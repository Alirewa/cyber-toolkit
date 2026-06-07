import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class SecurityMisconfigLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "security-misconfig",
    name: "Security Misconfiguration",
    description: "Identify common security misconfigurations: default credentials, verbose errors, exposed admin panels, and missing security headers.",
    objective: "Recognize misconfiguration patterns and apply secure-by-default hardening practices.",
    category: "MISCONFIGURATION",
    difficulty: "BEGINNER",
    icon: "Settings",
    xpReward: 10,
    estimatedMin: 15,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "First thing to change", content: "Default credentials (admin/admin) are the #1 misconfiguration. Always change them before deploying.", xpCost: 3 },
    ],
    steps: [
      { order: 1, title: "Common Misconfigurations", instruction: "Security Misconfiguration (OWASP A05:2021) includes:\n- **Default credentials** (admin/admin, root/root)\n- **Verbose error messages** leaking stack traces\n- **Directory listing** enabled\n- **Unnecessary features** enabled (debug mode, sample apps)\n- **Missing security headers**\n- **Outdated software** with known CVEs\n- **Exposed cloud storage** (public S3 buckets)" },
      { order: 2, title: "Information Disclosure", instruction: "**Verbose errors** in production leak valuable info:\n```\nUncaughtException: ECONNREFUSED 10.0.1.55:5432\n  at Database.connect (/app/src/db/postgres.js:42)\n```\nThis reveals: internal IPs, database type, file paths, framework.\n\n**Fix:** Generic error messages in production; log details server-side only." },
      { order: 3, title: "Hardening Checklist", instruction: "**Secure-by-default hardening:**\n1. Change ALL default credentials\n2. Disable debug/verbose errors in production\n3. Remove sample/test applications\n4. Set security headers (CSP, HSTS, X-Frame-Options)\n5. Disable directory listing\n6. Keep software patched\n7. Principle of least privilege for service accounts\n8. Automated configuration scanning in CI/CD" },
    ],
    questions: [
      { key: "owasp-rank", label: "What OWASP 2021 category number is Security Misconfiguration? (A0?)", type: "text", points: 10, placeholder: "A05 / 5" },
      { key: "top-misconfig", label: "What is the most common misconfiguration that should always be changed first?", type: "text", points: 15, placeholder: "default credentials" },
      { key: "error-handling", label: "In production, error messages should be _____ (verbose or generic)?", type: "text", points: 10, placeholder: "generic" },
      { key: "header", label: "Name one HTTP security header you should set:", type: "text", points: 10, placeholder: "CSP / HSTS / X-Frame-Options" },
    ],
    tags: ["misconfiguration", "hardening", "owasp-a05"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    const rank = (answers["owasp-rank"] ?? "").toLowerCase().replace(/[#\s]/g, "");
    if (rank === "a05" || rank === "5" || rank === "05" || rank.includes("a05")) {
      feedback["owasp-rank"] = { correct: true, message: "Correct!", explanation: "Security Misconfiguration is A05:2021 in the OWASP Top 10." };
      score += 10;
    } else {
      feedback["owasp-rank"] = { correct: false, message: "It's in the middle of the 2021 list.", explanation: "Security Misconfiguration is A05:2021." };
    }

    if (this.containsAny(answers["top-misconfig"] ?? "", ["default credential", "default password", "default cred", "admin/admin", "default account", "credentials"])) {
      feedback["top-misconfig"] = { correct: true, message: "Correct!", explanation: "Default credentials (admin/admin) are the most common and dangerous misconfiguration." };
      score += 15;
    } else {
      feedback["top-misconfig"] = { correct: false, message: "Think admin/admin.", explanation: "Default credentials must always be changed first." };
    }

    if (this.containsAny(answers["error-handling"] ?? "", ["generic", "vague", "minimal", "non-verbose", "hidden"])) {
      feedback["error-handling"] = { correct: true, message: "Correct!", explanation: "Production errors should be generic; detailed errors leak internal info to attackers." };
      score += 10;
    } else {
      feedback["error-handling"] = { correct: false, message: "Don't leak stack traces to users.", explanation: "Generic — production error messages should never reveal internal details." };
    }

    if (this.containsAny(answers["header"] ?? "", ["csp", "content security", "hsts", "strict-transport", "x-frame", "x-content-type", "referrer-policy", "permissions-policy"])) {
      feedback["header"] = { correct: true, message: "Correct!", explanation: "Key security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy." };
      score += 10;
    } else {
      feedback["header"] = { correct: false, message: "Think CSP or HSTS.", explanation: "Security headers: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, etc." };
    }

    return { passed: score >= 30, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
