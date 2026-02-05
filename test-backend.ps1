# Quick Test Script - Verify Backend Connection

# Test 1: Check if backend is accessible
Write-Host "Testing backend accessibility..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://hackhub-yyqw.onrender.com" -Method GET -UseBasicParsing
    Write-Host "[OK] Backend is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Backend is not accessible: $_" -ForegroundColor Red
}

# Test 2: Check if /teams endpoint exists (should return 401 without auth)
Write-Host "`nTesting /teams endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://hackhub-yyqw.onrender.com/teams" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] /teams endpoint is accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[OK] /teams endpoint exists (401 Unauthorized - expected without auth token)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "1. Add NEXT_PUBLIC_BACKEND_URL=https://hackhub-yyqw.onrender.com to Vercel"
Write-Host "2. Redeploy your frontend on Vercel"
Write-Host "3. Test creating a team at https://hackhub-pi.vercel.app/"
