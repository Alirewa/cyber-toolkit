import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class OwaspPathLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "owasp-top10",
    name: "OWASP Top 10 Mastery",
    description: "A capstone assessment covering the OWASP Top 10 (2021) — test your knowledge across all major web application security risks.",
    objective: "Demonstrate comprehensive understanding of the OWASP Top 10 categories and their mitigations.",
    category: "OWASP_TOP10",
    difficulty: "ADVANCED",
    icon: "Award",
    xpReward: 50,
    estimatedMin: 35,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "2021 reshuff, ", content: "In 2021, Broken Access Control became #1, and Cryptographic Failures (formerly Sensitive Data Exposure) became #2.", xpCost: 10 },
    ],
    steps: [
      { order: 1, title: "OWASP Top 10 (2021)", instruction: "The complete list:\n\n1. **A01** — Broken Access Control\n2. **A02** — Cryptographic Failures\n3. **A03** — Injection (SQLi, XSS, etc.)\n4. **A04** — Insecure Design\n5. **A05** — Security Misconfiguration\n6. **A06** — Vulnerable & Outdated Components\n7. **A07** — Identification & Authentication Failures\n8. **A08** — Software & Data Integrity Failures\n9. **A09** — Security Logging & Monitoring Failures\n10. **A10** — Server-Side Request Forgery (SSRF)" },
      { order: 2, title: "Key Changes from 2017", instruction: "**2021 updates:**\n- Broken Access Control: #5 → **#1**\n- Cryptographic Failures: renamed from 'Sensitive Data Exposure'\n- Injection: #1 → #3 (XSS merged into Injection)\n- **NEW:** Insecure Design (A04)\n- **NEW:** Software & Data Integrity Failures (A08)\n- **NEW:** SSRF (A10) — added by community survey" },
    ],
    questions: [
      { key: "number-one", label: "What is the #1 OWASP risk in 2021?", type: "text", points: 15, placeholder: "Broken Access Control" },
      { key: "injection-includes", label: "Which famous client-side attack was merged INTO the Injection category in 2021?", type: "text", points: 10, placeholder: "XSS" },
      { key: "new-category", label: "Name one NEW category added in 2021:", type: "text", points: 15, placeholder: "Insecure Design / SSRF / Software and Data Integrity Failures" },
      { key: "a10", label: "What is A10:2021 (the last category)?", type: "text", points: 10, placeholder: "SSRF / Server-Side Request Forgery" },
    ],
    prerequisites: ["xss-reflected", "sqli-intro", "broken-access-control"],
    tags: ["owasp", "capstone", "advanced"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["number-one"] ?? "", ["broken access control", "access control", "a01", "broken access"])) {
      feedback["number-one"] = { correct: true, message: "Correct!", explanation: "Broken Access Control is A01:2021 — the #1 risk." };
      score += 15;
    } else {
      feedback["number-one"] = { correct: false, message: "It jumped from #5 to #1 in 2021.", explanation: "Broken Access Control (A01:2021) is the top risk." };
    }

    if (this.containsAny(answers["injection-includes"] ?? "", ["xss", "cross-site scripting", "cross site scripting"])) {
      feedback["injection-includes"] = { correct: true, message: "Correct!", explanation: "XSS was merged into the Injection category (A03) in 2021." };
      score += 10;
    } else {
      feedback["injection-includes"] = { correct: false, message: "It's a script-injection attack.", explanation: "XSS (Cross-Site Scripting) was merged into Injection (A03:2021)." };
    }

    if (this.containsAny(answers["new-category"] ?? "", ["insecure design", "ssrf", "server-side request forgery", "software and data integrity", "data integrity", "integrity failures"])) {
      feedback["new-category"] = { correct: true, message: "Correct!", explanation: "New 2021 categories: Insecure Design (A04), Software & Data Integrity Failures (A08), and SSRF (A10)." };
      score += 15;
    } else {
      feedback["new-category"] = { correct: false, message: "Three categories were newly added in 2021.", explanation: "New: Insecure Design (A04), Software & Data Integrity Failures (A08), SSRF (A10)." };
    }

    if (this.containsAny(answers["a10"] ?? "", ["ssrf", "server-side request forgery", "server side request forgery"])) {
      feedback["a10"] = { correct: true, message: "Correct!", explanation: "A10:2021 is Server-Side Request Forgery (SSRF), added via community survey." };
      score += 10;
    } else {
      feedback["a10"] = { correct: false, message: "It's the SSRF category you may have studied earlier.", explanation: "A10:2021 is Server-Side Request Forgery (SSRF)." };
    }

    return { passed: score >= 40, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
