import { Injectable } from "@nestjs/common";
import type { INodeHandler, WorkflowNode, ExecutionContext, NodeResult } from "./node-handler.interface";

@Injectable()
export class TriggerNodeHandler implements INodeHandler {
  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult> {
    return {
      success: true,
      output: { trigger: "manual", input: ctx.nodeStates["__input__"]?.output ?? {} },
      logs: [{ level: "INFO", message: `Workflow triggered (${node.config["triggerType"] ?? "MANUAL"})` }],
    };
  }
}
