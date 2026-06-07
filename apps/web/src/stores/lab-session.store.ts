import { create } from "zustand";
import type { SubmitResult } from "@/lib/api-client";

export interface UnlockedHint {
  key: string;
  title: string;
  content: string;
  xpCost: number;
}

interface LabSessionState {
  // Active session
  activeSessionId: string | null;
  activeLabSlug: string | null;
  sandboxUrl: string | null;
  // Unlocked hints for the current lab
  unlockedHints: Record<string, UnlockedHint>;
  // Last submission result
  lastResult: SubmitResult | null;
  isSubmitting: boolean;
  // XP toast state (driven by WS)
  recentXp: { gained: number; total: number; level: number; leveledUp: boolean } | null;

  setSession: (sessionId: string, labSlug: string, sandboxUrl?: string | null) => void;
  clearSession: () => void;
  unlockHint: (hint: UnlockedHint) => void;
  resetHints: () => void;
  setResult: (result: SubmitResult | null) => void;
  setSubmitting: (v: boolean) => void;
  setRecentXp: (xp: LabSessionState["recentXp"]) => void;
}

export const useLabSessionStore = create<LabSessionState>((set) => ({
  activeSessionId: null,
  activeLabSlug: null,
  sandboxUrl: null,
  unlockedHints: {},
  lastResult: null,
  isSubmitting: false,
  recentXp: null,

  setSession: (activeSessionId, activeLabSlug, sandboxUrl = null) =>
    set({ activeSessionId, activeLabSlug, sandboxUrl }),

  clearSession: () =>
    set({ activeSessionId: null, activeLabSlug: null, sandboxUrl: null, unlockedHints: {}, lastResult: null }),

  unlockHint: (hint) =>
    set((state) => ({ unlockedHints: { ...state.unlockedHints, [hint.key]: hint } })),

  resetHints: () => set({ unlockedHints: {} }),

  setResult: (lastResult) => set({ lastResult }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  setRecentXp: (recentXp) => set({ recentXp }),
}));
