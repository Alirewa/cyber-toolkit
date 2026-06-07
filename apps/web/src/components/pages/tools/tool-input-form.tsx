"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import type { ToolDefinition } from "@/lib/api-client";

interface ToolInputFormProps {
  tool: ToolDefinition;
  onRun: (input: Record<string, string>) => void;
  isRunning: boolean;
  savedTargets?: Array<{ id: string; label: string; target: string }>;
}

export function ToolInputForm({ tool, onRun, isRunning, savedTargets }: ToolInputFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const field of tool.inputSchema.fields) {
      if (field.type === "select" && field.options?.[0]) {
        defaults[field.key] = field.options[0];
      } else {
        defaults[field.key] = "";
      }
    }
    return defaults;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {tool.inputSchema.fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <label className="text-sm font-medium text-surface-300">
            {field.label}
            {field.required && <span className="ml-1 text-red-400">*</span>}
          </label>

          {field.type === "select" ? (
            <select
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="w-full h-10 rounded-lg border border-surface-700 bg-surface-900 px-3 text-sm text-surface-100 focus:border-cyber-500 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-colors"
            >
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              rows={4}
              required={field.required}
              className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm font-mono text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-colors resize-y"
            />
          ) : (
            <div className="flex gap-2">
              <input
                type={field.type === "url" ? "url" : "text"}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 h-10 rounded-lg border border-surface-700 bg-surface-900 px-3 text-sm font-mono text-surface-100 placeholder:text-surface-600 focus:border-cyber-500 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-colors"
              />
              {/* Saved targets dropdown for first url/text field */}
              {savedTargets && savedTargets.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) setValues((v) => ({ ...v, [field.key]: e.target.value }));
                    e.target.value = "";
                  }}
                  defaultValue=""
                  className="h-10 rounded-lg border border-surface-700 bg-surface-900 px-2 text-xs text-surface-400 focus:outline-none"
                  title="Use saved target"
                >
                  <option value="" disabled>Saved…</option>
                  {savedTargets.map((t) => (
                    <option key={t.id} value={t.target}>{t.label}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {field.helpText && (
            <p className="text-xs text-surface-600">{field.helpText}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isRunning}
        className="flex items-center gap-2 rounded-lg bg-cyber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyber-500 disabled:opacity-60 transition-all shadow-glow-sm hover:shadow-glow active:scale-95"
      >
        {isRunning ? (
          <><Loader2 className="size-4 animate-spin" /> Running…</>
        ) : (
          <><Play className="size-4" /> Run Tool</>
        )}
      </button>
    </form>
  );
}
