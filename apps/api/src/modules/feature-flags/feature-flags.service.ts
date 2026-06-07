import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../redis/redis.service";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";

const FLAG_CACHE_TTL = 30; // seconds
const FLAG_CACHE_PREFIX = "ff:";

export interface FlagContext {
  userId?: string;
  organizationId?: string;
}

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Core evaluation engine ────────────────────────────────────

  async isEnabled(flagName: string, ctx: FlagContext = {}): Promise<boolean> {
    const cacheKey = `${FLAG_CACHE_PREFIX}${flagName}:${ctx.organizationId ?? "global"}:${ctx.userId ?? "anon"}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) return cached === "1";

    const result = await this.evaluate(flagName, ctx);
    await this.redis.setex(cacheKey, FLAG_CACHE_TTL, result ? "1" : "0");
    return result;
  }

  private async evaluate(flagName: string, ctx: FlagContext): Promise<boolean> {
    const [flag, overrides] = await Promise.all([
      this.prisma.featureFlag.findUnique({ where: { name: flagName } }),
      this.prisma.featureFlagOverride.findMany({ where: { flagName } }),
    ]);

    if (!flag) return false;

    // 1. User-level override (highest priority)
    if (ctx.userId) {
      const userOverride = overrides.find(
        (o) => o.userId === ctx.userId && o.organizationId === null,
      );
      if (userOverride) {
        if (userOverride.expiresAt && new Date() > userOverride.expiresAt) {
          // expired — skip
        } else {
          return userOverride.isEnabled;
        }
      }
    }

    // 2. Org-level override
    if (ctx.organizationId) {
      const orgOverride = overrides.find(
        (o) => o.organizationId === ctx.organizationId && o.userId === null,
      );
      if (orgOverride) {
        if (orgOverride.expiresAt && new Date() > orgOverride.expiresAt) {
          // expired — skip
        } else {
          if (!orgOverride.isEnabled) return false;
          return this.checkRollout(flagName + (ctx.userId ?? ctx.organizationId ?? ""), orgOverride.rolloutPct);
        }
      }
    }

    // 3. Global flag with rollout
    if (!flag.isEnabled) return false;
    if (flag.rolloutPct >= 100) return true;
    if (flag.rolloutPct <= 0) return false;

    const seed = flagName + (ctx.userId ?? ctx.organizationId ?? "anon");
    return this.checkRollout(seed, flag.rolloutPct);
  }

  /** Deterministic rollout: hash(seed) mod 100 < rolloutPct */
  private checkRollout(seed: string, rolloutPct: number): boolean {
    const hash = crypto.createHash("sha256").update(seed).digest("hex");
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    return bucket < rolloutPct;
  }

  // ── Admin CRUD ────────────────────────────────────────────────

  async listFlags() {
    const [flags, overrides] = await Promise.all([
      this.prisma.featureFlag.findMany({ orderBy: { name: "asc" } }),
      this.prisma.featureFlagOverride.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const overridesByFlag = overrides.reduce<Record<string, typeof overrides>>((acc, o) => {
      if (!acc[o.flagName]) acc[o.flagName] = [];
      acc[o.flagName]!.push(o);
      return acc;
    }, {});

    const flagsWithOverrides = flags.map((f) => ({
      ...f,
      overrides: overridesByFlag[f.name] ?? [],
    }));

    return { data: flagsWithOverrides, message: "Feature flags retrieved" };
  }

  async createFlag(dto: {
    name: string;
    description?: string;
    isEnabled?: boolean;
    rolloutPct?: number;
    environments?: string[];
    config?: Record<string, unknown>;
  }) {
    const flag = await this.prisma.featureFlag.create({
      data: {
        name: dto.name,
        description: dto.description,
        isEnabled: dto.isEnabled ?? false,
        rolloutPct: dto.rolloutPct ?? 100,
        environments: dto.environments ?? ["production", "development"],
        config: dto.config as Prisma.InputJsonValue,
      },
    });
    return { data: flag, message: "Feature flag created" };
  }

  async updateFlag(
    name: string,
    dto: {
      description?: string;
      isEnabled?: boolean;
      rolloutPct?: number;
      environments?: string[];
      config?: Record<string, unknown>;
    },
  ) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) throw new NotFoundException("Feature flag not found");

    const updated = await this.prisma.featureFlag.update({
      where: { name },
      data: {
        ...dto,
        config: dto.config as Prisma.InputJsonValue,
      },
    });

    await this.invalidateCache(name);
    return { data: updated, message: "Feature flag updated" };
  }

  async toggleFlag(name: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (!flag) throw new NotFoundException("Feature flag not found");

    const updated = await this.prisma.featureFlag.update({
      where: { name },
      data: { isEnabled: !flag.isEnabled },
    });

    await this.invalidateCache(name);
    return { data: updated, message: `Feature flag ${updated.isEnabled ? "enabled" : "disabled"}` };
  }

  async deleteFlag(name: string) {
    await this.prisma.featureFlag.delete({ where: { name } });
    await this.invalidateCache(name);
    return { data: null, message: "Feature flag deleted" };
  }

  // ── Overrides ─────────────────────────────────────────────────

  async setOverride(dto: {
    flagName: string;
    organizationId?: string;
    userId?: string;
    isEnabled: boolean;
    rolloutPct?: number;
    expiresAt?: Date;
    config?: Record<string, unknown>;
  }) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { name: dto.flagName } });
    if (!flag) throw new NotFoundException("Feature flag not found");

    const existing = await this.prisma.featureFlagOverride.findFirst({
      where: {
        flagName: dto.flagName,
        organizationId: dto.organizationId ?? null,
        userId: dto.userId ?? null,
      },
    });

    const overrideData = {
      isEnabled: dto.isEnabled,
      rolloutPct: dto.rolloutPct ?? 100,
      expiresAt: dto.expiresAt ?? null,
      config: dto.config ? (dto.config as Prisma.InputJsonValue) : Prisma.JsonNull,
    };

    const override = existing
      ? await this.prisma.featureFlagOverride.update({ where: { id: existing.id }, data: overrideData })
      : await this.prisma.featureFlagOverride.create({
          data: {
            flagName: dto.flagName,
            organizationId: dto.organizationId ?? null,
            userId: dto.userId ?? null,
            ...overrideData,
          },
        });

    await this.invalidateCache(dto.flagName);
    return { data: override, message: "Override set" };
  }

  async deleteOverride(id: string) {
    const override = await this.prisma.featureFlagOverride.findUnique({ where: { id } });
    if (!override) throw new NotFoundException("Override not found");
    await this.prisma.featureFlagOverride.delete({ where: { id } });
    await this.invalidateCache(override.flagName);
    return { data: null, message: "Override deleted" };
  }

  private async invalidateCache(flagName: string) {
    const keys = await this.redis.keys(`${FLAG_CACHE_PREFIX}${flagName}:*`);
    if (keys.length > 0) {
      for (const k of keys) await this.redis.del(k);
    }
  }
}
