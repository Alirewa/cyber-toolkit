import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as cheerio from "cheerio";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

@Injectable()
export class MetadataViewerHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "metadata-viewer",
    name: "Metadata Viewer",
    description: "Extract page metadata: Open Graph tags, Twitter cards, title, description, canonical URL, and favicon from any website.",
    category: "ANALYSIS",
    icon: "Tags",
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
    safetyNote: "Metadata is publicly served by all websites.",
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

    onProgress?.("Fetching page…", 25);

    try {
      const response = await this.withTimeout(
        axios.get<string>(url, {
          timeout: 15_000,
          maxRedirects: 5,
          validateStatus: () => true,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; CyberLab-MetadataViewer/1.0)" },
        }),
        "Metadata fetch",
      );

      onProgress?.("Extracting metadata…", 65);

      const html = String(response.data).slice(0, 150_000);
      const $ = cheerio.load(html);
      const origin = new URL(url).origin;

      // Basic metadata
      const title = $("title").first().text().trim() || null;
      const description = $("meta[name='description']").attr("content")?.trim() || null;
      const canonical = $("link[rel='canonical']").attr("href") || null;
      const charset = $("meta[charset]").attr("charset") ||
        $("meta[http-equiv='Content-Type']").attr("content")?.match(/charset=([^\s;]+)/i)?.[1] || null;
      const language = $("html").attr("lang") || null;
      const viewport = $("meta[name='viewport']").attr("content") || null;

      // Favicon
      const faviconHref =
        $("link[rel='icon']").attr("href") ||
        $("link[rel='shortcut icon']").attr("href") ||
        "/favicon.ico";
      const favicon = faviconHref.startsWith("http") ? faviconHref : `${origin}${faviconHref}`;

      // Open Graph
      const og: Record<string, string> = {};
      $("meta[property^='og:']").each((_, el) => {
        const prop = $(el).attr("property")?.replace("og:", "") ?? "";
        const content = $(el).attr("content") ?? "";
        if (prop && content) og[prop] = content;
      });

      // Twitter Card
      const twitter: Record<string, string> = {};
      $("meta[name^='twitter:']").each((_, el) => {
        const name = $(el).attr("name")?.replace("twitter:", "") ?? "";
        const content = $(el).attr("content") ?? "";
        if (name && content) twitter[name] = content;
      });

      // Structured data
      const jsonLd: unknown[] = [];
      $("script[type='application/ld+json']").each((_, el) => {
        try {
          const parsed = JSON.parse($(el).html() ?? "") as unknown;
          jsonLd.push(parsed);
        } catch { /* skip malformed */ }
      });

      onProgress?.("Complete", 100);

      return {
        success: true,
        data: {
          url,
          finalUrl: url,
          statusCode: response.status,
          basic: { title, description, canonical, charset, language, viewport, favicon },
          openGraph: Object.keys(og).length > 0 ? og : null,
          twitterCard: Object.keys(twitter).length > 0 ? twitter : null,
          jsonLd: jsonLd.length > 0 ? jsonLd : null,
        },
        summary: title
          ? `Title: "${title.substring(0, 60)}${title.length > 60 ? "…" : ""}"`
          : `Metadata extracted from ${url}`,
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Metadata extraction failed";
      return { success: false, data: { url, error: msg }, summary: msg, executionMs: this.elapsed(start) };
    }
  }
}
