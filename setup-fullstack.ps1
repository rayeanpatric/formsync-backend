# Fullstack Setup Script for Collaborative Form System
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Collaborative Form System - Fullstack Setup" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Clear any conflicting environment variables that might interfere
Write-Host "🔧 Clearing any conflicting environment variables..." -ForegroundColor Cyan
$env:DATABASE_URL = $null
$env:PRISMA_SCHEMA_PATH = $null
Write-Host "✅ Environment variables cleared" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
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
        Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Please update the DATABASE_URL in server/.env with your PostgreSQL connection string" -ForegroundColor Yellow
        Write-Host "   Example: postgresql://username:password@hostname:port/database?sslmode=require" -ForegroundColor Gray
    }
    else {
        Write-Host "Creating basic .env file..." -ForegroundColor Yellow
        @"
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
"@ | Set-Content -Path ".\server\.env" -Encoding UTF8
        Write-Host "✅ Created basic .env file" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Please update DATABASE_URL in server/.env before continuing" -ForegroundColor Yellow
        Write-Host "   The current placeholder will not work - you need a real PostgreSQL connection string" -ForegroundColor Red
    }
}
else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
    
    # Check if DATABASE_URL looks like a placeholder
    $envContent = Get-Content ".\server\.env" -Raw
    if ($envContent -match "DATABASE_URL.*username.*password.*hostname") {
        Write-Host "⚠️  WARNING: DATABASE_URL appears to be a placeholder" -ForegroundColor Yellow
        Write-Host "   Please update it with your actual PostgreSQL connection string" -ForegroundColor Yellow
    }
}

# Validate DATABASE_URL before continuing
Write-Host ""
Write-Host "5. Validating database configuration..." -ForegroundColor Yellow
$envPath = Join-Path $PWD "server\.env"
$dbUrl = ""

try {
    $envLines = Get-Content $envPath
    foreach ($line in $envLines) {
        if ($line -match "^DATABASE_URL\s*=\s*(.+)$") {
            $dbUrl = $matches[1].Trim('"')
            break
        }
    }
    
    if ([string]::IsNullOrEmpty($dbUrl) -or $dbUrl -eq "postgresql://username:password@hostname:port/database?sslmode=require") {
        Write-Host "❌ ERROR: DATABASE_URL is not configured" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please edit server/.env and update DATABASE_URL with your PostgreSQL connection string." -ForegroundColor Yellow
        Write-Host "Example for Neon: postgresql://user:pass@ep-example.neon.tech/dbname?sslmode=require" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After updating DATABASE_URL, run this script again." -ForegroundColor Cyan
        exit 1
    }
    elseif (-not $dbUrl.StartsWith("postgresql://") -and -not $dbUrl.StartsWith("postgres://")) {
        Write-Host "❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://" -ForegroundColor Red
        Write-Host "Current value: $dbUrl" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Please update DATABASE_URL in server/.env with a valid PostgreSQL connection string." -ForegroundColor Yellow
        exit 1
    }
    else {
        Write-Host "✅ DATABASE_URL appears to be properly configured" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ ERROR: Could not read or parse server/.env file" -ForegroundColor Red
    exit 1
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
