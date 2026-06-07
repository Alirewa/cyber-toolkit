"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Droplet, Flame, Target, Brain, Zap, TrendingUp, Sword, KeyRound,
  Database, Trophy, Lock, Award,
} from "lucide-react";
import { labsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplet, Flame, Target, Brain, Zap, TrendingUp, Sword, KeyRound, Database, Trophy, Award,
};

// Full catalog so we can show locked ones too
const CATALOG = [
  { slug: "first-blood", name: "First Blood", description: "Complete your first lab", icon: "Droplet" },
  { slug: "on-fire", name: "On Fire", description: "Complete 3 labs in one day", icon: "Flame" },
  { slug: "perfect-score", name: "Perfect Score", description: "Complete a lab with a 100% score", icon: "Target" },
  { slug: "hint-free", name: "Hint-Free", description: "Complete a lab without using any hints", icon: "Brain" },
  { slug: "speed-hacker", name: "Speed Hacker", description: "Complete a lab in under 10 minutes", icon: "Zap" },
  { slug: "level-up", name: "Rising Star", description: "Reach level 3 (Hacker)", icon: "TrendingUp" },
  { slug: "xss-slayer", name: "XSS Slayer", description: "Complete all XSS labs", icon: "Sword" },
  { slug: "jwt-jedi", name: "JWT Jedi", description: "Complete all JWT labs", icon: "KeyRound" },
  { slug: "sql-sorcerer", name: "SQL Sorcerer", description: "Complete all SQL injection labs", icon: "Database" },
  { slug: "completionist", name: "Completionist", description: "Complete all available labs", icon: "Trophy" },
];

export function LabsAchievements() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.labs.myAchievements,
    queryFn: () => labsApi.getMyAchievements(),
  });

  const earned = new Map((data?.data ?? []).map((a) => [a.achievement.slug, a.earnedAt]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Achievements</h1>
        <p className="mt-1 text-surface-400">
          {isLoading ? "Loading…" : `${earned.size}/${CATALOG.length} unlocked`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG.map((ach, i) => {
            const Icon = ICON_MAP[ach.icon] ?? Award;
            const unlocked = earned.has(ach.slug);
            return (
              <motion.div
                key={ach.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "relative flex items-center gap-4 rounded-xl border p-4 transition-all",
                  unlocked
                    ? "border-cyber-600/30 bg-cyber-600/5"
                    : "border-surface-800 bg-surface-900/30 opacity-60"
                )}
              >
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                  unlocked
                    ? "text-cyber-400 bg-cyber-400/10 border-cyber-400/20"
                    : "text-surface-600 bg-surface-800 border-surface-700"
                )}>
                  {unlocked ? <Icon className="size-6" /> : <Lock className="size-5" />}
                </div>
                <div className="flex-1">
                  <p className={cn("font-semibold", unlocked ? "text-surface-100" : "text-surface-400")}>
                    {ach.name}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{ach.description}</p>
                  {unlocked && (
                    <p className="text-xs text-cyber-400/70 mt-1">
                      Unlocked {new Date(earned.get(ach.slug)!).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
