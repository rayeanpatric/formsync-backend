# Collaborative Form App - NeonDB & Password Hashing Setup PowerShell Script

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Collaborative Form App - NeonDB & Password Hashing Setup" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".\.env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
DATABASE_URL="postgresql://neondb_owner:npg_jpbF5x0hvQGC@ep-icy-sound-a1q58rky-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
PORT=3000
NODE_ENV=development
"@ | Set-Content -Path ".\.env"
    Write-Host ".env file created with NeonDB connection string" -ForegroundColor Green
}

Write-Host "Installing bcrypt and other dependencies..." -ForegroundColor Yellow
npm install bcrypt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing bcrypt" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error generating Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pushing schema to NeonDB..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pushing schema to database" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Seeding the database with hashed passwords..." -ForegroundColor Yellow
npx prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error seeding the database" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is now configured to use:" -ForegroundColor White
Write-Host "1. NeonDB PostgreSQL database" -ForegroundColor White
Write-Host "2. bcrypt for password hashing" -ForegroundColor White
Write-Host ""
Write-Host "You can now run the application with:" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
