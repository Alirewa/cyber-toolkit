import { Injectable, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import { WorkflowStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { WorkflowNode, WorkflowEdge } from "./nodes/node-handler.interface";

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  teamId?: string;
}

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        userId,
        teamId: dto.teamId,
        name: dto.name,
        description: dto.description,
        triggerType: (dto.triggerType ?? "MANUAL") as never,
        triggerConfig: dto.triggerConfig as Prisma.InputJsonValue | undefined,
        nodes: ((dto.nodes ?? []) as unknown) as Prisma.InputJsonValue,
        edges: ((dto.edges ?? []) as unknown) as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(userId: string, page = 1, limit = 20, status?: WorkflowStatus) {
    const where = {
      userId,
      ...(status ? { status } : {}),
      status: { not: WorkflowStatus.ARCHIVED },
    };
    const [items, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { executions: true } } },
      }),
      this.prisma.workflow.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string, userId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        executions: { orderBy: { startedAt: "desc" }, take: 5 },
        scheduledJob: true,
      },
    });
    if (!workflow || (workflow.userId !== userId && !workflow.teamId)) {
      throw new NotFoundException("Workflow not found");
    }
    return workflow;
  }

  async update(id: string, userId: string, dto: Partial<CreateWorkflowDto> & { isEnabled?: boolean }) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id }, select: { userId: true, version: true } });
    if (!workflow || workflow.userId !== userId) throw new ForbiddenException();
    return this.prisma.workflow.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType as never | undefined,
        triggerConfig: dto.triggerConfig as Prisma.InputJsonValue | undefined,
        nodes: dto.nodes as Prisma.InputJsonValue | undefined,
        edges: dto.edges as Prisma.InputJsonValue | undefined,
        isEnabled: dto.isEnabled,
        version: { increment: 1 },
      },
    });
  }

  async archive(id: string, userId: string) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id }, select: { userId: true } });
    if (!workflow || workflow.userId !== userId) throw new ForbiddenException();
    return this.prisma.workflow.update({ where: { id }, data: { status: WorkflowStatus.ARCHIVED } });
  }

  async clone(id: string, userId: string) {
    const source = await this.prisma.workflow.findUnique({ where: { id } });
    if (!source) throw new NotFoundException();
    return this.prisma.workflow.create({
      data: {
        userId,
        name: `${source.name} (Copy)`,
        description: source.description,
        triggerType: source.triggerType,
        triggerConfig: (source.triggerConfig ?? undefined) as Prisma.InputJsonValue | undefined,
        nodes: source.nodes as Prisma.InputJsonValue,
        edges: source.edges as Prisma.InputJsonValue,
        status: WorkflowStatus.DRAFT,
      },
    });
  }
}
