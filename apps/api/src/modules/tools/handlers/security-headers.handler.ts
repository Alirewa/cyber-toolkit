import { Injectable } from "@nestjs/common";
import axios from "axios";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

interface HeaderCheck {
  present: boolean;
  value: string | null;
  score: number;
  recommendation: string;
}

@Injectable()
export class SecurityHeadersHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "security-headers",
    name: "Security Headers Checker",
    description: "Audit a website's HTTP security headers. Checks HSTS, CSP, X-Frame-Options, and more with a scored report.",
    category: "ANALYSIS",
    icon: "ShieldAlert",
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
    ],
    examples: ["https://example.com", "https://github.com"],
    safetyNote: "Only analyze websites you own or have permission to test.",
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const url = this.normaliseUrl(input["url"] ?? "");

    if (!url) {
      return { success: false, data: {}, summary: "No URL provided", executionMs: this.elapsed(start) };
    }

    onProgress?.("Fetching security headers…", 25);

    try {
      const response = await this.withTimeout(
        axios.get(url, {
          maxRedirects: 5,
          timeout: 15_000,
          validateStatus: () => true,
          headers: { "User-Agent": "CyberLab-SecurityAudit/1.0" },
        }),
        "Security headers check",
      );

      onProgress?.("Analyzing security posture…", 70);

      const headers = response.headers as Record<string, string>;
      const checks = this.analyzeHeaders(headers);
      const score = this.computeScore(checks);
      const grade = this.computeGrade(score);

      onProgress?.("Complete", 100);

      return {
        success: true,
        data: {
          url,
          statusCode: response.status,
          grade,
          score,
          maxScore: 100,
          headers: checks,
          rawHeaders: Object.fromEntries(
            Object.entries(headers).filter(([k]) =>
              ["strict-transport-security","content-security-policy","x-frame-options",
               "x-content-type-options","referrer-policy","permissions-policy",
               "x-xss-protection","cross-origin-opener-policy"].includes(k.toLowerCase())
            )
          ),
        },
        summary: `Grade: ${grade} (${score}/100) — ${Object.values(checks).filter((c) => c.present).length}/8 security headers present`,
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      return { success: false, data: { url, error: msg }, summary: msg, executionMs: this.elapsed(start) };
    }
  }

  private analyzeHeaders(headers: Record<string, string>): Record<string, HeaderCheck> {
    const h = (key: string) => headers[key.toLowerCase()] ?? null;

    return {
      "Strict-Transport-Security": {
        present: !!h("strict-transport-security"),
        value: h("strict-transport-security"),
        score: h("strict-transport-security") ? 15 : 0,
        recommendation: "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
      },
      "Content-Security-Policy": {
        present: !!h("content-security-policy"),
        value: h("content-security-policy"),
        score: h("content-security-policy") ? 20 : 0,
        recommendation: "Add a Content-Security-Policy header to prevent XSS attacks",
      },
      "X-Frame-Options": {
        present: !!h("x-frame-options"),
        value: h("x-frame-options"),
        score: h("x-frame-options") ? 10 : 0,
        recommendation: "Add: X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking",
      },
      "X-Content-Type-Options": {
        present: !!h("x-content-type-options"),
        value: h("x-content-type-options"),
        score: h("x-content-type-options") === "nosniff" ? 10 : 0,
        recommendation: "Add: X-Content-Type-Options: nosniff",
      },
      "Referrer-Policy": {
        present: !!h("referrer-policy"),
        value: h("referrer-policy"),
        score: h("referrer-policy") ? 10 : 0,
        recommendation: "Add: Referrer-Policy: strict-origin-when-cross-origin",
      },
      "Permissions-Policy": {
        present: !!h("permissions-policy"),
        value: h("permissions-policy"),
        score: h("permissions-policy") ? 15 : 0,
        recommendation: "Add a Permissions-Policy header to control browser features",
      },
      "X-XSS-Protection": {
        present: !!h("x-xss-protection"),
        value: h("x-xss-protection"),
        score: h("x-xss-protection") ? 5 : 0,
        recommendation: "Add: X-XSS-Protection: 1; mode=block (legacy browsers)",
      },
      "Cross-Origin-Opener-Policy": {
        present: !!h("cross-origin-opener-policy"),
        value: h("cross-origin-opener-policy"),
        score: h("cross-origin-opener-policy") ? 15 : 0,
        recommendation: "Add: Cross-Origin-Opener-Policy: same-origin",
      },
    };
  }

  private computeScore(checks: Record<string, HeaderCheck>): number {
    return Object.values(checks).reduce((acc, c) => acc + c.score, 0);
  }

  private computeGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 75) return "A";
    if (score >= 60) return "B";
    if (score >= 45) return "C";
    if (score >= 30) return "D";
    return "F";
  }
}
