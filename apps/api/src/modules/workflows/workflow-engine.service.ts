import { Injectable } from "@nestjs/common";
import type { ExecutionContext, WorkflowEdge, WorkflowNode, NodeResult } from "./nodes/node-handler.interface";
import { TriggerNodeHandler } from "./nodes/trigger.handler";
import { ToolNodeHandler } from "./nodes/tool.handler";
import { FindingNodeHandler } from "./nodes/finding.handler";
import { NotifyNodeHandler } from "./nodes/notify.handler";
import { ConditionNodeHandler } from "./nodes/condition.handler";
import { ReportNodeHandler } from "./nodes/report.handler";
import { DelayNodeHandler } from "./nodes/delay.handler";
import { resolveVar } from "./nodes/workflow-vars";

@Injectable()
export class WorkflowEngineService {
  constructor(
    private readonly triggerHandler: TriggerNodeHandler,
    private readonly toolHandler: ToolNodeHandler,
    private readonly findingHandler: FindingNodeHandler,
    private readonly notifyHandler: NotifyNodeHandler,
    private readonly conditionHandler: ConditionNodeHandler,
    private readonly reportHandler: ReportNodeHandler,
    private readonly delayHandler: DelayNodeHandler,
  ) {}

  async executeNode(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult> {
    switch (node.type) {
      case "TRIGGER":   return this.triggerHandler.execute(node, ctx);
      case "TOOL":      return this.toolHandler.execute(node, ctx);
      case "FINDING":   return this.findingHandler.execute(node, ctx);
      case "NOTIFY":    return this.notifyHandler.execute(node, ctx);
      case "CONDITION": return this.conditionHandler.execute(node, ctx);
      case "REPORT":    return this.reportHandler.execute(node, ctx);
      case "DELAY":     return this.delayHandler.execute(node, ctx);
      default:
        return { success: false, output: {}, logs: [{ level: "ERROR", message: `Unknown node type: ${node.type}` }] };
    }
  }

  /** Find the trigger node — must be exactly one. */
  findTriggerNode(nodes: WorkflowNode[]): WorkflowNode | undefined {
    return nodes.find(n => n.type === "TRIGGER");
  }

  /** Get the next node ID from the edges, respecting CONDITION branch labels. */
  getNextNodeId(currentNodeId: string, edges: WorkflowEdge[], nextEdgeLabel?: string): string | null {
    const outgoing = edges.filter(e => e.source === currentNodeId);
    if (outgoing.length === 0) return null;

    if (nextEdgeLabel) {
      const match = outgoing.find(e => e.label === nextEdgeLabel);
      return match?.target ?? null;
    }

    return outgoing[0]?.target ?? null;
  }

  /** Resolve a `${nodeId.field.subfield}` expression from nodeStates. */
  resolveVar(expr: string, ctx: ExecutionContext): string {
    return resolveVar(expr, ctx);
  }
}
