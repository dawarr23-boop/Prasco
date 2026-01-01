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
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build fehlgeschlagen!" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}
Write-Host "✓ Build erfolgreich" -ForegroundColor Green

# Dateien für Deployment vorbereiten
$deployFiles = @(
    "dist",
    "views", 
    "css",
    "js",
    "scripts",
    "package.json",
    "package-lock.json",
    ".env.production"
)

Write-Host "`n📤 Dateien übertragen..." -ForegroundColor Yellow

# Erstelle Remote-Verzeichnis falls nicht vorhanden
ssh "${PiUser}@${PiHost}" "mkdir -p ${RemotePath}"

foreach ($file in $deployFiles) {
    if (Test-Path $file) {
        Write-Host "  Kopiere $file..."
        scp -r $file "${PiUser}@${PiHost}:${RemotePath}/"
    } else {
        Write-Host "  ⚠️  $file nicht gefunden, überspringe..." -ForegroundColor Yellow
    }
}

Write-Host "`n⚙️ Remote-Setup ausführen..." -ForegroundColor Yellow

# Verwende bash -c mit einzelnen Befehlen um \r Probleme zu vermeiden
$remoteScript = @"
#!/bin/bash
set -e
cd '$RemotePath'
if [ -f .env.production ]; then
  cp .env.production .env
fi
npm ci --omit=dev --quiet
if pm2 list | grep -q 'prasco.*online'; then
  pm2 restart prasco
else
  pm2 start dist/server.js --name prasco
fi
pm2 save
"@

# Schreibe Script temporär auf dem Pi und führe es aus
$remoteScript | ssh "${PiUser}@${PiHost}" "cat > /tmp/prasco-deploy.sh && chmod +x /tmp/prasco-deploy.sh && bash /tmp/prasco-deploy.sh && rm /tmp/prasco-deploy.sh"

Write-Host "`n✅ Deployment abgeschlossen!" -ForegroundColor Green
Write-Host "   Display: http://${PiHost}:3000" -ForegroundColor Cyan
Write-Host "   Admin:   http://${PiHost}:3000/admin" -ForegroundColor Cyan
