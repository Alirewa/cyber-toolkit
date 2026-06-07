"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { ActiveExecution } from "@/stores/tool-execution.store";

interface ExecutionProgressProps {
  execution: ActiveExecution;
}

export function ExecutionProgress({ execution }: ExecutionProgressProps) {
  const { status, progress, steps } = execution;

  const isRunning = status === "running" || status === "pending";
  const isCompleted = status === "completed";
  const isFailed = status === "failed" || status === "timeout";

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-5 space-y-4">
      {/* Status header */}
      <div className="flex items-center gap-3">
        {isRunning && <Loader2 className="size-4 text-cyber-400 animate-spin shrink-0" />}
        {isCompleted && <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />}
        {isFailed && <XCircle className="size-4 text-red-400 shrink-0" />}
        <span className={`text-sm font-medium ${isCompleted ? "text-emerald-400" : isFailed ? "text-red-400" : "text-cyber-400"}`}>
          {isRunning ? "Executing tool…" : isCompleted ? "Execution complete" : `Execution failed`}
        </span>
        <span className="ml-auto text-xs text-surface-500 font-mono">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-800">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${isCompleted ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-cyber-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {isRunning && (
          <motion.div
            className="absolute inset-y-0 w-1/4 rounded-full bg-cyber-400/30"
            animate={{ x: ["0%", "400%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Steps log */}
      <AnimatePresence initial={false}>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {steps.slice(-6).map((step, i) => (
            <motion.div
              key={`${step}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs"
            >
              <div className="size-1 rounded-full bg-cyber-500 shrink-0" />
              <span className={i === steps.length - 1 ? "text-surface-200" : "text-surface-500"}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {isFailed && execution.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-xs text-red-400">{execution.error}</p>
        </div>
      )}
    </div>
  );
}
