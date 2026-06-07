# 🛡️ CyberLab — Personal Security & Bug Bounty Toolkit

> A self-hosted, personal hacking toolkit for bug bounty hunters and penetration testers.  
> No cloud, no login, no SaaS — just launch and hack.

[![NestJS](https://img.shields.io/badge/API-NestJS%2010-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Web-Next.js%2015-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%205-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%2016-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/Lang-TypeScript%205-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/Package-pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

---

## 📸 Screenshots

> Dashboard → Tools → Labs → Findings

| Dashboard | Security Tools | Bug Bounty Labs |
|-----------|---------------|-----------------|
| ![dashboard](docs/screenshots/dashboard.png) | ![tools](docs/screenshots/tools.png) | ![labs](docs/screenshots/labs.png) |

---

## ✨ Features

### 🔧 11 Security Tools (always available, no seed required)
| Tool | Category | Description |
|------|----------|-------------|
| **WHOIS Lookup** | Network | Domain registration, registrar, expiry, nameservers |
| **DNS Lookup** | Network | A, AAAA, MX, TXT, NS, CNAME record queries |
| **HTTP Header Analyzer** | Network | Fetch and inspect all HTTP response headers |
| **SSL Certificate Checker** | Network | TLS cert details, validity, SANs, cipher info |
| **Technology Stack Detector** | Analysis | CMS, frameworks, CDN, analytics detection |
| **Security Headers Checker** | Analysis | Grade your target A+ to F on security headers |
| **robots.txt Analyzer** | Analysis | Disallowed paths, sitemaps, crawl-delay extraction |
| **Metadata Viewer** | Analysis | Open Graph, Twitter Card, title, description, favicon |
| **Base64 Encode/Decode** | Encoding | Instant encode/decode, no network needed |
| **Hash Generator** | Encoding | MD5, SHA-1, SHA-256, SHA-512, SHA3-256, SHA3-512 |
| **JWT Decoder** | Encoding | Inspect header, payload, expiry without secret |

### 🧪 14 Bug Bounty Labs (hands-on practice)
- XSS (Reflected, Stored, DOM-Based)
- CSRF Fundamentals
- SQL Injection Basics
- IDOR — Insecure Direct Object Reference
- Authentication Flaws
- Broken Access Control
- JWT Security Mistakes
- Rate Limiting & Brute Force
- SSRF Demo (sandboxed)
- Insecure File Upload (sandboxed)
- Security Misconfiguration
- OWASP Top 10 Mastery (capstone)

### 📋 Findings & Reports
- Track vulnerabilities discovered during bug bounty/pen test
- Severity levels: Critical / High / Medium / Low
- Generate and export reports

---

## 🚀 Quick Start (Windows)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) — `npm install -g pnpm`

### 1. Clone the repository
```powershell
git clone https://github.com/Alirewa/cyber-toolkit.git
cd cyber-toolkit
```

### 2. Configure environment
```powershell
Copy-Item .env.example .env
# Edit .env if you want to change DB credentials (defaults work out of the box)
```

### 3. Launch everything
```powershell
.\start-local.ps1
```

This single script:
- ✅ Checks Docker, Node.js, pnpm
- ✅ Starts a PostgreSQL 16 container (`cyberlab-db`)
- ✅ Installs all dependencies
- ✅ Runs `prisma db push` + seed (creates local user + tools + labs)
- ✅ Starts API (port `4001`) and Web (port `4000`) in parallel

### 4. Open the dashboard
```
http://localhost:4000
```
No login required — goes straight to the dashboard.

---

## 🏗️ Architecture

```
cyber-toolkit/
├── apps/
│   ├── api/                  # NestJS 10 backend
│   │   ├── src/modules/
│   │   │   ├── tools/        # 11 security tool handlers
│   │   │   ├── labs/         # Bug bounty lab engine
│   │   │   ├── findings/     # Vulnerability tracking
│   │   │   └── reporting/    # Report generation
│   │   └── prisma/           # Schema + seed
│   └── web/                  # Next.js 15 frontend
│       └── src/
│           ├── app/          # App Router pages
│           └── components/   # UI components
└── packages/
    └── types/                # Shared TypeScript types
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 |
| UI | Tailwind CSS + Framer Motion + shadcn/ui |
| State | Zustand v5 + TanStack Query v5 |
| Backend | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 (via Docker) |
| ORM | Prisma 5 |
| Realtime | Socket.IO |
| Monorepo | pnpm workspaces + Turborepo |

### Personal Mode Design
- **No auth**: `BYPASS_AUTH=true` — mock admin user injected at every request
- **No Redis**: In-memory `Map`-based implementation replaces ioredis
- **No queue**: Bull/BullMQ removed — tools execute synchronously
- **No login page**: Root `/` redirects straight to `/dashboard`
- **Single startup**: One PowerShell script starts everything

---

## ⚙️ Configuration

All settings live in `.env` (copied from `.env.example`):

```env
# Personal mode — skip JWT (set false to re-enable auth)
BYPASS_AUTH=true

# Database (Docker container managed by start-local.ps1)
DATABASE_URL=postgresql://cyberlab:devpass123@localhost:5432/cyberlab?schema=public

# Ports
API_PORT=4001
WEB_PORT=4000
```

---

## 🛠️ Development

```powershell
# Start only the database
docker run -d --name cyberlab-db `
  -e POSTGRES_DB=cyberlab `
  -e POSTGRES_USER=cyberlab `
  -e POSTGRES_PASSWORD=devpass123 `
  -p 5432:5432 postgres:16-alpine

# Install deps
pnpm install

# Run migrations + seed
cd apps/api && npx prisma db push && npx prisma db seed

# Start API + Web in dev mode
pnpm dev
```

---

## 📁 Available Scripts

| Script | Description |
|--------|-------------|
| `.\start-local.ps1` | Full startup — DB + API + Web |
| `pnpm dev` | Start API + Web in watch mode |
| `pnpm build` | Build all packages |
| `pnpm --filter @cyberlab/api exec tsc --noEmit` | Type-check API |
| `pnpm --filter @cyberlab/web exec tsc --noEmit` | Type-check Web |

---

## ⚠️ Legal Disclaimer

> This toolkit is intended **exclusively for legal, authorized security testing**.  
> Only test systems you own or have **explicit written permission** to test.  
> The author is not responsible for any misuse of this software.  
> Always comply with applicable laws and the scope defined in bug bounty programs.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built for ethical hackers, bug bounty hunters, and security researchers.
</p>
