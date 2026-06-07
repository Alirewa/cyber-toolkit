import { Injectable } from "@nestjs/common";
import axios from "axios";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

@Injectable()
export class HttpHeadersHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "http-headers",
    name: "HTTP Header Analyzer",
    description: "Fetch and analyze HTTP response headers from any URL. Identifies server info, caching policies, and security configurations.",
    category: "NETWORK",
    icon: "FileCode",
    isNetwork: true,
    isInstant: false,
    inputFields: [
      {
        key: "url",
        label: "URL",
        type: "url",
        placeholder: "https://example.com",
        required: true,
      },
      {
        key: "method",
        label: "Method",
        type: "select",
        options: ["HEAD", "GET"],
        required: false,
      },
    ],
    examples: ["https://example.com", "https://github.com"],
    safetyNote: "Only analyze URLs you have permission to access.",
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const url = this.normaliseUrl(input["url"] ?? "");
    const method = (input["method"] ?? "HEAD").toUpperCase();

    if (!url) {
      return { success: false, data: {}, summary: "No URL provided", executionMs: this.elapsed(start) };
    }

    onProgress?.("Sending HTTP request…", 20);

    try {
      const response = await this.withTimeout(
        axios({
          method: method === "GET" ? "GET" : "HEAD",
          url,
          maxRedirects: 5,
          timeout: 15_000,
          validateStatus: () => true, // Don't throw on 4xx/5xx
          headers: {
            "User-Agent": "CyberLab-HeaderAnalyzer/1.0 (security-research)",
          },
        }),
        "HTTP request",
      );

      onProgress?.("Analyzing headers…", 70);

      const headers = response.headers as Record<string, string | string[]>;
      const statusCode = response.status;
      const responseTime = this.elapsed(start);

      // Categorise headers
      const securityHeaders = this.extractSecurityHeaders(headers);
      const serverInfo = this.extractServerInfo(headers);
      const cachingHeaders = this.extractCachingHeaders(headers);

      onProgress?.("Complete", 100);

      return {
        success: true,
        data: {
          url,
          statusCode,
          statusText: response.statusText,
          responseTimeMs: responseTime,
          method,
          headers,
          analysis: { securityHeaders, serverInfo, cachingHeaders },
          finalUrl: response.request?.res?.responseUrl ?? url,
        },
        summary: `${method} ${url} → ${statusCode} (${responseTime}ms)`,
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      return { success: false, data: { url, error: msg }, summary: msg, executionMs: this.elapsed(start) };
    }
  }

  private extractSecurityHeaders(headers: Record<string, unknown>): Record<string, string | null> {
    return {
      "strict-transport-security": String(headers["strict-transport-security"] ?? null),
      "content-security-policy": String(headers["content-security-policy"] ?? null),
      "x-frame-options": String(headers["x-frame-options"] ?? null),
      "x-content-type-options": String(headers["x-content-type-options"] ?? null),
      "referrer-policy": String(headers["referrer-policy"] ?? null),
      "permissions-policy": String(headers["permissions-policy"] ?? null),
      "x-xss-protection": String(headers["x-xss-protection"] ?? null),
    };
  }

  private extractServerInfo(headers: Record<string, unknown>): Record<string, string | null> {
    return {
      server: String(headers["server"] ?? null),
      "x-powered-by": String(headers["x-powered-by"] ?? null),
      via: String(headers["via"] ?? null),
    };
  }

  private extractCachingHeaders(headers: Record<string, unknown>): Record<string, string | null> {
    return {
      "cache-control": String(headers["cache-control"] ?? null),
      etag: String(headers["etag"] ?? null),
      "last-modified": String(headers["last-modified"] ?? null),
      expires: String(headers["expires"] ?? null),
    };
  }
}
