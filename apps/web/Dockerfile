# ─── Stage 1: Base ───────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

# ─── Stage 2: Dependencies ───────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
# Copy workspace packages needed for build
COPY ../../packages/ui/package.json ../../packages/ui/
COPY ../../packages/types/package.json ../../packages/types/
COPY ../../packages/config/package.json ../../packages/config/
RUN pnpm install --frozen-lockfile

# ─── Stage 3: Development ────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# ─── Stage 4: Builder ────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Copy workspace packages
COPY ../../packages ./../../packages
RUN pnpm run build

# ─── Stage 5: Production ─────────────────────────────────────────────
FROM node:22-alpine AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q -O - http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
