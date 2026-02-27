# PRASCO TV App – Release Keystore generieren (PowerShell)

param(
    [string]$KeystorePath = "prasco-tv-release.jks",
    [string]$Alias = "prasco-tv"
)

$ErrorActionPreference = "Stop"

Write-Host "=== PRASCO TV – Keystore Generator ===" -ForegroundColor Cyan

if (Test-Path $KeystorePath) {
    Write-Host "Keystore existiert bereits: $KeystorePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Überschreiben? (j/n)"
    if ($overwrite -ne "j") {
        Write-Host "Abgebrochen." -ForegroundColor Yellow
        exit 0
    }
    Remove-Item $KeystorePath
}

Write-Host "Erstelle Release Keystore..." -ForegroundColor Green
Write-Host "Bitte folgende Informationen eingeben:" -ForegroundColor Yellow

keytool -genkey -v `
    -keystore $KeystorePath `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -alias $Alias

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Keystore erfolgreich erstellt: $KeystorePath" -ForegroundColor Green
    Write-Host ""
    Write-Host "WICHTIG: Keystore NICHT in Git einchecken!" -ForegroundColor Red
    Write-Host "Konfiguration in local.properties:" -ForegroundColor Yellow
    Write-Host "  signing.storeFile=../$KeystorePath"
    Write-Host "  signing.storePassword=<dein-passwort>"
    Write-Host "  signing.keyAlias=$Alias"
    Write-Host "  signing.keyPassword=<dein-key-passwort>"
} else {
    Write-Host "Keystore-Erstellung fehlgeschlagen!" -ForegroundColor Red
    exit 1
}
