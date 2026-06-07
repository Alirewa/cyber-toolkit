"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { findingsApi, type FindingSeverity, type FindingStatus } from "@/lib/api-client";
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

const STATUSES: FindingStatus[] = ["OPEN", "IN_PROGRESS", "MITIGATED", "CLOSED", "ARCHIVED"];

interface FindingDetailData {
  id: string; title: string; description: string; severity: FindingSeverity; status: FindingStatus;
  tags: string[]; target?: string; createdAt: string; resolvedAt?: string;
  user: { id: string; username: string; avatarUrl: string | null };
  comments: Array<{ id: string; body: string; createdAt: string; author: { username: string; avatarUrl: string | null } }>;
}

export function FindingDetailPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ops.findingById(id),
    queryFn: () => findingsApi.getById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: FindingStatus) => findingsApi.update(id, { status }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.ops.findingById(id) }); toast.success("Status updated"); },
  });

  const severityMutation = useMutation({
    mutationFn: (severity: FindingSeverity) => findingsApi.update(id, { severity }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.ops.findingById(id) }); toast.success("Severity updated"); },
  });

  const commentMutation = useMutation({
    mutationFn: () => findingsApi.addComment(id, comment),
    onSuccess: () => { setComment(""); void qc.invalidateQueries({ queryKey: queryKeys.ops.findingById(id) }); },
  });

  if (isLoading) return <div className="max-w-3xl mx-auto space-y-4"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div>;

  const finding = data?.data as FindingDetailData | undefined;
  if (!finding) return <div className="py-12 text-center text-surface-400">Finding not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard/ops/findings" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-200 transition-colors">
        <ArrowLeft className="size-4" /> All Findings
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-surface-800 bg-surface-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-surface-50">{finding.title}</h1>
            <p className="mt-1 text-xs text-surface-500">
              by {finding.user.username} · {formatDistanceToNow(new Date(finding.createdAt), { addSuffix: true })}
            </p>
          </div>
          <span className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-semibold", SEVERITY_STYLES[finding.severity])}>{finding.severity}</span>
        </div>

        {finding.target && <p className="mt-3 font-mono text-sm text-cyber-300 bg-surface-950 rounded-lg px-3 py-2 inline-block">{finding.target}</p>}

        <p className="mt-4 text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">{finding.description}</p>

        {finding.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {finding.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs bg-surface-800 text-surface-400 rounded-full px-2 py-0.5">
                <Tag className="size-2.5" />{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-surface-800 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Status</label>
            <div className="flex rounded-lg border border-surface-700 overflow-hidden flex-wrap">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => statusMutation.mutate(s)}
                  className={cn("px-2.5 py-1.5 text-xs font-medium transition-colors",
                    finding.status === s ? "bg-cyber-600/20 text-cyber-400" : "text-surface-500 hover:text-surface-300")}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Severity</label>
            <select value={finding.severity} onChange={(e) => severityMutation.mutate(e.target.value as FindingSeverity)}
              className="h-9 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 focus:outline-none">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-5">
        <h2 className="font-semibold text-surface-100 mb-4">Comments ({finding.comments.length})</h2>
        <div className="space-y-3 mb-4">
          {finding.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-xs font-bold text-surface-300 shrink-0">
                {c.author.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs text-surface-500"><span className="font-medium text-surface-300">{c.author.username}</span> · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                <p className="text-sm text-surface-300 mt-0.5 whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))}
          {finding.comments.length === 0 && <p className="text-sm text-surface-500">No comments yet.</p>}
        </div>
        <div className="flex gap-2">
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..."
            className="flex-1 h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
          <button onClick={() => commentMutation.mutate()} disabled={!comment.trim() || commentMutation.isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-cyber-600 px-4 text-sm text-white hover:bg-cyber-500 disabled:opacity-60">
            {commentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
