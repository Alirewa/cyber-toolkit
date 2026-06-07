"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800/50 text-surface-400 [&_svg]:size-7">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-base font-semibold text-surface-200">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-surface-500">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
