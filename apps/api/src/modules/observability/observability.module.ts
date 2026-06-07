import { Module } from "@nestjs/common";
import { ObservabilityController } from "./observability.controller";
import { MetricsService } from "./metrics.service";
import { DatabaseModule } from "../database/database.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [ObservabilityController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class ObservabilityModule {}
