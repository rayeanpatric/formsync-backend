#!/bin/bash

echo
echo "===================================="
echo "Collaborative Form App - NeonDB & Password Hashing Setup"
echo "===================================="
echo

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "DATABASE_URL=\"postgresql://neondb_owner:npg_jpbF5x0hvQGC@ep-icy-sound-a1q58rky-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require\"" > .env
    echo "PORT=3000" >> .env
    echo "NODE_ENV=development" >> .env
    echo ".env file created with NeonDB connection string"
fi

echo "Installing bcrypt and other dependencies..."
npm install bcrypt
if [ $? -ne 0 ]; then
    echo "Error installing bcrypt"
    exit 1
fi

echo
echo "Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "Error generating Prisma client"
    exit 1
fi

echo
echo "Pushing schema to NeonDB..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "Error pushing schema to database"
    exit 1
fi

echo
echo "Seeding the database with hashed passwords..."
npx prisma db seed
if [ $? -ne 0 ]; then
    echo "Error seeding the database"
    exit 1
fi

echo
echo "===================================="
echo "Setup completed successfully!"
echo
echo "Your application is now configured to use:"
echo "1. NeonDB PostgreSQL database"
echo "2. bcrypt for password hashing"
echo
echo "You can now run the application with:"
echo "npm run dev"
echo "===================================="
