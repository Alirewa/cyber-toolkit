"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, CheckCircle2, Code2, Database, Globe, RefreshCw,
  Fingerprint, ShieldOff, KeyRound, Gauge, Radar, Upload, Settings, Award, Zap,
} from "lucide-react";
import { labsApi, type LabDefinition } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { LabDifficultyBadge } from "./lab-difficulty-badge";
import { LabCategoryFilter } from "./lab-category-filter";
import { useLabSocket } from "@/hooks/use-lab-socket";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Database, Globe, RefreshCw, Fingerprint, ShieldOff, KeyRound, Gauge, Radar, Upload, Settings, Award,
};

const CATEGORY_LABELS: Record<string, string> = {
  XSS: "XSS", CSRF: "CSRF", SQL_INJECTION: "SQL Injection", IDOR: "IDOR",
  AUTHENTICATION: "Auth", ACCESS_CONTROL: "Access Control", JWT: "JWT",
  SSRF: "SSRF", FILE_UPLOAD: "File Upload", MISCONFIGURATION: "Misconfig", OWASP_TOP10: "OWASP Top 10",
};

type DiffFilter = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export function LabsHub() {
  useLabSocket();
  const [difficulty, setDifficulty] = useState<DiffFilter>("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.labs.all(),
    queryFn: () => labsApi.getAll(),
  });

  const labs = (data?.data ?? []) as LabDefinition[];

  const filtered = useMemo(() => {
    return labs.filter((l) => {
      const matchDiff = difficulty === "ALL" || l.difficulty === difficulty;
      const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase());
      return matchDiff && matchSearch;
    });
  }, [labs, difficulty, search]);

  const counts = useMemo(() => ({
    ALL: labs.length,
    BEGINNER: labs.filter((l) => l.difficulty === "BEGINNER").length,
    INTERMEDIATE: labs.filter((l) => l.difficulty === "INTERMEDIATE").length,
    ADVANCED: labs.filter((l) => l.difficulty === "ADVANCED").length,
  }), [labs]);

  const completedCount = labs.filter((l) => l.userProgress?.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Bug Bounty Labs</h1>
          <p className="mt-1 text-surface-400">
            Interactive security training · {completedCount}/{labs.length} completed
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search labs…"
            className="w-full h-9 rounded-lg border border-surface-700 bg-surface-900 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none"
          />
        </div>
      </div>

      <LabCategoryFilter selected={difficulty} onChange={setDifficulty} counts={counts} />

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-surface-500">No labs found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lab, i) => {
            const Icon = ICON_MAP[lab.icon] ?? Code2;
            const completed = lab.userProgress?.isCompleted;
            return (
              <motion.div
                key={lab.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  href={`/dashboard/labs/${lab.slug}`}
                  className="group relative flex flex-col rounded-xl border border-surface-800 bg-surface-900/50 p-5 hover:border-surface-700 hover:bg-surface-900 transition-all h-full"
                >
                  {/* Completed badge */}
                  {completed && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="size-5 text-emerald-400" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border",
                      completed ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-cyber-400 bg-cyber-400/10 border-cyber-400/20"
                    )}>
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs text-surface-500 font-medium">{CATEGORY_LABELS[lab.category]}</span>
                  </div>

                  <h3 className="font-semibold text-surface-100 group-hover:text-cyber-400 transition-colors mb-1">
                    {lab.name}
                  </h3>
                  <p className="text-xs text-surface-500 leading-relaxed flex-1 line-clamp-2">
                    {lab.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LabDifficultyBadge difficulty={lab.difficulty} />
                      <span className="flex items-center gap-0.5 text-xs text-cyber-400">
                        <Zap className="size-3" /> {lab.xpReward}
                      </span>
                    </div>
                    <ArrowRight className="size-4 text-surface-600 group-hover:text-cyber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
