// String-literal union matching the WorkflowNodeType Prisma enum values
export type WorkflowNodeTypeValue = "TRIGGER" | "TOOL" | "FINDING" | "NOTIFY" | "CONDITION" | "REPORT" | "DELAY";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeTypeValue;
  label?: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;  // "onTrue" | "onFalse" for CONDITION nodes
}

export interface NodeState {
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  nodeStates: Record<string, NodeState>;
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
}

export interface NodeResult {
  success: boolean;
  output: Record<string, unknown>;
  nextEdgeLabel?: string;  // For CONDITION: "onTrue" or "onFalse"
  logs: Array<{ level: string; message: string; data?: unknown }>;
}

export interface INodeHandler {
  execute(node: WorkflowNode, ctx: ExecutionContext): Promise<NodeResult>;
}
