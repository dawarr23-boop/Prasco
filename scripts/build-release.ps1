# PRASCO TV App – Release Build (PowerShell)

param(
    [switch]$Clean,
    [switch]$Sign,
    [string]$KeystorePath = "prasco-tv-release.jks"
)

$ErrorActionPreference = "Stop"

Write-Host "=== PRASCO TV – Release Build ===" -ForegroundColor Cyan

# Clean falls gewünscht
if ($Clean) {
    Write-Host "Cleaning..." -ForegroundColor Yellow
    .\gradlew.bat clean
}

# Release Build
Write-Host "Building Release APK..." -ForegroundColor Green
.\gradlew.bat assembleRelease

$apkPath = "app\build\outputs\apk\release\app-release.apk"
$unsignedApkPath = "app\build\outputs\apk\release\app-release-unsigned.apk"

if (Test-Path $apkPath) {
    $fileInfo = Get-Item $apkPath
    $sizeMb = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host ""
    Write-Host "Build erfolgreich!" -ForegroundColor Green
    Write-Host "APK: $apkPath" -ForegroundColor White
    Write-Host "Größe: ${sizeMb} MB" -ForegroundColor White
} elseif (Test-Path $unsignedApkPath) {
    Write-Host "Unsigned APK erstellt: $unsignedApkPath" -ForegroundColor Yellow
    Write-Host "Zum Signieren: .\scripts\build-release.ps1 -Sign" -ForegroundColor Yellow
} else {
    Write-Host "Build fehlgeschlagen! Keine APK gefunden." -ForegroundColor Red
    exit 1
}
