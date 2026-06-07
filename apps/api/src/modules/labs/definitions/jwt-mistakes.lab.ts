import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

// Sample JWT for the lab exercises (deliberately weak)
const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJ1c2VybmFtZSI6ImFsaWNlIiwicm9sZSI6InVzZXIiLCJzZWNyZXRfZmxhZyI6IkNZQkVSTEFCe2p3dF9zZWNyZXRzX2FyZV9ub3Rfc2VjcmV0fSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

@Injectable()
export class JwtMistakesLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "jwt-mistakes",
    name: "JWT Security Mistakes",
    description: "Analyze common JWT implementation mistakes: algorithm confusion, weak secrets, and improper validation that lead to authentication bypass.",
    objective: "Decode a JWT, understand the alg:none attack, identify weak secrets, and apply JWT security best practices.",
    category: "JWT",
    difficulty: "INTERMEDIATE",
    icon: "KeyRound",
    xpReward: 25,
    estimatedMin: 25,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "JWT Structure", content: "A JWT has 3 parts: header.payload.signature. Each is Base64URL encoded. Use the JWT Decoder tool to decode it!", xpCost: 5 },
      { key: "hint-2", order: 2, title: "Finding the flag", content: "Decode the payload section of the sample JWT. Look for any field with the pattern CYBERLAB{...}", xpCost: 5 },
      { key: "hint-3", order: 3, title: "alg:none attack", content: "In the alg:none attack, the algorithm in the header is set to 'none', causing libraries to skip signature verification.", xpCost: 5 },
    ],
    steps: [
      { order: 1, title: "JWT Basics", instruction: "JSON Web Tokens (JWT) consist of three Base64URL-encoded parts:\n\n```\nheader.payload.signature\n```\n\n**Sample JWT to analyze:**\n```\n" + SAMPLE_JWT + "\n```\n\n**Task:** Use the JWT Decoder tool (Cyber Tools → JWT Decoder) to decode this token.\n\nDecode the payload section and find the hidden flag." },
      { order: 2, title: "The alg:none Attack", instruction: "One critical JWT vulnerability is the **alg:none attack**:\n\n1. An attacker creates a new JWT with `alg: \"none\"` in the header\n2. They modify the payload (e.g., escalate privileges: `role: \"admin\"`)\n3. They remove the signature\n4. Vulnerable libraries accept the token without verifying the signature!\n\n**Vulnerable header:**\n```json\n{\"alg\":\"none\",\"typ\":\"JWT\"}\n```" },
      { order: 3, title: "Weak Secret Detection", instruction: "JWT HS256 tokens can be cracked offline if the secret is weak. Tools like `jwt_tool` or `hashcat` can brute-force common secrets.\n\n**Example weak secrets:**\n- `secret`\n- `password`\n- `123456`\n- Company name\n\n**Best practice:** Use secrets ≥ 32 random bytes, generated with a CSPRNG." },
    ],
    questions: [
      { key: "algorithm", label: "What algorithm is used in the sample JWT header?", type: "text", points: 10, context: SAMPLE_JWT, placeholder: "HS256", helpText: "Decode the first part of the JWT to see the header" },
      { key: "flag", label: "Decode the sample JWT payload. What is the secret_flag value?", type: "flag", points: 25, placeholder: "CYBERLAB{...}", helpText: "Use the JWT Decoder tool in Cyber Tools" },
      { key: "alg-none-target", label: "In the alg:none attack, what algorithm value bypasses signature verification?", type: "text", points: 15, placeholder: "none" },
      { key: "best-practice", label: "What is the minimum recommended secret length for JWT HS256? (in characters/bytes)", type: "text", points: 10, placeholder: "32" },
    ],
    tags: ["jwt", "authentication", "algorithm-confusion", "owasp-a02"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    const algo = (answers["algorithm"] ?? "").toUpperCase().trim();
    if (algo === "HS256" || algo === "HMACSHA256") {
      feedback["algorithm"] = { correct: true, message: "Correct!", explanation: "The header contains alg:HS256 — HMAC with SHA-256.", expectedValue: "HS256" };
      score += 10;
    } else {
      feedback["algorithm"] = { correct: false, message: "Decode the JWT header (first part before the first dot).", explanation: "The algorithm field in the header is HS256 (HMAC-SHA256).", expectedValue: "HS256" };
    }

    const flag = (answers["flag"] ?? "").trim();
    const expectedFlag = "CYBERLAB{jwt_secrets_are_not_secret}";
    if (flag === expectedFlag || flag.toLowerCase() === expectedFlag.toLowerCase()) {
      feedback["flag"] = { correct: true, message: "Flag found! Well done.", explanation: "You successfully decoded the JWT payload and found the hidden flag.", expectedValue: expectedFlag };
      score += 25;
    } else {
      feedback["flag"] = { correct: false, message: "Decode the JWT payload section and look for the secret_flag field.", explanation: `The flag is in the payload's secret_flag field. Use the JWT Decoder tool. Expected: ${expectedFlag}` };
    }

    const algNone = (answers["alg-none-target"] ?? "").toLowerCase().trim();
    if (algNone === "none" || algNone === '"none"') {
      feedback["alg-none-target"] = { correct: true, message: "Correct!", explanation: "Setting alg to 'none' tells vulnerable JWT libraries that no signature verification is needed." };
      score += 15;
    } else {
      feedback["alg-none-target"] = { correct: false, message: "It's the literal string that bypasses signature validation when set as the algorithm.", explanation: "The algorithm value 'none' tells libraries to skip signature verification." };
    }

    const minLength = (answers["best-practice"] ?? "").trim();
    if (minLength === "32" || minLength === "256" || parseInt(minLength) >= 32) {
      feedback["best-practice"] = { correct: true, message: "Correct!", explanation: "OWASP recommends at least 32 bytes (256 bits) of random entropy for JWT secrets." };
      score += 10;
    } else {
      feedback["best-practice"] = { correct: false, message: "Think about cryptographic security standards.", explanation: "OWASP recommends JWT secrets be at least 32 bytes (256 bits) of random entropy." };
    }

    return { passed: score >= 45, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
