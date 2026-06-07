import { Module } from "@nestjs/common";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { QueueModule } from "../queue/queue.module";
import { WebsocketModule } from "../websocket/websocket.module";

@Module({
  imports: [NotificationsModule, QueueModule, WebsocketModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
