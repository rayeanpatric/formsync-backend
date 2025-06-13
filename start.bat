@echo off
echo ================================
echo Collaborative Form Filling System
echo ================================
echo.

:: Check if dependencies are installed
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

:: Setup database if needed
if not exist "prisma\dev.db" (
    echo Setting up database...
    npx prisma generate
    npx prisma migrate deploy
    npx prisma db seed
)

:: Start the server
echo.
echo ================================
echo Starting the development server...
echo ================================
echo.
echo Open your browser and go to:
echo   http://localhost:3000/login.html
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
