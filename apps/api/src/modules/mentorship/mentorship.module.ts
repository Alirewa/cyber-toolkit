import { Module } from "@nestjs/common";
import { MentorshipService } from "./mentorship.service";
import { ReputationModule } from "../reputation/reputation.module";
import { MentorshipController } from "./mentorship.controller";

@Module({
  imports: [ReputationModule],
  controllers: [MentorshipController],
  providers: [MentorshipService],
  exports: [MentorshipService],
})
export class MentorshipModule {}
