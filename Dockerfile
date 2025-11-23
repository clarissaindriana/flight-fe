# Build stage
FROM node:20 AS build-stage
WORKDIR /app

# Copy package files
COPY package*.json ./

# Build arguments
ARG VITE_API_URL
ARG VITE_BE2_API_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BE2_API_URL=$VITE_BE2_API_URL

# Install dependencies with better error handling
RUN npm ci --prefer-offline --no-audit

# Copy source files
COPY . .

# Create environment file
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production && \
    echo "VITE_BE2_API_URL=$VITE_BE2_API_URL" >> .env.production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production-stage
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost:80 || exit 1
CMD ["nginx", "-g", "daemon off;"]