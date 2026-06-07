import type { ExecutionContext } from "./node-handler.interface";

const VAR_PATTERN = /\$\{([^}]+)\}/g;

/** Interpolate `${nodeId.field.path}` expressions against execution node states. */
export function resolveVar(expr: string, ctx: ExecutionContext): string {
  return expr.replace(VAR_PATTERN, (_, path: string) => {
    const parts = path.split(".");
    const nodeId = parts[0];
    const rest = parts.slice(1);
    let value: unknown = ctx.nodeStates[nodeId]?.output;
    for (const key of rest) {
      if (value === null || value === undefined) break;
      value = (value as Record<string, unknown>)[key];
    }
    return value !== undefined && value !== null ? String(value) : "";
  });
}
