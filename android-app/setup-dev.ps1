#!/usr/bin/env pwsh
# Quick Setup Script für Android Development

param(
    [Parameter(Mandatory=$false)]
    [switch]$InstallDependencies,
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenStudio,
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateEmulator
)

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PRASCO Android Dev Setup              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. Prüfe Voraussetzungen
Write-Host "📋 Prüfe Voraussetzungen..." -ForegroundColor Yellow

$checks = @{
    "Java JDK" = @{
        check = { $env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe") }
        path = $env:JAVA_HOME
    }
    "Android SDK" = @{
        check = { $env:ANDROID_HOME -and (Test-Path "$env:ANDROID_HOME\platform-tools") }
        path = $env:ANDROID_HOME
    }
    "Gradle Wrapper" = @{
        check = { Test-Path "gradlew.bat" }
        path = "gradlew.bat"
    }
}

$allOk = $true

foreach ($check in $checks.GetEnumerator()) {
    $name = $check.Key
    $result = & $check.Value.check
    
    if ($result) {
        Write-Host "  ✓ $name" -ForegroundColor Green
        if ($check.Value.path) {
            Write-Host "    → $($check.Value.path)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  ✗ $name nicht gefunden!" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host "`n⚠ Einige Voraussetzungen fehlen!`n" -ForegroundColor Red
    
    Write-Host "Installationsschritte:" -ForegroundColor Yellow
    Write-Host "1. Android Studio: https://developer.android.com/studio"
    Write-Host "2. Nach Installation Android Studio einmal öffnen"
    Write-Host "3. SDK wird automatisch installiert`n"
    
    if (-not $env:JAVA_HOME) {
        $studioJava = "C:\Program Files\Android\Android Studio\jbr"
        if (Test-Path $studioJava) {
            Write-Host "💡 Android Studio Java gefunden!" -ForegroundColor Green
            Write-Host "   Setze temporär:`n" -ForegroundColor Yellow
            Write-Host '   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"' -ForegroundColor Cyan
        }
    }
    
    if (-not $env:ANDROID_HOME) {
        $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
        if (Test-Path $sdkPath) {
            Write-Host "💡 Android SDK gefunden!" -ForegroundColor Green
            Write-Host "   Setze temporär:`n" -ForegroundColor Yellow
            Write-Host "   `$env:ANDROID_HOME = `"$sdkPath`"" -ForegroundColor Cyan
        }
    }
    
    exit 1
}

Write-Host "`n✓ Alle Voraussetzungen erfüllt!`n" -ForegroundColor Green

# 2. Gradle Sync
Write-Host "🔄 Gradle Dependencies synchronisieren..." -ForegroundColor Yellow

try {
    .\gradlew.bat --version
    Write-Host "✓ Gradle funktioniert`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Gradle Problem: $_`n" -ForegroundColor Red
    exit 1
}

# 3. Android Studio öffnen
if ($OpenStudio) {
    Write-Host "🚀 Öffne Android Studio..." -ForegroundColor Yellow
    
    $studioPaths = @(
        "C:\Program Files\Android\Android Studio\bin\studio64.exe",
        "$env:LOCALAPPDATA\Programs\Android\Android Studio\bin\studio64.exe"
    )
    
    $studioExe = $studioPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($studioExe) {
        Start-Process $studioExe -ArgumentList (Get-Location).Path
        Write-Host "✓ Android Studio geöffnet`n" -ForegroundColor Green
    } else {
        Write-Host "✗ Android Studio nicht gefunden`n" -ForegroundColor Red
    }
}

# 4. Emulator Setup
if ($CreateEmulator) {
    Write-Host "📱 Emulator Setup..." -ForegroundColor Yellow
    
    $avdmanager = Join-Path $env:ANDROID_HOME "cmdline-tools\latest\bin\avdmanager.bat"
    $sdkmanager = Join-Path $env:ANDROID_HOME "cmdline-tools\latest\bin\sdkmanager.bat"
    
    if (Test-Path $avdmanager) {
        # System Image installieren
        Write-Host "  Installiere System Image..." -ForegroundColor Cyan
        & $sdkmanager "system-images;android-34;google_apis;x86_64"
        
        # AVD erstellen
        Write-Host "  Erstelle Emulator..." -ForegroundColor Cyan
        & $avdmanager create avd `
            -n "Prasco_Pixel_6" `
            -k "system-images;android-34;google_apis;x86_64" `
            -d "pixel_6" `
            --force
        
        Write-Host "✓ Emulator erstellt: Prasco_Pixel_6`n" -ForegroundColor Green
    } else {
        Write-Host "⚠ AVD Manager nicht gefunden - erstelle Emulator in Android Studio`n" -ForegroundColor Yellow
    }
}

# 5. Info ausgeben
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✓ Setup abgeschlossen!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Nächste Schritte:`n" -ForegroundColor Yellow

Write-Host "1. App bauen:" -ForegroundColor White
Write-Host "   .\build-app.ps1`n" -ForegroundColor Cyan

Write-Host "2. In Android Studio entwickeln:" -ForegroundColor White
Write-Host "   .\setup-dev.ps1 -OpenStudio`n" -ForegroundColor Cyan

Write-Host "3. Auf Gerät installieren:" -ForegroundColor White
Write-Host "   .\build-app.ps1 -Install`n" -ForegroundColor Cyan

Write-Host "4. Hilfe anzeigen:" -ForegroundColor White
Write-Host "   Get-Help .\build-app.ps1 -Detailed`n" -ForegroundColor Cyan

# Zeige verbundene Geräte
$adb = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
if (Test-Path $adb) {
    Write-Host "📱 Verbundene Geräte:" -ForegroundColor Yellow
    & $adb devices
    Write-Host ""
}

Write-Host "Dokumentation: BUILD-GUIDE.md`n" -ForegroundColor Cyan
