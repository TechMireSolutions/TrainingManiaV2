# ===================================================
# Stage 1: Build Frontend (React + Vite)
# ===================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY TrainingManiafrontend/package*.json ./
RUN npm ci

COPY TrainingManiafrontend/ ./
RUN npm run build

# ===================================================
# Stage 2: Build Backend & Generate Prisma Client
# ===================================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

RUN apk add --no-cache openssl python3 make g++

COPY TrainingManiaBackend-Node/package*.json ./
COPY TrainingManiaBackend-Node/prisma ./prisma/
RUN npm ci
RUN npx prisma generate

COPY TrainingManiaBackend-Node/ ./

# ===================================================
# Stage 3: Production Runner (Unified Full-Stack)
# ===================================================
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=8000
ENV DATABASE_URL="file:/app/prisma/dev.db"

# Copy backend dependencies, prisma client and source
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/src ./src
COPY --from=backend-builder /app/backend/seed-production-data.js ./seed-production-data.js

# Copy frontend static build into public folder for Express to serve
COPY --from=frontend-builder /app/frontend/dist ./public

# Ensure upload media directories exist
RUN mkdir -p /app/media/training_pdfs \
             /app/media/training_videos \
             /app/media/training_thumbnails \
             /app/media/verification_images \
             /app/media/nic_images \
             /app/media/temp

EXPOSE 8000

# Push DB schema, run initial seed if DB is empty, then start server
CMD ["sh", "-c", "npx prisma db push && node src/server.js"]
