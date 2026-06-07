import { Controller, Get, Header, Res } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../redis/redis.service";
import { Public } from "../../common/decorators/public.decorator";
import type { Response } from "express";

@Controller()
export class ObservabilityController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get("metrics")
  @Public()
  async getMetrics(@Res() res: Response) {
    const metrics = await this.metricsService.getMetrics();
    res.setHeader("Content-Type", this.metricsService.getContentType());
    res.end(metrics);
  }

  @Get("health/detailed")
  @Public()
  async getDetailedHealth() {
    const checks = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`.then(() => ({ service: "postgres", status: "healthy" })),
      this.redis.ping().then(() => ({ service: "redis", status: "healthy" })),
    ]);

    const results = checks.map((c, i) => {
      const services = ["postgres", "redis"];
      if (c.status === "fulfilled") return c.value;
      return { service: services[i], status: "down", error: String((c as PromiseRejectedResult).reason) };
    });

    const allHealthy = results.every((r) => r.status === "healthy");

    return {
      data: {
        status: allHealthy ? "healthy" : "degraded",
        services: results,
        checkedAt: new Date().toISOString(),
      },
      message: "Health check complete",
    };
  }
}
