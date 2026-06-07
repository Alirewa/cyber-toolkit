"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle, FileText, CheckCircle2, ArrowRight,
} from "lucide-react";
import { findingsApi, reportsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/30",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  LOW: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

export function OpsHub() {
  const { data: findingsData } = useQuery({
    queryKey: queryKeys.ops.findings({ status: "OPEN" }),
    queryFn: () => findingsApi.list({ status: "OPEN", limit: 50 }),
  });

  const { data: reportsData } = useQuery({
    queryKey: queryKeys.ops.reports(),
    queryFn: () => reportsApi.list({ limit: 5 }),
  });

  const openFindings = findingsData?.data?.items ?? [];
  const reports = reportsData?.data?.items ?? [];

  const severityCounts: Record<string, number> = {};
  for (const f of openFindings) {
    severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Findings &amp; Reports</h1>
        <p className="mt-1 text-surface-400">Track vulnerabilities you&apos;ve discovered and generate reports.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2">
        {[
          { label: "Open Findings", value: openFindings.length, icon: AlertTriangle, href: "/dashboard/ops/findings", color: "text-amber-400" },
          { label: "Reports", value: reports.length, icon: FileText, href: "/dashboard/ops/reports", color: "text-cyber-400" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={card.href} className="flex flex-col rounded-xl border border-surface-800 bg-surface-900/50 p-5 hover:border-surface-700 transition-all group">
              <card.icon className={cn("size-5 mb-3", card.color)} />
              <p className="text-2xl font-bold text-surface-50 tabular-nums">{card.value}</p>
              <p className="text-xs text-surface-500 mt-1 group-hover:text-surface-300 transition-colors">{card.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Findings by Severity */}
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="font-semibold text-surface-100 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-400" />
              Open Findings by Severity
            </h3>
            <Link href="/dashboard/ops/findings" className="text-xs text-cyber-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {openFindings.length === 0 ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="size-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-surface-500">No open findings! 🎉</p>
                <Link href="/dashboard/ops/findings" className="mt-2 inline-block text-xs text-cyber-400 hover:underline">
                  Add a finding →
                </Link>
              </div>
            ) : (
              ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(severity => {
                const count = severityCounts[severity] ?? 0;
                const max = Math.max(...Object.values(severityCounts), 1);
                const barColor = severity === "CRITICAL" ? "bg-red-500" : severity === "HIGH" ? "bg-orange-500" : severity === "MEDIUM" ? "bg-amber-500" : "bg-blue-500";
                return (
                  <div key={severity} className="flex items-center gap-3">
                    <span className={cn("text-xs rounded-full border px-2.5 py-0.5 font-semibold w-20 text-center", SEVERITY_COLORS[severity])}>
                      {severity}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-surface-800 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", barColor)}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / max) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-sm font-bold text-surface-300 tabular-nums w-6 text-right">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="font-semibold text-surface-100 flex items-center gap-2">
              <FileText className="size-4 text-cyber-400" />
              Recent Reports
            </h3>
            <Link href="/dashboard/ops/reports" className="text-xs text-cyber-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-surface-800">
            {reports.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <FileText className="size-8 text-surface-700 mx-auto mb-2" />
                <p className="text-sm text-surface-500">No reports yet.</p>
                <Link href="/dashboard/ops/reports" className="mt-2 inline-block text-xs text-cyber-400 hover:underline">
                  Create a report →
                </Link>
              </div>
            ) : reports.map((report) => (
              <div key={report.id} className="flex items-center gap-4 px-5 py-3">
                <FileText className="size-4 shrink-0 text-cyber-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">{report.title}</p>
                  <p className="text-xs text-surface-500 capitalize">{report.status?.toLowerCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
