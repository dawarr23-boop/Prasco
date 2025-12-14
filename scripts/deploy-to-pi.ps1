# PRASCO Deployment auf Raspberry Pi - Windows PowerShell Skript
# Verwendung: .\deploy-to-pi.ps1 -PiHost "192.168.1.100" -PiUser "pi"

param(
    [Parameter(Mandatory=$true)]
    [string]$PiHost,
    
    [Parameter(Mandatory=$false)]
    [string]$PiUser = "pi",
    
    [Parameter(Mandatory=$false)]
    [string]$RemotePath = "/home/pi/Prasco"
)

Write-Host "🚀 PRASCO Deployment zu Raspberry Pi" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Build ausführen
Write-Host "`n📦 TypeScript kompilieren..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# Dateien für Deployment vorbereiten
$deployFiles = @(
    "dist",
    "views", 
    "css",
    "js",
    "scripts",
    "package.json",
    "package-lock.json",
    ".env.production",
    "index.html"
)

Write-Host "`n📤 Dateien übertragen..." -ForegroundColor Yellow

foreach ($file in $deployFiles) {
    if (Test-Path $file) {
        Write-Host "  Kopiere $file..."
        scp -r $file "${PiUser}@${PiHost}:${RemotePath}/"
    }
}

Write-Host "`n⚙️ Remote-Setup ausführen..." -ForegroundColor Yellow

$remoteCommands = @"
cd $RemotePath
cp .env.production .env 2>/dev/null || true
npm ci --only=production
pm2 restart prasco 2>/dev/null || pm2 start dist/server.js --name prasco
pm2 save
"@

ssh "${PiUser}@${PiHost}" $remoteCommands

Write-Host "`n✅ Deployment abgeschlossen!" -ForegroundColor Green
Write-Host "   Display: http://${PiHost}:3000" -ForegroundColor Cyan
Write-Host "   Admin:   http://${PiHost}:3000/admin" -ForegroundColor Cyan
