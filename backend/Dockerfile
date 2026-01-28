FROM node:latest AS base

# ---------- deps ----------
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN mkdir prisma
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY prisma/* ./prisma/
RUN npm install -g pnpm \
  && pnpm install --no-frozen-lockfile
RUN npx prisma generate

# ---------- dev ----------
FROM base AS dev
WORKDIR /app
ENV NODE_ENV=development
RUN npm install -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 4000
CMD ["pnpm", "run", "dev"]

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm install -g pnpm && pnpm run build
RUN pnpm prune --prod

# ---------- runner ----------
FROM node:lts-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeuser

COPY --from=deps /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

USER nodeuser
EXPOSE 4000
ENV PORT=4000

ENTRYPOINT ["dumb-init", "/app/entrypoint.sh"]


