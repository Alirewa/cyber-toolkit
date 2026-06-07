"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { savedTargetsApi, type SavedTarget } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { EmptyState } from "@cyberlab/ui";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";

export default function SavedTargetsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", target: "", notes: "" });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tools.savedTargets,
    queryFn: () => savedTargetsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: () => savedTargetsApi.create(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tools.savedTargets });
      setForm({ label: "", target: "", notes: "" });
      setShowForm(false);
      toast.success("Target saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => savedTargetsApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tools.savedTargets });
      toast.success("Target deleted");
    },
  });

  const targets = (data?.data ?? []) as SavedTarget[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Saved Targets</h1>
          <p className="mt-1 text-surface-400">Quickly reuse domains, IPs, and URLs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-cyber-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyber-500 transition-colors"
        >
          <Plus className="size-4" /> Add Target
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-5 space-y-4">
          <h3 className="font-semibold text-surface-200">Save New Target</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400">Label</label>
              <input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} placeholder="My Production Server" className="w-full h-9 rounded-lg border border-surface-700 bg-surface-900 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400">Target (domain, IP, or URL)</label>
              <input value={form.target} onChange={(e) => setForm(f => ({ ...f, target: e.target.value }))} placeholder="example.com" className="w-full h-9 rounded-lg border border-surface-700 bg-surface-900 px-3 text-sm font-mono text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
            </div>
          </div>
          <input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full h-9 rounded-lg border border-surface-700 bg-surface-900 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate()} disabled={!form.label || !form.target || createMutation.isPending} className="rounded-lg bg-cyber-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyber-500 disabled:opacity-50 transition-colors">
              {createMutation.isPending ? "Saving…" : "Save Target"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-surface-700 px-4 py-2 text-sm text-surface-400 hover:bg-surface-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Targets list */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-800/40 animate-pulse" />)}</div>
      ) : targets.length === 0 ? (
        <EmptyState icon={<Target />} title="No saved targets" description="Save frequently used domains, IPs, or URLs for quick access in tools." action={<button onClick={() => setShowForm(true)} className="rounded-lg bg-cyber-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyber-500">Add your first target</button>} />
      ) : (
        <div className="space-y-3">
          {targets.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border border-surface-800 bg-surface-900/50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-700 bg-surface-800 text-surface-400">
                <Target className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-surface-200">{t.label}</p>
                <p className="text-xs font-mono text-surface-500 truncate">{t.target}</p>
                {t.notes && <p className="text-xs text-surface-600 mt-0.5">{t.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-600">{formatRelativeTime(t.createdAt)}</span>
                <Link href={`/dashboard/tools?target=${encodeURIComponent(t.target)}`} className="text-surface-500 hover:text-cyber-400 transition-colors">
                  <ExternalLink className="size-4" />
                </Link>
                <button onClick={() => deleteMutation.mutate(t.id)} disabled={deleteMutation.isPending} className="text-surface-600 hover:text-red-400 transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
