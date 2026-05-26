# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first — maximises Docker layer cache
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy source (node_modules excluded via .dockerignore)
COPY . .

# Build static assets → dist/
RUN npm run build


# ============================================================
# Stage 2: Production
# ============================================================
FROM nginx:alpine AS production

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA routing + caching + security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
