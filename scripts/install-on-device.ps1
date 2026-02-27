# PRASCO TV App – Auf Gerät installieren (PowerShell)
# Voraussetzung: ADB muss im PATH sein

param(
    [string]$DeviceIp,
    [string]$ApkPath = "app\build\outputs\apk\debug\app-debug.apk",
    [switch]$Release
)

$ErrorActionPreference = "Stop"

Write-Host "=== PRASCO TV – Install on Device ===" -ForegroundColor Cyan

# Release APK verwenden falls angegeben
if ($Release) {
    $ApkPath = "app\build\outputs\apk\release\app-release.apk"
}

# Prüfe ob APK existiert
if (-not (Test-Path $ApkPath)) {
    Write-Host "APK nicht gefunden: $ApkPath" -ForegroundColor Red
    Write-Host "Bitte zuerst bauen: ./gradlew assembleDebug" -ForegroundColor Yellow
    exit 1
}

# WLAN-Verbindung falls IP angegeben
if ($DeviceIp) {
    Write-Host "Verbinde mit $DeviceIp..." -ForegroundColor Yellow
    adb connect "${DeviceIp}:5555"
    Start-Sleep -Seconds 2
}

# Prüfe Geräte-Verbindung
$devices = adb devices | Select-String "device$"
if (-not $devices) {
    Write-Host "Kein Gerät gefunden!" -ForegroundColor Red
    Write-Host "Bitte per USB verbinden oder IP angeben: .\install-on-device.ps1 -DeviceIp 192.168.1.50" -ForegroundColor Yellow
    exit 1
}

Write-Host "Gerät gefunden. Installiere APK..." -ForegroundColor Green

# Installieren
adb install -r $ApkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Installation erfolgreich!" -ForegroundColor Green

    # App starten
    Write-Host "Starte PRASCO TV..." -ForegroundColor Yellow
    adb shell am start -n net.prasco.tv/.MainActivity

    Write-Host "Fertig!" -ForegroundColor Green
} else {
    Write-Host "Installation fehlgeschlagen!" -ForegroundColor Red
    exit 1
}
