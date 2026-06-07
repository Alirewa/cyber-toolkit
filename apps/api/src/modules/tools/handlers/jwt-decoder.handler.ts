import { Injectable } from "@nestjs/common";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

@Injectable()
export class JwtDecoderHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    description: "Safely decode and inspect JWT tokens — header, payload, and expiry. Does NOT verify the signature.",
    category: "ENCODING",
    icon: "KeyRound",
    isNetwork: false,
    isInstant: true,
    inputFields: [
      {
        key: "token",
        label: "JWT Token",
        type: "textarea",
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
        required: true,
        helpText: "Paste the full JWT token. Signature is NOT verified.",
      },
    ],
    examples: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"],
    safetyNote: "This tool only decodes the token — it never verifies or validates signatures.",
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    _onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const { token } = input;

    if (!token?.trim()) {
      return { success: false, data: {}, summary: "No token provided", executionMs: this.elapsed(start) };
    }

    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return {
        success: false,
        data: { error: "Invalid JWT format — expected 3 parts separated by dots" },
        summary: "Invalid JWT structure",
        executionMs: this.elapsed(start),
      };
    }

    try {
      const decodeBase64 = (str: string): unknown => {
        const padded = str.replace(/-/g, "+").replace(/_/g, "/");
        const json = Buffer.from(padded, "base64").toString("utf8");
        return JSON.parse(json) as unknown;
      };

      const header = decodeBase64(parts[0]!) as Record<string, unknown>;
      const payload = decodeBase64(parts[1]!) as Record<string, unknown>;
      const signatureRaw = parts[2]!;

      // Parse expiry info
      const now = Math.floor(Date.now() / 1000);
      let expiryInfo: Record<string, unknown> = { hasExpiry: false };

      if (typeof payload["exp"] === "number") {
        const exp = payload["exp"] as number;
        const isExpired = exp < now;
        expiryInfo = {
          hasExpiry: true,
          expiresAt: new Date(exp * 1000).toISOString(),
          isExpired,
          remainingSeconds: isExpired ? 0 : exp - now,
        };
      }

      if (typeof payload["iat"] === "number") {
        expiryInfo["issuedAt"] = new Date((payload["iat"] as number) * 1000).toISOString();
      }

      return {
        success: true,
        data: {
          header,
          payload,
          signature: signatureRaw.substring(0, 20) + "…",
          expiry: expiryInfo,
        },
        summary: `Algorithm: ${String(header["alg"] ?? "unknown")} · Subject: ${String(payload["sub"] ?? "N/A")}`,
        warnings: ["Signature NOT verified — decode only"],
        executionMs: this.elapsed(start),
      };
    } catch (err: unknown) {
      return {
        success: false,
        data: { error: "Failed to parse JWT parts" },
        summary: "Could not decode token",
        executionMs: this.elapsed(start),
      };
    }
  }
}
