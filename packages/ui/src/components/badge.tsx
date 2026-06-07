"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-cyber-600 text-white hover:bg-cyber-500",
        secondary: "border-transparent bg-surface-700 text-surface-200 hover:bg-surface-600",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-500",
        outline: "border-surface-600 text-surface-300",
        success: "border-transparent bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
        warning: "border-transparent bg-amber-600/20 text-amber-400 border-amber-600/30",
        danger: "border-transparent bg-red-600/20 text-red-400 border-red-600/30",
        info: "border-transparent bg-sky-600/20 text-sky-400 border-sky-600/30",
        cyber: "border-cyber-500/30 bg-cyber-500/10 text-cyber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
