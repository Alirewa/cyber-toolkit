import { Injectable, Logger } from "@nestjs/common";

/**
 * Personal-mode Redis replacement — fully in-memory, no Redis server required.
 * Drop-in replacement for the ioredis-based RedisService.
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();

  onModuleInit() {
    this.logger.log("RedisService running in in-memory mode (no Redis server needed)");
    // Clean up expired keys every 60s
    setInterval(() => this.purgeExpired(), 60_000);
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  private isExpired(entry: { value: string; expiresAt?: number }): boolean {
    return entry.expiresAt !== undefined && entry.expiresAt <= Date.now();
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string): Promise<void> {
    const existing = this.store.get(key);
    this.store.set(key, { value, expiresAt: existing?.expiresAt });
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (parseInt(current ?? "0", 10) || 0) + 1;
    const existing = this.store.get(key);
    this.store.set(key, { value: String(next), expiresAt: existing?.expiresAt });
    return next;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      this.store.set(key, { value: entry.value, expiresAt: Date.now() + ttlSeconds * 1_000 });
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return -2;
    if (entry.expiresAt === undefined) return -1;
    return Math.ceil((entry.expiresAt - Date.now()) / 1_000);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
    const result: string[] = [];
    for (const [key, entry] of this.store.entries()) {
      if (!this.isExpired(entry) && regex.test(key)) result.push(key);
    }
    return result;
  }

  async ping(): Promise<string> {
    return "PONG";
  }

  /** Compatibility shim — returns a mock client object */
  getClient(): unknown {
    return this;
  }
}
