import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { BaseToolHandler } from "../base/base-tool.handler";
import type { ToolMetadata } from "../base/tool-metadata.interface";
import type { ToolExecutionResult, ProgressCallback } from "../base/tool-execution.interface";

type HashAlgo = "md5" | "sha1" | "sha256" | "sha512" | "sha3-256" | "sha3-512";

@Injectable()
export class HashGeneratorHandler extends BaseToolHandler {
  readonly metadata: ToolMetadata = {
    slug: "hash-generator",
    name: "Hash Generator",
    description: "Generate cryptographic hashes for any input text. Supports MD5, SHA-1, SHA-256, SHA-512, and SHA3.",
    category: "ENCODING",
    icon: "Hash",
    isNetwork: false,
    isInstant: true,
    inputFields: [
      {
        key: "text",
        label: "Input Text",
        type: "textarea",
        placeholder: "Text to hash…",
        required: true,
      },
      {
        key: "algorithm",
        label: "Algorithm",
        type: "select",
        options: ["md5", "sha1", "sha256", "sha512", "sha3-256", "sha3-512"],
        required: false,
        helpText: "Leave blank to generate all algorithms",
      },
    ],
    examples: ["password123", "hello world"],
  };

  async execute(
    input: Record<string, string>,
    _userId: string,
    _onProgress?: ProgressCallback,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const { text, algorithm } = input;

    if (!text?.trim()) {
      return { success: false, data: {}, summary: "No input text provided", executionMs: this.elapsed(start) };
    }

    const algos: HashAlgo[] = algorithm
      ? [algorithm as HashAlgo]
      : ["md5", "sha1", "sha256", "sha512", "sha3-256", "sha3-512"];

    const hashes: Record<string, string> = {};
    for (const algo of algos) {
      try {
        hashes[algo] = crypto.createHash(algo).update(text, "utf8").digest("hex");
      } catch {
        hashes[algo] = `unsupported`;
      }
    }

    return {
      success: true,
      data: {
        input: text,
        length: text.length,
        hashes,
      },
      summary: algorithm
        ? `${algorithm.toUpperCase()}: ${hashes[algorithm] ?? "N/A"}`
        : `Generated ${Object.keys(hashes).length} hashes`,
      executionMs: this.elapsed(start),
    };
  }
}
