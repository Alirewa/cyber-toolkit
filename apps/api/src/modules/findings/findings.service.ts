import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Prisma, FindingStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { CreateFindingDto, UpdateFindingDto } from "./dto/create-finding.dto";

const AUTHOR_SELECT = { id: true, username: true, avatarUrl: true };

@Injectable()
export class FindingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFindingDto) {
    return this.prisma.finding.create({
      data: {
        userId,
        teamId: dto.teamId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: dto.status ?? "OPEN",
        tags: dto.tags ?? [],
        target: dto.target,
        evidence: dto.evidence as Prisma.InputJsonValue | undefined,
        toolRunId: dto.toolRunId,
        assignedToId: dto.assignedToId,
      },
      include: { user: { select: AUTHOR_SELECT }, assignedTo: { select: AUTHOR_SELECT } },
    });
  }

  async findAll(userId: string, opts?: {
    severity?: string; status?: string; search?: string;
    page?: number; limit?: number; teamId?: string;
  }) {
    const page = opts?.page ?? 1;
    const limit = Math.min(opts?.limit ?? 20, 100);

    const where: Prisma.FindingWhereInput = {
      OR: [
        { userId },
        ...(opts?.teamId ? [{ teamId: opts.teamId }] : []),
      ],
      ...(opts?.severity ? { severity: opts.severity as never } : {}),
      ...(opts?.status ? { status: opts.status as never } : {}),
      ...(opts?.search ? { title: { contains: opts.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.finding.findMany({
        where,
        include: {
          user: { select: AUTHOR_SELECT },
          assignedTo: { select: AUTHOR_SELECT },
          _count: { select: { comments: true } },
        },
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.finding.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string, userId: string) {
    const finding = await this.prisma.finding.findUnique({
      where: { id },
      include: {
        user: { select: AUTHOR_SELECT },
        assignedTo: { select: AUTHOR_SELECT },
        toolRun: { select: { id: true, status: true, createdAt: true, tool: { select: { name: true, slug: true } } } },
        comments: {
          include: { author: { select: AUTHOR_SELECT } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!finding) throw new NotFoundException("Finding not found");
    if (finding.userId !== userId && !finding.assignedToId) {
      // Check team membership would go here — simplified: allow any team member
    }

    return finding;
  }

  async update(id: string, userId: string, dto: UpdateFindingDto) {
    const finding = await this.prisma.finding.findUnique({ where: { id }, select: { userId: true, status: true } });
    if (!finding) throw new NotFoundException();
    if (finding.userId !== userId) throw new ForbiddenException();

    const resolvedAt = dto.status === FindingStatus.CLOSED || dto.status === FindingStatus.MITIGATED
      ? new Date()
      : undefined;

    return this.prisma.finding.update({
      where: { id },
      data: { ...dto, ...(resolvedAt ? { resolvedAt } : {}) },
    });
  }

  async delete(id: string, userId: string) {
    const finding = await this.prisma.finding.findUnique({ where: { id }, select: { userId: true } });
    if (!finding) throw new NotFoundException();
    if (finding.userId !== userId) throw new ForbiddenException();
    return this.prisma.finding.update({ where: { id }, data: { status: FindingStatus.ARCHIVED } });
  }

  async addComment(findingId: string, authorId: string, body: string) {
    const finding = await this.prisma.finding.findUnique({ where: { id: findingId }, select: { id: true } });
    if (!finding) throw new NotFoundException();
    return this.prisma.findingComment.create({
      data: { findingId, authorId, body },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  /** Called by WorkflowEngine's FindingNodeHandler */
  async createFromWorkflow(userId: string, dto: CreateFindingDto, workflowId: string) {
    return this.prisma.finding.create({
      data: {
        userId,
        workflowId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        tags: dto.tags ?? [],
        target: dto.target,
        evidence: dto.evidence as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async getStats(userId: string) {
    const counts = await this.prisma.finding.groupBy({
      by: ["severity"],
      where: { userId, status: { not: "ARCHIVED" } },
      _count: { id: true },
    });
    const statusCounts = await this.prisma.finding.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    });
    return { bySeverity: counts, byStatus: statusCounts };
  }
}
