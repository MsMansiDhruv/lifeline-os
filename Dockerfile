# =========================================================
# LIFELINE OS — GOOGLE CLOUD RUN DOCKERFILE
# Multi-stage production build for serverless deployment
# =========================================================

# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build Vite frontend production bundle
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy node_modules and built dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# Expose Cloud Run default port
EXPOSE 8080

# Start server using tsx
CMD ["npx", "tsx", "server.ts"]
