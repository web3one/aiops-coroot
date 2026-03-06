# Build stage
FROM docker.fzyun.io/node:22-alpine AS builder

# Install glibc compatibility (needed for Prisma engine)
RUN apk add --no-cache libc6-compat

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ARG NPM_REGISTRY=https://registry.npmjs.org

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with lockfile and explicit retry handling for unstable networks.
RUN npm config set registry "${NPM_REGISTRY}" \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && for attempt in 1 2 3; do \
        npm ci --no-audit --prefer-offline && exit 0; \
        echo "npm ci failed on attempt ${attempt}, retrying..."; \
        npm cache clean --force; \
        sleep $((attempt * 5)); \
    done; \
    exit 1

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Production stage
FROM docker.fzyun.io/node:22-alpine AS runner
WORKDIR /app

# Install glibc compatibility (needed if running Next.js in production mode)
RUN apk add --no-cache libc6-compat

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
