# ── deps ── (better-sqlite3 installed without native build: skipped at runtime via DB_ENGINE=node)
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── builder ──
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY next-config.js ./next.config.js
RUN npm run build

# ── runner: node:22 ships the built-in node:sqlite engine ──
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DB_ENGINE=node
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/data ./data
COPY --from=builder /app/styles ./styles
COPY --from=builder /app/styles.css ./styles.css
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js
COPY --from=builder /app/next-config.js ./next.config.js
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm", "start"]
