"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft, Play, Loader2, Send, Target, Clock, CheckCircle2, BookOpen,
  Code2, Database, Globe, RefreshCw, Fingerprint, ShieldOff, KeyRound,
  Gauge, Radar, Upload, Settings, Award, RotateCcw, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { labsApi, type LabDefinition } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { LabDifficultyBadge } from "./lab-difficulty-badge";
import { LabHintPanel } from "./lab-hint-panel";
import { LabResultCard } from "./lab-result-card";
import { useLabSessionStore } from "@/stores/lab-session.store";
import { useLabSocket } from "@/hooks/use-lab-socket";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Database, Globe, RefreshCw, Fingerprint, ShieldOff, KeyRound, Gauge, Radar, Upload, Settings, Award,
};

export function LabWorkspace({ slug }: { slug: string }) {
  useLabSocket();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const session = useLabSessionStore();
  const { activeSessionId, sandboxUrl, lastResult } = session;

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.labs.bySlug(slug),
    queryFn: () => labsApi.getBySlug(slug),
  });

  const lab = data?.data as LabDefinition | undefined;

  // Hydrate session state from existing active session
  useEffect(() => {
    if (lab?.activeSession) {
      session.setSession(lab.activeSession.id, slug, lab.activeSession.sandboxUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lab?.activeSession?.id]);

  const startMutation = useMutation({
    mutationFn: () => labsApi.start(slug),
    onSuccess: (res) => {
      session.setSession(res.data.id, slug, res.data.sandboxUrl);
      toast.success("Lab session started");
    },
    onError: () => toast.error("Failed to start lab session"),
  });

  const resetMutation = useMutation({
    mutationFn: () => labsApi.resetSession(slug),
    onSuccess: (res) => {
      session.setSession(res.data.sessionId, slug, res.data.sandboxUrl);
      session.resetHints();
      session.setResult(null);
      setAnswers({});
      toast.success("Session reset");
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => labsApi.submit(slug, answers, activeSessionId ?? undefined),
    onMutate: () => session.setSubmitting(true),
    onSuccess: (res) => {
      session.setResult(res.data);
      void qc.invalidateQueries({ queryKey: queryKeys.labs.bySlug(slug) });
      void qc.invalidateQueries({ queryKey: queryKeys.labs.myProgress });
    },
    onError: () => toast.error("Submission failed"),
    onSettled: () => session.setSubmitting(false),
  });

  const allAnswered = useMemo(() => {
    if (!lab) return false;
    return lab.questions.every((q) => (answers[q.key] ?? "").trim().length > 0);
  }, [lab, answers]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !lab) {
    return (
      <div className="py-12 text-center">
        <p className="text-surface-400">Lab not found.</p>
        <Link href="/dashboard/labs" className="mt-3 inline-block text-cyber-400 hover:underline">← Back to labs</Link>
      </div>
    );
  }

  const Icon = ICON_MAP[lab.icon] ?? Code2;
  const isCompleted = lab.userProgress?.isCompleted;
  const hasSession = Boolean(activeSessionId);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/dashboard/labs" className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200">
        <ArrowLeft className="size-4" /> Back to Labs
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyber-400/10 border border-cyber-400/20 text-cyber-400">
            <Icon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-surface-50">{lab.name}</h1>
              {isCompleted && <CheckCircle2 className="size-5 text-emerald-400" />}
            </div>
            <p className="mt-1 text-surface-400 max-w-2xl">{lab.description}</p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <LabDifficultyBadge difficulty={lab.difficulty} />
              <span className="flex items-center gap-1 text-sm text-surface-500">
                <Clock className="size-3.5" /> ~{lab.estimatedMin} min
              </span>
              <span className="flex items-center gap-1 text-sm text-cyber-400 font-medium">
                <Award className="size-3.5" /> {lab.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: instructions + sandbox */}
        <div className="lg:col-span-2 space-y-6">
          {/* Objective */}
          <div className="rounded-xl border border-cyber-600/20 bg-cyber-600/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-4 text-cyber-400" />
              <h3 className="font-semibold text-cyber-400">Objective</h3>
            </div>
            <p className="text-sm text-surface-300 leading-relaxed">{lab.objective}</p>
          </div>

          {/* Sandbox iframe */}
          {lab.isSandboxed && hasSession && sandboxUrl && (
            <div className="rounded-xl border border-surface-800 overflow-hidden">
              <div className="flex items-center justify-between bg-surface-900 px-4 py-2 border-b border-surface-800">
                <span className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
                  <Globe className="size-3.5" /> Sandbox Environment
                </span>
                <a href={sandboxUrl} target="_blank" rel="noreferrer" className="text-xs text-cyber-400 hover:underline flex items-center gap-1">
                  Open in new tab <ExternalLink className="size-3" />
                </a>
              </div>
              <iframe src={sandboxUrl} className="w-full h-[420px] bg-white" title="Lab sandbox" sandbox="allow-scripts allow-forms allow-same-origin" />
            </div>
          )}

          {/* Steps */}
          {lab.steps.length > 0 && (
            <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="size-4 text-surface-300" />
                <h3 className="font-semibold text-surface-100">Walkthrough</h3>
              </div>
              <ol className="space-y-4">
                {lab.steps.map((step) => (
                  <li key={step.order} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-800 text-xs font-bold text-surface-300">
                      {step.order}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-surface-200 text-sm">{step.title}</p>
                      <p className="text-sm text-surface-400 mt-1 leading-relaxed whitespace-pre-line">{step.instruction}</p>
                      {step.codeExample && (
                        <pre className="mt-2 rounded-lg bg-surface-950 border border-surface-800 p-3 text-xs text-cyber-300 overflow-x-auto">
                          <code>{step.codeExample}</code>
                        </pre>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right: actions + questions + hints */}
        <div className="space-y-6">
          {/* Session control */}
          {lab.isSandboxed && !hasSession && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyber-600 px-4 py-3 font-medium text-white hover:bg-cyber-500 transition-colors disabled:opacity-60"
            >
              {startMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              Start Lab Session
            </button>
          )}

          {lab.isSandboxed && hasSession && (
            <button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm font-medium text-surface-200 hover:bg-surface-700 transition-colors disabled:opacity-60"
            >
              {resetMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Reset Sandbox
            </button>
          )}

          {/* Result or Questions */}
          {lastResult && lastResult.passed ? (
            <LabResultCard result={lastResult} onRetry={() => session.setResult(null)} />
          ) : (
            <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-5">
              <h3 className="font-semibold text-surface-100 mb-4">Submit Your Answers</h3>
              <div className="space-y-4">
                {lab.questions.map((q) => (
                  <div key={q.key}>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">
                      {q.label}
                      <span className="ml-1.5 text-xs text-surface-600">({q.points} pts)</span>
                    </label>
                    {q.context && (
                      <pre className="mb-2 rounded-lg bg-surface-950 border border-surface-800 p-2.5 text-xs text-amber-300 overflow-x-auto whitespace-pre-wrap">
                        {q.context}
                      </pre>
                    )}
                    {q.type === "select" && q.options ? (
                      <select
                        value={answers[q.key] ?? ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                        className="w-full h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 focus:border-cyber-500 focus:outline-none"
                      >
                        <option value="">Select…</option>
                        {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : q.type === "code" ? (
                      <textarea
                        value={answers[q.key] ?? ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                        placeholder={q.placeholder}
                        rows={3}
                        className="w-full rounded-lg border border-surface-700 bg-surface-950 px-3 py-2 text-sm font-mono text-cyber-300 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none resize-y"
                      />
                    ) : (
                      <input
                        value={answers[q.key] ?? ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                        placeholder={q.placeholder}
                        className="w-full h-10 rounded-lg border border-surface-700 bg-surface-950 px-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none"
                      />
                    )}
                    {q.helpText && <p className="mt-1 text-xs text-surface-600">{q.helpText}</p>}
                  </div>
                ))}
              </div>

              <button
                onClick={() => submitMutation.mutate()}
                disabled={!allAnswered || submitMutation.isPending}
                className={cn(
                  "mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors",
                  allAnswered && !submitMutation.isPending
                    ? "bg-cyber-600 text-white hover:bg-cyber-500"
                    : "bg-surface-800 text-surface-500 cursor-not-allowed"
                )}
              >
                {submitMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit Answers
              </button>

              {/* Inline failed result */}
              {lastResult && !lastResult.passed && (
                <div className="mt-4">
                  <LabResultCard result={lastResult} onRetry={() => session.setResult(null)} />
                </div>
              )}
            </div>
          )}

          {/* Hints */}
          <LabHintPanel labSlug={slug} hints={lab.hints} />
        </div>
      </div>
    </div>
  );
}
