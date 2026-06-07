export interface ToolExecutionResult {
  success: boolean;
  data: Record<string, unknown>;
  summary: string;
  warnings?: string[];
  executionMs: number;
}

export interface ToolProgressUpdate {
  runId: string;
  step: string;
  percent: number;
}

export type ProgressCallback = (step: string, percent: number) => void;
