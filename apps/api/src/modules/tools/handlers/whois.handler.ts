import { Injectable } from "@nestjs/common";
import * as whois from "whois";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

@Injectable()
export class WhoisHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "whois",
    name: "WHOIS Lookup",
    description: "Query domain registration information including registrar, creation/expiry dates, nameservers, and RDAP data.",
    category: "NETWORK",
    icon: "Globe",
    isNetwork: true,
    isInstant: false,
    inputFields: [
      {
        key: "target",
        label: "Domain or IP",
        type: "text",
        placeholder: "example.com",
        required: true,
        helpText: "Enter a domain name or IP address",
      },
    ],
    examples: ["example.com", "google.com"],
    safetyNote: "Only query domains you own or have explicit authorization to research.",
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const target = this.normaliseTarget(input["target"] ?? "");

    if (!target) {
      return { success: false, data: {}, summary: "No target provided", executionMs: this.elapsed(start) };
    }

    onProgress?.("Querying WHOIS server…", 20);

    try {
      const raw = await this.withTimeout(
        new Promise<string>((resolve, reject) => {
          whois.lookup(target, (err: Error | null, data: string | unknown) => {
            if (err) reject(err);
            else resolve(typeof data === "string" ? data : JSON.stringify(data));
          });
        }),
        "WHOIS lookup",
      );

      onProgress?.("Parsing WHOIS data…", 70);

      const parsed = this.parseWhoisData(raw);

      onProgress?.("Complete", 100);

      return {
        success: true,
        data: { target, raw, parsed },
        summary: parsed["registrar"]
          ? `Registrar: ${String(parsed["registrar"])} · Expires: ${String(parsed["expiresAt"] ?? "N/A")}`
          : `WHOIS data retrieved for ${target}`,
        warnings: ["Only query targets you are authorized to research"],
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "WHOIS lookup failed";
      return { success: false, data: { target, error: message }, summary: message, executionMs: this.elapsed(start) };
    }
  }

  private parseWhoisData(raw: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = raw.split("\n");

    const fieldMap: Record<string, string> = {
      "registrar:": "registrar",
      "registrant organization:": "organization",
      "creation date:": "createdAt",
      "registry expiry date:": "expiresAt",
      "updated date:": "updatedAt",
      "registrar url:": "registrarUrl",
      "registrar iana id:": "registrarId",
      "domain status:": "status",
      "dnssec:": "dnssec",
    };

    const nameservers: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase().trim();

      if (lower.startsWith("name server:") || lower.startsWith("nserver:")) {
        const ns = line.split(":")[1]?.trim();
        if (ns) nameservers.push(ns.toLowerCase());
        continue;
      }

      for (const [key, fieldName] of Object.entries(fieldMap)) {
        if (lower.startsWith(key) && !result[fieldName]) {
          result[fieldName] = line.split(":").slice(1).join(":").trim();
          break;
        }
      }
    }

    if (nameservers.length > 0) result["nameservers"] = [...new Set(nameservers)];
    return result;
  }
}
