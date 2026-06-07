"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";
import { useToolExecutionStore } from "@/stores/tool-execution.store";
import { queryKeys } from "@/lib/query-keys";

interface ToolStartedPayload {
  runId: string;
  toolSlug: string;
  toolName: string;
}
interface ToolProgressPayload {
  runId: string;
  step: string;
  percent: number;
}
interface ToolCompletedPayload {
  runId: string;
  result: unknown;
  executionMs: number;
}
interface ToolFailedPayload {
  runId: string;
  error: string;
}

/** Hook that wires Socket.IO tool events to the Zustand execution store */
export function useToolExecutionSocket() {
  const { socket } = useSocket();
  const qc = useQueryClient();
  const { startExecution, updateProgress, completeExecution, failExecution } = useToolExecutionStore();

  useEffect(() => {
    if (!socket) return;

    socket.on("tool:started", (payload: ToolStartedPayload) => {
      startExecution({
        runId: payload.runId,
        toolSlug: payload.toolSlug,
        toolName: payload.toolName,
        status: "running",
        startedAt: Date.now(),
      });
    });

    socket.on("tool:progress", (payload: ToolProgressPayload) => {
      updateProgress(payload.runId, payload.step, payload.percent);
    });

    socket.on("tool:completed", (payload: ToolCompletedPayload) => {
      completeExecution(payload.runId, payload.result);
      // Invalidate run history so it refreshes
      void qc.invalidateQueries({ queryKey: queryKeys.tools.runs() });
    });

    socket.on("tool:failed", (payload: ToolFailedPayload) => {
      failExecution(payload.runId, payload.error);
    });

    return () => {
      socket.off("tool:started");
      socket.off("tool:progress");
      socket.off("tool:completed");
      socket.off("tool:failed");
    };
  }, [socket, startExecution, updateProgress, completeExecution, failExecution, qc]);
}
