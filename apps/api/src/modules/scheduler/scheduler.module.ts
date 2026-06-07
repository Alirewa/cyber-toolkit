import { Module } from "@nestjs/common";
import { SchedulerController } from "./scheduler.controller";
import { SchedulerService } from "./scheduler.service";
import { WebsocketModule } from "../websocket/websocket.module";

// Personal mode — BullModule/SchedulerProcessor removed (no Redis queue needed)
@Module({
  imports: [WebsocketModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
