# Fullstack Setup Script for Collaborative Form System
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Collaborative Form System - Fullstack Setup" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\package.json")) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "1. Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing root dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing server dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Installing client dependencies..." -ForegroundColor Yellow
Set-Location ../client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing client dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "4. Setting up environment file..." -ForegroundColor Yellow
if (-not (Test-Path ".\server\.env")) {
    if (Test-Path ".\server\.env.example") {
        Copy-Item ".\server\.env.example" ".\server\.env"
        Write-Host "Created .env file from .env.example" -ForegroundColor Green
        Write-Host "Please update the DATABASE_URL in server/.env" -ForegroundColor Yellow
    } else {
        Write-Host "Creating basic .env file..." -ForegroundColor Yellow
        @"
DATABASE_URL="postgresql://user:password@host:port/database"
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:3001
"@ | Set-Content -Path ".\server\.env"
        Write-Host "Created basic .env file. Please update DATABASE_URL." -ForegroundColor Yellow
    }
} else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "5. Generating Prisma client..." -ForegroundColor Yellow
Set-Location server
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error generating Prisma client" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "6. Setting up database..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error setting up database" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL and database connectivity" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "7. Seeding database..." -ForegroundColor Yellow
npx prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error seeding database" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your fullstack application is ready!" -ForegroundColor White
Write-Host ""
Write-Host "To start development:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start individual services:" -ForegroundColor White
Write-Host "  npm run dev:server  (Backend: http://localhost:3000)" -ForegroundColor Cyan
Write-Host "  npm run dev:client  (Frontend: http://localhost:3001)" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start with Docker (includes Redis):" -ForegroundColor White
Write-Host "  docker-compose up --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor White
Write-Host "  Admin: admin@example.com / admin123" -ForegroundColor Yellow
Write-Host "  User:  john@example.com / password123" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Cyan
