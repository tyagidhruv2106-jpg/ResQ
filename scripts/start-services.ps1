# ==============================================================================
# ResQ — PowerShell Multi-Window Service Launcher
# Starts all backend microservices and the Vite frontend in dedicated windows.
# ==============================================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  ResQ Emergency Animal Rescue Coordination Platform  " -ForegroundColor White
Write-Host "======================================================" -ForegroundColor Cyan

$root = (Get-Location).Path

Write-Host "Checking Docker Containers..." -ForegroundColor Yellow
docker compose ps

Write-Host "`nLaunching Microservices..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$root'; node services/auth-service/src/index.js"
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$root'; node services/report-service/src/index.js"
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$root'; node services/organization-service/src/index.js"
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$root'; node services/notification-service/src/index.js"
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$root'; node services/api-gateway/src/index.js"

Write-Host "`nLaunching Vite Ethereal Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$root/frontend'; npm run dev"

Write-Host "`nAll systems launched successfully!" -ForegroundColor Cyan
Write-Host "  👉 Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "  👉 API Gateway:  http://localhost:8000" -ForegroundColor White
Write-Host "  👉 RabbitMQ UI:  http://localhost:15672" -ForegroundColor White

