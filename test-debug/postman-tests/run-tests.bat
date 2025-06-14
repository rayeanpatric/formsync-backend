@echo off
REM Collaborative Form App API Test Runner for Windows
REM This script runs the Postman tests using Newman CLI

echo 🚀 Collaborative Form App API Test Runner
echo ==========================================

REM Check if Newman is installed
newman --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Newman CLI not found. Installing...
    npm install -g newman
)

REM Default to local environment
set ENVIRONMENT=local
set BASE_URL=http://localhost:3000

REM Parse command line arguments
:parse_args
if "%1"=="--env" (
    set ENVIRONMENT=%2
    shift
    shift
    goto parse_args
)
if "%1"=="--url" (
    set BASE_URL=%2
    shift
    shift
    goto parse_args
)
if "%1"=="--help" (
    echo Usage: %0 [options]
    echo.
    echo Options:
    echo   --env [local^|production]  Set environment (default: local^)
    echo   --url [URL]              Set custom base URL
    echo   --help                   Show this help message
    echo.
    echo Examples:
    echo   %0                                          # Run tests locally
    echo   %0 --env production                        # Run tests on production
    echo   %0 --url http://localhost:3000            # Run tests on custom URL
    exit /b 0
)
if "%1" NEQ "" (
    echo Unknown option %1
    exit /b 1
)

REM Set production URL if environment is production
if "%ENVIRONMENT%"=="production" (
    set BASE_URL=https://base-backend-try-production.up.railway.app
)

echo 🌍 Environment: %ENVIRONMENT%
echo 🔗 Base URL: %BASE_URL%
echo.

REM Check if server is accessible
echo 🔍 Checking server connectivity...
curl -f -s --connect-timeout 10 "%BASE_URL%/health" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server is accessible
) else (
    echo ❌ Server is not accessible. Please check:
    echo    - Server is running
    echo    - URL is correct: %BASE_URL%
    echo    - Network connectivity
    exit /b 1
)

echo.
echo 🧪 Running API tests...
echo ========================

REM Generate timestamp for report filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%-%HH%%Min%%Sec%"

REM Run Newman with the specified environment
newman run collection.json ^
    -e environment.json ^
    --env-var "baseUrl=%BASE_URL%" ^
    --reporters cli,html ^
    --reporter-html-export "test-report-%timestamp%.html" ^
    --color on ^
    --delay-request 100

REM Check exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ All tests completed successfully!
    echo 📊 Test report saved as HTML file
) else (
    echo.
    echo ❌ Some tests failed. Check the output above for details.
    exit /b 1
)
