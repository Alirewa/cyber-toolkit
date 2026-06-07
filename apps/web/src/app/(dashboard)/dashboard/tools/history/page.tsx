"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Trash2, ExternalLink } from "lucide-react";
import { toolsApi, type ToolRun } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { DataTable, Badge, EmptyState } from "@cyberlab/ui";
import type { Column } from "@cyberlab/ui";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "info" | "secondary"> = {
  COMPLETED: "success",
  FAILED: "danger",
  TIMEOUT: "danger",
  RUNNING: "info",
  PENDING: "warning",
  CANCELLED: "secondary",
};

export default function ScanHistoryPage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const toolFilter = searchParams.get("tool") ?? undefined;
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tools.runs({ page, limit, toolSlug: toolFilter }),
    queryFn: () => toolsApi.getRuns({ page, limit, toolSlug: toolFilter }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolsApi.deleteRun(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tools", "runs"] });
      toast.success("Run deleted");
    },
  });

  const runs = (data?.data?.items ?? []) as ToolRun[];
  const total = data?.data?.total ?? 0;

  const columns: Column<ToolRun>[] = [
    {
      key: "tool",
      header: "Tool",
      cell: (run) => (
        <Link href={`/dashboard/tools/${run.tool?.slug ?? ""}`} className="flex items-center gap-2 hover:text-cyber-400 transition-colors">
          <span className="font-medium text-surface-200">{run.tool?.name ?? run.toolId}</span>
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (run) => <Badge variant={STATUS_VARIANT[run.status] ?? "secondary"}>{run.status}</Badge>,
    },
    {
      key: "input",
      header: "Target",
      cell: (run) => {
        const input = run.input as Record<string, string>;
        const firstVal = Object.values(input)[0] ?? "—";
        return <span className="text-xs font-mono text-surface-400 truncate max-w-[160px] block">{firstVal}</span>;
      },
    },
    {
      key: "duration",
      header: "Duration",
      cell: (run) => (
        <span className="text-xs text-surface-500 font-mono">
          {run.executionMs ? `${run.executionMs}ms` : "—"}
        </span>
      ),
    },
    {
      key: "time",
      header: "Run",
      cell: (run) => <span className="text-xs text-surface-500">{formatRelativeTime(run.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (run) => (
        <div className="flex items-center gap-2">
          {run.status === "COMPLETED" && (
            <Link href={`/dashboard/tools/${run.tool?.slug ?? ""}`} className="text-cyber-400 hover:text-cyber-300">
              <ExternalLink className="size-3.5" />
            </Link>
          )}
          <button
            onClick={() => deleteMutation.mutate(run.id)}
            disabled={deleteMutation.isPending}
            className="text-surface-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Scan History</h1>
          <p className="mt-1 text-surface-400">All your tool executions</p>
        </div>
        <Link href="/dashboard/tools" className="flex items-center gap-1.5 text-sm text-cyber-400 hover:text-cyber-300">
          All Tools <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={runs}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        isLoading={isLoading}
        keyExtractor={(r) => r.id}
        emptyState={<EmptyState title="No runs yet" description="Execute a tool to see results here." />}
      />
    </div>
  );
}
