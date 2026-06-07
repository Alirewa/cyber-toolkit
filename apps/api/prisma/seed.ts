import { PrismaClient, Role } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. System Roles ──────────────────────────────────────────────────
  const roles = [
    { name: Role.SUPER_ADMIN, description: "Full platform access — system use only", isSystem: true },
    { name: Role.ADMIN, description: "Administrative access", isSystem: true },
    { name: Role.MODERATOR, description: "Content moderation access", isSystem: true },
    { name: Role.USER, description: "Standard user access", isSystem: true },
  ];

  for (const role of roles) {
    await prisma.roleEntity.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log("✅ Roles seeded");

  // ── 2. System Permissions ─────────────────────────────────────────────
  const permissions = [
    { resource: "users", action: "read" },
    { resource: "users", action: "write" },
    { resource: "users", action: "delete" },
    { resource: "users", action: "ban" },
    { resource: "roles", action: "read" },
    { resource: "roles", action: "assign" },
    { resource: "audit-logs", action: "read" },
    { resource: "notifications", action: "read" },
    { resource: "api-keys", action: "manage" },
    { resource: "feature-flags", action: "manage" },
    { resource: "modules", action: "manage" },
    { resource: "platform", action: "stats" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
  }
  console.log("✅ Permissions seeded");

  // ── 3. Role → Permission Assignments ─────────────────────────────────
  const rolePermissions: Record<Role, string[]> = {
    [Role.SUPER_ADMIN]: permissions.map((p) => `${p.resource}:${p.action}`),
    [Role.ADMIN]: [
      "users:read", "users:write", "users:ban",
      "roles:read", "roles:assign",
      "audit-logs:read", "notifications:read",
      "feature-flags:manage", "platform:stats",
    ],
    [Role.MODERATOR]: ["users:read", "audit-logs:read", "notifications:read"],
    [Role.USER]: ["notifications:read", "api-keys:manage"],
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.roleEntity.findUnique({ where: { name: roleName as Role } });
    if (!role) continue;

    for (const permStr of perms) {
      const [resource, action] = permStr.split(":") as [string, string];
      const perm = await prisma.permission.findUnique({ where: { resource_action: { resource, action } } });
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log("✅ Role permissions assigned");

  // ── 4. Local Admin User (personal mode — fixed ID matches BYPASS_AUTH) ──
  const admin = await prisma.user.upsert({
    where: { email: "admin@cyberlab.local" },
    update: { username: "admin", isEmailVerified: true, isActive: true },
    create: {
      id: "local-user-001",
      email: "admin@cyberlab.local",
      username: "admin",
      passwordHash: "bypass-personal-mode",
      isEmailVerified: true,
      isActive: true,
      settings: { create: {} },
    },
  });

  const superAdminRole = await prisma.roleEntity.findUnique({ where: { name: Role.SUPER_ADMIN } });
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: superAdminRole.id },
    });
  }
  console.log(`✅ Local admin user: admin@cyberlab.local (id: ${admin.id})`);

  // ── 5. Feature Flags ──────────────────────────────────────────────────
  const featureFlags = [
    { name: "cyber_tools", description: "Enable Phase 2 cyber tools", isEnabled: false },
    { name: "bug_bounty_labs", description: "Enable Phase 3 bug bounty labs", isEnabled: false },
    { name: "community", description: "Enable Phase 4 community features", isEnabled: false },
    { name: "ai_assistant", description: "Enable Phase 5 AI assistant", isEnabled: false },
    { name: "email_verification", description: "Require email verification on signup", isEnabled: false },
    { name: "two_factor_auth", description: "Enable 2FA support", isEnabled: false },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: { description: flag.description },
      create: flag,
    });
  }
  console.log("✅ Feature flags seeded");

  // ── 6. Platform Modules ───────────────────────────────────────────────
  const modules = [
    { name: "Cyber Tools", slug: "cyber-tools", description: "Defensive security utilities", version: "2.0.0" },
    { name: "Bug Bounty Labs", slug: "bug-bounty-labs", description: "Interactive security labs", version: "3.0.0" },
    { name: "Community", slug: "community", description: "Collaboration and community", version: "4.0.0" },
    { name: "Automation", slug: "automation", description: "Workflow automation", version: "5.0.0" },
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { slug: mod.slug },
      update: {},
      create: mod,
    });
  }
  console.log("✅ Modules seeded");

  // ── 7. Tool Definitions ───────────────────────────────────────────────
  const toolDefinitions = [
    // NETWORK tools
    {
      slug: "whois",
      name: "WHOIS Lookup",
      description: "Query domain registration information including registrar, creation/expiry dates, and nameservers.",
      category: "NETWORK" as const,
      icon: "Globe",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "target", label: "Domain or IP", type: "text", required: true }] },
    },
    {
      slug: "dns-lookup",
      name: "DNS Lookup",
      description: "Query DNS records for a domain: A, AAAA, MX, TXT, NS, CNAME.",
      category: "NETWORK" as const,
      icon: "Network",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "target", label: "Domain", type: "text", required: true }, { key: "recordType", label: "Record Type", type: "select", options: ["ALL","A","AAAA","MX","TXT","NS","CNAME"], required: false }] },
    },
    {
      slug: "http-headers",
      name: "HTTP Header Analyzer",
      description: "Fetch and analyze HTTP response headers from any URL.",
      category: "NETWORK" as const,
      icon: "FileCode",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "url", label: "URL", type: "url", required: true }, { key: "method", label: "Method", type: "select", options: ["HEAD","GET"], required: false }] },
    },
    {
      slug: "ssl-checker",
      name: "SSL Certificate Checker",
      description: "Inspect SSL/TLS certificate details: issuer, validity, SANs, and cipher suites.",
      category: "NETWORK" as const,
      icon: "ShieldCheck",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "host", label: "Hostname", type: "text", required: true }, { key: "port", label: "Port", type: "text", required: false }] },
    },
    // ANALYSIS tools
    {
      slug: "tech-detector",
      name: "Technology Stack Detector",
      description: "Detect web technologies, frameworks, CMS, CDN, and analytics tools.",
      category: "ANALYSIS" as const,
      icon: "Layers",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "url", label: "URL", type: "url", required: true }] },
    },
    {
      slug: "security-headers",
      name: "Security Headers Checker",
      description: "Audit HTTP security headers with a graded report (A+ to F).",
      category: "ANALYSIS" as const,
      icon: "ShieldAlert",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "url", label: "URL", type: "url", required: true }] },
    },
    {
      slug: "robots-txt",
      name: "robots.txt Analyzer",
      description: "Fetch and parse a website's robots.txt — disallowed paths, sitemaps, crawl delays.",
      category: "ANALYSIS" as const,
      icon: "Bot",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "url", label: "URL or Domain", type: "url", required: true }] },
    },
    {
      slug: "metadata-viewer",
      name: "Metadata Viewer",
      description: "Extract Open Graph tags, Twitter cards, title, description, and favicon from any URL.",
      category: "ANALYSIS" as const,
      icon: "Tags",
      isNetwork: true,
      isInstant: false,
      inputSchema: { fields: [{ key: "url", label: "URL", type: "url", required: true }] },
    },
    // ENCODING tools
    {
      slug: "base64",
      name: "Base64 Encode / Decode",
      description: "Encode text to Base64 or decode Base64 back to plaintext.",
      category: "ENCODING" as const,
      icon: "Binary",
      isNetwork: false,
      isInstant: true,
      inputSchema: { fields: [{ key: "text", label: "Input Text", type: "textarea", required: true }, { key: "mode", label: "Operation", type: "select", options: ["encode","decode"], required: true }] },
    },
    {
      slug: "hash-generator",
      name: "Hash Generator",
      description: "Generate MD5, SHA-1, SHA-256, SHA-512, and SHA3 hashes for any input.",
      category: "ENCODING" as const,
      icon: "Hash",
      isNetwork: false,
      isInstant: true,
      inputSchema: { fields: [{ key: "text", label: "Input Text", type: "textarea", required: true }, { key: "algorithm", label: "Algorithm", type: "select", options: ["md5","sha1","sha256","sha512","sha3-256","sha3-512"], required: false }] },
    },
    {
      slug: "jwt-decoder",
      name: "JWT Decoder",
      description: "Safely decode and inspect JWT tokens — header, payload, and expiry info.",
      category: "ENCODING" as const,
      icon: "KeyRound",
      isNetwork: false,
      isInstant: true,
      inputSchema: { fields: [{ key: "token", label: "JWT Token", type: "textarea", required: true }] },
    },
  ];

  for (const tool of toolDefinitions) {
    await prisma.toolDefinition.upsert({
      where: { slug: tool.slug },
      update: { name: tool.name, description: tool.description, isEnabled: true },
      create: { ...tool, isEnabled: true },
    });
  }
  console.log(`✅ ${toolDefinitions.length} tool definitions seeded`);

  // ── 8. Lab Definitions ────────────────────────────────────────────────
  const labs = [
    // XSS
    { slug: "xss-reflected", name: "Reflected XSS", description: "Learn how reflected cross-site scripting works by analyzing vulnerable URL parameters.", objective: "Identify and explain a reflected XSS vulnerability.", category: "XSS" as const, difficulty: "BEGINNER" as const, icon: "Code2", xpReward: 10, estimatedMin: 15, isSandboxed: false },
    { slug: "xss-stored", name: "Stored XSS", description: "Explore persistent cross-site scripting when payloads are saved to a database.", objective: "Understand stored XSS mechanics and prevention.", category: "XSS" as const, difficulty: "INTERMEDIATE" as const, icon: "Database", xpReward: 25, estimatedMin: 20, isSandboxed: false },
    { slug: "xss-dom", name: "DOM-Based XSS", description: "Investigate DOM-based XSS occurring entirely in the browser.", objective: "Identify DOM XSS sources and sinks.", category: "XSS" as const, difficulty: "ADVANCED" as const, icon: "Globe", xpReward: 50, estimatedMin: 30, isSandboxed: false },
    // CSRF
    { slug: "csrf-basics", name: "CSRF Fundamentals", description: "Learn how Cross-Site Request Forgery tricks users into submitting malicious requests.", objective: "Understand CSRF mechanics and CSRF tokens.", category: "CSRF" as const, difficulty: "BEGINNER" as const, icon: "RefreshCw", xpReward: 10, estimatedMin: 15, isSandboxed: false },
    // SQLi
    { slug: "sqli-intro", name: "SQL Injection Basics", description: "Understand how SQL injection works by analyzing unsanitized queries.", objective: "Recognize SQLi patterns and parameterized queries.", category: "SQL_INJECTION" as const, difficulty: "INTERMEDIATE" as const, icon: "Database", xpReward: 25, estimatedMin: 25, isSandboxed: false },
    // IDOR
    { slug: "idor-basics", name: "IDOR — Insecure Direct Object Reference", description: "Discover how IDOR lets attackers access other users' data.", objective: "Identify IDOR patterns and access control.", category: "IDOR" as const, difficulty: "BEGINNER" as const, icon: "Fingerprint", xpReward: 10, estimatedMin: 15, isSandboxed: false },
    // Auth
    { slug: "auth-flaws", name: "Authentication Flaws", description: "Examine common authentication vulnerabilities.", objective: "Identify insecure authentication patterns.", category: "AUTHENTICATION" as const, difficulty: "INTERMEDIATE" as const, icon: "Lock", xpReward: 25, estimatedMin: 25, isSandboxed: false },
    // Access Control
    { slug: "broken-access-control", name: "Broken Access Control", description: "Explore the #1 OWASP risk: privilege escalation and forced browsing.", objective: "Understand privilege escalation types.", category: "ACCESS_CONTROL" as const, difficulty: "INTERMEDIATE" as const, icon: "ShieldOff", xpReward: 25, estimatedMin: 25, isSandboxed: false },
    // JWT
    { slug: "jwt-mistakes", name: "JWT Security Mistakes", description: "Analyze common JWT implementation mistakes.", objective: "Understand alg:none attacks and weak secrets.", category: "JWT" as const, difficulty: "INTERMEDIATE" as const, icon: "KeyRound", xpReward: 25, estimatedMin: 25, isSandboxed: false },
    // Rate limiting
    { slug: "rate-limiting", name: "Rate Limiting & Brute Force", description: "Learn why missing rate limits enable brute-force attacks.", objective: "Understand rate limiting strategies.", category: "MISCONFIGURATION" as const, difficulty: "BEGINNER" as const, icon: "Gauge", xpReward: 10, estimatedMin: 15, isSandboxed: false },
    // SSRF (sandboxed)
    { slug: "ssrf-demo", name: "SSRF Sandbox Demo", description: "Server-Side Request Forgery education in an isolated sandbox.", objective: "Understand SSRF impact and allowlist defenses.", category: "SSRF" as const, difficulty: "ADVANCED" as const, icon: "Radar", xpReward: 50, estimatedMin: 30, isSandboxed: true, sandboxImage: "cyberlab/ssrf-lab:1.0" },
    // File upload (sandboxed)
    { slug: "file-upload", name: "Insecure File Upload", description: "Learn how unrestricted file uploads lead to RCE.", objective: "Identify dangerous upload patterns and validation.", category: "FILE_UPLOAD" as const, difficulty: "ADVANCED" as const, icon: "Upload", xpReward: 50, estimatedMin: 30, isSandboxed: true, sandboxImage: "cyberlab/upload-lab:1.0" },
    // Misconfig
    { slug: "security-misconfig", name: "Security Misconfiguration", description: "Identify common security misconfigurations.", objective: "Recognize misconfiguration patterns.", category: "MISCONFIGURATION" as const, difficulty: "BEGINNER" as const, icon: "Settings", xpReward: 10, estimatedMin: 15, isSandboxed: false },
    // OWASP capstone
    { slug: "owasp-top10", name: "OWASP Top 10 Mastery", description: "A capstone assessment covering the OWASP Top 10 (2021).", objective: "Demonstrate comprehensive OWASP knowledge.", category: "OWASP_TOP10" as const, difficulty: "ADVANCED" as const, icon: "Award", xpReward: 50, estimatedMin: 35, isSandboxed: false },
  ];

  for (const lab of labs) {
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: { name: lab.name, description: lab.description, isEnabled: true },
      create: { ...lab, isEnabled: true },
    });
  }
  console.log(`✅ ${labs.length} labs seeded`);

  // ── 9. Achievements ───────────────────────────────────────────────────
  const achievements = [
    { slug: "first-blood", name: "First Blood", description: "Complete your first lab", icon: "Droplet", type: "FIRST_BLOOD" as const, xpReward: 5 },
    { slug: "on-fire", name: "On Fire", description: "Complete 3 labs in one day", icon: "Flame", type: "STREAK" as const, xpReward: 15 },
    { slug: "perfect-score", name: "Perfect Score", description: "Complete a lab with a 100% score", icon: "Target", type: "PERFECT_SCORE" as const, xpReward: 10 },
    { slug: "hint-free", name: "Hint-Free", description: "Complete a lab without using any hints", icon: "Brain", type: "HINT_FREE" as const, xpReward: 10 },
    { slug: "speed-hacker", name: "Speed Hacker", description: "Complete a lab in under 10 minutes", icon: "Zap", type: "SPEED_RUN" as const, xpReward: 10 },
    { slug: "level-up", name: "Rising Star", description: "Reach level 3 (Hacker)", icon: "TrendingUp", type: "LEVEL_UP" as const, xpReward: 20 },
    { slug: "xss-slayer", name: "XSS Slayer", description: "Complete all XSS labs", icon: "Sword", type: "CATEGORY_MASTER" as const, xpReward: 25 },
    { slug: "jwt-jedi", name: "JWT Jedi", description: "Complete all JWT labs", icon: "KeyRound", type: "CATEGORY_MASTER" as const, xpReward: 25 },
    { slug: "sql-sorcerer", name: "SQL Sorcerer", description: "Complete all SQL injection labs", icon: "Database", type: "CATEGORY_MASTER" as const, xpReward: 25 },
    { slug: "completionist", name: "Completionist", description: "Complete all available labs", icon: "Trophy", type: "COMPLETIONIST" as const, xpReward: 100 },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { slug: ach.slug },
      update: { name: ach.name, description: ach.description },
      create: ach,
    });
  }
  console.log(`✅ ${achievements.length} achievements seeded`);

  // ── 10. Learning Paths ────────────────────────────────────────────────
  const learningPaths = [
    { slug: "xss-mastery", name: "XSS Mastery Path", description: "Master all forms of cross-site scripting from reflected to DOM-based.", icon: "Code2", labSlugs: ["xss-reflected", "xss-stored", "xss-dom"] },
    { slug: "injection-attacks", name: "Injection Attacks", description: "Learn SQL injection and related injection vulnerabilities.", icon: "Database", labSlugs: ["sqli-intro", "xss-reflected"] },
    { slug: "access-control-path", name: "Access Control & Auth", description: "Understand authentication, authorization, IDOR, and access control.", icon: "Lock", labSlugs: ["auth-flaws", "idor-basics", "broken-access-control", "jwt-mistakes"] },
    { slug: "owasp-journey", name: "OWASP Top 10 Journey", description: "A complete guided journey through the OWASP Top 10 risks.", icon: "Award", labSlugs: ["broken-access-control", "jwt-mistakes", "sqli-intro", "xss-reflected", "security-misconfig", "ssrf-demo", "owasp-top10"] },
  ];

  for (const path of learningPaths) {
    await prisma.learningPath.upsert({
      where: { slug: path.slug },
      update: { name: path.name, description: path.description, labSlugs: path.labSlugs },
      create: { ...path, isEnabled: true },
    });
  }
  console.log(`✅ ${learningPaths.length} learning paths seeded`);

  // ── 11. UserScore for admin ───────────────────────────────────────────
  await prisma.userScore.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log("\n🎉 Seeding complete!");
  console.log(`   Personal mode — user: admin@cyberlab.local (BYPASS_AUTH=true)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
