# Base stage with pnpm setup
FROM node:20-alpine AS base
RUN npm install -g pnpm@latest
# Configure pnpm for better network handling
RUN pnpm config set fetch-timeout 300000
WORKDIR /app

# Development stage
FROM base AS dev

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with increased timeout
RUN pnpm install --fetch-timeout 300000

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Development command with hot reload
CMD ["pnpm", "run", "dev"]

# Production build stage
FROM base AS builder

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (dev included) and build
RUN pnpm install --frozen-lockfile --fetch-timeout 300000

# Copy the rest of the code
COPY . .

# Build Next.js application
RUN pnpm run build
RUN pnpm prune --production

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/node_modules ./node_modules

# Use non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start application
CMD ["node", "server.js"]

