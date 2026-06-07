import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { BaseLab } from "./base/base-lab";

// Lab definitions — import all here
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

@Injectable()
export class LabRegistryService implements OnModuleInit {
  private readonly logger = new Logger(LabRegistryService.name);
  private readonly labs = new Map<string, BaseLab>();

  constructor(
    private readonly xssReflected: XssReflectedLab,
    private readonly xssStored: XssStoredLab,
    private readonly xssDom: XssDomLab,
    private readonly csrf: CsrfBasicsLab,
    private readonly sqli: SqliIntroLab,
    private readonly idor: IdorBasicsLab,
    private readonly authFlaws: AuthFlawsLab,
    private readonly brokenAccess: BrokenAccessLab,
    private readonly jwtMistakes: JwtMistakesLab,
    private readonly rateLimiting: RateLimitingLab,
    private readonly ssrfDemo: SsrfDemoLab,
    private readonly fileUpload: FileUploadLab,
    private readonly securityMisconfig: SecurityMisconfigLab,
    private readonly owaspPath: OwaspPathLab,
  ) {}

  onModuleInit() {
    const allLabs: BaseLab[] = [
      this.xssReflected, this.xssStored, this.xssDom,
      this.csrf, this.sqli, this.idor, this.authFlaws,
      this.brokenAccess, this.jwtMistakes, this.rateLimiting,
      this.ssrfDemo, this.fileUpload, this.securityMisconfig, this.owaspPath,
    ];

    for (const lab of allLabs) {
      this.labs.set(lab.meta.slug, lab);
      this.logger.log(`Registered lab: ${lab.meta.slug}`);
    }

    this.logger.log(`Lab registry initialized with ${this.labs.size} labs`);
  }

  getBySlug(slug: string): BaseLab {
    const lab = this.labs.get(slug);
    if (!lab) throw new NotFoundException(`Lab '${slug}' not found`);
    return lab;
  }

  getAll(): BaseLab[] {
    return Array.from(this.labs.values()).filter((l) => l.meta.slug !== undefined);
  }

  has(slug: string): boolean {
    return this.labs.has(slug);
  }
}
