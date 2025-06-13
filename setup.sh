#!/bin/bash

echo
echo "===================================="
echo "Collaborative Form Filling System Setup"
echo "===================================="
echo

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing dependencies"
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
echo "Running database migrations..."
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
    echo "Error running migrations"
    exit 1
fi

echo
echo "Seeding the database..."
npm run prisma:seed
if [ $? -ne 0 ]; then
    echo "Error seeding the database"
    exit 1
fi

echo
echo "===================================="
echo "Setup completed successfully!"
echo
echo "You can now run the application with:"
echo "npm run dev"
echo
echo "Or start with Docker:"
echo "docker-compose up"
echo "===================================="
