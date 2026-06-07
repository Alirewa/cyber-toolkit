"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, Globe, Network, ShieldCheck, FileCode, Layers, ShieldAlert, Bot, Tags, Binary, Hash, KeyRound } from "lucide-react";
import { toolsApi, type ToolDefinition } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { Skeleton } from "@cyberlab/ui";
import { ToolCategoryFilter } from "./tool-category-filter";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ReactNode> = {
  Globe: <Globe className="size-5" />,
  Network: <Network className="size-5" />,
  ShieldCheck: <ShieldCheck className="size-5" />,
  FileCode: <FileCode className="size-5" />,
  Layers: <Layers className="size-5" />,
  ShieldAlert: <ShieldAlert className="size-5" />,
  Bot: <Bot className="size-5" />,
  Tags: <Tags className="size-5" />,
  Binary: <Binary className="size-5" />,
  Hash: <Hash className="size-5" />,
  KeyRound: <KeyRound className="size-5" />,
};

const CATEGORY_COLORS = {
  NETWORK: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  ANALYSIS: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  ENCODING: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

type CategoryFilter = "ALL" | "NETWORK" | "ANALYSIS" | "ENCODING";

export function ToolsHub() {
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tools.all,
    queryFn: () => toolsApi.getAll(),
  });

  const tools = (data?.data ?? []) as ToolDefinition[];

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchCat = category === "ALL" || t.category === category;
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [tools, category, search]);

  const counts = useMemo(() => ({
    ALL: tools.length,
    NETWORK: tools.filter((t) => t.category === "NETWORK").length,
    ANALYSIS: tools.filter((t) => t.category === "ANALYSIS").length,
    ENCODING: tools.filter((t) => t.category === "ENCODING").length,
  }), [tools]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Cyber Tools</h1>
          <p className="mt-1 text-surface-400">Defensive security utilities for authorized research</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full h-9 rounded-lg border border-surface-700 bg-surface-900 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter */}
      <ToolCategoryFilter selected={category} onChange={setCategory} counts={counts} />

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-surface-500">No tools found matching your search.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool, i) => (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href={`/dashboard/tools/${tool.slug}`}
                className="group flex flex-col rounded-xl border border-surface-800 bg-surface-900/50 p-5 hover:border-surface-700 hover:bg-surface-900 transition-all h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", CATEGORY_COLORS[tool.category])}>
                    {ICON_MAP[tool.icon] ?? <span className="text-xs">{tool.icon[0]}</span>}
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium border", CATEGORY_COLORS[tool.category])}>
                    {tool.category.charAt(0) + tool.category.slice(1).toLowerCase()}
                  </span>
                </div>

                <h3 className="font-semibold text-surface-100 group-hover:text-cyber-400 transition-colors mb-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-surface-500 leading-relaxed flex-1 line-clamp-2">
                  {tool.description}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-cyber-400 group-hover:gap-2.5 transition-all">
                  <span>Run Tool</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
