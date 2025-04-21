# Use multi-stage build for a smaller final image
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application and build
COPY . .
RUN npm run build

# Final stage
FROM node:18-slim

# Install necessary dependencies for Cloud SQL proxy
RUN apt-get update && apt-get install -y ca-certificates wget && rm -rf /var/lib/apt/lists/*

# Download and install Cloud SQL proxy
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /usr/local/bin/cloud_sql_proxy
RUN chmod +x /usr/local/bin/cloud_sql_proxy

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copy the service account key
COPY brainbanter-sql-key.json /brainbanter-sql-key.json

# Expose the port
ENV PORT=8000
EXPOSE 8000

# Start script that runs both the proxy and the application
COPY deploy.sh /deploy.sh
RUN chmod +x /deploy.sh

CMD ["/deploy.sh"] 