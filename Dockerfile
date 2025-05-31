# Use multi-stage build for a smaller final image
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Copy the rest of the application and build
COPY . .
RUN npm run build

# Final stage
FROM node:18-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Expose the port
ENV PORT=8000
EXPOSE 8000

# Generate Prisma client and start the application
CMD ["sh", "-c", "npx prisma generate && node build/server.js"] 