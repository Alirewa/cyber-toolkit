import { create } from "zustand";

export interface ExecutionLogLine {
  nodeId?: string;
  nodeType?: string;
  level: string;
  message: string;
  success?: boolean;
  timestamp: number;
}

type NodeStatusValue = "idle" | "running" | "completed" | "failed";

export interface NodeStatusEntry {
  status: NodeStatusValue;
}

interface OpsState {
  activeExecutionId: string | null;
  /** nodeId → { status }, for live-animating the workflow builder canvas */
  nodeStatuses: Record<string, NodeStatusEntry>;
  executionLogs: ExecutionLogLine[];

  setActiveExecution: (id: string | null) => void;
  setNodeStatus: (nodeId: string, status: NodeStatusValue) => void;
  appendLog: (line: ExecutionLogLine) => void;
  clearExecution: () => void;
}

export const useOpsStore = create<OpsState>((set) => ({
  activeExecutionId: null,
  nodeStatuses: {},
  executionLogs: [],

  setActiveExecution: (activeExecutionId) => set({ activeExecutionId, nodeStatuses: {}, executionLogs: [] }),
  setNodeStatus: (nodeId, status) =>
    set((s) => ({ nodeStatuses: { ...s.nodeStatuses, [nodeId]: { status } } })),
  appendLog: (line) => set((s) => ({ executionLogs: [...s.executionLogs, line] })),
  clearExecution: () => set({ activeExecutionId: null, nodeStatuses: {}, executionLogs: [] }),
}));
