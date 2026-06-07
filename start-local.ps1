# ============================================================
#  CyberLab — Personal Mode Startup Script
#  Usage:  .\start-local.ps1
#  Needs:  Node.js 20+, pnpm, Docker Desktop (for PostgreSQL)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CyberLab  --  Personal Mode Launcher" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Verify prerequisites ─────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js not found. Download from https://nodejs.org" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "[INFO]  pnpm not found — installing globally..." -ForegroundColor Yellow
    npm install -g pnpm
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker not found." -ForegroundColor Red
    Write-Host "        Install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "        (Only needed for the database — free, runs in background)" -ForegroundColor Yellow
    exit 1
}

# ── Start PostgreSQL container ───────────────────────────────
Write-Host "[1/5] Starting PostgreSQL database..." -ForegroundColor Yellow

$dbRunning = docker ps --filter "name=cyberlab-db" --filter "status=running" -q
if ($dbRunning) {
    Write-Host "       PostgreSQL already running." -ForegroundColor Green
} else {
    # Remove stopped container if it exists
    $dbExists = docker ps -a --filter "name=cyberlab-db" -q
    if ($dbExists) {
        docker rm -f cyberlab-db | Out-Null
    }
    docker run -d `
        --name cyberlab-db `
        -e POSTGRES_DB=cyberlab `
        -e POSTGRES_USER=cyberlab `
        -e POSTGRES_PASSWORD=devpass123 `
        -p 5432:5432 `
        postgres:16-alpine | Out-Null

    Write-Host "       Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        $check = docker exec cyberlab-db pg_isready -U cyberlab 2>&1
        if ($check -match "accepting connections") {
            $ready = $true
            break
        }
    }
    if (-not $ready) {
        Write-Host "[ERROR] PostgreSQL did not start in time." -ForegroundColor Red
        exit 1
    }
    Write-Host "       PostgreSQL is ready." -ForegroundColor Green
}

# ── Install dependencies ─────────────────────────────────────
if (-not (Test-Path "node_modules")) {
    Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
    pnpm install
} else {
    Write-Host "[2/5] Dependencies already installed." -ForegroundColor Green
}

# ── Build shared types ───────────────────────────────────────
Write-Host "[3/5] Building shared types..." -ForegroundColor Yellow
pnpm --filter @cyberlab/types run build

# ── Generate Prisma client + push schema ─────────────────────
Write-Host "[4/5] Setting up database schema..." -ForegroundColor Yellow
Set-Location apps\api
npx prisma generate
npx prisma db push --accept-data-loss
Set-Location ..\..

# ── Seed tool definitions ────────────────────────────────────
Write-Host "[5/5] Seeding tool definitions..." -ForegroundColor Yellow
Set-Location apps\api
npx ts-node -r tsconfig-paths/register prisma/seed.ts
Set-Location ..\..

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  CyberLab is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "   Dashboard  ->  http://localhost:4000  " -ForegroundColor Cyan
Write-Host "   API        ->  http://localhost:4001  " -ForegroundColor Cyan
Write-Host ""
Write-Host "  Open http://localhost:4000 in your browser" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop the apps" -ForegroundColor Gray
Write-Host "  (PostgreSQL keeps running in Docker)" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

pnpm dev
