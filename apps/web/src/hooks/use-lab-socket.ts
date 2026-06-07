"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/socket-provider";
import { useLabSessionStore } from "@/stores/lab-session.store";
import { queryKeys } from "@/lib/query-keys";

interface XpGainedPayload {
  xpGained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
}

interface AchievementPayload {
  achievement: { slug: string; name: string; icon: string; xpReward: number };
}

/** Wires lab-related WS events to TanStack Query + Zustand + toasts */
export function useLabSocket() {
  const { socket } = useSocket();
  const qc = useQueryClient();
  const setRecentXp = useLabSessionStore((s) => s.setRecentXp);

  useEffect(() => {
    if (!socket) return;

    socket.on("xp:gained", (payload: XpGainedPayload) => {
      setRecentXp({
        gained: payload.xpGained,
        total: payload.totalXp,
        level: payload.level,
        leveledUp: payload.leveledUp,
      });
      void qc.invalidateQueries({ queryKey: queryKeys.labs.myScore });
      void qc.invalidateQueries({ queryKey: queryKeys.labs.myProgress });

      if (payload.leveledUp) {
        toast.success(`Level Up! You reached level ${payload.level} 🎉`, {
          description: `+${payload.xpGained} XP earned`,
        });
      } else {
        toast.success(`+${payload.xpGained} XP earned`);
      }
    });

    socket.on("achievement:unlocked", (payload: AchievementPayload) => {
      toast.success(`🏆 Achievement Unlocked: ${payload.achievement.name}`, {
        description: payload.achievement.xpReward > 0 ? `+${payload.achievement.xpReward} bonus XP` : undefined,
        duration: 6000,
      });
      void qc.invalidateQueries({ queryKey: queryKeys.labs.myAchievements });
    });

    socket.on("lab:session:expired", () => {
      toast.warning("Your lab session has expired. Start a new session to continue.");
      void qc.invalidateQueries({ queryKey: ["labs"] });
    });

    return () => {
      socket.off("xp:gained");
      socket.off("achievement:unlocked");
      socket.off("lab:session:expired");
    };
  }, [socket, qc, setRecentXp]);
}
