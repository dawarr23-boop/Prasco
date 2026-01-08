# ============================================
# PRASCO Production Patch Deployment
# ============================================

# Version aus package.json auslesen
$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
$VERSION = $packageJson.version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRASCO Patch Deployment v$VERSION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PI_HOST = "pi@192.168.2.47"
$PI_PATH = "~/prasco"

# Schritt 1: TypeScript kompilieren
Write-Host "[1/5] Kompiliere TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Fehler beim Kompilieren!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ TypeScript kompiliert" -ForegroundColor Green
Write-Host ""

# Schritt 2: Frontend-Dateien hochladen
Write-Host "[2/5] Lade Frontend-Dateien hoch..." -ForegroundColor Yellow

# CSS
Write-Host "  → css/display.css"
scp css/display.css "${PI_HOST}:${PI_PATH}/css/"

# JavaScript
Write-Host "  → js/display.js"
scp js/display.js "${PI_HOST}:${PI_PATH}/js/"

Write-Host "  → js/admin.js"
scp js/admin.js "${PI_HOST}:${PI_PATH}/js/"

# Views
Write-Host "  → views/admin/dashboard.html"
scp views/admin/dashboard.html "${PI_HOST}:${PI_PATH}/views/admin/"

Write-Host "✓ Frontend-Dateien hochgeladen" -ForegroundColor Green
Write-Host ""

# Schritt 3: Backend (kompiliertes TypeScript) hochladen
Write-Host "[3/5] Lade Backend-Dateien hoch..." -ForegroundColor Yellow
scp -r dist "${PI_HOST}:${PI_PATH}/"
Write-Host "  → package.json (Version $VERSION)"
scp package.json "${PI_HOST}:${PI_PATH}/"
Write-Host "✓ Backend-Dateien hochgeladen" -ForegroundColor Green
Write-Host ""

# Schritt 4: PM2 neu starten
Write-Host "[4/5] Starte Server neu..." -ForegroundColor Yellow
ssh $PI_HOST 'cd ~/prasco && pm2 restart all'
Write-Host "✓ Server neu gestartet" -ForegroundColor Green
Write-Host ""

# Schritt 5: Status prüfen
Write-Host "[5/5] Prüfe Server-Status..." -ForegroundColor Yellow
ssh $PI_HOST 'pm2 status'
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Patch erfolgreich deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Änderungen in diesem Patch:" -ForegroundColor Cyan
Write-Host "  • Presentation Mode Controls (dezente Anzeige + Auto-Hide)" -ForegroundColor White
Write-Host "  • CSP-Header Update (unsafe-inline für scriptSrcAttr)" -ForegroundColor White
Write-Host "  • Drag & Drop Priorität Auto-Update" -ForegroundColor White
Write-Host "  • Sortier-Modi für Beitragsansicht (6 Optionen)" -ForegroundColor White
Write-Host "  • onclick-Handler entfernt (CSP-konform)" -ForegroundColor White
Write-Host ""
Write-Host "Testen Sie:" -ForegroundColor Yellow
Write-Host "  → Admin-Panel: http://192.168.2.47:3000/admin" -ForegroundColor White
Write-Host "  → Display: http://192.168.2.47:3000/public/display.html" -ForegroundColor White
Write-Host "  → Presentation: http://192.168.2.47:3000/public/display.html?mode=presentation" -ForegroundColor White
