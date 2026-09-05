# ==========================================
# TrainingMania Backend - Production Dockerfile
# ==========================================

# Step 1: Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache openssl python3 make g++

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci
RUN npx prisma generate

# Copy source code
COPY . .

# ==========================================
# Step 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=8000

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Create media directory with appropriate permissions
RUN mkdir -p /app/media/training_pdfs \
             /app/media/training_videos \
             /app/media/training_thumbnails \
             /app/media/verification_images \
             /app/media/nic_images \
             /app/media/temp

EXPOSE 8000

# Entrypoint script: sync DB schema then start server
CMD ["sh", "-c", "npx prisma db push && node src/server.js"]
