@echo off
setlocal enabledelayedexpansion

REM Fullstack Setup Script for Collaborative Form System (Windows Batch)
echo ============================================
echo Collaborative Form System - Fullstack Setup
echo ============================================
echo.

REM Clear any conflicting environment variables that might interfere
echo 🔧 Clearing any conflicting environment variables...
set DATABASE_URL=
set PRISMA_SCHEMA_PATH=
echo ✅ Environment variables cleared
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found!
    echo Please run this script from the project root directory.
    echo.
    exit /b 1
)

echo 1. Installing root dependencies...
call npm install
if errorlevel 1 (
    echo Error installing root dependencies
    exit /b 1
)

echo.
echo 2. Installing server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo Error installing server dependencies
    exit /b 1
)

echo.
echo 3. Installing client dependencies...
cd ..\client
call npm install
if errorlevel 1 (
    echo Error installing client dependencies
    exit /b 1
)

cd ..

echo.
echo 4. Setting up environment file...
if not exist "server\.env" (
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env"
        echo ✅ Created .env file from .env.example
        echo ⚠️  IMPORTANT: Please update the DATABASE_URL in server\.env with your PostgreSQL connection string
        echo    Example: postgresql://username:password@hostname:port/database?sslmode=require
    ) else (
        echo Creating basic .env file...
        (
            echo # Server Configuration
            echo PORT=3000
            echo NODE_ENV=development
            echo.
            echo # Client Configuration
            echo CLIENT_URL=http://localhost:3001
            echo.
            echo # Database Configuration ^(PostgreSQL^) - UPDATE THIS!
            echo DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
            echo.
            echo # Redis Configuration ^(Optional for local development^)
            echo REDIS_URL=redis://localhost:6379
            echo.
            echo # For production deployment:
            echo # DATABASE_URL=your-neon-or-postgres-url
            echo # REDIS_URL=your-redis-url
            echo # CLIENT_URL=https://your-client-domain.vercel.app
        ) > "server\.env"
        echo ✅ Created basic .env file
        echo ⚠️  IMPORTANT: Please update DATABASE_URL in server\.env before continuing
        echo    The current placeholder will not work - you need a real PostgreSQL connection string
    )
) else (
    echo ✅ .env file already exists
    
    REM Check if DATABASE_URL looks like a placeholder
    findstr /C:"DATABASE_URL.*username.*password.*hostname" "server\.env" >nul
    if not errorlevel 1 (
        echo ⚠️  WARNING: DATABASE_URL appears to be a placeholder
        echo    Please update it with your actual PostgreSQL connection string
    )
)

REM Validate DATABASE_URL before continuing
echo.
echo 5. Validating database configuration...
if exist "server\.env" (
    for /f "tokens=2 delims==" %%a in ('findstr /B "DATABASE_URL" "server\.env"') do set "DATABASE_URL=%%a"
    set "DATABASE_URL=!DATABASE_URL:"=!"
    set "DATABASE_URL=!DATABASE_URL: =!"
    
    if "!DATABASE_URL!"=="" (
        echo ❌ ERROR: DATABASE_URL is not configured
        echo.
        echo Please edit server\.env and update DATABASE_URL with your PostgreSQL connection string.
        echo Example for Neon: postgresql://user:pass@ep-example.neon.tech/dbname?sslmode=require
        echo.
        echo After updating DATABASE_URL, run this script again.
        exit /b 1
    )
    
    if "!DATABASE_URL!"=="postgresql://username:password@hostname:port/database?sslmode=require" (
        echo ❌ ERROR: DATABASE_URL is not configured
        echo.
        echo Please edit server\.env and update DATABASE_URL with your PostgreSQL connection string.
        echo Example for Neon: postgresql://user:pass@ep-example.neon.tech/dbname?sslmode=require
        echo.
        echo After updating DATABASE_URL, run this script again.
        exit /b 1
    )
    
    echo !DATABASE_URL! | findstr /B "postgresql://" >nul
    if errorlevel 1 (
        echo !DATABASE_URL! | findstr /B "postgres://" >nul
        if errorlevel 1 (
            echo ❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://
            echo Current value: !DATABASE_URL!
            echo.
            echo Please update DATABASE_URL in server\.env with a valid PostgreSQL connection string.
            exit /b 1
        )
    )
    
    echo ✅ DATABASE_URL appears to be properly configured
) else (
    echo ❌ ERROR: Could not read server\.env file
    exit /b 1
)

echo.
echo 6. Generating Prisma client...
cd server
call npx prisma generate
if errorlevel 1 (
    echo Error generating Prisma client
    echo Please check your DATABASE_URL in .env file
    exit /b 1
)

echo.
echo 7. Setting up database...
call npx prisma db push
if errorlevel 1 (
    echo Error setting up database
    echo Please check your DATABASE_URL and database connectivity
    exit /b 1
)

echo.
echo 8. Seeding database...
call npx prisma db seed
if errorlevel 1 (
    echo Error seeding database
    exit /b 1
)

cd ..

echo.
echo ====================================
echo Setup completed successfully!
echo.
echo Your fullstack application is ready!
echo.
echo To start development:
echo   npm run dev
echo.
echo To start individual services:
echo   npm run dev:server  ^(Backend: http://localhost:3000^)
echo   npm run dev:client  ^(Frontend: http://localhost:3001^)
echo.
echo To start with Docker ^(includes Redis^):
echo   docker-compose up --build
echo.
echo Demo Accounts:
echo   Admin: admin@example.com / admin123
echo   User:  john@example.com / password123
echo ====================================
