import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class ApiManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsageSummary(params: {
    apiKeyId?: string;
    userId?: string;
    organizationId?: string;
    days?: number;
  }) {
    const days = params.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where = {
      createdAt: { gte: since },
      ...(params.apiKeyId ? { apiKeyId: params.apiKeyId } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
    };

    const [totalRequests, errorCount, avgDuration, byEndpoint] = await Promise.all([
      this.prisma.apiUsage.count({ where }),
      this.prisma.apiUsage.count({ where: { ...where, statusCode: { gte: 400 } } }),
      this.prisma.apiUsage.aggregate({ where, _avg: { durationMs: true } }),
      this.prisma.apiUsage.groupBy({
        by: ["endpoint", "method"],
        where,
        _count: { id: true },
        _avg: { durationMs: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
      }),
    ]);

    return {
      data: {
        totalRequests,
        errorCount,
        errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
        avgDurationMs: avgDuration._avg.durationMs ?? 0,
        byEndpoint: byEndpoint.map((e) => ({
          endpoint: e.endpoint,
          method: e.method,
          count: e._count.id,
          avgDurationMs: e._avg.durationMs ?? 0,
        })),
      },
      message: "Usage summary retrieved",
    };
  }

  async getDailyUsage(params: { apiKeyId?: string; organizationId?: string; days?: number }) {
    const days = params.days ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const usage = await this.prisma.$queryRaw<Array<{ date: Date; count: bigint; errors: bigint }>>`
      SELECT
        DATE_TRUNC('day', "created_at") AS date,
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE "status_code" >= 400) AS errors
      FROM api_usage
      WHERE "created_at" >= ${since}
      ${params.apiKeyId ? `AND "api_key_id" = ${params.apiKeyId}` : `-- no key filter`}
      ${params.organizationId ? `AND "organization_id" = ${params.organizationId}` : `-- no org filter`}
      GROUP BY DATE_TRUNC('day', "created_at")
      ORDER BY date ASC
    `;

    return {
      data: usage.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        count: Number(r.count),
        errors: Number(r.errors),
      })),
      message: "Daily usage retrieved",
    };
  }

  async getQuotaStatus(apiKeyId: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!key) return { data: null, message: "Key not found" };

    return {
      data: {
        apiKeyId,
        quotaPerDay: key.quotaPerDay,
        usageToday: key.usageToday,
        percentUsed: key.quotaPerDay ? (key.usageToday / key.quotaPerDay) * 100 : 0,
        resetAt: key.quotaResetAt?.toISOString() ?? null,
        isUnlimited: key.quotaPerDay === null,
      },
      message: "Quota status retrieved",
    };
  }

  async checkAndIncrementQuota(apiKeyId: string): Promise<void> {
    const key = await this.prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!key || !key.isActive) throw new ForbiddenException("API key not active");
    if (key.quotaPerDay === null) return; // unlimited

    // Reset daily counter if needed
    const now = new Date();
    if (!key.quotaResetAt || now > key.quotaResetAt) {
      await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          usageToday: 1,
          quotaResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      });
      return;
    }

    if (key.usageToday >= key.quotaPerDay) {
      throw new ForbiddenException(`Daily API quota exceeded (${key.quotaPerDay} requests/day)`);
    }

    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { usageToday: { increment: 1 } },
    });
  }

  async recordUsage(data: {
    apiKeyId: string;
    userId: string;
    organizationId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // fire-and-forget for performance
    this.prisma.apiUsage
      .create({ data })
      .catch(() => {/* non-critical */});
  }

  async getTopUsers(organizationId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.prisma.apiUsage.groupBy({
      by: ["userId"],
      where: { organizationId, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const userIds = result.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatarUrl: true },
    });

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    return {
      data: result.map((r) => ({
        user: userMap[r.userId],
        requestCount: r._count.id,
      })),
      message: "Top users retrieved",
    };
  }
}
