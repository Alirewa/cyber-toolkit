import type { ToolMetadata } from "./tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "./tool-execution.interface";

export abstract class BaseToolHandler {
  abstract readonly metadata: ToolMetadata;

  /** Execute the tool. For network tools, a progressCallback is provided. */
  abstract execute(
    input: Record<string, string>,
    userId: string,
    onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult>;

  protected readonly timeoutMs = 20_000;

  /** Wrap any promise with a 20-second timeout */
  protected withTimeout<T>(promise: Promise<T>, label = "Tool"): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${label} timed out after 20 seconds`)),
          this.timeoutMs,
        ),
      ),
    ]);
  }

  /** Sanitise and normalise a URL/domain input */
  protected normaliseTarget(raw: string): string {
    const trimmed = raw.trim().toLowerCase();
    // Remove protocol if present for domain-only operations
    return trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }

  /** Ensure input has a full URL */
  protected normaliseUrl(raw: string): string {
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  /** Elapsed time helper */
  protected elapsed(startMs: number): number {
    return Date.now() - startMs;
  }
}
