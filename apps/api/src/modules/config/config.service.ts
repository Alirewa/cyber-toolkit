import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}

  get nodeEnv(): string {
    return this.config.get<string>("NODE_ENV", "development");
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  get port(): number {
    return this.config.get<number>("PORT", 3001);
  }

  get frontendUrl(): string {
    return this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
  }

  get databaseUrl(): string {
    return this.config.getOrThrow<string>("DATABASE_URL");
  }

  get redisHost(): string {
    return this.config.get<string>("REDIS_HOST", "localhost");
  }

  get redisPort(): number {
    return this.config.get<number>("REDIS_PORT", 6379);
  }

  get redisPassword(): string {
    return this.config.getOrThrow<string>("REDIS_PASSWORD");
  }

  get jwtAccessSecret(): string {
    return this.config.getOrThrow<string>("JWT_ACCESS_SECRET");
  }

  get jwtRefreshSecret(): string {
    return this.config.getOrThrow<string>("JWT_REFRESH_SECRET");
  }

  get jwtAccessExpiry(): string {
    return this.config.get<string>("JWT_ACCESS_EXPIRY", "15m");
  }

  get jwtRefreshExpiry(): string {
    return this.config.get<string>("JWT_REFRESH_EXPIRY", "7d");
  }

  get csrfSecret(): string {
    return this.config.getOrThrow<string>("CSRF_SECRET");
  }

  get smtpHost(): string {
    return this.config.get<string>("SMTP_HOST", "smtp.mailtrap.io");
  }

  get smtpPort(): number {
    return this.config.get<number>("SMTP_PORT", 587);
  }

  get smtpUser(): string {
    return this.config.get<string>("SMTP_USER", "");
  }

  get smtpPass(): string {
    return this.config.get<string>("SMTP_PASS", "");
  }

  get smtpFrom(): string {
    return this.config.get<string>("SMTP_FROM", "noreply@cyberlab.io");
  }

  get throttleGlobalLimit(): number {
    return this.config.get<number>("THROTTLE_GLOBAL_LIMIT", 100);
  }

  get throttleAuthLimit(): number {
    return this.config.get<number>("THROTTLE_AUTH_LIMIT", 5);
  }

  get throttleTtlMs(): number {
    return this.config.get<number>("THROTTLE_TTL_MS", 60000);
  }

  get seedAdminEmail(): string {
    return this.config.get<string>("SEED_ADMIN_EMAIL", "admin@cyberlab.io");
  }

  get seedAdminUsername(): string {
    return this.config.get<string>("SEED_ADMIN_USERNAME", "superadmin");
  }

  get seedAdminPassword(): string {
    return this.config.get<string>("SEED_ADMIN_PASSWORD", "changeme123");
  }

  // ── Lab Sandbox ───────────────────────────────────────────────────────
  /** "mock" | "docker". Defaults to docker in production, mock otherwise. */
  get sandboxProvider(): "mock" | "docker" {
    const explicit = this.config.get<string>("SANDBOX_PROVIDER");
    if (explicit === "docker" || explicit === "mock") return explicit;
    return this.isProduction ? "docker" : "mock";
  }

  /** Hostname used to build sandbox URLs returned to the browser. */
  get sandboxHost(): string {
    return this.config.get<string>("SANDBOX_HOST", "localhost");
  }

  /** URL scheme for sandbox links. */
  get sandboxScheme(): string {
    return this.config.get<string>("SANDBOX_SCHEME", "http");
  }

  /** Docker network the sandbox containers attach to (isolated, no egress). */
  get sandboxNetwork(): string {
    return this.config.get<string>("SANDBOX_NETWORK", "cyberlab_sandbox");
  }

  /** Path to the Docker daemon socket. */
  get dockerSocketPath(): string {
    return this.config.get<string>("DOCKER_SOCKET_PATH", "/var/run/docker.sock");
  }

  /** Session time-to-live in minutes. */
  get sandboxTtlMinutes(): number {
    return this.config.get<number>("SANDBOX_TTL_MINUTES", 60);
  }

  /** Per-container memory cap (MB). */
  get sandboxMemoryMb(): number {
    return this.config.get<number>("SANDBOX_MEMORY_MB", 256);
  }

  /** Per-container CPU quota as a fraction of one core (e.g. 0.5). */
  get sandboxCpus(): number {
    return this.config.get<number>("SANDBOX_CPUS", 0.5);
  }

  /** Host port allocation range (inclusive). */
  get sandboxPortRangeStart(): number {
    return this.config.get<number>("SANDBOX_PORT_RANGE_START", 21000);
  }

  get sandboxPortRangeEnd(): number {
    return this.config.get<number>("SANDBOX_PORT_RANGE_END", 21999);
  }
}
