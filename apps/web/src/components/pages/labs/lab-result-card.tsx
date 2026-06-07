"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Zap, RotateCcw, Trophy } from "lucide-react";
import type { SubmitResult } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface LabResultCardProps {
  result: SubmitResult;
  onRetry: () => void;
}

export function LabResultCard({ result, onRetry }: LabResultCardProps) {
  const percent = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border p-6",
        result.passed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <div className="flex items-start gap-4">
        {result.passed ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <Trophy className="size-6 text-emerald-400" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <XCircle className="size-6 text-amber-400" />
          </div>
        )}

        <div className="flex-1">
          <h3 className={cn("text-lg font-bold", result.passed ? "text-emerald-400" : "text-amber-400")}>
            {result.passed ? "Lab Completed!" : "Not quite — try again"}
          </h3>
          <p className="text-sm text-surface-400 mt-0.5">
            Score: <span className="font-semibold text-surface-200">{result.score}/{result.maxScore}</span> ({percent}%)
          </p>

          {result.passed && result.xpEarned > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyber-600/15 border border-cyber-600/30 px-3 py-1 text-cyber-400">
              <Zap className="size-3.5" />
              <span className="text-sm font-bold">+{result.xpEarned} XP earned</span>
            </div>
          )}
          {result.hintsUsed > 0 && (
            <p className="mt-2 text-xs text-surface-500">{result.hintsUsed} hint(s) used</p>
          )}
        </div>
      </div>

      {/* Per-question feedback */}
      <div className="mt-5 space-y-2">
        {Object.entries(result.feedback).map(([key, fb]) => (
          <div
            key={key}
            className={cn(
              "rounded-lg border p-3",
              fb.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
            )}
          >
            <div className="flex items-start gap-2">
              {fb.correct ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <XCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <div>
                <p className={cn("text-sm font-medium", fb.correct ? "text-emerald-300" : "text-red-300")}>
                  {fb.message}
                </p>
                {fb.explanation && (
                  <p className="text-xs text-surface-400 mt-1 leading-relaxed">{fb.explanation}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!result.passed && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-sm font-medium text-surface-200 hover:bg-surface-700 transition-colors"
        >
          <RotateCcw className="size-4" /> Try Again
        </button>
      )}
    </motion.div>
  );
}
