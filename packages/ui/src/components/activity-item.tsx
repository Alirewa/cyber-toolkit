"use client";

import * as React from "react";
import type { AuditLog } from "@cyberlab/types";
import { cn } from "../lib/utils";

interface ActivityItemProps {
  log: AuditLog;
  isLast?: boolean;
}

export function ActivityItem({ log, isLast }: ActivityItemProps) {
  const [resource, action] = log.action.split(".");

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-800 border border-surface-700">
          <span className="text-xs font-bold text-cyber-400 uppercase">{resource?.[0] ?? "?"}</span>
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-surface-800" />}
      </div>
      <div className="pb-6 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-surface-200">
            <span className="font-medium text-cyber-400">{action ?? log.action}</span>
            {log.resource && (
              <span className="text-surface-400"> on {log.resource}</span>
            )}
          </p>
          <time className="shrink-0 text-xs text-surface-600">
            {new Date(log.createdAt).toLocaleString()}
          </time>
        </div>
        {log.ipAddress && (
          <p className="mt-0.5 text-xs text-surface-600 font-mono">{log.ipAddress}</p>
        )}
      </div>
    </div>
  );
}
