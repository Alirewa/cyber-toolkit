import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class CsrfBasicsLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "csrf-basics",
    name: "CSRF Fundamentals",
    description: "Learn how Cross-Site Request Forgery attacks trick users into unknowingly submitting malicious requests using their authenticated session.",
    objective: "Understand CSRF mechanics, identify vulnerable endpoints, understand CSRF tokens, and distinguish CSRF from XSS.",
    category: "CSRF",
    difficulty: "BEGINNER",
    icon: "RefreshCw",
    xpReward: 10,
    estimatedMin: 15,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "How CSRF works", content: "CSRF exploits the browser's automatic inclusion of cookies in cross-origin requests. If you're logged into a site, a malicious page can make requests to that site using your cookies.", xpCost: 3 },
    ],
    steps: [
      { order: 1, title: "CSRF Attack Mechanics", instruction: "**Cross-Site Request Forgery (CSRF)** tricks an authenticated user's browser into making an unwanted request to a trusted site.\n\n**Attack scenario:**\n1. Alice is logged into `bank.com`\n2. Alice visits `evil.com` which contains:\n```html\n<img src=\"https://bank.com/transfer?to=attacker&amount=1000\">\n```\n3. Alice's browser automatically sends her cookies\n4. The bank processes the transfer!\n\n**Key:** The browser sends cookies even for cross-origin requests." },
      { order: 2, title: "CSRF vs XSS", instruction: "| | CSRF | XSS |\n|--|--|--|\n| **Runs code where?** | Server (victim's request) | Browser (victim's browser) |\n| **Needs JS?** | No | Yes |\n| **Session required?** | Yes | No |\n| **Origin?** | Cross-site | Same or cross-site |\n\n**CSRF exploits trust the server has in the user's browser. XSS exploits trust the user's browser has in the server.**" },
      { order: 3, title: "CSRF Token Defense", instruction: "**CSRF tokens** are the primary defense:\n\n1. Server generates a unique, random token per session\n2. Token is embedded in each HTML form as a hidden field\n3. Server validates the token on every state-changing request\n4. Attacker can't read the token (same-origin policy)\n\n```html\n<form action=\"/transfer\" method=\"POST\">\n  <input type=\"hidden\" name=\"csrf_token\" value=\"R4nd0m-S3cr3t-Tok3n\">\n  ...\n</form>\n```" },
    ],
    questions: [
      { key: "definition", label: "CSRF exploits the trust that the _____ has in the user's browser:", type: "text", points: 10, placeholder: "server / website" },
      { key: "requirement", label: "What must be true for CSRF to work? (what is the user's state)", type: "text", points: 10, placeholder: "logged in / authenticated" },
      { key: "defense", label: "What is the primary cryptographic defense against CSRF attacks?", type: "text", points: 10, placeholder: "CSRF token / anti-forgery token" },
      { key: "samesite", label: "Which cookie attribute helps mitigate CSRF by restricting cross-site sending?", type: "text", points: 10, placeholder: "SameSite" },
    ],
    tags: ["csrf", "client-side", "owasp-a01"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["definition"] ?? "", ["server", "website", "site", "application"])) {
      feedback["definition"] = { correct: true, message: "Correct!", explanation: "CSRF exploits the trust the server has in the user's browser — it believes requests with valid cookies are legitimate." };
      score += 10;
    } else {
      feedback["definition"] = { correct: false, message: "Think from the server's perspective.", explanation: "CSRF exploits the server's trust in the user's browser — the server sees a valid cookie and assumes the request is legitimate." };
    }

    if (this.containsAny(answers["requirement"] ?? "", ["logged in", "authenticated", "session", "cookie", "signed in"])) {
      feedback["requirement"] = { correct: true, message: "Correct!", explanation: "CSRF requires the victim to be authenticated (logged in) so their session cookie is sent with the forged request." };
      score += 10;
    } else {
      feedback["requirement"] = { correct: false, message: "What state must the user be in for the attack to succeed?", explanation: "The user must be logged in (authenticated). The attack relies on the browser automatically including session cookies." };
    }

    if (this.containsAny(answers["defense"] ?? "", ["csrf token", "anti-csrf", "synchronizer token", "nonce", "anti-forgery"])) {
      feedback["defense"] = { correct: true, message: "Correct!", explanation: "CSRF tokens (synchronizer token pattern) are unpredictable values that attackers can't guess or forge." };
      score += 10;
    } else {
      feedback["defense"] = { correct: false, message: "It's a random secret value embedded in forms.", explanation: "CSRF tokens are unique, unpredictable values generated per session/request that servers validate before processing state-changing requests." };
    }

    if (this.containsAny(answers["samesite"] ?? "", ["samesite", "same-site", "same site"])) {
      feedback["samesite"] = { correct: true, message: "Correct!", explanation: "The SameSite cookie attribute (Strict or Lax) tells browsers not to send cookies on cross-site requests, mitigating CSRF." };
      score += 10;
    } else {
      feedback["samesite"] = { correct: false, message: "It's a modern cookie attribute that restricts cross-origin cookie sending.", explanation: "SameSite=Strict or SameSite=Lax prevents cookies from being sent on cross-site requests." };
    }

    return { passed: score >= 30, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
