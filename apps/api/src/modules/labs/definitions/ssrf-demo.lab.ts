import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class SsrfDemoLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "ssrf-demo",
    name: "SSRF Sandbox Demo",
    description: "Server-Side Request Forgery education in an isolated sandbox — learn how SSRF reaches internal services and cloud metadata.",
    objective: "Understand SSRF impact, recognize dangerous URL-fetching patterns, and learn allowlist-based defenses.",
    category: "SSRF",
    difficulty: "ADVANCED",
    icon: "Radar",
    xpReward: 50,
    estimatedMin: 30,
    isSandboxed: true,
    sandboxImage: "cyberlab/ssrf-lab:1.0",
    hints: [
      { key: "hint-1", order: 1, title: "Cloud metadata", content: "Cloud providers expose metadata at 169.254.169.254. SSRF to this endpoint can leak credentials.", xpCost: 8 },
      { key: "hint-2", order: 2, title: "The real fix", content: "Blocklists are easily bypassed (e.g., DNS rebinding, decimal IPs). Use an allowlist of permitted destinations instead.", xpCost: 8 },
    ],
    steps: [
      { order: 1, title: "What is SSRF?", instruction: "**Server-Side Request Forgery (SSRF)** tricks a server into making HTTP requests to attacker-chosen destinations.\n\n**Vulnerable pattern:**\n```javascript\n// Fetches whatever URL the user provides\nconst response = await fetch(req.query.url);\n```\n\nAn attacker supplies `url=http://localhost:6379` to reach internal services the server can access but the attacker normally can't." },
      { order: 2, title: "SSRF Impact", instruction: "**What SSRF can reach:**\n- Internal services (databases, admin panels)\n- Cloud metadata endpoints: `http://169.254.169.254/latest/meta-data/` (AWS) — can leak IAM credentials!\n- localhost services bound to 127.0.0.1\n- Internal network scanning\n\n**This is a SANDBOX demo. Never test SSRF against systems you don't own.**" },
      { order: 3, title: "Defending Against SSRF", instruction: "**Defenses (in order of strength):**\n1. **Allowlist** permitted domains/IPs (strongest)\n2. **Block private IP ranges** (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)\n3. **Disable redirects** or validate them\n4. **Use a dedicated egress proxy**\n5. **Validate the response** content-type\n\n⚠️ Blocklists alone are bypassable (decimal IPs, DNS rebinding, IPv6)." },
    ],
    questions: [
      { key: "full-name", label: "What does SSRF stand for?", type: "text", points: 10, placeholder: "Server-Side Request Forgery" },
      { key: "metadata-ip", label: "What IP address do cloud providers use for the metadata endpoint?", type: "text", points: 20, placeholder: "169.254.169.254", helpText: "It's a link-local address" },
      { key: "best-defense", label: "What is the strongest SSRF defense: blocklist or allowlist?", type: "text", points: 15, placeholder: "allowlist" },
      { key: "private-range", label: "Name one private IP range that SSRF protections should block:", type: "text", points: 15, placeholder: "127.0.0.1 / 10.0.0.0/8 / 192.168.x" },
    ],
    tags: ["ssrf", "cloud", "owasp-a10", "advanced"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["full-name"] ?? "", ["server-side request forgery", "server side request forgery"])) {
      feedback["full-name"] = { correct: true, message: "Correct!", explanation: "SSRF = Server-Side Request Forgery." };
      score += 10;
    } else {
      feedback["full-name"] = { correct: false, message: "S-S-R-F", explanation: "SSRF stands for Server-Side Request Forgery." };
    }

    const metaIp = (answers["metadata-ip"] ?? "").trim();
    if (metaIp.includes("169.254.169.254")) {
      feedback["metadata-ip"] = { correct: true, message: "Correct!", explanation: "169.254.169.254 is the link-local metadata endpoint used by AWS, GCP, and Azure. SSRF here can leak cloud credentials." };
      score += 20;
    } else {
      feedback["metadata-ip"] = { correct: false, message: "It's a 169.254.x.x link-local address.", explanation: "The cloud metadata endpoint is 169.254.169.254." };
    }

    if (this.containsAny(answers["best-defense"] ?? "", ["allowlist", "allow-list", "allow list", "whitelist"])) {
      feedback["best-defense"] = { correct: true, message: "Correct!", explanation: "Allowlists (only permit known-good destinations) are far stronger than blocklists, which are easily bypassed." };
      score += 15;
    } else {
      feedback["best-defense"] = { correct: false, message: "Which is harder to bypass — denying bad or only allowing good?", explanation: "Allowlist — only permit explicitly approved destinations. Blocklists are bypassable." };
    }

    const range = (answers["private-range"] ?? "").toLowerCase();
    if (this.containsAny(range, ["127.0.0.1", "127.", "localhost", "10.", "192.168", "172.16", "169.254", "private", "::1"])) {
      feedback["private-range"] = { correct: true, message: "Correct!", explanation: "Private ranges to block: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16." };
      score += 15;
    } else {
      feedback["private-range"] = { correct: false, message: "Think RFC 1918 private addresses or loopback.", explanation: "Block: 127.x (loopback), 10.x, 172.16-31.x, 192.168.x (private), and 169.254.x (link-local)." };
    }

    return { passed: score >= 45, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
