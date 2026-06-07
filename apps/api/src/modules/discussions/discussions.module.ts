import { Module } from "@nestjs/common";
import { DiscussionsController } from "./discussions.controller";
import { DiscussionsService } from "./discussions.service";
import { ReputationModule } from "../reputation/reputation.module";
import { CommunityModule } from "../community/community.module";

@Module({
  imports: [ReputationModule, CommunityModule],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
