import { Injectable } from "@nestjs/common";
import type { INodeHandler, WorkflowNode, ExecutionContext, NodeResult } from "./node-handler.interface";
import { resolveVar } from "./workflow-vars";

@Injectable()
export class ConditionNodeHandler implements INodeHandler {
  constructor() {}

  async execute(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult> {
    const left = resolveVar(String(node.config["left"] ?? ""), ctx);
    const right = String(node.config["right"] ?? "");
    const operator = String(node.config["operator"] ?? "eq");

    let result = false;
    switch (operator) {
      case "eq":       result = left === right; break;
      case "neq":      result = left !== right; break;
      case "contains": result = left.includes(right); break;
      case "gt":       result = parseFloat(left) > parseFloat(right); break;
      case "lt":       result = parseFloat(left) < parseFloat(right); break;
      default:         result = false;
    }

    return {
      success: true,
      output: { result, left, right, operator },
      nextEdgeLabel: result ? "onTrue" : "onFalse",
      logs: [{ level: "INFO", message: `Condition: "${left}" ${operator} "${right}" → ${result}` }],
    };
  }
}
