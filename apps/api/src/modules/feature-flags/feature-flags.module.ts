import { Module } from "@nestjs/common";
import { FeatureFlagsController } from "./feature-flags.controller";
import { FeatureFlagsService } from "./feature-flags.service";
import { DatabaseModule } from "../database/database.module";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
