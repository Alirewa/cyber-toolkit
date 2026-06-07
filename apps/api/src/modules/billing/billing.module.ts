import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { DatabaseModule } from "../database/database.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [DatabaseModule, AuditLogsModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
