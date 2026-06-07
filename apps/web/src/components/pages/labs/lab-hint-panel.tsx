"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Lock, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { labsApi, type LabHint } from "@/lib/api-client";
import { useLabSessionStore } from "@/stores/lab-session.store";
import { cn } from "@/lib/utils";

interface LabHintPanelProps {
  labSlug: string;
  hints: LabHint[];
}

export function LabHintPanel({ labSlug, hints }: LabHintPanelProps) {
  const unlockedHints = useLabSessionStore((s) => s.unlockedHints);
  const unlockHint = useLabSessionStore((s) => s.unlockHint);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (key: string) => labsApi.getHint(labSlug, key),
    onSuccess: (res) => {
      unlockHint(res.data);
      toast.info(`Hint unlocked${res.data.xpCost > 0 ? ` (-${res.data.xpCost} XP from this lab's reward)` : ""}`);
    },
    onError: () => toast.error("Failed to unlock hint"),
    onSettled: () => setPendingKey(null),
  });

  if (hints.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="size-4 text-amber-400" />
        <h3 className="font-semibold text-surface-100">Hints</h3>
        <span className="text-xs text-surface-500">({Object.keys(unlockedHints).length}/{hints.length} unlocked)</span>
      </div>

      <div className="space-y-2">
        {hints.map((hint) => {
          const unlocked = unlockedHints[hint.key];
          const isPending = pendingKey === hint.key && mutation.isPending;

          return (
            <div key={hint.key} className="rounded-lg border border-surface-800 bg-surface-950/40 overflow-hidden">
              {unlocked ? (
                <div className="p-3">
                  <p className="text-sm font-medium text-amber-400 mb-1">{unlocked.title}</p>
                  <p className="text-sm text-surface-300 leading-relaxed">{unlocked.content}</p>
                </div>
              ) : (
                <button
                  onClick={() => { setPendingKey(hint.key); mutation.mutate(hint.key); }}
                  disabled={isPending}
                  className="flex w-full items-center justify-between p-3 hover:bg-surface-800/50 transition-colors disabled:opacity-60"
                >
                  <div className="flex items-center gap-2">
                    {isPending ? <Loader2 className="size-4 animate-spin text-surface-500" /> : <Lock className="size-4 text-surface-500" />}
                    <span className="text-sm text-surface-300">{hint.title}</span>
                  </div>
                  {hint.xpCost > 0 && (
                    <span className={cn("flex items-center gap-0.5 text-xs text-amber-400/80")}>
                      <Zap className="size-3" /> -{hint.xpCost}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {Object.keys(unlockedHints).length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-xs text-surface-600"
          >
            Using hints reduces the XP you earn from completing this lab.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
