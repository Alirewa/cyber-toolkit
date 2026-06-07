"use client";

import { cn } from "@/lib/utils";

type Category = "ALL" | "NETWORK" | "ANALYSIS" | "ENCODING";

interface ToolCategoryFilterProps {
  selected: Category;
  onChange: (cat: Category) => void;
  counts: Record<Category, number>;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "NETWORK", label: "Network" },
  { value: "ANALYSIS", label: "Analysis" },
  { value: "ENCODING", label: "Encoding" },
];

export function ToolCategoryFilter({ selected, onChange, counts }: ToolCategoryFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-surface-800 bg-surface-900/50 p-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            selected === cat.value
              ? "bg-cyber-600/20 text-cyber-400 border border-cyber-600/30"
              : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
          )}
        >
          {cat.label}
          <span className={cn(
            "text-xs rounded-full px-1.5 py-0.5",
            selected === cat.value ? "bg-cyber-600/30 text-cyber-300" : "bg-surface-800 text-surface-500"
          )}>
            {counts[cat.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
