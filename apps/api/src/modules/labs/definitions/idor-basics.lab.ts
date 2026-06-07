import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class IdorBasicsLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "idor-basics",
    name: "IDOR — Insecure Direct Object Reference",
    description: "Discover how IDOR vulnerabilities let attackers access other users' data by manipulating object identifiers in requests.",
    objective: "Identify IDOR patterns, understand the difference between authentication and authorization, and learn proper access control checks.",
    category: "IDOR",
    difficulty: "BEGINNER",
    icon: "Fingerprint",
    xpReward: 10,
    estimatedMin: 15,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "Predictable IDs", content: "IDOR thrives on predictable, sequential IDs. If your invoice is /invoice/1005, try /invoice/1004.", xpCost: 3 },
      { key: "hint-2", order: 2, title: "Auth vs Authz", content: "Authentication = who you are. Authorization = what you're allowed to access. IDOR is a failure of authorization.", xpCost: 3 },
    ],
    steps: [
      { order: 1, title: "What is IDOR?", instruction: "**Insecure Direct Object Reference (IDOR)** occurs when an application exposes a reference to an internal object (like a database ID) and fails to verify the user is authorized to access it.\n\n**Example:**\n```\nGET /api/users/1001/profile   ← your profile\nGET /api/users/1002/profile   ← someone else's profile!\n```\n\nIf the server doesn't check ownership, you can read anyone's data." },
      { order: 2, title: "Authentication vs Authorization", instruction: "These are different concepts:\n\n- **Authentication** answers *\"Who are you?\"* (login)\n- **Authorization** answers *\"Are you allowed to do this?\"* (access control)\n\nIDOR is an **authorization** failure — the user is authenticated, but the server doesn't check if they *own* the resource they're requesting." },
      { order: 3, title: "Preventing IDOR", instruction: "**Mitigations:**\n1. **Ownership checks:** Always verify `resource.ownerId === currentUser.id`\n2. **Use UUIDs instead of sequential IDs** (defense in depth, not a fix alone)\n3. **Indirect references:** map user-facing IDs to internal IDs per session\n4. **Centralized access control** middleware\n\n```javascript\nconst doc = await db.document.findFirst({\n  where: { id: docId, ownerId: req.user.id }  // ✅ ownership check\n});\n```" },
    ],
    questions: [
      { key: "category", label: "IDOR is primarily a failure of which security control? (authentication or authorization)", type: "text", points: 15, placeholder: "authorization" },
      { key: "exploit", label: "If your order is at /order/5821, what would you change to test for IDOR?", type: "text", points: 10, placeholder: "the ID number / 5820" },
      { key: "fix", label: "What server-side check prevents IDOR?", type: "text", points: 15, placeholder: "ownership check" },
      { key: "id-hardening", label: "What type of identifier makes IDs harder to guess (defense in depth)?", type: "text", points: 10, placeholder: "UUID" },
    ],
    tags: ["idor", "access-control", "owasp-a01"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["category"] ?? "", ["authoriz", "access control", "access-control", "authz"])) {
      feedback["category"] = { correct: true, message: "Correct!", explanation: "IDOR is an authorization failure — the user is authenticated but the server fails to verify they're allowed to access the specific resource." };
      score += 15;
    } else {
      feedback["category"] = { correct: false, message: "The user is logged in, but can they access THIS resource?", explanation: "IDOR is an authorization (access control) failure, not authentication." };
    }

    const exploit = (answers["exploit"] ?? "").toLowerCase();
    if (this.containsAny(exploit, ["id", "number", "5820", "5822", "increment", "decrement", "change"])) {
      feedback["exploit"] = { correct: true, message: "Correct!", explanation: "You'd change the ID number (e.g., to 5820 or 5822) to try accessing another user's order." };
      score += 10;
    } else {
      feedback["exploit"] = { correct: false, message: "What part of the URL identifies the object?", explanation: "Change the ID number — e.g., try /order/5820 to see if you can access another user's order." };
    }

    if (this.containsAny(answers["fix"] ?? "", ["ownership", "owner", "authoriz", "access control", "verify user", "belongs"])) {
      feedback["fix"] = { correct: true, message: "Correct!", explanation: "An ownership check (resource.ownerId === currentUser.id) ensures users can only access their own resources." };
      score += 15;
    } else {
      feedback["fix"] = { correct: false, message: "The server must verify the user owns the resource.", explanation: "An ownership/authorization check verifying the resource belongs to the requesting user prevents IDOR." };
    }

    if (this.containsAny(answers["id-hardening"] ?? "", ["uuid", "guid", "random", "unpredictable"])) {
      feedback["id-hardening"] = { correct: true, message: "Correct!", explanation: "UUIDs are non-sequential and hard to guess, providing defense in depth (but ownership checks are still required)." };
      score += 10;
    } else {
      feedback["id-hardening"] = { correct: false, message: "Think of a random, non-sequential identifier format.", explanation: "UUIDs (Universally Unique Identifiers) make IDs hard to guess — defense in depth, not a standalone fix." };
    }

    return { passed: score >= 35, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
