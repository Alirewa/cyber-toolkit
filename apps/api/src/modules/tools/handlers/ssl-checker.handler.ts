import { Injectable } from "@nestjs/common";
import * as tls from "tls";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

@Injectable()
export class SslCheckerHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "ssl-checker",
    name: "SSL Certificate Checker",
    description: "Inspect SSL/TLS certificate details: issuer, validity period, SANs, cipher suites, and expiry warnings.",
    category: "NETWORK",
    icon: "ShieldCheck",
    isNetwork: true,
    isInstant: false,
    inputFields: [
      {
        key: "host",
        label: "Hostname",
        type: "text",
        placeholder: "example.com",
        required: true,
        helpText: "Domain name (without https://)",
      },
      {
        key: "port",
        label: "Port",
        type: "text",
        placeholder: "443",
        required: false,
      },
    ],
    examples: ["example.com", "github.com"],
    safetyNote: "SSL checks only read the publicly presented certificate — no exploitation.",
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const host = this.normaliseTarget(input["host"] ?? "");
    const port = parseInt(input["port"] ?? "443", 10) || 443;

    if (!host) {
      return { success: false, data: {}, summary: "No hostname provided", executionMs: this.elapsed(start) };
    }

    onProgress?.("Connecting to server…", 20);

    try {
      const certInfo = await this.withTimeout(
        this.getCertificateInfo(host, port, onProgress),
        "SSL check",
      );

      onProgress?.("Complete", 100);

      const now = new Date();
      const expiry = new Date(certInfo.validTo as string);
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / 86_400_000);
      const isExpired = daysUntilExpiry < 0;
      const expiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

      const warnings: string[] = [];
      if (isExpired) warnings.push("Certificate has expired!");
      if (expiringSoon) warnings.push(`Certificate expires in ${daysUntilExpiry} days`);

      return {
        success: true,
        data: {
          host,
          port,
          ...certInfo,
          daysUntilExpiry,
          isExpired,
          expiringSoon,
        },
        summary: isExpired
          ? `❌ EXPIRED — ${host} certificate expired ${Math.abs(daysUntilExpiry)} days ago`
          : `✅ Valid — expires in ${daysUntilExpiry} days (${certInfo.validTo})`,
        warnings: warnings.length ? warnings : undefined,
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "SSL check failed";
      return { success: false, data: { host, port, error: msg }, summary: msg, executionMs: this.elapsed(start) };
    }
  }

  private getCertificateInfo(
    host: string,
    port: number,
    onProgress?: ProgressCallback,
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 10_000 }, () => {
        onProgress?.("Retrieving certificate…", 60);

        const cert = socket.getPeerCertificate(true);
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();

        socket.destroy();

        if (!cert || !cert.subject) {
          reject(new Error("No certificate received from server"));
          return;
        }

        const sans: string[] = [];
        if (cert.subjectaltname) {
          sans.push(
            ...cert.subjectaltname
              .split(",")
              .map((s: string) => s.trim().replace(/^DNS:/, "").replace(/^IP Address:/, "IP:")),
          );
        }

        resolve({
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          serialNumber: cert.serialNumber,
          fingerprint: cert.fingerprint,
          fingerprint256: cert.fingerprint256,
          subjectAltNames: sans,
          tlsProtocol: protocol,
          cipherSuite: cipher?.name ?? null,
          selfSigned: cert.issuer?.CN === cert.subject?.CN && cert.issuer?.O === cert.subject?.O,
        });
      });

      socket.on("error", reject);
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("Connection timed out"));
      });
    });
  }
}
