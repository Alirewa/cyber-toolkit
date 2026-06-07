"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Plus, Loader2, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { reportsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { formatDistanceToNow } from "date-fns";

const REPORT_TYPES = [
  { value: "TOOL_SUMMARY", label: "Tool Summary", desc: "Tool execution stats over a period" },
  { value: "FINDING_SUMMARY", label: "Finding Summary", desc: "Findings grouped by severity & status" },
  { value: "PROGRESS", label: "Learning Progress", desc: "Your XP, labs, and achievements" },
  { value: "WORKFLOW", label: "Workflow Report", desc: "Workflow execution success rates" },
];

interface ReportRow { id: string; title: string; type: string; status: string; generatedAt: string }

function GenerateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("TOOL_SUMMARY");
  const mutation = useMutation({
    mutationFn: () => reportsApi.generate({ title: title || `${type} Report`, type }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["ops", "reports"] }); toast.success("Report generated"); onClose(); },
    onError: () => toast.error("Failed to generate report"),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-surface-700 bg-surface-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-surface-50 mb-4">Generate Report</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title (optional)"
          className="w-full h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none mb-3" />
        <div className="space-y-2">
          {REPORT_TYPES.map((rt) => (
            <button key={rt.value} onClick={() => setType(rt.value)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${type === rt.value ? "border-cyber-600/40 bg-cyber-600/10" : "border-surface-800 hover:border-surface-700"}`}>
              <p className="text-sm font-medium text-surface-200">{rt.label}</p>
              <p className="text-xs text-surface-500">{rt.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-surface-700 bg-surface-800 py-2 text-sm text-surface-200">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 rounded-lg bg-cyber-600 py-2 text-sm font-medium text-white hover:bg-cyber-500 disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />} Generate
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReportsCenter() {
  const [showGen, setShowGen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ops.reports(),
    queryFn: () => reportsApi.list({ limit: 50 }),
  });

  const reports = (data?.data?.items ?? []) as ReportRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Reports</h1>
          <p className="mt-1 text-surface-400">Generate and export security reports</p>
        </div>
        <button onClick={() => setShowGen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyber-500 transition-colors">
          <Plus className="size-4" /> Generate Report
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto size-10 text-surface-700 mb-3" />
          <p className="text-surface-400">No reports yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 rounded-xl border border-surface-800 bg-surface-900/50 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                <BarChart3 className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">{r.title}</p>
                <p className="text-xs text-surface-500">{r.type.replace("_", " ")} · {formatDistanceToNow(new Date(r.generatedAt), { addSuffix: true })}</p>
              </div>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700">
                <Download className="size-3.5" /> Export PDF
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {showGen && <GenerateModal onClose={() => setShowGen(false)} />}
    </div>
  );
}
