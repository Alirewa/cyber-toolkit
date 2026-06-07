import { Module } from "@nestjs/common";
import { WriteupsController } from "./writeups.controller";
import { WriteupsService } from "./writeups.service";
import { ReputationModule } from "../reputation/reputation.module";
import { CommunityModule } from "../community/community.module";

@Module({
  imports: [ReputationModule, CommunityModule],
  controllers: [WriteupsController],
  providers: [WriteupsService],
  exports: [WriteupsService],
})
export class WriteupsModule {}
