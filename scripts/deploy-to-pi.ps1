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

# Führe Remote-Befehle direkt aus
ssh "${PiUser}@${PiHost}" 'cd /home/pi/Prasco && if [ -f .env.production ]; then cp .env.production .env; fi'
ssh "${PiUser}@${PiHost}" 'cd /home/pi/Prasco && npm ci --omit=dev --quiet'

# PM2 prüfen und neu starten
Write-Host "  PM2: Prüfe Status..."
$pm2Check = ssh "${PiUser}@${PiHost}" 'pm2 list | grep -q "prasco.*online" && echo "running" || echo "stopped"'
if ($pm2Check -match 'stopped') {
    Write-Host "  PM2: Starte neuen Prozess..."
    ssh "${PiUser}@${PiHost}" 'cd /home/pi/Prasco && pm2 start dist/server.js --name prasco'
} else {
    Write-Host "  PM2: Restarte bestehenden Prozess..."
    ssh "${PiUser}@${PiHost}" 'cd /home/pi/Prasco && pm2 restart prasco'
}
ssh "${PiUser}@${PiHost}" 'pm2 save'

Write-Host "`n✅ Deployment abgeschlossen!" -ForegroundColor Green
$displayUrl = "http://${PiHost}:3000"
$adminUrl = "http://${PiHost}:3000/admin"
Write-Host "   Display: $displayUrl" -ForegroundColor Cyan
Write-Host "   Admin:   $adminUrl" -ForegroundColor Cyan

