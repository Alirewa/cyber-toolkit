"use client";

import { cn } from "@/lib/utils";
import type { LabDifficulty } from "@/lib/api-client";

const STYLES: Record<LabDifficulty, string> = {
  BEGINNER: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  INTERMEDIATE: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  ADVANCED: "text-red-400 bg-red-400/10 border-red-400/20",
};

const LABELS: Record<LabDifficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function LabDifficultyBadge({ difficulty, className }: { difficulty: LabDifficulty; className?: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold border", STYLES[difficulty], className)}>
      {LABELS[difficulty]}
    </span>
  );
}
