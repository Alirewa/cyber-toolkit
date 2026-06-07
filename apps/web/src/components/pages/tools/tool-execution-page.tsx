"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, History, AlertTriangle, Globe, Network, ShieldCheck, FileCode, Layers, ShieldAlert, Bot, Tags, Binary, Hash, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { toolsApi, savedTargetsApi, type ToolDefinition } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useToolExecutionStore } from "@/stores/tool-execution.store";
import { useToolExecutionSocket } from "@/hooks/use-tool-execution";
import { OwnershipNotice } from "./ownership-notice";
import { ToolInputForm } from "./tool-input-form";
import { ExecutionProgress } from "./execution-progress";
import { ToolResultCard } from "./tool-result-card";
import { Skeleton } from "@cyberlab/ui";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Network, ShieldCheck, FileCode, Layers, ShieldAlert, Bot, Tags, Binary, Hash, KeyRound,
};

const CATEGORY_COLORS: Record<string, string> = {
  NETWORK: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  ANALYSIS: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  ENCODING: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

interface ToolExecutionPageProps {
  slug: string;
}

export function ToolExecutionPage({ slug }: ToolExecutionPageProps) {
  useToolExecutionSocket();
  const qc = useQueryClient();
  const { executions } = useToolExecutionStore();
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const { data: toolData, isLoading } = useQuery({
    queryKey: queryKeys.tools.bySlug(slug),
    queryFn: () => toolsApi.getBySlug(slug),
  });

  const { data: savedData } = useQuery({
    queryKey: queryKeys.tools.savedTargets,
    queryFn: () => savedTargetsApi.getAll(),
  });

  const runMutation = useMutation({
    mutationFn: (input: Record<string, string>) => toolsApi.run(slug, input),
    onSuccess: (res) => {
      const runId = res.data.runId;
      setActiveRunId(runId);

      // For instant tools, result comes back immediately
      if (res.data.status === "COMPLETED" && res.data.result) {
        toast.success("Tool executed successfully");
      }
    },
    onError: () => {
      toast.error("Failed to execute tool");
    },
  });

  const tool = toolData?.data as ToolDefinition | undefined;
  const savedTargets = savedData?.data ?? [];
  const activeExecution = activeRunId ? executions[activeRunId] : null;
  const isRunning = runMutation.isPending || (activeExecution?.status === "running") || (activeExecution?.status === "pending");

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-400">Tool not found.</p>
        <Link href="/dashboard/tools" className="mt-4 text-cyber-400 hover:underline">← Back to Tools</Link>
      </div>
    );
  }

  const IconComp = ICON_MAP[tool.icon];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tools"
          className="flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Tools
        </Link>
        <Link
          href={`/dashboard/tools/history?tool=${slug}`}
          className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-cyber-400 transition-colors"
        >
          <History className="size-3.5" />
          View History
        </Link>
      </div>

      {/* Tool header */}
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${CATEGORY_COLORS[tool.category] ?? ""}`}>
          {IconComp ? <IconComp className="size-6" /> : <span className="text-sm">{tool.icon[0]}</span>}
        </div>
        <div>
          <h1 className="text-xl font-bold text-surface-50">{tool.name}</h1>
          <p className="mt-0.5 text-sm text-surface-400">{tool.description}</p>
        </div>
      </div>

      {/* Ownership notice for network tools */}
      {tool.isNetwork && <OwnershipNotice />}

      {/* Input form */}
      <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-6">
        <h2 className="text-sm font-semibold text-surface-300 mb-4 uppercase tracking-wider">Configure & Run</h2>
        <ToolInputForm
          tool={tool}
          onRun={(input) => runMutation.mutate(input)}
          isRunning={isRunning}
          savedTargets={savedTargets}
        />
      </div>

      {/* Execution progress */}
      <AnimatePresence>
        {activeExecution && (activeExecution.status === "running" || activeExecution.status === "pending") && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ExecutionProgress execution={activeExecution} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {activeExecution?.status === "completed" && !!activeExecution.result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <ToolResultCard
              title={`${tool.name} — Results`}
              data={(activeExecution.result as Record<string, unknown>)?.["data"] as Record<string, unknown> ?? activeExecution.result as Record<string, unknown>}
              summary={(activeExecution.result as Record<string, unknown>)?.["summary"] as string}
              warnings={(activeExecution.result as Record<string, unknown>)?.["warnings"] as string[]}
              executionMs={(activeExecution.result as Record<string, unknown>)?.["executionMs"] as number}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failed state */}
      {activeExecution?.status === "failed" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="size-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Execution failed</p>
            <p className="text-xs text-surface-500 mt-0.5">{activeExecution.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
