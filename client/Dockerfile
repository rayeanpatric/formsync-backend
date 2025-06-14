# Client Dockerfile for development
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy client files
COPY . .

# Expose port 3001 for client
EXPOSE 3001

# Start the development server
CMD ["npm", "run", "dev"]
