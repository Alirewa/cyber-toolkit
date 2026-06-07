import { Module } from "@nestjs/common";

import { ToolsController } from "./tools.controller";
import { ToolsService } from "./tools.service";
import { ToolRunsService } from "./tool-runs.service";
import { ToolRegistryService } from "./tool-registry.service";
import { ToolExecutorService } from "./tool-executor.service";

// Handlers
import { WhoisHandler } from "./handlers/whois.handler";
import { DnsLookupHandler } from "./handlers/dns-lookup.handler";
import { HttpHeadersHandler } from "./handlers/http-headers.handler";
import { SslCheckerHandler } from "./handlers/ssl-checker.handler";
import { TechDetectorHandler } from "./handlers/tech-detector.handler";
import { RobotsTxtHandler } from "./handlers/robots-txt.handler";
import { SecurityHeadersHandler } from "./handlers/security-headers.handler";
import { Base64Handler } from "./handlers/base64.handler";
import { HashGeneratorHandler } from "./handlers/hash-generator.handler";
import { JwtDecoderHandler } from "./handlers/jwt-decoder.handler";
import { MetadataViewerHandler } from "./handlers/metadata-viewer.handler";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { WebsocketModule } from "../websocket/websocket.module";

// Personal mode — BullModule and ToolProcessor removed (no Redis/queue needed)
@Module({
  imports: [
    AuditLogsModule,
    WebsocketModule,
  ],
  controllers: [ToolsController],
  providers: [
    ToolsService,
    ToolRunsService,
    ToolRegistryService,
    ToolExecutorService,
    // Tool handlers
    WhoisHandler,
    DnsLookupHandler,
    HttpHeadersHandler,
    SslCheckerHandler,
    TechDetectorHandler,
    RobotsTxtHandler,
    SecurityHeadersHandler,
    Base64Handler,
    HashGeneratorHandler,
    JwtDecoderHandler,
    MetadataViewerHandler,
  ],
  exports: [ToolsService, ToolRunsService, ToolExecutorService, ToolRegistryService],
})
export class ToolsModule {}
