import { Injectable, Logger } from "@nestjs/common";
import type { INodeHandler, WorkflowNode, ExecutionContext, NodeResult } from "./node-handler.interface";
import { ToolExecutorService } from "../../tools/tool-executor.service";
import { resolveVar } from "./workflow-vars";

@Injectable()
export class ToolNodeHandler implements INodeHandler {
  private readonly logger = new Logger(ToolNodeHandler.name);

  constructor(
    private readonly toolExecutor: ToolExecutorService,
  ) {}

  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult> {
    const toolSlug = node.config["toolSlug"] as string | undefined;
    if (!toolSlug) {
      return { success: false, output: {}, logs: [{ level: "ERROR", message: "TOOL node missing toolSlug" }] };
    }

    const rawMapping = (node.config["inputMapping"] as Record<string, string> | undefined) ?? {};
    const input: Record<string, string> = {};
    for (const [key, expr] of Object.entries(rawMapping)) {
      input[key] = resolveVar(String(expr), ctx);
    }

    this.logger.log(`Executing tool: ${toolSlug} with input: ${JSON.stringify(input)}`);

    try {
      const runResponse = await this.toolExecutor.execute(ctx.userId, toolSlug, input);
      const runId = ((runResponse as unknown) as { data: { runId: string } }).data?.runId;
      // Wait for result (poll ToolRun until complete or timeout)
      const result = await this.toolExecutor.waitForCompletion(runId, 30_000);
      return {
        success: result.success,
        output: { result, toolSlug, runId },
        logs: [{ level: "INFO", message: `Tool ${toolSlug} executed`, data: { runId } }],
      };
    } catch (err: unknown) {
      return {
        success: false,
        output: { error: String(err) },
        logs: [{ level: "ERROR", message: `Tool ${toolSlug} failed: ${String(err)}` }],
      };
    }
  }
}
