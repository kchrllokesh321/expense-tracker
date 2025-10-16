# Multi-stage Dockerfile for building the Vite React app and serving it with nginx

# 1) Build stage
FROM node:20-alpine as builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY bun.lockb ./
RUN npm ci --production=false || npm install

# Copy source and build
COPY . /app
RUN npm run build

# 2) Production image with nginx
FROM nginx:stable-alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (if present) to provide SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx in foreground
CMD ["/usr/sbin/nginx", "-g", "daemon off;"]
