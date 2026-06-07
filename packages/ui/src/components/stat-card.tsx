"use client";

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: { value: number; direction: "up" | "down" };
  description?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  accent?: "green" | "blue" | "purple" | "orange";
}

const accentStyles = {
  green: "text-cyber-400 bg-cyber-500/10 border-cyber-500/20",
  blue: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

export function StatCard({
  title,
  value,
  delta,
  description,
  icon,
  loading,
  className,
  accent = "green",
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 hover:border-surface-700 transition-colors", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-surface-400">{title}</p>
        {icon && (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border [&_svg]:size-4", accentStyles[accent])}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <p className="text-2xl font-bold text-surface-50 tabular-nums">{value}</p>
        {delta && (
          <div
            className={cn(
              "mb-0.5 flex items-center gap-0.5 text-xs font-medium",
              delta.direction === "up" ? "text-emerald-400" : "text-red-400"
            )}
          >
            {delta.direction === "up" ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {Math.abs(delta.value)}%
          </div>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-surface-500">{description}</p>}
    </Card>
  );
}
