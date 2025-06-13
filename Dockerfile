FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose app port
EXPOSE 3000

# Command to start the app
CMD ["npm", "start"]
