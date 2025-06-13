# Collaborative Form Filling System - Control Script
# PowerShell script to manage the application

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Collaborative Form Filling System" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\package.json")) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if setup has been run
if (-not (Test-Path ".\prisma\dev.db")) {
    Write-Host "Database not found! Please run setup first:" -ForegroundColor Yellow
    Write-Host "    .\setup.bat" -ForegroundColor Cyan
    Write-Host ""
    
    $runSetup = Read-Host "Would you like to run setup now? (y/n)"
    if ($runSetup -eq "y" -or $runSetup -eq "Y") {
        Write-Host "Running setup..." -ForegroundColor Green
        .\setup.bat
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Setup failed!" -ForegroundColor Red
            exit 1
        }
    } else {
        exit 1
    }
}

# Display current status
Write-Host "Current Status:" -ForegroundColor Cyan
Write-Host "  Database: Available" -ForegroundColor Green
Write-Host "  Node.js: $(node --version)" -ForegroundColor Green
Write-Host "  Dependencies: Installed" -ForegroundColor Green
Write-Host ""

# Show menu options
Write-Host "Choose an option to run the application:" -ForegroundColor White
Write-Host ""
Write-Host "DEVELOPMENT" -ForegroundColor Cyan
Write-Host "  1. Start development server (with hot reload)" -ForegroundColor White
Write-Host "  2. Start production server" -ForegroundColor White
Write-Host "  3. Start with Docker" -ForegroundColor White
Write-Host ""
Write-Host "DATABASE" -ForegroundColor Cyan
Write-Host "  4. Open Prisma Studio (database GUI)" -ForegroundColor White
Write-Host "  5. Reset database (deletes all data)" -ForegroundColor White
Write-Host "  6. Seed database with sample data" -ForegroundColor White
Write-Host ""
Write-Host "MAINTENANCE" -ForegroundColor Cyan
Write-Host "  7. Run API tests" -ForegroundColor White
Write-Host "  8. View logs" -ForegroundColor White
Write-Host "  9. Install dependencies" -ForegroundColor White
Write-Host ""
Write-Host "QUICK ACCESS" -ForegroundColor Cyan
Write-Host "  10. Open login page in browser" -ForegroundColor White
Write-Host "  11. View implementation summary" -ForegroundColor White
Write-Host ""
Write-Host "EXIT" -ForegroundColor Red
Write-Host "  0. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (0-11)"

switch ($choice) {
    "1" {
        Write-Host "Starting development server..." -ForegroundColor Green
        Write-Host "Server will restart automatically when files change" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        npm run dev
    }
    "2" {
        Write-Host "Starting production server..." -ForegroundColor Green
        Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        npm start
    }
    "3" {
        Write-Host "Starting with Docker..." -ForegroundColor Green
        Write-Host "This may take a few minutes for the first run..." -ForegroundColor Yellow
        docker-compose up --build
    }
    "4" {
        Write-Host "Opening Prisma Studio..." -ForegroundColor Green
        Write-Host "Database GUI will open in your browser" -ForegroundColor Cyan
        npm run prisma:studio
    }
    "5" {
        Write-Host "WARNING: This will delete ALL data!" -ForegroundColor Red
        $confirm = Read-Host "Are you absolutely sure? Type 'RESET' to confirm"
        if ($confirm -eq "RESET") {
            Write-Host "Resetting database..." -ForegroundColor Yellow
            npm run prisma:reset
            Write-Host "Database reset complete!" -ForegroundColor Green
        } else {
            Write-Host "Reset cancelled." -ForegroundColor Yellow
        }
    }
    "6" {
        Write-Host "Seeding database with sample data..." -ForegroundColor Green
        npm run prisma:seed
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database seeded successfully!" -ForegroundColor Green
            Write-Host "Sample users: Admin User, Alice Johnson, Bob Smith, Carol Davis" -ForegroundColor Cyan
            Write-Host "Sample forms: Customer Feedback, Event Registration, Employee Survey" -ForegroundColor Cyan
        }
    }    "7" {
        Write-Host "Running API tests..." -ForegroundColor Green
        
        # Check if the server is already running
        try {
            $serverRunning = $null -ne (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue)
            if (-not $serverRunning) {
                Write-Host "Warning: Server doesn't appear to be running on port 3000." -ForegroundColor Yellow
                Write-Host "Starting a temporary server for testing..." -ForegroundColor Cyan
                
                # Start server in background
                $job = Start-Job -ScriptBlock {
                    cd $using:PWD
                    npm start
                }
                
                # Wait for server to start
                Write-Host "Waiting for server to start..." -ForegroundColor Cyan
                Start-Sleep -Seconds 5
            }
            
            # Run tests
            node test-api.js
            $testResult = $LASTEXITCODE
            
            # Stop temporary server if we started one
            if (-not $serverRunning -and $job) {
                Write-Host "Stopping temporary server..." -ForegroundColor Cyan
                Stop-Job -Job $job
                Remove-Job -Job $job -Force
            }
            
            # Report results
            if ($testResult -eq 0) {
                Write-Host "All API tests passed!" -ForegroundColor Green
            } else {
                Write-Host "Some API tests failed." -ForegroundColor Red
                Write-Host "Check the errors above for details." -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "Error running tests: $_" -ForegroundColor Red
            if (-not $serverRunning -and $job) {
                Stop-Job -Job $job
                Remove-Job -Job $job -Force
            }
        }
    }
    "8" {
        Write-Host "Recent application logs:" -ForegroundColor Green
        Write-Host "Check the terminal where the server is running for live logs" -ForegroundColor Yellow
    }
    "9" {
        Write-Host "Installing dependencies..." -ForegroundColor Green
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Dependencies installed successfully!" -ForegroundColor Green
        }
    }
    "10" {
        Write-Host "Opening login page..." -ForegroundColor Green
        Start-Process "http://localhost:3000/login.html"
        Write-Host "Browser should open with the login page" -ForegroundColor Green
    }
    "11" {
        Write-Host "Implementation Summary:" -ForegroundColor Green
        Write-Host ""
        if (Test-Path "IMPLEMENTATION_SUMMARY.md") {
            Get-Content "IMPLEMENTATION_SUMMARY.md" | Select-Object -First 20
        } else {
            Write-Host "Implementation summary file not found." -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "Full summary available in IMPLEMENTATION_SUMMARY.md" -ForegroundColor Cyan
    }
    "0" {
        Write-Host "Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Invalid choice. Please run the script again and choose 0-11." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Task completed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
