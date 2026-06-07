import { Injectable, OnModuleInit } from "@nestjs/common";

// Lazy-load prom-client to avoid hard dependency issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const promClient = (() => { try { return require("prom-client"); } catch { return null; } })();

@Injectable()
export class MetricsService implements OnModuleInit {
  private registry: unknown;
  private httpRequestsTotal: unknown;
  private httpDurationHistogram: unknown;
  private activeSessionsGauge: unknown;
  private queueJobsTotal: unknown;
  private labCompletionsTotal: unknown;
  private readonly available: boolean;

  constructor() {
    this.available = !!promClient;
  }

  onModuleInit() {
    if (!this.available) return;

    const { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } = promClient;

    this.registry = new Registry();
    (this.registry as { setDefaultLabels: (l: Record<string, string>) => void }).setDefaultLabels({
      app: "cyberlab-api",
    });

    collectDefaultMetrics({ register: this.registry as never });

    this.httpRequestsTotal = new Counter({
      name: "cyberlab_http_requests_total",
      help: "Total HTTP requests",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry as never],
    });

    this.httpDurationHistogram = new Histogram({
      name: "cyberlab_http_duration_ms",
      help: "HTTP request duration in milliseconds",
      labelNames: ["method", "route"],
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.registry as never],
    });

    this.activeSessionsGauge = new Gauge({
      name: "cyberlab_active_sessions",
      help: "Number of active user sessions",
      registers: [this.registry as never],
    });

    this.queueJobsTotal = new Counter({
      name: "cyberlab_queue_jobs_total",
      help: "Total queue jobs processed",
      labelNames: ["queue", "status"],
      registers: [this.registry as never],
    });

    this.labCompletionsTotal = new Counter({
      name: "cyberlab_lab_completions_total",
      help: "Total lab completions",
      labelNames: ["lab_slug", "difficulty"],
      registers: [this.registry as never],
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number) {
    if (!this.available) return;
    (this.httpRequestsTotal as { inc: (l: Record<string, string | number>) => void }).inc({
      method,
      route,
      status_code: statusCode,
    });
    (this.httpDurationHistogram as { observe: (l: Record<string, string>, v: number) => void }).observe(
      { method, route },
      durationMs,
    );
  }

  recordQueueJob(queue: string, status: "completed" | "failed") {
    if (!this.available) return;
    (this.queueJobsTotal as { inc: (l: Record<string, string>) => void }).inc({ queue, status });
  }

  recordLabCompletion(labSlug: string, difficulty: string) {
    if (!this.available) return;
    (this.labCompletionsTotal as { inc: (l: Record<string, string>) => void }).inc({
      lab_slug: labSlug,
      difficulty,
    });
  }

  setActiveSessions(count: number) {
    if (!this.available) return;
    (this.activeSessionsGauge as { set: (v: number) => void }).set(count);
  }

  async getMetrics(): Promise<string> {
    if (!this.available) return "# prom-client not installed\n";
    return (this.registry as { metrics: () => Promise<string> }).metrics();
  }

  getContentType(): string {
    if (!this.available) return "text/plain";
    return promClient.Registry.REGISTRY_CONTENT_TYPE as string;
  }
}
