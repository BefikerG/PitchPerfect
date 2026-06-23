# Stage 1: Build the React app with Node/Vite
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the production bundle
# VITE_API_URL is passed at build time via docker-compose
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve the built files with Nginx (lightweight, no Node needed)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config to handle React Router (SPA) - all routes go to index.html
RUN echo 'server { \
  listen 80; \
  location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
