"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/socket-provider";
import { useOpsStore } from "@/stores/ops.store";
import { queryKeys } from "@/lib/query-keys";

interface WorkflowStepPayload  { executionId: string; nodeId: string; nodeType: string; success: boolean }
interface WorkflowDonePayload  { executionId: string; workflowName: string; durationMs: number }
interface WorkflowFailPayload  { executionId: string; workflowName: string; error: string }
interface AlertPayload          { alertId: string; title: string; severity: string }
interface SchedulerJobPayload  { jobName: string; type: string }

export function useOpsSocket() {
  const { socket } = useSocket();
  const qc = useQueryClient();
  const { appendLog, setNodeStatus } = useOpsStore();

  useEffect(() => {
    if (!socket) return;

    socket.on("workflow:step-completed", (p: WorkflowStepPayload) => {
      appendLog({
        level: p.success ? "INFO" : "ERROR",
        message: `Node [${p.nodeType}] ${p.success ? "✓ completed" : "✗ failed"}`,
        nodeId: p.nodeId,
        nodeType: p.nodeType,
        success: p.success,
        timestamp: Date.now(),
      });
      setNodeStatus(p.nodeId, p.success ? "completed" : "failed");
    });

    socket.on("workflow:completed", (p: WorkflowDonePayload) => {
      toast.success(`Workflow "${p.workflowName}" completed in ${(p.durationMs / 1000).toFixed(1)}s ✅`);
      void qc.invalidateQueries({ queryKey: queryKeys.ops.executions() });
      void qc.invalidateQueries({ queryKey: queryKeys.ops.workflows() });
    });

    socket.on("workflow:failed", (p: WorkflowFailPayload) => {
      toast.error(`Workflow "${p.workflowName}" failed: ${p.error}`);
      void qc.invalidateQueries({ queryKey: queryKeys.ops.executions() });
    });

    socket.on("alert:triggered", (p: AlertPayload) => {
      const colors: Record<string, string> = { CRITICAL: "🔴", HIGH: "🟠", MEDIUM: "🟡", LOW: "🔵" };
      toast.warning(`${colors[p.severity] ?? "⚠️"} Alert: ${p.title}`, {
        action: { label: "View", onClick: () => (window.location.href = "/dashboard/ops/alerts") },
      });
      void qc.invalidateQueries({ queryKey: queryKeys.ops.alerts() });
    });

    socket.on("finding:created", () => {
      void qc.invalidateQueries({ queryKey: queryKeys.ops.findings() });
    });

    socket.on("scheduler:job-fired", (p: SchedulerJobPayload) => {
      toast.info(`Scheduled job "${p.jobName}" (${p.type}) fired`);
      void qc.invalidateQueries({ queryKey: queryKeys.ops.scheduledJobs });
    });

    return () => {
      socket.off("workflow:step-completed");
      socket.off("workflow:completed");
      socket.off("workflow:failed");
      socket.off("alert:triggered");
      socket.off("finding:created");
      socket.off("scheduler:job-fired");
    };
  }, [socket, qc, appendLog, setNodeStatus]);
}
