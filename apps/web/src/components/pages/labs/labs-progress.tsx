"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Trophy, FlaskConical, TrendingUp, Target } from "lucide-react";
import { labsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { XpLevelBar } from "./xp-level-bar";
import { useLabSocket } from "@/hooks/use-lab-socket";

export function LabsProgress() {
  useLabSocket();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.labs.myProgress,
    queryFn: () => labsApi.getMyProgress(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  const score = data?.data.score;
  const levelInfo = data?.data.levelInfo;
  const stats = data?.data.stats;

  const cards = [
    { label: "Total XP", value: score?.totalXp ?? 0, icon: TrendingUp, color: "text-cyber-400" },
    { label: "Labs Completed", value: `${stats?.completed ?? 0}/${stats?.total ?? 0}`, icon: FlaskConical, color: "text-emerald-400" },
    { label: "Current Streak", value: `${score?.streak ?? 0} days`, icon: Flame, color: "text-orange-400" },
    { label: "Completion", value: `${stats?.percentComplete ?? 0}%`, icon: Target, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">My Progress</h1>
        <p className="mt-1 text-surface-400">Track your bug bounty training journey</p>
      </div>

      {/* Level bar */}
      <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-6">
        <XpLevelBar
          totalXp={score?.totalXp ?? 0}
          level={levelInfo?.current ?? 1}
          levelName={levelInfo?.levelName ?? "Novice"}
          nextLevelXp={levelInfo?.next ?? 100}
        />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-surface-800 bg-surface-900/50 p-5"
          >
            <card.icon className={`size-5 ${card.color}`} />
            <p className="mt-3 text-2xl font-bold text-surface-50 tabular-nums">{card.value}</p>
            <p className="text-sm text-surface-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {(stats?.completed ?? 0) === 0 && (
        <div className="rounded-xl border border-dashed border-surface-800 p-10 text-center">
          <Trophy className="mx-auto size-8 text-surface-700" />
          <p className="mt-3 text-surface-400">You haven&apos;t completed any labs yet.</p>
          <a href="/dashboard/labs" className="mt-2 inline-block text-cyber-400 hover:underline">Start your first lab →</a>
        </div>
      )}
    </div>
  );
}
