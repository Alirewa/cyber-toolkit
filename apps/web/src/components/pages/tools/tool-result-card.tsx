"use client";

import { useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ToolResultCardProps {
  title: string;
  data: Record<string, unknown>;
  summary?: string;
  warnings?: string[];
  executionMs?: number;
}

export function ToolResultCard({ title, data, summary, warnings, executionMs }: ToolResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800 bg-surface-800/30">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-cyber-500" />
          <span className="text-sm font-semibold text-surface-100">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {executionMs && (
            <span className="text-xs text-surface-600 font-mono">{executionMs}ms</span>
          )}
          <button
            onClick={copyJson}
            className="flex items-center gap-1.5 rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-400 hover:text-surface-200 transition-colors"
          >
            {copied ? <Check className="size-3 text-cyber-400" /> : <Copy className="size-3" />}
            {copied ? "Copied!" : "Copy JSON"}
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="px-4 py-3 border-b border-surface-800/50">
          <p className="text-sm text-surface-300">{summary}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="px-4 py-2 border-b border-surface-800/50 bg-amber-500/5">
          {warnings.map((w) => (
            <p key={w} className="text-xs text-amber-400">⚠ {w}</p>
          ))}
        </div>
      )}

      {/* Data grid */}
      <div className="p-4 space-y-2">
        <DataView data={data} depth={0} />
      </div>

      {/* Expand raw JSON */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2.5 border-t border-surface-800 text-xs text-surface-500 hover:text-surface-300 hover:bg-surface-800/30 transition-colors"
      >
        <span>Raw JSON</span>
        {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <pre className="p-4 text-xs font-mono text-surface-300 overflow-x-auto bg-surface-950/50 border-t border-surface-800 max-h-64">
              {JSON.stringify(data, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DataView({ data, depth }: { data: unknown; depth: number }) {
  if (data === null || data === undefined) return <span className="text-surface-600">null</span>;
  if (typeof data === "boolean") return <span className={data ? "text-emerald-400" : "text-red-400"}>{String(data)}</span>;
  if (typeof data === "number") return <span className="text-sky-400 font-mono">{data}</span>;
  if (typeof data === "string") {
    if (data.length > 200) return <span className="text-surface-300 text-xs">{data.substring(0, 200)}…</span>;
    return <span className="text-surface-300">{data}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-surface-600">[ ]</span>;
    return (
      <div className="space-y-1">
        {data.slice(0, 20).map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-surface-600 font-mono text-xs shrink-0">[{i}]</span>
            <DataView data={item} depth={depth + 1} />
          </div>
        ))}
        {data.length > 20 && <span className="text-surface-500 text-xs">…and {data.length - 20} more</span>}
      </div>
    );
  }

  if (typeof data === "object") {
    return (
      <div className={`space-y-2 ${depth > 0 ? "pl-3 border-l border-surface-800" : ""}`}>
        {Object.entries(data as Record<string, unknown>).map(([key, val]) => (
          <div key={key} className="flex items-start gap-3">
            <span className="text-xs font-medium text-surface-500 shrink-0 min-w-[100px] font-mono">{key}</span>
            <DataView data={val} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-surface-300">{String(data)}</span>;
}
