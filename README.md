<div align="center">

<img src="https://img.shields.io/badge/CyberLab-Personal%20Security%20Toolkit-00d4ff?style=for-the-badge&logo=shield&logoColor=black" alt="CyberLab" />

# CyberLab — Personal Bug Bounty & Penetration Testing Toolkit

**Self-hosted security toolkit for bug bounty hunters, pen testers, and ethical hackers.**  
11 hacking tools · 14 interactive labs · Findings tracker · No login · No cloud · One command start

[![Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00d4ff?style=flat-square&logo=github)](https://alirewa.github.io/cyber-toolkit/)
[![NestJS](https://img.shields.io/badge/API-NestJS%2010-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Web-Next.js%2015-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[**Live Demo →**](https://alirewa.github.io/cyber-toolkit/) · [Quick Start](#-quick-start) · [Security Tools](#-11-security-tools) · [Bug Bounty Labs](#-14-bug-bounty-labs)

</div>

---

## What is CyberLab?

CyberLab is a **personal, self-hosted security dashboard** designed for:

- 🎯 **Bug bounty hunters** — recon, header analysis, SSL/cert inspection, JWT decoding
- 🔐 **Penetration testers** — WHOIS, DNS enumeration, tech stack detection, security header grading
- 🧑‍💻 **Security learners** — 14 hands-on labs covering OWASP Top 10, XSS, SQLi, IDOR, SSRF, JWT attacks
- 📋 **Findings management** — track vulnerabilities discovered, set severity, generate reports

**No login. No SaaS fees. No cloud dependency.** Launch on your Windows machine or private server with one PowerShell command.

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| **11 Security Tools** | WHOIS, DNS, SSL, HTTP Headers, Security Headers, Tech Detector, robots.txt, Metadata, Base64, JWT Decoder, Hash Generator |
| **14 Bug Bounty Labs** | XSS (3 types), CSRF, SQLi, IDOR, Auth Flaws, Broken Access Control, JWT Mistakes, Rate Limiting, SSRF, File Upload, OWASP Top 10 capstone |
| **Findings Tracker** | Log vulnerabilities with severity (Critical/High/Medium/Low), notes, and status |
| **Reports** | Generate and export pentest reports from your findings |
| **Personal Mode** | No auth, no multi-user, no JWT login — straight to dashboard |
| **One-Command Start** | `.\start-local.ps1` handles Docker DB + deps + migrations + API + Web |

---

## 🔧 11 Security Tools

> All tools run instantly from your browser against any authorized target.

### Network Reconnaissance
| Tool | Description |
|------|-------------|
| **WHOIS Lookup** | Domain registration, registrar, creation/expiry dates, nameservers, RDAP data |
| **DNS Lookup** | Query A, AAAA, MX, TXT, NS, CNAME records for any domain |
| **HTTP Header Analyzer** | Fetch and inspect all HTTP response headers from any URL |
| **SSL Certificate Checker** | TLS cert validity, issuer, SANs, expiry, cipher suite details |

### Analysis & Fingerprinting
| Tool | Description |
|------|-------------|
| **Technology Stack Detector** | Identify CMS, frameworks, CDN, analytics, server technologies |
| **Security Headers Checker** | Audit security headers with A+ to F grade report (HSTS, CSP, X-Frame-Options…) |
| **robots.txt Analyzer** | Extract disallowed paths, sitemaps, crawl-delay — find hidden endpoints |
| **Metadata Viewer** | Extract Open Graph tags, Twitter cards, title, favicon, and meta description |

### Encoding & Cryptography
| Tool | Description |
|------|-------------|
| **Base64 Encode / Decode** | Instant encode/decode — runs entirely in-browser, no network request |
| **Hash Generator** | MD5, SHA-1, SHA-256, SHA-512, SHA3-256, SHA3-512 hashing |
| **JWT Decoder** | Decode and inspect JWT header, payload, expiry without needing the secret |

---

## 🧪 14 Bug Bounty Labs

Hands-on practice for OWASP Top 10 and common bug bounty vulnerability classes.

| Lab | Difficulty | Category |
|-----|------------|----------|
| Reflected XSS | Beginner | Cross-Site Scripting |
| Stored XSS | Intermediate | Cross-Site Scripting |
| DOM-Based XSS | Advanced | Cross-Site Scripting |
| CSRF Fundamentals | Beginner | Request Forgery |
| SQL Injection Basics | Intermediate | Injection |
| IDOR Basics | Beginner | Access Control |
| Authentication Flaws | Intermediate | Authentication |
| Broken Access Control | Intermediate | OWASP #1 |
| JWT Security Mistakes | Intermediate | Token Security |
| Rate Limiting & Brute Force | Beginner | Misconfiguration |
| SSRF Demo (sandboxed) | Advanced | Server-Side Forgery |
| Insecure File Upload (sandboxed) | Advanced | Remote Code Exec |
| Security Misconfiguration | Beginner | OWASP #5 |
| OWASP Top 10 Mastery | Advanced | Capstone |

Each lab includes: **objective**, **hints**, **step-by-step guidance**, and **XP reward**.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Download |
|------------|---------|
| Docker Desktop | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| Node.js 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | `npm install -g pnpm` |

### 1. Clone

```powershell
git clone https://github.com/Alirewa/cyber-toolkit.git
cd cyber-toolkit
```

### 2. Configure

```powershell
Copy-Item .env.example .env
# Defaults work out of the box — no edits needed
```

### 3. Launch

```powershell
.\start-local.ps1
```

This single script automatically:
- ✅ Verifies Docker, Node.js, pnpm are installed
- ✅ Starts a PostgreSQL 16 Docker container (`cyberlab-db`)
- ✅ Installs all workspace dependencies (`pnpm install`)
- ✅ Runs database migrations (`prisma db push`)
- ✅ Seeds the database (tools, labs, local admin user)
- ✅ Starts API on `http://localhost:4001`
- ✅ Starts Web on `http://localhost:4000`

### 4. Open

```
http://localhost:4000
```

**No login screen.** You land directly on the dashboard.

---

## 🏗️ Architecture

```
cyber-toolkit/
├── apps/
│   ├── api/                    # NestJS 10 — REST API + WebSocket
│   │   ├── src/modules/
│   │   │   ├── tools/          # 11 tool handlers (WHOIS, DNS, SSL…)
│   │   │   ├── labs/           # Lab engine + progress tracking
│   │   │   ├── findings/       # Vulnerability tracker
│   │   │   └── reporting/      # Report generation
│   │   └── prisma/             # Schema (PostgreSQL) + seed
│   └── web/                    # Next.js 15 — App Router frontend
│       └── src/
│           ├── app/            # Route segments (dashboard, admin)
│           └── components/     # UI components (tools, labs, ops)
└── packages/
    ├── types/                  # Shared TypeScript types
    └── ui/                     # Shared UI component library
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15 |
| UI | Tailwind CSS + Framer Motion | latest |
| State | Zustand + TanStack Query | v5 |
| Backend | NestJS + TypeScript | 10 |
| Database | PostgreSQL (via Docker) | 16 |
| ORM | Prisma | 5 |
| Realtime | Socket.IO | latest |
| Monorepo | pnpm workspaces + Turborepo | latest |

### Personal Mode — How It Works

CyberLab is designed to run as a **single-user personal tool**:

- **No auth required** — `BYPASS_AUTH=true` injects a mock admin user at every request
- **No Redis** — replaced with an in-memory `Map` implementation
- **No job queue** — Bull/BullMQ removed; tools execute synchronously
- **No login page** — root `/` redirects directly to `/dashboard`
- **Tools always available** — tool list reads from the in-memory handler registry (no seed required for tool listing)

---

## ⚙️ Configuration

Edit `.env` (copied from `.env.example`) to customize:

```env
# Personal mode — skip JWT authentication
BYPASS_AUTH=true

# Database (managed automatically by start-local.ps1)
DATABASE_URL=postgresql://cyberlab:devpass123@localhost:5432/cyberlab?schema=public

# Ports
API_PORT=4001
NEXT_PUBLIC_API_URL=http://localhost:4001
```

---

## 🛠️ Development Commands

```powershell
# Full startup (recommended)
.\start-local.ps1

# Individual commands
pnpm install                                      # Install all deps
pnpm dev                                          # Start API + Web in watch mode
pnpm build                                        # Build all packages

# Database
cd apps/api
npx prisma db push                                # Apply schema
npx prisma db seed                                # Seed tools, labs, admin user
npx prisma studio                                 # Open DB GUI at localhost:5555

# Type checking
pnpm --filter @cyberlab/api exec tsc --noEmit     # Check API types
pnpm --filter @cyberlab/web exec tsc --noEmit     # Check Web types
```

---

## 📋 What's Included

```
Dashboard
├── Security Tools
│   ├── All Tools (11)
│   ├── Scan History
│   └── Saved Targets
├── Bug Bounty Labs
│   ├── All Labs (14)
│   └── My Progress
├── Findings & Reports
│   ├── Findings (CRUD + severity)
│   └── Reports (generate + export)
├── Settings
│   └── Profile
└── Admin Panel
    ├── Users
    ├── Audit Logs
    └── System Health
```

---

## ⚠️ Legal & Ethical Use

> This toolkit is intended **exclusively for legal, authorized security testing**.
>
> - ✅ Test only systems you **own** or have **explicit written permission** to test
> - ✅ Always respect the scope defined in bug bounty program policies
> - ✅ Follow responsible disclosure practices
> - ❌ Do **not** use on systems without authorization — unauthorized access is illegal
>
> The author is not responsible for any misuse of this software.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built for ethical hackers, bug bounty hunters, and security researchers.

**[Live Demo](https://alirewa.github.io/cyber-toolkit/) · [Report an Issue](https://github.com/Alirewa/cyber-toolkit/issues) · [Star on GitHub ⭐](https://github.com/Alirewa/cyber-toolkit)**

</div>
