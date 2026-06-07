"use client";

import { cn } from "@/lib/utils";

type DiffFilter = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface LabCategoryFilterProps {
  selected: DiffFilter;
  onChange: (d: DiffFilter) => void;
  counts: Record<DiffFilter, number>;
}

const FILTERS: { value: DiffFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function LabCategoryFilter({ selected, onChange, counts }: LabCategoryFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-surface-800 bg-surface-900/50 p-1 w-fit">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            selected === f.value
              ? "bg-cyber-600/20 text-cyber-400 border border-cyber-600/30"
              : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
          )}
        >
          {f.label}
          <span className={cn(
            "text-xs rounded-full px-1.5 py-0.5",
            selected === f.value ? "bg-cyber-600/30 text-cyber-300" : "bg-surface-800 text-surface-500"
          )}>
            {counts[f.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
