"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditLogsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { DataTable, EmptyState, Badge } from "@cyberlab/ui";
import type { AuditLog } from "@cyberlab/types";
import type { Column } from "@cyberlab/ui";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auditLogs.all({ page, limit, action: search }),
    queryFn: () => auditLogsApi.getAll({ page, limit, action: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const logs: AuditLog[] = (data?.data?.items ?? []) as AuditLog[];
  const total = data?.data?.total ?? 0;

  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: "Action",
      cell: (log) => <code className="rounded bg-surface-800 px-1.5 py-0.5 text-xs font-mono text-cyber-400">{log.action}</code>,
    },
    {
      key: "user",
      header: "User",
      cell: (log) => <span className="text-sm text-surface-300">{log.userId ?? "System"}</span>,
    },
    {
      key: "resource",
      header: "Resource",
      cell: (log) => log.resource ? (
        <span className="text-xs text-surface-400">{log.resource}{log.resourceId && `:${log.resourceId.slice(0, 8)}…`}</span>
      ) : <span className="text-surface-600">—</span>,
    },
    {
      key: "ip",
      header: "IP Address",
      cell: (log) => <span className="font-mono text-xs text-surface-500">{log.ipAddress ?? "—"}</span>,
    },
    {
      key: "time",
      header: "Time",
      cell: (log) => <span className="text-xs text-surface-400">{formatDate(log.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Audit Logs</h1>
        <p className="mt-1 text-surface-400">Immutable record of all platform actions</p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by action..."
        keyExtractor={(l) => l.id}
        emptyState={<EmptyState title="No logs found" description="Audit logs will appear as users take actions." />}
      />
    </div>
  );
}
