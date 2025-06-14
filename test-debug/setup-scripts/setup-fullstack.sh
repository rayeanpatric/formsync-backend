#!/bin/bash

# Fullstack Setup Script for Collaborative Form System (Linux/macOS)
echo "============================================"
echo "Collaborative Form System - Fullstack Setup"
echo "============================================"
echo ""

# Clear any conflicting environment variables that might interfere
echo "🔧 Clearing any conflicting environment variables..."
unset DATABASE_URL
unset PRISMA_SCHEMA_PATH
echo "✅ Environment variables cleared"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the project root directory."
    echo ""
    exit 1
fi

echo "1. Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing root dependencies"
    exit 1
fi

echo ""
echo "2. Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Error installing server dependencies"
    exit 1
fi

echo ""
echo "3. Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "Error installing client dependencies"
    exit 1
fi

cd ..

echo ""
echo "4. Setting up environment file..."
if [ ! -f "./server/.env" ]; then
    if [ -f "./server/.env.example" ]; then
        cp "./server/.env.example" "./server/.env"
        echo "✅ Created .env file from .env.example"
        echo "⚠️  IMPORTANT: Please update the DATABASE_URL in server/.env with your PostgreSQL connection string"
        echo "   Example: postgresql://username:password@hostname:port/database?sslmode=require"
    else
        echo "Creating basic .env file..."
        cat > "./server/.env" << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=development

# Client Configuration  
CLIENT_URL=http://localhost:3001

# Database Configuration (PostgreSQL) - UPDATE THIS!
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require

# Redis Configuration (Optional for local development)
REDIS_URL=redis://localhost:6379

# For production deployment:
# DATABASE_URL=your-neon-or-postgres-url
# REDIS_URL=your-redis-url
# CLIENT_URL=https://your-client-domain.vercel.app
EOF
        echo "✅ Created basic .env file"
        echo "⚠️  IMPORTANT: Please update DATABASE_URL in server/.env before continuing"
        echo "   The current placeholder will not work - you need a real PostgreSQL connection string"
    fi
else
    echo "✅ .env file already exists"
    
    # Check if DATABASE_URL looks like a placeholder
    if grep -q "DATABASE_URL.*username.*password.*hostname" "./server/.env"; then
        echo "⚠️  WARNING: DATABASE_URL appears to be a placeholder"
        echo "   Please update it with your actual PostgreSQL connection string"
    fi
fi

# Validate DATABASE_URL before continuing
echo ""
echo "5. Validating database configuration..."
if [ -f "./server/.env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL" "./server/.env" | cut -d'=' -f2- | tr -d '"' | tr -d ' ')
    
    if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://username:password@hostname:port/database?sslmode=require" ]; then
        echo "❌ ERROR: DATABASE_URL is not configured"
        echo ""
        echo "Please edit server/.env and update DATABASE_URL with your PostgreSQL connection string."
        echo "Example for Neon: postgresql://user:pass@ep-example.neon.tech/dbname?sslmode=require"
        echo ""
        echo "After updating DATABASE_URL, run this script again."
        exit 1
    elif [[ ! "$DATABASE_URL" =~ ^postgresql:// ]] && [[ ! "$DATABASE_URL" =~ ^postgres:// ]]; then
        echo "❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://"
        echo "Current value: $DATABASE_URL"
        echo ""
        echo "Please update DATABASE_URL in server/.env with a valid PostgreSQL connection string."
        exit 1
    else
        echo "✅ DATABASE_URL appears to be properly configured"
    fi
else
    echo "❌ ERROR: Could not read server/.env file"
    exit 1
fi

echo ""
echo "6. Generating Prisma client..."
cd server
npx prisma generate
if [ $? -ne 0 ]; then
    echo "Error generating Prisma client"
    echo "Please check your DATABASE_URL in .env file"
    exit 1
fi

echo ""
echo "7. Setting up database..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "Error setting up database"
    echo "Please check your DATABASE_URL and database connectivity"
    exit 1
fi

echo ""
echo "8. Seeding database..."
npx prisma db seed
if [ $? -ne 0 ]; then
    echo "Error seeding database"
    exit 1
fi

cd ..

echo ""
echo "===================================="
echo "Setup completed successfully!"
echo ""
echo "Your fullstack application is ready!"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "To start individual services:"
echo "  npm run dev:server  (Backend: http://localhost:3000)"
echo "  npm run dev:client  (Frontend: http://localhost:3001)"
echo ""
echo "To start with Docker (includes Redis):"
echo "  docker-compose up --build"
echo ""
echo "Demo Accounts:"
echo "  Admin: admin@example.com / admin123"
echo "  User:  john@example.com / password123"
echo "===================================="
