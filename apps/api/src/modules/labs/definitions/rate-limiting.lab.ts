import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class RateLimitingLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "rate-limiting",
    name: "Rate Limiting & Brute Force",
    description: "Learn why missing rate limits enable brute-force, credential stuffing, and resource exhaustion — and how to defend.",
    objective: "Understand rate limiting strategies, identify endpoints that need protection, and learn account lockout trade-offs.",
    category: "MISCONFIGURATION",
    difficulty: "BEGINNER",
    icon: "Gauge",
    xpReward: 10,
    estimatedMin: 15,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "Most critical endpoint", content: "The login endpoint is the most important to rate limit — it's the primary target for brute-force and credential stuffing.", xpCost: 3 },
    ],
    steps: [
      { order: 1, title: "Why Rate Limiting Matters", instruction: "Without rate limits, attackers can:\n- **Brute-force** passwords (try millions of combinations)\n- **Credential stuffing** (test leaked passwords)\n- **Enumerate** valid usernames/emails\n- **Exhaust resources** (DoS)\n- **Abuse** expensive operations (sending SMS, emails)\n\nCyberLab rate-limits auth endpoints to 5 requests/minute." },
      { order: 2, title: "Rate Limiting Strategies", instruction: "**Common algorithms:**\n- **Fixed window:** N requests per fixed time window\n- **Sliding window:** smooths out window-boundary bursts\n- **Token bucket:** tokens refill at a steady rate\n- **Leaky bucket:** requests processed at a constant rate\n\n**Identifiers to rate-limit by:**\n- IP address\n- User ID / API key\n- IP + endpoint combination" },
      { order: 3, title: "Account Lockout Trade-offs", instruction: "**Account lockout** (lock after N failed attempts) has trade-offs:\n- ✅ Stops brute force on a single account\n- ❌ Enables **denial of service** (attacker locks out legitimate users)\n\n**Better approaches:**\n- Exponential backoff / increasing delays\n- CAPTCHA after several failures\n- Rate limit by IP + monitor for distributed attacks\n- Multi-factor authentication" },
    ],
    questions: [
      { key: "critical-endpoint", label: "Which endpoint is most critical to rate limit?", type: "text", points: 10, placeholder: "login / authentication" },
      { key: "attack", label: "Name one attack that rate limiting prevents:", type: "text", points: 10, placeholder: "brute force / credential stuffing / DoS" },
      { key: "algorithm", label: "Name one rate limiting algorithm:", type: "text", points: 10, placeholder: "token bucket / sliding window / fixed window" },
      { key: "lockout-risk", label: "What attack can aggressive account lockout enable against legitimate users?", type: "text", points: 10, placeholder: "denial of service / DoS" },
    ],
    tags: ["rate-limiting", "brute-force", "dos", "misconfiguration"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["critical-endpoint"] ?? "", ["login", "auth", "signin", "sign-in", "log in"])) {
      feedback["critical-endpoint"] = { correct: true, message: "Correct!", explanation: "The login endpoint is the highest-priority target for brute-force and credential stuffing." };
      score += 10;
    } else {
      feedback["critical-endpoint"] = { correct: false, message: "Where do attackers try passwords?", explanation: "The login/authentication endpoint is most critical to rate limit." };
    }

    if (this.containsAny(answers["attack"] ?? "", ["brute", "credential stuffing", "credential-stuffing", "dos", "denial", "enumerat", "stuffing"])) {
      feedback["attack"] = { correct: true, message: "Correct!", explanation: "Rate limiting prevents brute force, credential stuffing, enumeration, and resource exhaustion (DoS)." };
      score += 10;
    } else {
      feedback["attack"] = { correct: false, message: "Think about high-volume automated attacks.", explanation: "Brute force, credential stuffing, username enumeration, and DoS are all mitigated by rate limiting." };
    }

    if (this.containsAny(answers["algorithm"] ?? "", ["token bucket", "leaky bucket", "sliding window", "fixed window", "bucket", "window"])) {
      feedback["algorithm"] = { correct: true, message: "Correct!", explanation: "Token bucket, leaky bucket, sliding window, and fixed window are common rate limiting algorithms." };
      score += 10;
    } else {
      feedback["algorithm"] = { correct: false, message: "Think 'bucket' or 'window'.", explanation: "Common algorithms: token bucket, leaky bucket, sliding window, fixed window." };
    }

    if (this.containsAny(answers["lockout-risk"] ?? "", ["denial", "dos", "lockout", "lock out", "deny access"])) {
      feedback["lockout-risk"] = { correct: true, message: "Correct!", explanation: "Aggressive lockout lets attackers deliberately lock out legitimate users — a denial of service." };
      score += 10;
    } else {
      feedback["lockout-risk"] = { correct: false, message: "What happens to legit users if you lock accounts too easily?", explanation: "Denial of Service (DoS) — attackers can intentionally trigger lockouts to deny legitimate users access." };
    }

    return { passed: score >= 30, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
