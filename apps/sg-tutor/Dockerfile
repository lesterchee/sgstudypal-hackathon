# ── Stage 1: Dependencies ─────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app

# Copy root package files for npm workspaces resolution
COPY package.json package-lock.json* ./

# Copy workspace package.json files so npm can resolve the dependency tree
COPY apps/sg-tutor/package.json ./apps/sg-tutor/package.json
COPY packages/core-engine/package.json ./packages/core-engine/package.json
COPY packages/ui-legal/package.json ./packages/ui-legal/package.json
COPY packages/ui-chat/package.json ./packages/ui-chat/package.json
COPY packages/workflows/package.json ./packages/workflows/package.json

RUN npm install --legacy-peer-deps

# ── Stage 2: Builder ──────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app ./

# Copy the entire source tree needed for the build
COPY . .

# Set production environment so Next.js reads .env.production
ENV NODE_ENV=production

# Build the Next.js app (reads .env.production for NEXT_PUBLIC_ vars)
RUN cd apps/sg-tutor && npx next build

# ── Stage 3: Runner ───────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy the standalone output from the builder
COPY --from=builder /app/apps/sg-tutor/.next/standalone ./
COPY --from=builder /app/apps/sg-tutor/public ./apps/sg-tutor/public
COPY --from=builder /app/apps/sg-tutor/.next/static ./apps/sg-tutor/.next/static

EXPOSE 8080
CMD ["node", "apps/sg-tutor/server.js"]
