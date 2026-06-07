import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "./modules/config/config.module";
import { DatabaseModule } from "./modules/database/database.module";
import { RedisModule } from "./modules/redis/redis.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { QueueModule } from "./modules/queue/queue.module";
import { HealthModule } from "./modules/health/health.module";
import { WebsocketModule } from "./modules/websocket/websocket.module";
import { ToolsModule } from "./modules/tools/tools.module";
import { LabsModule } from "./modules/labs/labs.module";
// SecOps — Findings & Reporting
import { FindingsModule } from "./modules/findings/findings.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    ThrottlerModule.forRoot([
      {
        name: "global",
        ttl: 60_000,
        limit: 100,
      },
    ]),
    // Personal mode — no AuthModule, no PermissionsModule
    UsersModule,
    RolesModule,
    AuditLogsModule,
    QueueModule,
    HealthModule,
    WebsocketModule,
    ToolsModule,
    LabsModule,
    // SecOps — Findings & Reporting
    FindingsModule,
    ReportingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
