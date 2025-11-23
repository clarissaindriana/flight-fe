# Production stage only - use pre-built dist from CI
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy pre-built dist from CI artifacts
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost:80 || exit 1
CMD ["nginx", "-g", "daemon off;"]