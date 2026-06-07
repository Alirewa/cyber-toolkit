"use client";

import { Shield } from "lucide-react";
import { Badge } from "@cyberlab/ui";

export function AdminTopbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-red-900/30 bg-surface-900/80 backdrop-blur-xl px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Shield className="size-4 text-red-400" />
        <span className="text-sm font-semibold text-surface-200">Admin Dashboard</span>
        <Badge variant="danger">Restricted</Badge>
      </div>
      <p className="text-xs text-surface-600">All actions are logged in the audit trail</p>
    </header>
  );
}
