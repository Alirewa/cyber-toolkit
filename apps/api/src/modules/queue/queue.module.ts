import { Module } from "@nestjs/common";
import { QueueService } from "./queue.service";

// Personal mode — Bull/Redis removed. QueueService is a no-op logger.
@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
