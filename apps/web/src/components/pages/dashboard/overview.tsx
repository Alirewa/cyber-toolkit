"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench, FlaskConical, AlertTriangle, History,
  ArrowRight, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { toolsApi, findingsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "text-emerald-400",
  FAILED: "text-red-400",
  RUNNING: "text-amber-400",
  PENDING: "text-surface-500",
  CANCELLED: "text-surface-600",
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
  RUNNING: Clock,
  PENDING: Clock,
  CANCELLED: XCircle,
};

export function DashboardOverview() {
  const { user } = useAuthStore();

  const { data: recentRunsData } = useQuery({
    queryKey: queryKeys.tools.runs({ limit: 6 }),
    queryFn: () => toolsApi.getRuns({ limit: 6 }),
  });

  const { data: findingsData } = useQuery({
    queryKey: queryKeys.ops.findings({ status: "OPEN" }),
    queryFn: () => findingsApi.list({ status: "OPEN", limit: 50 }),
  });

  const recentRuns = recentRunsData?.data?.items ?? [];
  const openFindings = findingsData?.data?.items ?? [];

  const severityCounts: Record<string, number> = {};
  for (const f of openFindings) {
    severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50">
          Welcome, <span className="text-cyber-400">{user?.username}</span>
        </h1>
        <p className="mt-1 text-surface-400">Your personal hacking & bug bounty toolkit.</p>
      </div>

      {/* Quick-launch cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/dashboard/tools",
            icon: Wrench,
            label: "Security Tools",
            desc: "WHOIS, DNS, SSL, Headers, Tech Detector, JWT, Hashing…",
            color: "text-cyber-400",
            border: "hover:border-cyber-600/40",
          },
          {
            href: "/dashboard/labs",
            icon: FlaskConical,
            label: "Bug Bounty Labs",
            desc: "XSS, SQLi, IDOR, CSRF, JWT, SSRF — hands-on practice",
            color: "text-purple-400",
            border: "hover:border-purple-600/40",
          },
          {
            href: "/dashboard/ops/findings",
            icon: AlertTriangle,
            label: "Findings",
            desc: `${openFindings.length} open vulnerability${openFindings.length !== 1 ? "ies" : "y"} tracked`,
            color: "text-amber-400",
            border: "hover:border-amber-600/40",
          },
        ].map((card, i) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={card.href}
              className={cn(
                "group flex flex-col gap-3 rounded-xl border border-surface-800 bg-surface-900/50 p-5 transition-all",
                card.border
              )}
            >
              <card.icon className={cn("size-6", card.color)} />
              <div>
                <p className="font-semibold text-surface-100 group-hover:text-white transition-colors">
                  {card.label}
                </p>
                <p className="mt-1 text-sm text-surface-500">{card.desc}</p>
              </div>
              <ArrowRight className="size-4 text-surface-600 group-hover:text-surface-400 transition-colors mt-auto self-end" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Scan History */}
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="font-semibold text-surface-100 flex items-center gap-2">
              <History className="size-4 text-cyber-400" />
              Recent Scans
            </h3>
            <Link href="/dashboard/tools/history" className="text-xs text-cyber-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-surface-800">
            {recentRuns.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Wrench className="size-8 text-surface-700 mx-auto mb-2" />
                <p className="text-sm text-surface-500">No scans yet.</p>
                <Link href="/dashboard/tools" className="mt-2 inline-block text-xs text-cyber-400 hover:underline">
                  Run your first tool →
                </Link>
              </div>
            ) : recentRuns.map((run) => {
              const StatusIcon = STATUS_ICONS[run.status] ?? Clock;
              return (
                <div key={run.id} className="flex items-center gap-4 px-5 py-3">
                  <StatusIcon className={cn("size-4 shrink-0", STATUS_COLORS[run.status] ?? "text-surface-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-200 truncate capitalize">
                      {run.tool?.slug?.replace(/-/g, " ") ?? "Tool Run"}
                    </p>
                    <p className="text-xs text-surface-500">
                      {run.createdAt ? formatDistanceToNow(new Date(run.createdAt), { addSuffix: true }) : "—"}
                    </p>
                  </div>
                  <span className={cn("text-xs font-medium", STATUS_COLORS[run.status] ?? "text-surface-500")}>
                    {run.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open Findings by Severity */}
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="font-semibold text-surface-100 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-400" />
              Open Findings
            </h3>
            <Link href="/dashboard/ops/findings" className="text-xs text-cyber-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {openFindings.length === 0 ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="size-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-surface-500">No open findings. Clean slate! 🎉</p>
              </div>
            ) : (
              ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(severity => {
                const count = severityCounts[severity] ?? 0;
                const max = Math.max(...Object.values(severityCounts), 1);
                const barColor = severity === "CRITICAL" ? "bg-red-500" : severity === "HIGH" ? "bg-orange-500" : severity === "MEDIUM" ? "bg-amber-500" : "bg-blue-500";
                const labelColor = severity === "CRITICAL" ? "text-red-400 border-red-400/30 bg-red-400/10" : severity === "HIGH" ? "text-orange-400 border-orange-400/30 bg-orange-400/10" : severity === "MEDIUM" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : "text-blue-400 border-blue-400/30 bg-blue-400/10";
                return (
                  <div key={severity} className="flex items-center gap-3">
                    <span className={cn("text-xs rounded-full border px-2.5 py-0.5 font-semibold w-20 text-center", labelColor)}>
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
      </div>
    </div>
  );
}
