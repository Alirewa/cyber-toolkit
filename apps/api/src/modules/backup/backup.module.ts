import { Module } from "@nestjs/common";
import { BackupController } from "./backup.controller";
import { BackupService } from "./backup.service";
import { DatabaseModule } from "../database/database.module";
import { QueueModule } from "../queue/queue.module";

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
