# PRASCO Digital Signage - Production Dockerfile
FROM node:20-alpine AS builder

# Build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts
RUN npm rebuild

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine AS production

# LibreOffice + PDF-to-image tools for PowerPoint slide conversion
RUN apk add --no-cache libreoffice poppler-utils font-noto font-noto-cjk ttf-dejavu ttf-freefont

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts
RUN npm rebuild

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy static assets
COPY views ./views
COPY css ./css
COPY js ./js
COPY public ./public

# Create uploads and logs directories
RUN mkdir -p uploads/originals uploads/thumbnails uploads/presentations uploads/temp logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]
