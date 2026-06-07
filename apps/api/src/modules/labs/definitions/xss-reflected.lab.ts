import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class XssReflectedLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "xss-reflected",
    name: "Reflected XSS",
    description: "Learn how reflected cross-site scripting works by analyzing vulnerable URL parameters that echo unsanitized input.",
    objective: "Identify and explain a reflected XSS vulnerability, craft a basic payload, and understand the mitigation.",
    category: "XSS",
    difficulty: "BEGINNER",
    icon: "Code2",
    xpReward: 10,
    estimatedMin: 15,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "Where to look", content: "Reflected XSS occurs when user input from the URL is echoed back into the HTML page without encoding.", xpCost: 3 },
      { key: "hint-2", order: 2, title: "Common locations", content: "Look at query parameters like `?search=`, `?q=`, or `?name=` — these are common injection points.", xpCost: 3 },
    ],
    steps: [
      { order: 1, title: "Understanding Reflected XSS", instruction: "Reflected XSS occurs when a web application takes user-supplied input from a URL parameter and includes it in the HTTP response without proper encoding.\n\n**Example vulnerable code (PHP):**\n```php\n<?php\n$search = $_GET['q'];\necho \"You searched for: \" . $search;\n?>\n```\n\nIf a user visits `?q=<script>alert(1)</script>`, the script executes in their browser." },
      { order: 2, title: "Crafting a Payload", instruction: "A basic reflected XSS payload uses the `<script>` tag:\n```\n<script>alert('XSS')</script>\n```\n\nOther techniques to bypass filters:\n```\n<img src=x onerror=alert(1)>\n\"><script>alert(1)</script>\n```" },
      { order: 3, title: "Impact & Mitigation", instruction: "**Impact:** Attackers can steal cookies, perform actions on behalf of victims, or redirect to phishing pages.\n\n**Mitigation:**\n- Encode output: `htmlspecialchars($input, ENT_QUOTES, 'UTF-8')`\n- Implement Content Security Policy (CSP)\n- Validate input server-side\n- Use a Web Application Firewall (WAF)" },
    ],
    questions: [
      { key: "xss-type", label: "What type of XSS is this? Reflected, Stored, or DOM?", type: "text", points: 10, placeholder: "Reflected", helpText: "The payload comes from the URL request" },
      { key: "vulnerable-param", label: "A URL contains `?name=<script>alert(1)</script>`. Which parameter is vulnerable?", type: "text", points: 10, placeholder: "name" },
      { key: "mitigation", label: "What PHP function would you use to prevent this XSS?", type: "text", points: 10, placeholder: "htmlspecialchars", helpText: "It encodes HTML special characters" },
      { key: "attack-goal", label: "What is the most common goal of a reflected XSS attack? (one word)", type: "text", points: 10, placeholder: "cookie stealing / session hijacking" },
    ],
    tags: ["xss", "client-side", "owasp-a03"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    // Q1: XSS type
    const xssType = (answers["xss-type"] ?? "").toLowerCase();
    if (xssType.includes("reflect")) {
      feedback["xss-type"] = { correct: true, message: "Correct!", explanation: "Reflected XSS is when the payload is reflected back from the server in the same HTTP response." };
      score += 10;
    } else {
      feedback["xss-type"] = { correct: false, message: "Incorrect. The payload travels via the URL request and is reflected back.", explanation: "Reflected XSS means the payload is part of the HTTP request and gets reflected in the response." };
    }

    // Q2: vulnerable param
    const param = (answers["vulnerable-param"] ?? "").trim().toLowerCase();
    if (param === "name" || param === "?name" || param === "name=") {
      feedback["vulnerable-param"] = { correct: true, message: "Correct!", explanation: "The `name` parameter receives the payload `<script>alert(1)</script>`." };
      score += 10;
    } else {
      feedback["vulnerable-param"] = { correct: false, message: "Look at the URL parameter name before the `=`.", explanation: "The vulnerable parameter is `name` — it's the one that contains the injected `<script>` tag." };
    }

    // Q3: mitigation
    const mitigation = (answers["mitigation"] ?? "").toLowerCase();
    if (this.containsAny(mitigation, ["htmlspecialchars", "html_entity_encode", "encode", "escape", "sanitize"])) {
      feedback["mitigation"] = { correct: true, message: "Correct!", explanation: "htmlspecialchars() converts <, >, \", ' and & to HTML entities, preventing script injection.", expectedValue: "htmlspecialchars" };
      score += 10;
    } else {
      feedback["mitigation"] = { correct: false, message: "Think about encoding HTML special characters.", explanation: "htmlspecialchars($input, ENT_QUOTES, 'UTF-8') is the correct PHP function to encode output." };
    }

    // Q4: attack goal
    const goal = (answers["attack-goal"] ?? "").toLowerCase();
    if (this.containsAny(goal, ["cookie", "session", "steal", "hijack", "theft"])) {
      feedback["attack-goal"] = { correct: true, message: "Correct!", explanation: "Cookie theft/session hijacking is the primary goal — attackers steal the victim's session cookie to impersonate them." };
      score += 10;
    } else {
      feedback["attack-goal"] = { correct: false, message: "What does an attacker want from your browser session?", explanation: "Cookie stealing (session hijacking) is the most common goal, allowing attackers to log in as the victim." };
    }

    return {
      passed: score >= 30,
      score,
      maxScore: this.maxScore,
      xpEarned: this.calcXp(score, 0),
      feedback,
    };
  }
}
