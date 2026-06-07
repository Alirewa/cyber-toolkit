import { create } from "zustand";

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "timeout" | "cancelled";

export interface ActiveExecution {
  runId: string;
  toolSlug: string;
  toolName: string;
  status: ExecutionStatus;
  progress: number;
  steps: string[];
  result: unknown | null;
  error: string | null;
  startedAt: number;
}

interface ToolExecutionState {
  executions: Record<string, ActiveExecution>;
  startExecution: (run: Omit<ActiveExecution, "progress" | "steps" | "result" | "error">) => void;
  updateProgress: (runId: string, step: string, percent: number) => void;
  completeExecution: (runId: string, result: unknown) => void;
  failExecution: (runId: string, error: string, status?: ExecutionStatus) => void;
  clearExecution: (runId: string) => void;
  clearAll: () => void;
}

export const useToolExecutionStore = create<ToolExecutionState>((set) => ({
  executions: {},

  startExecution: (run) =>
    set((state) => ({
      executions: {
        ...state.executions,
        [run.runId]: { ...run, progress: 0, steps: [], result: null, error: null },
      },
    })),

  updateProgress: (runId, step, percent) =>
    set((state) => {
      const ex = state.executions[runId];
      if (!ex) return state;
      return {
        executions: {
          ...state.executions,
          [runId]: {
            ...ex,
            status: "running",
            progress: percent,
            steps: [...ex.steps, step],
          },
        },
      };
    }),

  completeExecution: (runId, result) =>
    set((state) => {
      const ex = state.executions[runId];
      if (!ex) return state;
      return {
        executions: {
          ...state.executions,
          [runId]: { ...ex, status: "completed", progress: 100, result },
        },
      };
    }),

  failExecution: (runId, error, status = "failed") =>
    set((state) => {
      const ex = state.executions[runId];
      if (!ex) return state;
      return {
        executions: {
          ...state.executions,
          [runId]: { ...ex, status, error },
        },
      };
    }),

  clearExecution: (runId) =>
    set((state) => {
      const { [runId]: _, ...rest } = state.executions;
      return { executions: rest };
    }),

  clearAll: () => set({ executions: {} }),
}));
