# Use Node.js LTS version
FROM node:20-alpine

# Install security updates
RUN apk update && apk upgrade

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Build the application
RUN npm run start:build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PUBLIC_PATH="/"

# Run as non-root user
USER node

# Start the server
CMD ["npm", "run", "start:server"]
