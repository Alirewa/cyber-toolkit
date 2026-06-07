import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

interface TechSignature {
  name: string;
  category: string;
  detect: (html: string, headers: Record<string, string>, scripts: string[]) => boolean;
  version?: (html: string, headers: Record<string, string>) => string | null;
}

@Injectable()
export class TechDetectorHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "tech-detector",
    name: "Technology Stack Detector",
    description: "Detect web technologies, frameworks, CMS, CDN, analytics tools, and server software by analyzing a website.",
    category: "ANALYSIS",
    icon: "Layers",
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
    examples: ["https://example.com", "https://wordpress.org"],
    safetyNote: "Technology detection uses passive analysis of publicly served content.",
  };

  private readonly signatures: TechSignature[] = [
    // CMS
    { name: "WordPress", category: "CMS", detect: (h, _, s) => h.includes("wp-content/") || h.includes("wp-includes/") || s.some(u => u.includes("wp-")) },
    { name: "Drupal", category: "CMS", detect: (h) => h.includes("Drupal.settings") || h.includes("/sites/default/files/") },
    { name: "Joomla", category: "CMS", detect: (h) => h.includes("/components/com_") || h.includes("Joomla!") },
    { name: "Ghost", category: "CMS", detect: (h) => h.includes("ghost/") || h.includes("content/themes/") },
    // Frameworks
    { name: "Next.js", category: "Framework", detect: (h) => h.includes("__NEXT_DATA__") || h.includes("/_next/static/") },
    { name: "Nuxt.js", category: "Framework", detect: (h) => h.includes("__NUXT__") || h.includes("/_nuxt/") },
    { name: "React", category: "Framework", detect: (h, _, s) => h.includes("react-root") || s.some(u => u.includes("react")) },
    { name: "Vue.js", category: "Framework", detect: (h, _, s) => h.includes("__vue_app__") || s.some(u => u.includes("vue")) },
    { name: "Angular", category: "Framework", detect: (h) => h.includes("ng-version=") || h.includes("ng-app") },
    { name: "Gatsby", category: "Framework", detect: (h) => h.includes("___gatsby") || h.includes("/static/gatsby") },
    // Servers
    { name: "Apache", category: "Server", detect: (_, headers) => (headers["server"] ?? "").toLowerCase().includes("apache") },
    { name: "Nginx", category: "Server", detect: (_, headers) => (headers["server"] ?? "").toLowerCase().includes("nginx") },
    { name: "Cloudflare", category: "CDN", detect: (_, headers) => !!headers["cf-ray"] || (headers["server"] ?? "").toLowerCase() === "cloudflare" },
    { name: "Vercel", category: "Hosting", detect: (_, headers) => (headers["x-vercel-id"] ?? "").length > 0 || (headers["server"] ?? "") === "Vercel" },
    { name: "Netlify", category: "Hosting", detect: (_, headers) => !!headers["x-nf-request-id"] },
    { name: "AWS CloudFront", category: "CDN", detect: (_, headers) => (headers["via"] ?? "").includes("CloudFront") },
    // Analytics
    { name: "Google Analytics", category: "Analytics", detect: (h) => h.includes("google-analytics.com/analytics.js") || h.includes("gtag(") },
    { name: "Google Tag Manager", category: "Analytics", detect: (h) => h.includes("googletagmanager.com/gtm.js") },
    { name: "HotJar", category: "Analytics", detect: (h) => h.includes("static.hotjar.com") },
    { name: "Plausible", category: "Analytics", detect: (h, _, s) => s.some(u => u.includes("plausible.io")) },
    // UI / CSS
    { name: "Bootstrap", category: "CSS Framework", detect: (h, _, s) => h.includes("bootstrap") || s.some(u => u.includes("bootstrap")) },
    { name: "Tailwind CSS", category: "CSS Framework", detect: (h) => /class="[^"]*\b(flex|grid|p-\d|m-\d|text-\w)/.test(h) },
    // Languages
    { name: "PHP", category: "Language", detect: (_, headers) => (headers["x-powered-by"] ?? "").toLowerCase().includes("php") },
    { name: "Ruby on Rails", category: "Framework", detect: (_, headers) => (headers["x-powered-by"] ?? "").toLowerCase().includes("phusion") },
    // E-commerce
    { name: "Shopify", category: "E-commerce", detect: (h) => h.includes("cdn.shopify.com") || h.includes("myshopify.com") },
    { name: "WooCommerce", category: "E-commerce", detect: (h) => h.includes("woocommerce") },
  ];

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

    onProgress?.("Fetching page content…", 20);

    try {
      const response = await this.withTimeout(
        axios.get<string>(url, {
          timeout: 15_000,
          maxRedirects: 5,
          validateStatus: () => true,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; CyberLab-TechDetector/1.0)" },
        }),
        "Tech detection",
      );

      onProgress?.("Analyzing technologies…", 60);

      const html = String(response.data).slice(0, 200_000); // cap at 200KB
      const headers = response.headers as Record<string, string>;
      const $ = cheerio.load(html);

      // Extract script sources
      const scripts: string[] = [];
      $("script[src]").each((_, el) => {
        const src = $(el).attr("src");
        if (src) scripts.push(src);
      });

      const detected: Array<{ name: string; category: string }> = [];

      for (const sig of this.signatures) {
        try {
          if (sig.detect(html, headers, scripts)) {
            detected.push({ name: sig.name, category: sig.category });
          }
        } catch { /* continue */ }
      }

      onProgress?.("Complete", 100);

      // Group by category
      const grouped: Record<string, string[]> = {};
      for (const tech of detected) {
        if (!grouped[tech.category]) grouped[tech.category] = [];
        grouped[tech.category]!.push(tech.name);
      }

      return {
        success: true,
        data: {
          url,
          statusCode: response.status,
          detected: detected.length > 0 ? detected : [],
          grouped,
          totalDetected: detected.length,
          headers: {
            server: headers["server"] ?? null,
            "x-powered-by": headers["x-powered-by"] ?? null,
          },
        },
        summary: detected.length > 0
          ? `Detected ${detected.length} technologies: ${detected.slice(0, 4).map(t => t.name).join(", ")}${detected.length > 4 ? " +more" : ""}`
          : `No known technologies detected for ${url}`,
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Technology detection failed";
      return { success: false, data: { url, error: msg }, summary: msg, executionMs: this.elapsed(start) };
    }
  }
}
