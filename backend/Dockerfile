# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:22-alpine AS builder

# openssl is required by Prisma at generate time
RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependency manifests first — maximises Docker layer cache
COPY package.json package-lock.json ./

# Install all dependencies (devDeps needed for build & prisma generate)
RUN npm ci

# Copy the rest of the source (node_modules excluded via .dockerignore)
COPY . .

# Generate Prisma client to ./generated/prisma (custom output, moduleFormat: cjs)
# prisma generate does NOT connect to DB — inline dummy URL satisfies prisma.config.ts env() loader
RUN DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy" npx prisma generate

# Compile TypeScript → dist/
# Output structure: dist/src/main.js, dist/generated/prisma/...
RUN npm run build


# ============================================================
# Stage 2: Production
# ============================================================
FROM node:22-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Install production dependencies only — clean slate (no stale .prisma/client shim)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled application (includes dist/src/ and dist/generated/)
COPY --from=builder /app/dist ./dist

# Copy Prisma schema — needed if running `npx prisma migrate deploy` pre-startup
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Entry point: dist/src/main.js (rootDir = project root, not src)
CMD ["node", "dist/src/main"]
