import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { ToolRunStatus, ToolRun } from "@prisma/client";
import type { ToolExecutionResult } from "./base/tool-execution.interface";
import type { PaginationQuery } from "@cyberlab/types";

@Injectable()
export class ToolRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: {
    userId: string;
    toolId: string;
    input: Record<string, string>;
  }): Promise<ToolRun> {
    return this.prisma.toolRun.create({
      data: {
        userId: dto.userId,
        toolId: dto.toolId,
        input: dto.input as Prisma.InputJsonValue,
        status: "PENDING",
      },
    });
  }

  async setRunning(runId: string, queueJobId?: string): Promise<void> {
    await this.prisma.toolRun.update({
      where: { id: runId },
      data: { status: "RUNNING", queueJobId },
    });
  }

  async complete(runId: string, result: ToolExecutionResult): Promise<void> {
    await this.prisma.toolRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        result: result as unknown as Prisma.InputJsonValue,
        executionMs: result.executionMs,
        completedAt: new Date(),
      },
    });
  }

  async fail(runId: string, errorMessage: string, status: ToolRunStatus = "FAILED"): Promise<void> {
    await this.prisma.toolRun.update({
      where: { id: runId },
      data: { status, errorMessage, completedAt: new Date() },
    });
  }

  async cancel(runId: string, userId: string): Promise<void> {
    const run = await this.prisma.toolRun.findFirst({ where: { id: runId, userId } });
    if (!run) throw new NotFoundException("Tool run not found");
    if (run.status !== "PENDING" && run.status !== "RUNNING") return;
    await this.prisma.toolRun.update({ where: { id: runId }, data: { status: "CANCELLED" } });
  }

  async findByUser(userId: string, query: PaginationQuery & { toolSlug?: string; status?: string }) {
    const { page = 1, limit = 20, status, toolSlug } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (status) where["status"] = status;
    if (toolSlug) {
      where["tool"] = { slug: toolSlug };
    }

    const [items, total] = await Promise.all([
      this.prisma.toolRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { tool: { select: { slug: true, name: true, icon: true, category: true } } },
      }),
      this.prisma.toolRun.count({ where }),
    ]);

    return {
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
      message: "Tool runs retrieved",
    };
  }

  async findOne(runId: string, userId: string) {
    const run = await this.prisma.toolRun.findFirst({
      where: { id: runId, userId },
      include: { tool: true },
    });
    if (!run) throw new NotFoundException("Tool run not found");
    return { data: run, message: "Tool run retrieved" };
  }

  async delete(runId: string, userId: string): Promise<void> {
    const run = await this.prisma.toolRun.findFirst({ where: { id: runId, userId } });
    if (!run) throw new NotFoundException("Tool run not found");
    await this.prisma.toolRun.delete({ where: { id: runId } });
  }
}
