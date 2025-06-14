# Test & Debug Directory Structure Verification Script
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Test & Debug Directory Structure Verification" -ForegroundColor Green  
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$testDebugPath = Split-Path -Parent $PSScriptRoot
$rootPath = Split-Path -Parent $testDebugPath

Write-Host "🔍 Verifying test-debug directory structure..." -ForegroundColor Yellow
Write-Host "Root Path: $rootPath" -ForegroundColor Gray
Write-Host "Test-Debug Path: $testDebugPath" -ForegroundColor Gray
Write-Host ""

# Check main directories
$directories = @("backend-tests", "frontend-tests", "postman-tests", "setup-scripts")
$allGood = $true

foreach ($dir in $directories) {
    $dirPath = Join-Path $testDebugPath $dir
    if (Test-Path $dirPath) {
        $fileCount = (Get-ChildItem $dirPath -File).Count
        Write-Host "✅ $dir/ ($fileCount files)" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $dir/ (missing)" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "📊 File Count Summary:" -ForegroundColor Yellow

# Count files in each directory
$backendTests = (Get-ChildItem (Join-Path $testDebugPath "backend-tests") -File -ErrorAction SilentlyContinue).Count
$frontendTests = (Get-ChildItem (Join-Path $testDebugPath "frontend-tests") -File -ErrorAction SilentlyContinue).Count  
$postmanTests = (Get-ChildItem (Join-Path $testDebugPath "postman-tests") -File -ErrorAction SilentlyContinue).Count
$setupScripts = (Get-ChildItem (Join-Path $testDebugPath "setup-scripts") -File -ErrorAction SilentlyContinue).Count

Write-Host "   Backend Tests:  $backendTests files" -ForegroundColor Cyan
Write-Host "   Frontend Tests: $frontendTests files" -ForegroundColor Cyan  
Write-Host "   Postman Tests:  $postmanTests files" -ForegroundColor Cyan
Write-Host "   Setup Scripts:  $setupScripts files" -ForegroundColor Cyan

$totalFiles = $backendTests + $frontendTests + $postmanTests + $setupScripts
Write-Host "   Total Files:    $totalFiles files" -ForegroundColor White

Write-Host ""
Write-Host "🧹 Checking root directory cleanup..." -ForegroundColor Yellow

# Check that certain files are NOT in root anymore
$shouldNotExist = @(
    "migrate-response-format.js",
    "setup-fullstack.sh", 
    "setup-fullstack.ps1",
    "setup-fullstack.bat"
)

$cleanRoot = $true
foreach ($file in $shouldNotExist) {
    $filePath = Join-Path $rootPath $file
    if (Test-Path $filePath) {
        Write-Host "❌ $file still in root directory" -ForegroundColor Red
        $cleanRoot = $false
    }
}

if ($cleanRoot) {
    Write-Host "✅ Root directory properly cleaned" -ForegroundColor Green
}

Write-Host ""
if ($allGood -and $cleanRoot) {
    Write-Host "🎉 SUCCESS: Test & debug directory structure is properly organized!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 Usage:" -ForegroundColor White
    Write-Host "   View documentation: Get-Content '$testDebugPath\README.md'" -ForegroundColor Gray
    Write-Host "   Run backend tests:  node test-debug/backend-tests/test-all-connections.js" -ForegroundColor Gray
    Write-Host "   Run Postman tests:  cd test-debug/postman-tests && npm test" -ForegroundColor Gray
}
else {
    Write-Host "❌ ISSUES FOUND: Please review the errors above" -ForegroundColor Red
    exit 1
}

Write-Host ""