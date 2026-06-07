import { Injectable } from "@nestjs/common";
import type { INodeHandler, WorkflowNode, ExecutionContext, NodeResult } from "./node-handler.interface";

const MAX_DELAY_MS = 5 * 60 * 1000; // 5 minute cap

@Injectable()
export class DelayNodeHandler implements INodeHandler {
  async execute(node: WorkflowNode, _ctx: ExecutionContext): Promise<NodeResult> {
    const ms = Math.min(Number(node.config["delayMs"] ?? 1000), MAX_DELAY_MS);
    await new Promise(resolve => setTimeout(resolve, ms));
    return {
      success: true,
      output: { delayed: ms },
      logs: [{ level: "INFO", message: `Delayed ${ms}ms` }],
    };
  }
}
