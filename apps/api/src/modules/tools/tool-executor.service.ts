import { Injectable, Logger } from "@nestjs/common";
import { ToolRegistryService } from "./tool-registry.service";
import { ToolRunsService } from "./tool-runs.service";
import { WebsocketService } from "../websocket/websocket.service";
import { PrismaService } from "../database/prisma.service";
import type { ToolExecutionResult } from "./base/tool-execution.interface";

export interface ToolJobData {
  runId: string;
  toolSlug: string;
  input: Record<string, string>;
  userId: string;
  enqueuedAt: number;
}

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly registry: ToolRegistryService,
    private readonly runs: ToolRunsService,
    private readonly ws: WebsocketService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    userId: string,
    toolSlug: string,
    input: Record<string, string>,
  ) {
    const handler = this.registry.getHandler(toolSlug);
    const { name } = handler.metadata;

    // Look up ToolDefinition ID
    const toolDef = await this.prisma.toolDefinition.findUnique({ where: { slug: toolSlug } });
    if (!toolDef) throw new Error(`ToolDefinition not found for slug: ${toolSlug}`);

    // Create run record
    const run = await this.runs.create({ userId, toolId: toolDef.id, input });

    // Personal mode — all tools execute synchronously (no queue, no Redis)
    return this.executeDirect(run.id, userId, toolSlug, input, name);
  }

  private async executeDirect(
    runId: string,
    userId: string,
    toolSlug: string,
    input: Record<string, string>,
    toolName: string,
  ) {
    const handler = this.registry.getHandler(toolSlug);
    await this.runs.setRunning(runId);
    this.ws.emitToolStarted(userId, { runId, toolSlug, toolName });

    try {
      const result = await handler.execute(input, userId);
      await this.runs.complete(runId, result);
      this.ws.emitToolCompleted(userId, { runId, result, executionMs: result.executionMs });
      this.logger.log(`Tool ${toolSlug} completed in ${result.executionMs}ms (run ${runId})`);
      return { data: { runId, status: "COMPLETED", result }, message: "Tool executed" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      await this.runs.fail(runId, msg);
      this.ws.emitToolFailed(userId, { runId, error: msg });
      this.logger.error(`Tool ${toolSlug} failed for run ${runId}: ${msg}`);
      return { data: { runId, status: "FAILED", error: msg }, message: "Tool execution failed" };
    }
  }

  /**
   * Wait for a tool run to complete (used by workflow engine).
   * In personal mode tools run synchronously so this returns immediately after execute().
   */
  async waitForCompletion(runId: string, timeoutMs = 30_000): Promise<{ success: boolean; result: unknown }> {
    const pollIntervalMs = 200;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const run = await this.prisma.toolRun.findUnique({
        where: { id: runId },
        select: { status: true, result: true, errorMessage: true },
      });
      if (!run) throw new Error(`ToolRun ${runId} not found`);
      if (run.status === "COMPLETED") return { success: true, result: run.result };
      if (run.status === "FAILED" || run.status === "TIMEOUT" || run.status === "CANCELLED") {
        return { success: false, result: { error: run.errorMessage ?? "Tool failed" } };
      }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    throw new Error(`Tool execution timed out after ${timeoutMs}ms`);
  }
}
