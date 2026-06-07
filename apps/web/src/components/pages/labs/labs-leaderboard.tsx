"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown, Medal, Zap, FlaskConical } from "lucide-react";
import { labsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="size-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="size-5 text-slate-300" />;
  if (rank === 3) return <Medal className="size-5 text-amber-700" />;
  return <span className="text-sm font-bold text-surface-500 w-5 text-center">{rank}</span>;
}

export function LabsLeaderboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.labs.leaderboard,
    queryFn: () => labsApi.getLeaderboard(),
  });

  const entries = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Leaderboard</h1>
        <p className="mt-1 text-surface-400">Top bug bounty hunters by XP</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center text-surface-500">No rankings yet. Be the first!</div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const isMe = entry.userId === user?.id;
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 transition-all",
                  isMe
                    ? "border-cyber-600/40 bg-cyber-600/10"
                    : entry.rank <= 3
                    ? "border-surface-700 bg-surface-900/70"
                    : "border-surface-800 bg-surface-900/40"
                )}
              >
                <div className="flex w-8 justify-center">
                  <RankBadge rank={entry.rank} />
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-800 border border-surface-700 text-sm font-bold text-surface-300 overflow-hidden">
                  {entry.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.avatarUrl} alt={entry.username} className="h-full w-full object-cover" />
                  ) : (
                    entry.username.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-100 truncate">
                    {entry.username}
                    {isMe && <span className="ml-2 text-xs text-cyber-400">(You)</span>}
                  </p>
                  <p className="text-xs text-surface-500">Level {entry.level}</p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-surface-400">
                    <FlaskConical className="size-3.5" /> {entry.labsDone}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-cyber-400 tabular-nums">
                    <Zap className="size-3.5" /> {entry.totalXp.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
