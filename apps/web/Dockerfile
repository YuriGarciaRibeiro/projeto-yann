FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:web

FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/web/package.json ./apps/web/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node --from=builder /app/apps/web/.next ./apps/web/.next
COPY --chown=node:node --from=builder /app/apps/web/public ./apps/web/public
COPY --chown=node:node --from=builder /app/apps/web/src ./apps/web/src
COPY --chown=node:node --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
