"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XpLevelBarProps {
  totalXp: number;
  level: number;
  levelName: string;
  nextLevelXp: number;
  compact?: boolean;
}

export function XpLevelBar({ totalXp, level, levelName, nextLevelXp, compact }: XpLevelBarProps) {
  const percent = nextLevelXp > totalXp ? Math.min(100, Math.round((totalXp / nextLevelXp) * 100)) : 100;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-600/20 border border-cyber-600/30 text-cyber-400 text-sm font-bold">
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-100">{levelName}</p>
            <p className="text-xs text-surface-500">Level {level}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-cyber-400">
          <Zap className="size-3.5" />
          <span className="text-sm font-bold tabular-nums">{totalXp.toLocaleString()} XP</span>
        </div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyber-600 to-cyber-400"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {nextLevelXp > totalXp && (
        <p className="text-xs text-surface-500 text-right">
          {(nextLevelXp - totalXp).toLocaleString()} XP to next level
        </p>
      )}
    </div>
  );
}
