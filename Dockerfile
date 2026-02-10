# Build stage
FROM node:20-alpine AS builder

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci

# Copy server source code
COPY server/ ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/

# Install production dependencies only
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/server/dist ./server/dist

# Copy client files
COPY client/ ./client/

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app/server

# Start the server
CMD ["node", "dist/index.js"]
