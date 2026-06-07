import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class BrokenAccessLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "broken-access-control",
    name: "Broken Access Control",
    description: "Explore the #1 OWASP risk: privilege escalation, forced browsing, and missing function-level access control.",
    objective: "Understand vertical vs horizontal privilege escalation and learn to enforce access control on every request.",
    category: "ACCESS_CONTROL",
    difficulty: "INTERMEDIATE",
    icon: "ShieldOff",
    xpReward: 25,
    estimatedMin: 25,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "Vertical vs Horizontal", content: "Vertical = accessing higher privileges (user → admin). Horizontal = accessing same-level resources of another user (user A → user B).", xpCost: 5 },
      { key: "hint-2", order: 2, title: "Forced browsing", content: "Just because a link to /admin isn't shown in the UI doesn't mean the endpoint is protected. Always enforce server-side.", xpCost: 5 },
    ],
    steps: [
      { order: 1, title: "Broken Access Control — OWASP #1", instruction: "Broken Access Control moved to **#1 in the OWASP Top 10 (2021)**. It covers any failure to restrict what authenticated users can do.\n\n**Common forms:**\n- Forced browsing to restricted URLs\n- Privilege escalation (vertical/horizontal)\n- Missing function-level authorization\n- Metadata manipulation (JWT role tampering)" },
      { order: 2, title: "Privilege Escalation Types", instruction: "**Vertical Privilege Escalation:**\nA regular user gains admin privileges.\n```\nPOST /api/users/me/role { \"role\": \"admin\" }  ← should be rejected!\n```\n\n**Horizontal Privilege Escalation:**\nUser A accesses User B's resources at the same privilege level (this overlaps with IDOR).\n```\nGET /api/users/B/messages  ← as user A\n```" },
      { order: 3, title: "Defense Principles", instruction: "**Best practices:**\n1. **Deny by default** — everything is forbidden unless explicitly allowed\n2. **Enforce server-side** — never trust the client/UI\n3. **Check on every request** — not just at login\n4. **Centralize** access control logic (guards/middleware)\n5. **Log access failures** and alert on repeated attempts\n\nCyberLab uses a global JwtAuthGuard + RolesGuard for this." },
    ],
    questions: [
      { key: "owasp-rank", label: "What is Broken Access Control's rank in the OWASP Top 10 (2021)?", type: "text", points: 10, placeholder: "1 / #1 / A01" },
      { key: "vertical", label: "A normal user gaining admin rights is which type of privilege escalation?", type: "text", points: 15, placeholder: "vertical" },
      { key: "default-principle", label: "What access control principle means 'forbidden unless explicitly allowed'?", type: "text", points: 15, placeholder: "deny by default" },
      { key: "enforcement", label: "Access control must be enforced where: client-side or server-side?", type: "text", points: 10, placeholder: "server-side" },
    ],
    tags: ["access-control", "privilege-escalation", "owasp-a01"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    const rank = (answers["owasp-rank"] ?? "").toLowerCase().replace(/[#\s]/g, "");
    if (rank === "1" || rank === "a01" || rank === "first" || rank.includes("a01")) {
      feedback["owasp-rank"] = { correct: true, message: "Correct!", explanation: "Broken Access Control is #1 (A01:2021) in the OWASP Top 10 — the most serious web application risk." };
      score += 10;
    } else {
      feedback["owasp-rank"] = { correct: false, message: "It's the top risk in the 2021 list.", explanation: "Broken Access Control is ranked #1 (A01:2021)." };
    }

    if (this.containsAny(answers["vertical"] ?? "", ["vertical"])) {
      feedback["vertical"] = { correct: true, message: "Correct!", explanation: "Vertical privilege escalation means gaining HIGHER privileges (user → admin)." };
      score += 15;
    } else {
      feedback["vertical"] = { correct: false, message: "Moving UP in privilege level is called...?", explanation: "Vertical privilege escalation — gaining higher-level privileges like admin." };
    }

    if (this.containsAny(answers["default-principle"] ?? "", ["deny by default", "deny-by-default", "default deny", "least privilege", "whitelist", "fail closed"])) {
      feedback["default-principle"] = { correct: true, message: "Correct!", explanation: "'Deny by default' (fail-closed) means access is forbidden unless explicitly granted." };
      score += 15;
    } else {
      feedback["default-principle"] = { correct: false, message: "The safe default for permissions.", explanation: "'Deny by default' — everything is forbidden unless explicitly allowed." };
    }

    if (this.containsAny(answers["enforcement"] ?? "", ["server", "backend", "server-side", "back-end"])) {
      feedback["enforcement"] = { correct: true, message: "Correct!", explanation: "Access control MUST be enforced server-side — client-side checks can always be bypassed." };
      score += 10;
    } else {
      feedback["enforcement"] = { correct: false, message: "The client can always be manipulated.", explanation: "Server-side — never trust the client for access control decisions." };
    }

    return { passed: score >= 40, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
