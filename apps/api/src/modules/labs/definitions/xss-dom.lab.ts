import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class XssDomLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "xss-dom",
    name: "DOM-Based XSS",
    description: "Investigate how DOM-based XSS occurs entirely in the browser when client-side JavaScript handles untrusted data unsafely.",
    objective: "Identify DOM-based XSS sources and sinks, understand why it bypasses server-side protections, and apply client-side mitigations.",
    category: "XSS",
    difficulty: "ADVANCED",
    icon: "Globe",
    xpReward: 50,
    estimatedMin: 30,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "Sources vs Sinks", content: "In DOM XSS, a 'source' is user-controlled input (e.g., location.hash). A 'sink' is where that data ends up dangerously (e.g., innerHTML).", xpCost: 8 },
      { key: "hint-2", order: 2, title: "Common sinks", content: "Dangerous sinks include: innerHTML, document.write(), eval(), setTimeout(string), location.href, outerHTML", xpCost: 8 },
    ],
    steps: [
      { order: 1, title: "DOM XSS Fundamentals", instruction: "DOM-based XSS happens entirely in the browser — the server never sees the malicious payload. It occurs when client-side JavaScript reads from a user-controlled source and writes to a dangerous sink.\n\n**Vulnerable code:**\n```javascript\nvar name = location.hash.substring(1);\ndocument.getElementById('greeting').innerHTML = 'Hello, ' + name;\n```\n\n**Exploit:** `https://example.com/page#<img src=x onerror=alert(1)>`" },
      { order: 2, title: "Sources and Sinks", instruction: "**Common Sources:**\n- `location.hash`\n- `location.search`\n- `location.href`\n- `document.referrer`\n- `window.name`\n\n**Dangerous Sinks:**\n- `innerHTML` / `outerHTML`\n- `document.write()`\n- `eval()`\n- `setTimeout('code', ms)`\n- `location.href = userInput`" },
      { order: 3, title: "Safe Alternatives", instruction: "**Safe replacements:**\n```javascript\n// Instead of innerHTML (dangerous):\ndocument.getElementById('name').innerHTML = input;\n\n// Use textContent (safe):\ndocument.getElementById('name').textContent = input;\n\n// Or createElement + createTextNode:\nconst text = document.createTextNode(input);\nelement.appendChild(text);\n```" },
    ],
    questions: [
      { key: "source", label: "In DOM XSS, what is a 'source'?", type: "text", points: 15, placeholder: "User-controlled input...", helpText: "Think about where the malicious data enters the JavaScript code" },
      { key: "sink", label: "Name TWO dangerous DOM sinks:", type: "text", points: 20, placeholder: "innerHTML, eval..." },
      { key: "server-sees", label: "Does the server see the DOM XSS payload? (yes/no)", type: "text", points: 15, placeholder: "no" },
      { key: "safe-alternative", label: "What is the safe alternative to innerHTML for rendering plain text?", type: "text", points: 15, placeholder: "textContent", helpText: "It treats the value as text, not HTML" },
    ],
    tags: ["xss", "dom", "client-side", "advanced"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    const source = (answers["source"] ?? "").toLowerCase();
    if (this.containsAny(source, ["user input", "user-controlled", "user controlled", "untrusted", "location", "hash", "attacker"])) {
      feedback["source"] = { correct: true, message: "Correct!", explanation: "A source is any user-controlled input that enters the JavaScript code: location.hash, location.search, document.referrer, etc." };
      score += 15;
    } else {
      feedback["source"] = { correct: false, message: "A source is where untrusted data enters JavaScript.", explanation: "In DOM XSS, a source is user-controlled input like location.hash, location.search, or document.referrer." };
    }

    const sinks = (answers["sink"] ?? "").toLowerCase();
    let sinksFound = 0;
    for (const s of ["innerhtml", "document.write", "eval", "settimeout", "location.href", "outerhtml", "insertadjacenthtml"]) {
      if (sinks.includes(s)) sinksFound++;
    }
    if (sinksFound >= 2) {
      feedback["sink"] = { correct: true, message: "Correct!", explanation: "Common dangerous sinks include innerHTML, document.write(), eval(), setTimeout() with a string, and outerHTML." };
      score += 20;
    } else if (sinksFound === 1) {
      feedback["sink"] = { correct: false, message: "You found one — try to name two more dangerous sinks.", explanation: "Common sinks: innerHTML, document.write, eval, setTimeout(string), outerHTML, location.href" };
    } else {
      feedback["sink"] = { correct: false, message: "Think about JavaScript properties/functions that render HTML or execute code.", explanation: "Dangerous sinks include innerHTML, document.write(), eval() — they render HTML or execute strings as code." };
    }

    const serverSees = (answers["server-sees"] ?? "").toLowerCase().trim();
    if (serverSees === "no" || serverSees === "never" || serverSees.includes("no")) {
      feedback["server-sees"] = { correct: true, message: "Correct!", explanation: "DOM XSS happens entirely in the browser (client-side). The server never processes the payload — this is why server-side WAFs can't detect it." };
      score += 15;
    } else {
      feedback["server-sees"] = { correct: false, message: "Remember: DOM XSS is purely client-side.", explanation: "No — the server never sees DOM XSS payloads. They're processed entirely by the browser's JavaScript engine." };
    }

    const safeAlt = (answers["safe-alternative"] ?? "").toLowerCase();
    if (this.containsAny(safeAlt, ["textcontent", "text-content", "createtextnode", "innertext"])) {
      feedback["safe-alternative"] = { correct: true, message: "Correct!", explanation: "textContent sets the text as plain text (not HTML), preventing script injection even if the value contains HTML tags." };
      score += 15;
    } else {
      feedback["safe-alternative"] = { correct: false, message: "Use a property that treats the value as text, not HTML markup.", explanation: "textContent is the safe alternative to innerHTML — it treats the value as plain text and never parses it as HTML." };
    }

    return { passed: score >= 45, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
