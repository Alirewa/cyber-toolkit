"use client";

import { AlertTriangle } from "lucide-react";

interface OwnershipNoticeProps {
  className?: string;
}

export function OwnershipNotice({ className }: OwnershipNoticeProps) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 ${className ?? ""}`}>
      <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-300/80 leading-relaxed">
        <span className="font-semibold text-amber-300">Authorized Use Only — </span>
        Only scan or analyze targets you own or have explicit written permission to test.
        Unauthorized scanning may violate laws and Terms of Service agreements.
      </p>
    </div>
  );
}
