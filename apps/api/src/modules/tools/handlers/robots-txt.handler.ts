import { Injectable } from "@nestjs/common";
import axios from "axios";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

@Injectable()
export class RobotsTxtHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "robots-txt",
    name: "robots.txt Analyzer",
    description: "Fetch and parse a website's robots.txt file. Identifies disallowed paths, sitemaps, and crawl delays.",
    category: "ANALYSIS",
    icon: "Bot",
    isNetwork: true,
    isInstant: false,
    inputFields: [
      {
        key: "url",
        label: "URL or Domain",
        type: "url",
        placeholder: "https://example.com",
        required: true,
      },
    ],
    examples: ["https://example.com", "https://github.com"],
    safetyNote: "robots.txt is a publicly accessible file — no special permissions required.",
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const baseUrl = this.normaliseUrl(input["url"] ?? "");

    if (!baseUrl) {
      return { success: false, data: {}, summary: "No URL provided", executionMs: this.elapsed(start) };
    }

    // Construct robots.txt URL
    const origin = new URL(baseUrl).origin;
    const robotsUrl = `${origin}/robots.txt`;

    onProgress?.("Fetching robots.txt…", 30);

    try {
      const response = await this.withTimeout(
        axios.get<string>(robotsUrl, {
          timeout: 10_000,
          validateStatus: () => true,
          headers: { "User-Agent": "CyberLab-RobotsAnalyzer/1.0" },
          responseType: "text",
        }),
        "robots.txt fetch",
      );

      if (response.status === 404) {
        return {
          success: true,
          data: { url: robotsUrl, exists: false, statusCode: 404 },
          summary: `No robots.txt found at ${robotsUrl}`,
          executionMs: this.elapsed(start),
        };
      }

      onProgress?.("Parsing directives…", 70);

      const rawContent = String(response.data).slice(0, 10_000); // cap at 10KB
      const parsed = this.parseRobotsTxt(rawContent);

      onProgress?.("Complete", 100);

      const totalDisallowed = parsed.rules.reduce((acc, r) => acc + r.disallow.length, 0);

      return {
        success: true,
        data: {
          url: robotsUrl,
          exists: true,
          statusCode: response.status,
          rawContent,
          ...parsed,
        },
        summary: `Found ${parsed.rules.length} user-agent rules · ${totalDisallowed} disallowed paths · ${parsed.sitemaps.length} sitemaps`,
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch robots.txt";
      return { success: false, data: { url: robotsUrl, error: msg }, summary: msg, executionMs: this.elapsed(start) };
    }
  }

  private parseRobotsTxt(content: string): {
    rules: Array<{ userAgent: string; allow: string[]; disallow: string[]; crawlDelay?: number }>;
    sitemaps: string[];
    host?: string;
  } {
    const lines = content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    const rules: Array<{ userAgent: string; allow: string[]; disallow: string[]; crawlDelay?: number }> = [];
    const sitemaps: string[] = [];
    let host: string | undefined;

    let currentAgents: string[] = [];
    let allow: string[] = [];
    let disallow: string[] = [];
    let crawlDelay: number | undefined;

    const pushRule = () => {
      if (currentAgents.length > 0) {
        for (const ua of currentAgents) {
          rules.push({ userAgent: ua, allow: [...allow], disallow: [...disallow], crawlDelay });
        }
        currentAgents = [];
        allow = [];
        disallow = [];
        crawlDelay = undefined;
      }
    };

    for (const line of lines) {
      const [directive, ...rest] = line.split(":") as [string, ...string[]];
      const value = rest.join(":").trim();
      const d = directive.toLowerCase().trim();

      if (d === "user-agent") {
        if (currentAgents.length > 0 && (allow.length > 0 || disallow.length > 0)) pushRule();
        currentAgents.push(value);
      } else if (d === "disallow") {
        disallow.push(value);
      } else if (d === "allow") {
        allow.push(value);
      } else if (d === "crawl-delay") {
        crawlDelay = parseFloat(value) || undefined;
      } else if (d === "sitemap") {
        sitemaps.push(value);
      } else if (d === "host") {
        host = value;
      }
    }
    pushRule();

    return { rules, sitemaps, host };
  }
}
