import { Module } from "@nestjs/common";

import { LabsController } from "./labs.controller";
import { LabsService } from "./labs.service";
import { LabRegistryService } from "./lab-registry.service";
import { LabValidationService } from "./lab-validation.service";
import { LabProgressService } from "./lab-progress.service";
import { AchievementService } from "./achievement.service";

// Sandbox
import { MockSandboxProvider } from "./sandbox/mock-sandbox.provider";
import { DockerSandboxProvider } from "./sandbox/docker-sandbox.provider";
import { SANDBOX_PROVIDER_TOKEN } from "./sandbox/sandbox.interface";
import { ConfigModule } from "../config/config.module";
import { ConfigService } from "../config/config.service";

// Lab definitions
import { XssReflectedLab } from "./definitions/xss-reflected.lab";
import { XssStoredLab } from "./definitions/xss-stored.lab";
import { XssDomLab } from "./definitions/xss-dom.lab";
import { CsrfBasicsLab } from "./definitions/csrf-basics.lab";
import { SqliIntroLab } from "./definitions/sqli-intro.lab";
import { IdorBasicsLab } from "./definitions/idor-basics.lab";
import { AuthFlawsLab } from "./definitions/auth-flaws.lab";
import { BrokenAccessLab } from "./definitions/broken-access.lab";
import { JwtMistakesLab } from "./definitions/jwt-mistakes.lab";
import { RateLimitingLab } from "./definitions/rate-limiting.lab";
import { SsrfDemoLab } from "./definitions/ssrf-demo.lab";
import { FileUploadLab } from "./definitions/file-upload.lab";
import { SecurityMisconfigLab } from "./definitions/security-misconfig.lab";
import { OwaspPathLab } from "./definitions/owasp-path.lab";

import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { WebsocketModule } from "../websocket/websocket.module";

const LAB_DEFINITIONS = [
  XssReflectedLab, XssStoredLab, XssDomLab,
  CsrfBasicsLab, SqliIntroLab, IdorBasicsLab,
  AuthFlawsLab, BrokenAccessLab, JwtMistakesLab,
  RateLimitingLab, SsrfDemoLab, FileUploadLab,
  SecurityMisconfigLab, OwaspPathLab,
];

@Module({
  imports: [
    ConfigModule,
    AuditLogsModule,
    WebsocketModule,
  ],
  controllers: [LabsController],
  providers: [
    LabsService,
    LabRegistryService,
    LabValidationService,
    LabProgressService,
    AchievementService,
    MockSandboxProvider,
    DockerSandboxProvider,
    // Provider chosen by env: "docker" in production, "mock" otherwise.
    {
      provide: SANDBOX_PROVIDER_TOKEN,
      inject: [ConfigService, MockSandboxProvider, DockerSandboxProvider],
      useFactory: (
        config: ConfigService,
        mock: MockSandboxProvider,
        docker: DockerSandboxProvider,
      ) => (config.sandboxProvider === "docker" ? docker : mock),
    },
    ...LAB_DEFINITIONS,
  ],
  exports: [LabsService, LabProgressService, AchievementService],
})
export class LabsModule {}
