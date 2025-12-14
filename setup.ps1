#!/usr/bin/env pwsh

# PRASCO Development Environment Setup Script
# PowerShell-Skript zum automatischen Setup der Entwicklungsumgebung

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PRASCO Development Environment Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe Node.js Installation
Write-Host "Prüfe Node.js Installation..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js gefunden: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js nicht gefunden! Bitte installiere Node.js 18+ von https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Prüfe npm Installation
Write-Host "Prüfe npm Installation..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "✅ npm gefunden: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Prüfe Docker Installation
Write-Host "Prüfe Docker Installation..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVersion = docker --version
    Write-Host "✅ Docker gefunden: $dockerVersion" -ForegroundColor Green
    $dockerAvailable = $true
} else {
    Write-Host "⚠️  Docker nicht gefunden. Docker ist optional." -ForegroundColor Yellow
    $dockerAvailable = $false
}

# Installiere Dependencies
Write-Host ""
Write-Host "Installiere npm-Dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fehler beim Installieren der Dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installiert" -ForegroundColor Green

# Erstelle .env aus .env.development wenn nicht existiert
Write-Host ""
Write-Host "Prüfe .env Datei..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.development" ".env"
    Write-Host "✅ .env Datei erstellt" -ForegroundColor Green
} else {
    Write-Host "✅ .env Datei existiert bereits" -ForegroundColor Green
}

# Erstelle Verzeichnisse
Write-Host ""
Write-Host "Erstelle benötigte Verzeichnisse..." -ForegroundColor Yellow
@("logs", "uploads", "dist") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "✅ Verzeichnis $_ erstellt" -ForegroundColor Green
    }
}

# Starte Docker-Container wenn Docker verfügbar
if ($dockerAvailable) {
    Write-Host ""
    Write-Host "Starte Docker-Container..." -ForegroundColor Yellow
    
    # Prüfe ob Container bereits laufen
    $runningContainers = docker ps --filter "name=prasco" --format "{{.Names}}"
    
    if ($runningContainers) {
        Write-Host "✅ Docker-Container laufen bereits:" -ForegroundColor Green
        $runningContainers | ForEach-Object { Write-Host "   - $_" -ForegroundColor Cyan }
    } else {
        docker-compose up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker-Container gestartet" -ForegroundColor Green
            
            # Warte auf PostgreSQL
            Write-Host "Warte auf PostgreSQL..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            
            # Prüfe Container-Status
            docker-compose ps
        } else {
            Write-Host "⚠️  Fehler beim Starten der Container" -ForegroundColor Yellow
        }
    }
}

# Kompiliere TypeScript
Write-Host ""
Write-Host "Kompiliere TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript erfolgreich kompiliert" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript-Kompilierung fehlgeschlagen!" -ForegroundColor Red
    exit 1
}

# Abschluss
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ✅ Setup erfolgreich abgeschlossen!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Development-Server starten:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Tests ausführen:" -ForegroundColor White
Write-Host "   npm test" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. API testen:" -ForegroundColor White
Write-Host "   - Display: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Admin:   http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host "   - API:     http://localhost:3000/api" -ForegroundColor Cyan
Write-Host "   - Health:  http://localhost:3000/api/health" -ForegroundColor Cyan
Write-Host ""

if ($dockerAvailable) {
    Write-Host "4. Datenbank-UI (Adminer):" -ForegroundColor White
    Write-Host "   http://localhost:8080" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Weitere Infos: DEV-SETUP.md" -ForegroundColor Yellow
Write-Host ""
