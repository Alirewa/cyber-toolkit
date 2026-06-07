"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { findingsApi, type FindingSummary, type FindingSeverity } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  LOW: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  INFO: "text-surface-400 bg-surface-700/40 border-surface-700",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "text-red-300 bg-red-500/10",
  IN_PROGRESS: "text-amber-300 bg-amber-500/10",
  MITIGATED: "text-sky-300 bg-sky-500/10",
  CLOSED: "text-emerald-300 bg-emerald-500/10",
  ARCHIVED: "text-surface-500 bg-surface-800",
};

const SEVERITIES: (FindingSeverity | "ALL")[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

function NewFindingModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", severity: "MEDIUM" as FindingSeverity, target: "", tags: "" });
  const mutation = useMutation({
    mutationFn: () => findingsApi.create({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ops", "findings"] });
      toast.success("Finding created");
      onClose();
    },
    onError: () => toast.error("Failed to create finding"),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-surface-700 bg-surface-900 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-surface-50 mb-4">New Finding</h2>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title"
            className="w-full h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={4}
            className="w-full rounded-lg border border-surface-700 bg-surface-950 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none resize-y" />
          <div className="flex gap-2">
            <select value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as FindingSeverity }))}
              className="flex-1 h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 focus:outline-none">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} placeholder="Target (optional)"
              className="flex-1 h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
          </div>
          <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="tags, comma-separated"
            className="w-full h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-surface-700 bg-surface-800 py-2 text-sm text-surface-200">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.title || !form.description || mutation.isPending}
            className="flex-1 rounded-lg bg-cyber-600 py-2 text-sm font-medium text-white hover:bg-cyber-500 disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />} Create
          </button>
        </div>
      </div>
    </div>
  );
}

export function FindingsDashboard() {
  const [severity, setSeverity] = useState<FindingSeverity | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ops.findings({ severity, search }),
    queryFn: () => findingsApi.list({ severity: severity === "ALL" ? undefined : severity, search: search || undefined, limit: 50 }),
  });

  const findings = (data?.data?.items ?? []) as FindingSummary[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Findings</h1>
          <p className="mt-1 text-surface-400">Track and remediate security findings</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyber-500 transition-colors">
          <Plus className="size-4" /> New Finding
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search findings..."
            className="w-full h-9 rounded-lg border border-surface-700 bg-surface-900 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
        </div>
        <div className="flex rounded-lg border border-surface-800 bg-surface-900/50 p-1 gap-1 flex-wrap">
          {SEVERITIES.map((s) => (
            <button key={s} onClick={() => setSeverity(s)}
              className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                severity === s ? "bg-cyber-600/20 text-cyber-400 border border-cyber-600/30" : "text-surface-400 hover:text-surface-200")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : findings.length === 0 ? (
        <div className="py-12 text-center">
          <AlertTriangle className="mx-auto size-10 text-surface-700 mb-3" />
          <p className="text-surface-400">No findings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {findings.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/dashboard/ops/findings/${f.id}`}
                className="flex items-center gap-4 rounded-xl border border-surface-800 bg-surface-900/50 p-4 hover:border-surface-700 transition-colors group">
                <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold", SEVERITY_STYLES[f.severity])}>{f.severity}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200 group-hover:text-cyber-400 transition-colors truncate">{f.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-surface-500">
                    {f.target && <span className="font-mono">{f.target}</span>}
                    <span>{formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}</span>
                    {f.tags.slice(0, 2).map((t) => <span key={t} className="bg-surface-800 rounded-full px-2 py-0.5">{t}</span>)}
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[f.status])}>{f.status.replace("_", " ")}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {showNew && <NewFindingModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
