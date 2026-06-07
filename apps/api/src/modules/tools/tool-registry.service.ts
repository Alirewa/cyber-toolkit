import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import type { BaseToolHandler } from "./base/base-tool.handler";

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

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly handlers = new Map<string, BaseToolHandler>();

  constructor(
    private readonly whois: WhoisHandler,
    private readonly dnsLookup: DnsLookupHandler,
    private readonly httpHeaders: HttpHeadersHandler,
    private readonly sslChecker: SslCheckerHandler,
    private readonly techDetector: TechDetectorHandler,
    private readonly robotsTxt: RobotsTxtHandler,
    private readonly securityHeaders: SecurityHeadersHandler,
    private readonly base64: Base64Handler,
    private readonly hashGenerator: HashGeneratorHandler,
    private readonly jwtDecoder: JwtDecoderHandler,
    private readonly metadataViewer: MetadataViewerHandler,
  ) {}

  onModuleInit() {
    const allHandlers: BaseToolHandler[] = [
      this.whois,
      this.dnsLookup,
      this.httpHeaders,
      this.sslChecker,
      this.techDetector,
      this.robotsTxt,
      this.securityHeaders,
      this.base64,
      this.hashGenerator,
      this.jwtDecoder,
      this.metadataViewer,
    ];

    for (const handler of allHandlers) {
      this.handlers.set(handler.metadata.slug, handler);
      this.logger.log(`Registered tool: ${handler.metadata.slug}`);
    }

    this.logger.log(`Tool registry initialized with ${this.handlers.size} tools`);
  }

  getHandler(slug: string): BaseToolHandler {
    const handler = this.handlers.get(slug);
    if (!handler) throw new NotFoundException(`Tool '${slug}' not found`);
    return handler;
  }

  getAllHandlers(): BaseToolHandler[] {
    return Array.from(this.handlers.values());
  }

  hasHandler(slug: string): boolean {
    return this.handlers.has(slug);
  }
}
