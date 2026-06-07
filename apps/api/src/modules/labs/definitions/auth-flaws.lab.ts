import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class AuthFlawsLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "auth-flaws",
    name: "Authentication Flaws",
    description: "Examine common authentication vulnerabilities: weak password storage, username enumeration, and session fixation.",
    objective: "Identify insecure authentication patterns and apply best practices for credential storage and session management.",
    category: "AUTHENTICATION",
    difficulty: "INTERMEDIATE",
    icon: "Lock",
    xpReward: 25,
    estimatedMin: 25,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "Password storage", content: "Never store plaintext passwords. Never use fast hashes (MD5/SHA1) for passwords — use a slow, salted algorithm.", xpCost: 5 },
      { key: "hint-2", order: 2, title: "Enumeration", content: "Login error messages should be identical whether the username exists or not — to prevent username enumeration.", xpCost: 5 },
    ],
    steps: [
      { order: 1, title: "Secure Password Storage", instruction: "**Never:**\n- Store plaintext passwords\n- Use MD5, SHA1, or SHA256 alone (too fast — easy to brute force)\n\n**Always:**\n- Use a slow, adaptive hashing algorithm: **bcrypt**, **scrypt**, or **Argon2**\n- Use a unique random salt per password\n\n```javascript\n// SAFE\nconst hash = await argon2.hash(password);\n```" },
      { order: 2, title: "Username Enumeration", instruction: "If a login form says:\n- *\"User not found\"* → username doesn't exist\n- *\"Wrong password\"* → username exists!\n\nAttackers use this to build a list of valid usernames.\n\n**Fix:** Use a generic message: *\"Invalid email or password\"* in all cases, and ensure consistent response timing." },
      { order: 3, title: "Session Security", instruction: "**Session best practices:**\n- Regenerate session ID after login (prevents **session fixation**)\n- Set short session expiry + idle timeout\n- Use HttpOnly + Secure + SameSite cookies\n- Invalidate sessions on logout server-side\n- Implement refresh token rotation (like CyberLab does!)" },
    ],
    questions: [
      { key: "hash-algo", label: "Name one password hashing algorithm that is SAFE for storing passwords:", type: "text", points: 15, placeholder: "bcrypt / argon2 / scrypt" },
      { key: "unsafe-hash", label: "Name one hashing algorithm that is UNSAFE for passwords (too fast):", type: "text", points: 10, placeholder: "MD5 / SHA1" },
      { key: "enumeration-fix", label: "What login message prevents username enumeration?", type: "text", points: 15, placeholder: "Invalid email or password (generic)" },
      { key: "session-fixation", label: "What should you regenerate after a successful login to prevent session fixation?", type: "text", points: 10, placeholder: "session ID" },
    ],
    tags: ["authentication", "passwords", "sessions", "owasp-a07"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["hash-algo"] ?? "", ["bcrypt", "argon", "scrypt", "pbkdf2"])) {
      feedback["hash-algo"] = { correct: true, message: "Correct!", explanation: "bcrypt, Argon2, scrypt, and PBKDF2 are slow, adaptive, salted hashing algorithms designed for passwords." };
      score += 15;
    } else {
      feedback["hash-algo"] = { correct: false, message: "Think of slow, adaptive hashing algorithms.", explanation: "Safe choices: bcrypt, Argon2, scrypt, or PBKDF2. CyberLab uses Argon2." };
    }

    if (this.containsAny(answers["unsafe-hash"] ?? "", ["md5", "sha1", "sha-1", "sha256", "sha-256", "sha", "plain"])) {
      feedback["unsafe-hash"] = { correct: true, message: "Correct!", explanation: "MD5 and SHA family are too fast — attackers can compute billions of hashes per second to brute force them." };
      score += 10;
    } else {
      feedback["unsafe-hash"] = { correct: false, message: "Think of fast, general-purpose hash functions.", explanation: "MD5 and SHA1/SHA256 are unsafe for passwords because they're fast — easy to brute force." };
    }

    if (this.containsAny(answers["enumeration-fix"] ?? "", ["invalid", "generic", "incorrect", "email or password", "username or password", "same"])) {
      feedback["enumeration-fix"] = { correct: true, message: "Correct!", explanation: "A generic message like 'Invalid email or password' doesn't reveal whether the username exists." };
      score += 15;
    } else {
      feedback["enumeration-fix"] = { correct: false, message: "The message must not reveal whether the username exists.", explanation: "Use a generic message: 'Invalid email or password' for both wrong-username and wrong-password cases." };
    }

    if (this.containsAny(answers["session-fixation"] ?? "", ["session id", "session-id", "sessionid", "session", "token"])) {
      feedback["session-fixation"] = { correct: true, message: "Correct!", explanation: "Regenerating the session ID after login prevents session fixation, where an attacker pre-sets a known session ID." };
      score += 10;
    } else {
      feedback["session-fixation"] = { correct: false, message: "What identifier ties a user to their session?", explanation: "Regenerate the session ID after login to prevent session fixation attacks." };
    }

    return { passed: score >= 40, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
