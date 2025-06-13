# Collaborative Form Filling System - Control Script
# PowerShell script to manage the application

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Collaborative Form Filling System (NeonDB)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\package.json")) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if .env file exists with DATABASE_URL
if (-not (Test-Path ".\.env") -or -not (Get-Content ".\.env" | Select-String "DATABASE_URL")) {
    Write-Host "Database configuration not found in .env file!" -ForegroundColor Red
    Write-Host "Please ensure your .env file contains a valid DATABASE_URL for NeonDB." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if setup has been run by checking if Prisma client exists
if (-not (Test-Path ".\node_modules\@prisma\client")) {
    Write-Host "Prisma client not found! Please run setup first:" -ForegroundColor Yellow
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

# Display menu of options
function Show-Menu {
    Write-Host "Menu Options:" -ForegroundColor Cyan
    Write-Host "------------------------" -ForegroundColor Cyan
    Write-Host "1. Start development server"
    Write-Host "2. Generate Prisma client"
    Write-Host "3. Push schema to database"
    Write-Host "4. Seed database"
    Write-Host "5. Run database tests"
    Write-Host "6. Open Prisma Studio"
    Write-Host "7. Migrate responses from ID to label format"
    Write-Host "Q. Quit"
    Write-Host "------------------------" -ForegroundColor Cyan
    Write-Host ""
}

function Start-DevServer {
    Write-Host "Starting development server..." -ForegroundColor Green
    npm run dev
}

function Generate-PrismaClient {
    Write-Host "Generating Prisma client..." -ForegroundColor Green
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Prisma client generated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error generating Prisma client!" -ForegroundColor Red
    }
}

function Push-Schema {
    Write-Host "Pushing schema to database..." -ForegroundColor Green
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Schema pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error pushing schema!" -ForegroundColor Red
    }
}

function Seed-Database {
    Write-Host "Seeding database..." -ForegroundColor Green
    npx prisma db seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database seeded successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error seeding database!" -ForegroundColor Red
    }
}

function Test-Database {
    Write-Host "Testing database connection..." -ForegroundColor Green
    node test-db-connection.js
}

function Open-PrismaStudio {
    Write-Host "Opening Prisma Studio..." -ForegroundColor Green
    Start-Process -FilePath "npx" -ArgumentList "prisma studio"
}

function Migrate-Responses {
    Write-Host "Migrating responses from ID to label format..." -ForegroundColor Green
    node migrate-response-format.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Responses migrated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error migrating responses!" -ForegroundColor Red
    }
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice"
    Write-Host ""
    
    switch ($choice) {
        "1" { Start-DevServer; break }
        "2" { Generate-PrismaClient; break }
        "3" { Push-Schema; break }
        "4" { Seed-Database; break }
        "5" { Test-Database; break }
        "6" { Open-PrismaStudio; break }
        "7" { Migrate-Responses; break }
        "Q" { exit 0 }
        "q" { exit 0 }
        default { Write-Host "Invalid option. Please try again." -ForegroundColor Yellow }
    }
    
    if ($choice -ne "1" -and $choice -ne "6" -and $choice -ne "q" -and $choice -ne "Q") {
        Write-Host ""
        Read-Host "Press Enter to continue"
        Clear-Host
    }
} while ($true)
