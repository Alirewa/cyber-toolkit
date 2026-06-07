import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { LabRegistryService } from "./lab-registry.service";
import { SANDBOX_PROVIDER_TOKEN } from "./sandbox/sandbox.interface";
import type { ISandboxProvider } from "./sandbox/sandbox.interface";
import { Inject } from "@nestjs/common";
import type { QueryLabsDto } from "./dto/query-labs.dto";

@Injectable()
export class LabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: LabRegistryService,
    @Inject(SANDBOX_PROVIDER_TOKEN) private readonly sandbox: ISandboxProvider,
  ) {}

  async findAll(query: QueryLabsDto, userId?: string) {
    const labs = this.registry.getAll().filter((l) => {
      if (query.difficulty && l.meta.difficulty !== query.difficulty) return false;
      if (query.category && l.meta.category !== query.category) return false;
      if (query.search) {
        const s = query.search.toLowerCase();
        return l.meta.name.toLowerCase().includes(s) || l.meta.description.toLowerCase().includes(s);
      }
      return true;
    });

    // Get user progress for all labs if authenticated
    let progressMap: Record<string, { isCompleted: boolean; bestScore: number; attempts: number }> = {};
    if (userId) {
      const progress = await this.prisma.userLabProgress.findMany({ where: { userId } });
      progressMap = Object.fromEntries(
        progress.map((p) => [p.labId, { isCompleted: p.isCompleted, bestScore: p.bestScore, attempts: p.attempts }])
      );
    }

    const labDefs = await this.prisma.lab.findMany({
      where: { slug: { in: labs.map((l) => l.meta.slug) }, isEnabled: true },
      select: { id: true, slug: true },
    });
    const slugToId = Object.fromEntries(labDefs.map((l) => [l.slug, l.id]));

    return {
      data: labs.map((l) => {
        const dbId = slugToId[l.meta.slug];
        const progress = dbId ? progressMap[dbId] : undefined;
        return {
          ...l.meta,
          id: dbId,
          userProgress: progress ?? null,
        };
      }),
      message: "Labs retrieved",
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const lab = this.registry.getBySlug(slug);
    const dbLab = await this.prisma.lab.findUnique({ where: { slug } });
    if (!dbLab) throw new NotFoundException(`Lab '${slug}' not found in database`);

    let userProgress = null;
    let activeSession = null;
    let submissions: unknown[] = [];

    if (userId) {
      userProgress = await this.prisma.userLabProgress.findUnique({
        where: { userId_labId: { userId, labId: dbLab.id } },
      });
      activeSession = await this.prisma.labSession.findFirst({
        where: { userId, labId: dbLab.id, status: "ACTIVE" },
        orderBy: { startedAt: "desc" },
      });
      submissions = await this.prisma.labSubmission.findMany({
        where: { userId, labId: dbLab.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, score: true, maxScore: true, xpEarned: true, createdAt: true },
      });
    }

    return {
      data: {
        ...lab.meta,
        id: dbLab.id,
        userProgress,
        activeSession,
        recentSubmissions: submissions,
      },
      message: "Lab retrieved",
    };
  }

  async startSession(userId: string, slug: string) {
    const lab = this.registry.getBySlug(slug);
    const dbLab = await this.prisma.lab.findUnique({ where: { slug } });
    if (!dbLab) throw new NotFoundException(`Lab '${slug}' not found`);

    // Check for existing active session
    const existing = await this.prisma.labSession.findFirst({
      where: { userId, labId: dbLab.id, status: "ACTIVE" },
    });
    if (existing) {
      return { data: existing, message: "Session already active" };
    }

    let sandboxUrl: string | null = null;
    let sandboxId: string | null = null;
    let expiresAt: Date | null = null;

    if (lab.meta.isSandboxed) {
      const result = await this.sandbox.start(slug, userId);
      sandboxUrl = result.url;
      sandboxId = result.containerId ?? null;
      expiresAt = result.expiresAt;
    }

    const session = await this.prisma.labSession.create({
      data: {
        userId,
        labId: dbLab.id,
        sandboxUrl,
        sandboxId,
        expiresAt,
      },
    });

    return { data: session, message: "Lab session started" };
  }

  async resetSession(userId: string, slug: string) {
    const dbLab = await this.prisma.lab.findUnique({ where: { slug } });
    if (!dbLab) throw new NotFoundException("Lab not found");

    const session = await this.prisma.labSession.findFirst({
      where: { userId, labId: dbLab.id, status: "ACTIVE" },
    });
    if (!session) throw new NotFoundException("No active session found");

    let newUrl = session.sandboxUrl;
    if (session.sandboxId) {
      const result = await this.sandbox.reset(session.sandboxId, slug, userId);
      newUrl = result.url;
    }

    await this.prisma.labSession.update({
      where: { id: session.id },
      data: { resetCount: { increment: 1 }, sandboxUrl: newUrl },
    });

    return { data: { sessionId: session.id, sandboxUrl: newUrl }, message: "Lab reset" };
  }

  async getHint(userId: string, slug: string, hintKey: string) {
    const lab = this.registry.getBySlug(slug);
    const hint = lab.getHint(hintKey);
    if (!hint) throw new NotFoundException(`Hint '${hintKey}' not found`);

    const dbLab = await this.prisma.lab.findUnique({ where: { slug } });
    if (!dbLab) throw new NotFoundException("Lab not found");

    const session = await this.prisma.labSession.findFirst({
      where: { userId, labId: dbLab.id, status: "ACTIVE" },
    });

    if (session) {
      await this.prisma.hintUsage.upsert({
        where: { userId_labId_hintKey: { userId, labId: dbLab.id, hintKey } },
        update: {},
        create: { userId, labId: dbLab.id, hintKey, sessionId: session.id },
      });
    }

    return {
      data: { key: hintKey, title: hint.title, content: hint.content, xpCost: hint.xpCost },
      message: "Hint retrieved",
    };
  }

  async getLearningPaths() {
    const paths = await this.prisma.learningPath.findMany({ where: { isEnabled: true } });
    return { data: paths, message: "Learning paths retrieved" };
  }

  async getLeaderboard(limit = 50) {
    const scores = await this.prisma.userScore.findMany({
      orderBy: { totalXp: "desc" },
      take: limit,
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return {
      data: scores.map((s, i) => ({
        rank: i + 1,
        userId: s.userId,
        username: s.user.username,
        avatarUrl: s.user.avatarUrl,
        totalXp: s.totalXp,
        level: s.level,
        labsDone: s.labsDone,
      })),
      message: "Leaderboard retrieved",
    };
  }

  async getUserScore(userId: string) {
    let score = await this.prisma.userScore.findUnique({ where: { userId } });
    if (!score) {
      score = await this.prisma.userScore.create({ data: { userId } });
    }
    return { data: score, message: "Score retrieved" };
  }
}
