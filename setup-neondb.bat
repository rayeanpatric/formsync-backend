@echo off
echo.
echo ====================================
echo Collaborative Form App - NeonDB & Password Hashing Setup
echo ====================================
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file...
    echo DATABASE_URL="postgresql://neondb_owner:npg_jpbF5x0hvQGC@ep-icy-sound-a1q58rky-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" > .env
    echo PORT=3000 >> .env
    echo NODE_ENV=development >> .env
    echo .env file created with NeonDB connection string
)

echo Installing bcrypt and other dependencies...
call npm install bcrypt
if %ERRORLEVEL% neq 0 (
    echo Error installing bcrypt
    exit /b %ERRORLEVEL%
)

echo.
echo Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo Error generating Prisma client
    exit /b %ERRORLEVEL%
)

echo.
echo Pushing schema to NeonDB...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo Error pushing schema to database
    exit /b %ERRORLEVEL%
)

echo.
echo Seeding the database with hashed passwords...
call npx prisma db seed
if %ERRORLEVEL% neq 0 (
    echo Error seeding the database
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================
echo Setup completed successfully!
echo.
echo Your application is now configured to use:
echo 1. NeonDB PostgreSQL database
echo 2. bcrypt for password hashing
echo.
echo You can now run the application with:
echo npm run dev
echo ====================================
