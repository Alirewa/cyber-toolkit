import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class FileUploadLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "file-upload",
    name: "Insecure File Upload",
    description: "Learn how unrestricted file uploads lead to remote code execution (RCE) in an isolated sandbox.",
    objective: "Understand dangerous upload patterns, bypass techniques, and robust validation defenses.",
    category: "FILE_UPLOAD",
    difficulty: "ADVANCED",
    icon: "Upload",
    xpReward: 50,
    estimatedMin: 30,
    isSandboxed: true,
    sandboxImage: "cyberlab/upload-lab:1.0",
    hints: [
      { key: "hint-1", order: 1, title: "Double extensions", content: "A file named shell.php.jpg can bypass naïve extension checks while still being executed as PHP by misconfigured servers.", xpCost: 8 },
      { key: "hint-2", order: 2, title: "Content-Type is a lie", content: "The Content-Type header is attacker-controlled. Never trust it — verify the actual file bytes (magic numbers).", xpCost: 8 },
    ],
    steps: [
      { order: 1, title: "Why uploads are dangerous", instruction: "**Unrestricted file upload** lets an attacker place executable code on the server.\n\n**Vulnerable pattern:**\n```javascript\n// Saves any uploaded file into the web root\nfs.writeFileSync(`./public/${file.originalname}`, file.buffer);\n```\n\nUpload `shell.php`, then browse to `/shell.php` → arbitrary code execution." },
      { order: 2, title: "Common bypasses", instruction: "Attackers defeat weak filters with:\n- **Double extensions:** `shell.php.jpg`\n- **Null bytes:** `shell.php%00.jpg` (legacy)\n- **Case tricks:** `shell.PhP`\n- **Content-Type spoofing:** sending `image/jpeg` for a script\n- **Polyglot files:** valid image AND valid script\n- **SVG with embedded JS** for stored XSS" },
      { order: 3, title: "Defending uploads", instruction: "**Layered defenses:**\n1. **Allowlist** extensions AND validate magic bytes\n2. **Rename** files to random server-generated names\n3. Store **outside the web root** (or in object storage)\n4. Serve with `Content-Disposition: attachment` and a fixed Content-Type\n5. Disable script execution in the upload directory\n6. Enforce **size limits** and scan with AV" },
    ],
    questions: [
      { key: "impact", label: "What is the most severe impact of an unrestricted file upload that lands in the web root?", type: "text", points: 15, placeholder: "Remote Code Execution (RCE)" },
      { key: "bypass", label: "Name one technique to bypass a simple extension filter:", type: "text", points: 10, placeholder: "Double extension (shell.php.jpg)" },
      { key: "trust-header", label: "Should you trust the Content-Type header to validate an upload? (yes/no)", type: "text", points: 10, placeholder: "no" },
      { key: "best-defense", label: "Besides allowlisting extensions, what should you verify about the file's actual contents?", type: "text", points: 15, placeholder: "Magic bytes / file signature" },
    ],
    tags: ["file-upload", "rce", "owasp-a04", "advanced"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["impact"] ?? "", ["rce", "remote code execution", "code execution", "arbitrary code", "shell"])) {
      feedback["impact"] = { correct: true, message: "Correct!", explanation: "An executable file in the web root leads to Remote Code Execution (RCE) — full server compromise." };
      score += 15;
    } else {
      feedback["impact"] = { correct: false, message: "Think about uploading executable code.", explanation: "The worst case is Remote Code Execution (RCE)." };
    }

    if (this.containsAny(answers["bypass"] ?? "", ["double extension", "shell.php.jpg", ".php.jpg", "null byte", "%00", "polyglot", "content-type", "case", "phps", "svg"])) {
      feedback["bypass"] = { correct: true, message: "Correct!", explanation: "Common bypasses: double extensions, null bytes, case tricks, Content-Type spoofing, and polyglot files." };
      score += 10;
    } else {
      feedback["bypass"] = { correct: false, message: "Think about how 'shell.php.jpg' might slip through.", explanation: "Double extensions, null bytes, case variation, or Content-Type spoofing all bypass naïve filters." };
    }

    if (this.containsAny(answers["trust-header"] ?? "", ["no", "never", "false", "don't", "do not", "nope"])) {
      feedback["trust-header"] = { correct: true, message: "Correct!", explanation: "The Content-Type header is attacker-controlled and must never be trusted for validation." };
      score += 10;
    } else {
      feedback["trust-header"] = { correct: false, message: "It's attacker-controlled…", explanation: "No — Content-Type is set by the client and trivially spoofed." };
    }

    if (this.containsAny(answers["best-defense"] ?? "", ["magic", "signature", "magic bytes", "magic number", "file signature", "bytes", "header bytes", "content"])) {
      feedback["best-defense"] = { correct: true, message: "Correct!", explanation: "Validate the file's magic bytes (file signature) to confirm its true type, not just the extension or header." };
      score += 15;
    } else {
      feedback["best-defense"] = { correct: false, message: "Inspect the actual file bytes…", explanation: "Verify the magic bytes / file signature to confirm the real content type." };
    }

    return { passed: score >= 40, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
