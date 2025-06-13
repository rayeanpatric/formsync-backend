@echo off
echo.
echo ====================================
echo Collaborative Form Filling System Setup
echo ====================================
echo.

echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error installing dependencies
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
echo Running database migrations...
call npx prisma migrate dev --name init
if %ERRORLEVEL% neq 0 (
    echo Error running migrations
    exit /b %ERRORLEVEL%
)

echo.
echo Seeding the database...
call npm run prisma:seed
if %ERRORLEVEL% neq 0 (
    echo Error seeding the database
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================
echo Setup completed successfully!
echo.
echo You can now run the application with:
echo npm run dev
echo.
echo Or start with Docker:
echo docker-compose up
echo ====================================
