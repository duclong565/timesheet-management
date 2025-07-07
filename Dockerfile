# Multi-stage build for NestJS application
FROM node:22.16.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./ # Copy package files from the current directory to the working directory
COPY prisma ./prisma/ # Copy prisma files from the current directory to the working directory

# Install dependencies
RUN npm ci --only=production && npm cache clean --force # Install only production dependencies and clean the cache

# Copy source code
COPY . . # Copy all files from the current directory to the working directory

# Generate Prisma client
RUN npx prisma generate # Generate Prisma client

# Build the application
RUN npm run build # Build the application

# Production stage
FROM node:22.16.0-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init # Install dumb-init for proper signal handling

# Create app user
RUN addgroup -g 1001 -S nodejs # Create app user
RUN adduser -S nestjs -u 1001 # Create app user

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./ # Copy package files from the current directory to the working directory

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force # Install only production dependencies and clean the cache

# Copy built application and prisma
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist # Copy built application from the builder stage to the working directory
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma # Copy prisma files from the builder stage to the working directory
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules # Copy node modules from the builder stage to the working directory

# Generate Prisma client
RUN npx prisma generate

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"] 