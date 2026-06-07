import { Injectable } from "@nestjs/common";
import { promises as dns } from "dns";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

type RecordType = "A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME" | "ALL";

@Injectable()
export class DnsLookupHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "dns-lookup",
    name: "DNS Lookup",
    description: "Query DNS records for a domain: A, AAAA, MX, TXT, NS, CNAME. Essential for reconnaissance and infrastructure analysis.",
    category: "NETWORK",
    icon: "Network",
    isNetwork: true,
    isInstant: false,
    inputFields: [
      {
        key: "target",
        label: "Domain",
        type: "text",
        placeholder: "example.com",
        required: true,
      },
      {
        key: "recordType",
        label: "Record Type",
        type: "select",
        options: ["ALL", "A", "AAAA", "MX", "TXT", "NS", "CNAME"],
        required: false,
        helpText: "Select ALL to query common record types",
      },
    ],
    examples: ["example.com", "google.com"],
    safetyNote: "DNS lookups are passive — they query public DNS infrastructure.",
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const target = this.normaliseTarget(input["target"] ?? "");
    const recordType = (input["recordType"] as RecordType) ?? "ALL";

    if (!target) {
      return { success: false, data: {}, summary: "No domain provided", executionMs: this.elapsed(start) };
    }

    onProgress?.("Resolving DNS records…", 10);

    const records: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    const typesToQuery: Exclude<RecordType, "ALL">[] =
      recordType === "ALL" ? ["A", "AAAA", "MX", "TXT", "NS", "CNAME"] : [recordType];

    const total = typesToQuery.length;
    let done = 0;

    await Promise.allSettled(
      typesToQuery.map(async (type) => {
        try {
          switch (type) {
            case "A":
              records["A"] = await this.withTimeout(dns.resolve4(target), "A record");
              break;
            case "AAAA":
              records["AAAA"] = await this.withTimeout(dns.resolve6(target), "AAAA record");
              break;
            case "MX":
              records["MX"] = await this.withTimeout(dns.resolveMx(target), "MX record");
              break;
            case "TXT":
              records["TXT"] = (await this.withTimeout(dns.resolveTxt(target), "TXT record")).map((r) => r.join(""));
              break;
            case "NS":
              records["NS"] = await this.withTimeout(dns.resolveNs(target), "NS record");
              break;
            case "CNAME":
              records["CNAME"] = await this.withTimeout(dns.resolveCname(target), "CNAME record");
              break;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed";
          if (!msg.includes("ENODATA") && !msg.includes("ENOTFOUND")) {
            errors[type] = msg;
          }
        } finally {
          done++;
          onProgress?.(`Queried ${type} records…`, 10 + Math.floor((done / total) * 80));
        }
      }),
    );

    onProgress?.("Complete", 100);

    const totalRecords = Object.values(records).reduce<number>((acc, val) => {
      return acc + (Array.isArray(val) ? val.length : 1);
    }, 0);

    return {
      success: true,
      data: { target, records, errors, queriedTypes: typesToQuery },
      summary: `Found ${totalRecords} records across ${Object.keys(records).length} types for ${target}`,
      warnings: ["DNS data is publicly available — no authorization needed for standard lookups"],
      executionMs: this.elapsed(start),
    };
  }
}
