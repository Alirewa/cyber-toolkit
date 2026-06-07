import { Injectable } from "@nestjs/common";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

@Injectable()
export class Base64Handler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "base64",
    name: "Base64 Encode / Decode",
    description: "Encode text to Base64 or decode Base64 back to plaintext. Useful for analyzing obfuscated data in web apps.",
    category: "ENCODING",
    icon: "Binary",
    isNetwork: false,
    isInstant: true,
    inputFields: [
      {
        key: "text",
        label: "Input Text",
        type: "textarea",
        placeholder: "Enter text to encode or Base64 to decode…",
        required: true,
      },
      {
        key: "mode",
        label: "Operation",
        type: "select",
        options: ["encode", "decode"],
        required: true,
      },
    ],
    examples: ["Hello, World!", "SGVsbG8sIFdvcmxkIQ=="],
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    _onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const { text, mode } = input;

    if (!text?.trim()) {
      return { success: false, data: {}, summary: "No input provided", executionMs: this.elapsed(start) };
    }

    try {
      if (mode === "encode") {
        const encoded = Buffer.from(text, "utf8").toString("base64");
        return {
          success: true,
          data: { mode: "encode", input: text, output: encoded, length: encoded.length },
          summary: `Encoded ${text.length} chars → ${encoded.length} chars`,
          executionMs: this.elapsed(start),
        };
      } else {
        // Detect if it looks like URL-safe base64
        const cleaned = text.trim().replace(/-/g, "+").replace(/_/g, "/");
        const decoded = Buffer.from(cleaned, "base64").toString("utf8");
        return {
          success: true,
          data: { mode: "decode", input: text, output: decoded, length: decoded.length },
          summary: `Decoded ${text.trim().length} chars → ${decoded.length} chars`,
          executionMs: this.elapsed(start),
        };
      }
    } catch {
      return {
        success: false,
        data: { error: "Invalid Base64 input" },
        summary: "Failed to decode — input is not valid Base64",
        executionMs: this.elapsed(start),
      };
    }
  }
}
