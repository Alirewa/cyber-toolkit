import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { LabRegistryService } from "./lab-registry.service";
import { LabProgressService } from "./lab-progress.service";
import { AchievementService } from "./achievement.service";
import { WebsocketService } from "../websocket/websocket.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class LabValidationService {
  private readonly logger = new Logger(LabValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: LabRegistryService,
    private readonly progress: LabProgressService,
    private readonly achievements: AchievementService,
    private readonly ws: WebsocketService,
    private readonly audit: AuditLogsService,
  ) {}

  async validate(
    userId: string,
    slug: string,
    answers: Record<string, string>,
    sessionId?: string,
  ) {
    const lab = this.registry.getBySlug(slug);
    const dbLab = await this.prisma.lab.findUnique({ where: { slug } });
    if (!dbLab) throw new NotFoundException(`Lab '${slug}' not found`);

    // Count hints used in this session
    let hintsUsed = 0;
    if (sessionId) {
      hintsUsed = await this.prisma.hintUsage.count({
        where: { userId, labId: dbLab.id, sessionId },
      });
    }

    // Run validation
    const startMs = Date.now();
    const result = await lab.validate(answers, { userId, sessionId: sessionId ?? "", hintsUsed });
    const timeSpentMs = Date.now() - startMs;

    // Recalculate XP with hints penalty
    const xpEarned = lab["calcXp"](result.score, hintsUsed) as number;

    // Create submission record
    const submission = await this.prisma.labSubmission.create({
      data: {
        userId,
        labId: dbLab.id,
        sessionId: sessionId ?? (await this.getOrCreateSession(userId, dbLab.id)),
        status: result.passed ? "PASSED" : "FAILED",
        answers: answers as Prisma.InputJsonValue,
        score: result.score,
        maxScore: result.maxScore,
        feedback: result.feedback as unknown as Prisma.InputJsonValue,
        hintsUsed,
        xpEarned,
        timeSpentMs,
        completedAt: new Date(),
      },
    });

    // Track progress
    await this.progress.incrementAttempt(userId, dbLab.id);

    if (result.passed) {
      await this.progress.markLabCompleted(userId, dbLab.id, result.score, hintsUsed);

      // Update session status
      if (sessionId) {
        await this.prisma.labSession.updateMany({
          where: { id: sessionId, userId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      // Award XP
      const scoreResult = await this.progress.awardXp(userId, xpEarned);

      // Emit WS events
      this.ws.emitLabSubmissionResult(userId, {
        submissionId: submission.id,
        passed: true,
        score: result.score,
        maxScore: result.maxScore,
        xpEarned,
      });

      this.ws.emitXpGained(userId, {
        xpGained: xpEarned,
        totalXp: scoreResult.totalXp,
        level: scoreResult.level,
        leveledUp: scoreResult.leveledUp,
      });

      if (scoreResult.leveledUp) {
        await this.achievements.checkAndAward(userId, { type: "level_up", newLevel: scoreResult.level });
      }

      // Check achievements
      await this.achievements.checkAndAward(userId, {
        type: "lab_completed",
        labSlug: slug,
        labId: dbLab.id,
        hintsUsed,
        score: result.score,
        maxScore: result.maxScore,
        timeSpentMs,
      });

      this.logger.log(`User ${userId} passed lab ${slug} with score ${result.score}/${result.maxScore}`);
    } else {
      this.ws.emitLabSubmissionResult(userId, {
        submissionId: submission.id,
        passed: false,
        score: result.score,
        maxScore: result.maxScore,
        xpEarned: 0,
      });
    }

    await this.audit.log({
      userId,
      action: "lab.submit",
      resource: "labs",
      resourceId: dbLab.id,
      metadata: { slug, passed: result.passed, score: result.score },
    });

    return {
      data: {
        submissionId: submission.id,
        passed: result.passed,
        score: result.score,
        maxScore: result.maxScore,
        xpEarned: result.passed ? xpEarned : 0,
        hintsUsed,
        feedback: result.feedback,
      },
      message: result.passed ? "Lab completed! Great work." : "Incorrect answers. Try again!",
    };
  }

  private async getOrCreateSession(userId: string, labId: string): Promise<string> {
    const session = await this.prisma.labSession.findFirst({
      where: { userId, labId, status: { in: ["ACTIVE"] } },
      orderBy: { startedAt: "desc" },
    });
    if (session) return session.id;

    const newSession = await this.prisma.labSession.create({
      data: { userId, labId },
    });
    return newSession.id;
  }

  async getMySubmissions(userId: string, params: { page?: number; limit?: number; labSlug?: string }) {
    const { page = 1, limit = 20, labSlug } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (labSlug) {
      const dbLab = await this.prisma.lab.findUnique({ where: { slug: labSlug } });
      if (dbLab) where["labId"] = dbLab.id;
    }

    const [items, total] = await Promise.all([
      this.prisma.labSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { lab: { select: { slug: true, name: true, difficulty: true } } },
      }),
      this.prisma.labSubmission.count({ where }),
    ]);

    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: "Submissions retrieved",
    };
  }
}
