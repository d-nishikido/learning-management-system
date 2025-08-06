FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for development
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    openssl \
    openssl-dev

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for ts-node)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/materials

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/v1/health || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]