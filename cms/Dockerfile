# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /opt/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies including PostgreSQL driver
RUN npm install --only=production pg && npm cache clean --force

# Copy the rest of the application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S strapi -u 1001

# Set ownership of the app directory
RUN chown -R strapi:nodejs /opt/app
USER strapi

# Build the Strapi admin panel
RUN npm run build

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
