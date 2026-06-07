import { Injectable } from "@nestjs/common";
import { BaseLab } from "../base/base-lab";
import type { LabMeta, ValidationResult } from "../base/lab-definition.interface";

@Injectable()
export class SqliIntroLab extends BaseLab {
  readonly meta: LabMeta = {
    slug: "sqli-intro",
    name: "SQL Injection Basics",
    description: "Understand how SQL injection works by analyzing unsanitized database queries — strictly educational, no live database attacks.",
    objective: "Recognize SQL injection patterns, understand classic auth-bypass payloads, and learn parameterized queries as the fix.",
    category: "SQL_INJECTION",
    difficulty: "INTERMEDIATE",
    icon: "Database",
    xpReward: 25,
    estimatedMin: 25,
    isSandboxed: false,
    hints: [
      { key: "hint-1", order: 1, title: "String concatenation is the enemy", content: "SQL injection happens when user input is directly concatenated into a query string instead of using parameters.", xpCost: 5 },
      { key: "hint-2", order: 2, title: "Classic auth bypass", content: "The classic login bypass uses a payload that makes the WHERE clause always true, like commenting out the rest of the query.", xpCost: 5 },
    ],
    steps: [
      { order: 1, title: "What is SQL Injection?", instruction: "SQL injection occurs when untrusted input is concatenated into a SQL query.\n\n**Vulnerable code:**\n```javascript\nconst query = `SELECT * FROM users WHERE username = '${user}' AND password = '${pass}'`;\n```\n\nIf `user` = `admin'--`, the query becomes:\n```sql\nSELECT * FROM users WHERE username = 'admin'--' AND password = '...'\n```\nThe `--` comments out the password check!" },
      { order: 2, title: "Classic Payloads", instruction: "**Auth bypass:**\n```\n' OR '1'='1\nadmin'--\n' OR 1=1--\n```\n\n**Union-based (data extraction):**\n```\n' UNION SELECT username, password FROM users--\n```\n\n**These are for understanding only — never run against systems you don't own.**" },
      { order: 3, title: "The Fix: Parameterized Queries", instruction: "**Always use parameterized queries (prepared statements):**\n```javascript\n// SAFE — Prisma\nawait prisma.user.findFirst({ where: { username, password } });\n\n// SAFE — raw with parameters\ndb.query('SELECT * FROM users WHERE username = $1', [username]);\n```\n\nThe database treats parameters as data, never as executable SQL." },
    ],
    questions: [
      { key: "root-cause", label: "What is the root cause of SQL injection? (what coding mistake)", type: "text", points: 15, placeholder: "string concatenation of user input" },
      { key: "bypass-payload", label: "Complete the classic auth bypass payload: ' OR ____", type: "text", points: 15, placeholder: "'1'='1", context: "SELECT * FROM users WHERE username = '[INPUT]'" },
      { key: "fix", label: "What is the recommended fix for SQL injection?", type: "text", points: 15, placeholder: "parameterized queries / prepared statements" },
      { key: "comment", label: "In MySQL/SQL, what two characters start an inline comment (used to truncate queries)?", type: "text", points: 10, placeholder: "--" },
    ],
    tags: ["sqli", "injection", "owasp-a03"],
  };

  async validate(answers: Record<string, string>): Promise<ValidationResult> {
    const feedback: ValidationResult["feedback"] = {};
    let score = 0;

    if (this.containsAny(answers["root-cause"] ?? "", ["concatenat", "string", "unsanitized", "untrusted input", "no parameter", "user input", "interpolat"])) {
      feedback["root-cause"] = { correct: true, message: "Correct!", explanation: "SQL injection is caused by concatenating untrusted user input directly into SQL query strings." };
      score += 15;
    } else {
      feedback["root-cause"] = { correct: false, message: "Think about how the malicious input gets into the query.", explanation: "The root cause is string concatenation of unsanitized user input into SQL queries." };
    }

    const bypass = (answers["bypass-payload"] ?? "").toLowerCase().replace(/\s/g, "");
    if (this.containsAny(bypass, ["'1'='1", "1=1", "'a'='a", "true"])) {
      feedback["bypass-payload"] = { correct: true, message: "Correct!", explanation: "' OR '1'='1 makes the WHERE clause always true, bypassing authentication." };
      score += 15;
    } else {
      feedback["bypass-payload"] = { correct: false, message: "You need a condition that's always true.", explanation: "The classic payload is ' OR '1'='1 — it makes the WHERE clause evaluate to true for all rows." };
    }

    if (this.containsAny(answers["fix"] ?? "", ["parameteriz", "prepared statement", "prepared-statement", "binding", "orm", "placeholder"])) {
      feedback["fix"] = { correct: true, message: "Correct!", explanation: "Parameterized queries (prepared statements) separate code from data — input is never interpreted as SQL." };
      score += 15;
    } else {
      feedback["fix"] = { correct: false, message: "What technique separates SQL code from data?", explanation: "Parameterized queries / prepared statements are the correct fix — they treat input strictly as data." };
    }

    const comment = (answers["comment"] ?? "").trim();
    if (comment.includes("--")) {
      feedback["comment"] = { correct: true, message: "Correct!", explanation: "-- starts an inline comment in SQL, used to truncate the rest of a query." };
      score += 10;
    } else {
      feedback["comment"] = { correct: false, message: "It's two identical dash characters.", explanation: "-- (double dash) starts an inline comment in SQL." };
    }

    return { passed: score >= 40, score, maxScore: this.maxScore, xpEarned: this.calcXp(score, 0), feedback };
  }
}
