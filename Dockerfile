# Multi-stage production build for Waves Cash Drawer
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build the frontend (compiles to dist/)
RUN npm run build

# Production runtime image
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5174

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.js ./server.js

EXPOSE 5174

CMD ["npm", "start"]
