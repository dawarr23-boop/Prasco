# Quick Start - Erste Android App Build
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  PRASCO Android App - Quick Start Build" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dieses Script fuehrt dich durch den ersten Build der Android App.`n" -ForegroundColor White

# Schritt 1: Voraussetzungen prüfen
Write-Host "[1/4] 🔍 Prüfe Voraussetzungen..." -ForegroundColor Yellow
Write-Host ""

$javaOk = $false
$sdkOk = $false

# Java prüfen
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    Write-Host "  ✓ Java JDK gefunden" -ForegroundColor Green
    & "$env:JAVA_HOME\bin\java.exe" -version 2>&1 | Select-Object -First 1
    $javaOk = $true
} else {
    Write-Host "  ✗ Java JDK nicht gefunden" -ForegroundColor Red
    
    # Versuche Android Studio JDK zu finden
    $studioJdk = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path $studioJdk) {
        Write-Host "  💡 Android Studio JDK gefunden!" -ForegroundColor Green
        Write-Host "  → Setze JAVA_HOME..." -ForegroundColor Cyan
        $env:JAVA_HOME = $studioJdk
        $javaOk = $true
    }
}

# Android SDK prüfen
if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    Write-Host "  ✓ Android SDK gefunden" -ForegroundColor Green
    $sdkOk = $true
} else {
    Write-Host "  ⚠ ANDROID_HOME nicht gesetzt" -ForegroundColor Yellow
    
    # Versuche SDK zu finden
    $defaultSdk = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $defaultSdk) {
        Write-Host "  💡 Android SDK gefunden!" -ForegroundColor Green
        Write-Host "  → Setze ANDROID_HOME..." -ForegroundColor Cyan
        $env:ANDROID_HOME = $defaultSdk
        $sdkOk = $true
    }
}

Write-Host ""

if (-not $javaOk -or -not $sdkOk) {
    Write-Host "❌ Fehlende Voraussetzungen!`n" -ForegroundColor Red
    
    if (-not $javaOk) {
        Write-Host "Java JDK 17 benötigt:" -ForegroundColor Yellow
        Write-Host "  → Android Studio installieren: https://developer.android.com/studio"
        Write-Host "  → Oder JDK 17: https://adoptium.net/`n"
    }
    
    if (-not $sdkOk) {
        Write-Host "Android SDK benötigt:" -ForegroundColor Yellow
        Write-Host "  → Android Studio installieren und einmal öffnen`n"
    }
    
    Write-Host "Tipp: Nach Android Studio Installation:" -ForegroundColor Cyan
    Write-Host '  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"'
    Write-Host '  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"'
    
    exit 1
}

# Schritt 2: Build-Typ wählen
Write-Host "[2/4] 📦 Wähle Build-Typ...`n" -ForegroundColor Yellow

Write-Host "Welchen Build möchtest du erstellen?" -ForegroundColor White
Write-Host "  [1] Debug (für Entwicklung & Testing) - Empfohlen für erste Build"
Write-Host "  [2] Release (für Produktion, benötigt Signatur)"
Write-Host ""

$choice = Read-Host "Deine Wahl (1 oder 2)"

$buildType = if ($choice -eq "2") { "release" } else { "debug" }

Write-Host "  → Build-Typ: $buildType`n" -ForegroundColor Cyan

# Schritt 3: Bauen
Write-Host "[3/4] 🔨 Baue Android App...`n" -ForegroundColor Yellow

if ($buildType -eq "debug") {
    Write-Host "Führe aus: .\gradlew.bat assembleDebug`n" -ForegroundColor Cyan
    .\gradlew.bat assembleDebug --stacktrace
} else {
    Write-Host "Führe aus: .\gradlew.bat assembleRelease`n" -ForegroundColor Cyan
    .\gradlew.bat assembleRelease --stacktrace
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build fehlgeschlagen!`n" -ForegroundColor Red
    Write-Host "Versuche:" -ForegroundColor Yellow
    Write-Host "  1. .\gradlew.bat clean"
    Write-Host "  2. .\gradlew.bat assembleDebug --stacktrace`n"
    exit 1
}

# Schritt 4: Ergebnis
Write-Host "`n[4/4] ✅ Build erfolgreich!`n" -ForegroundColor Yellow

$apkPath = "app\build\outputs\apk\$buildType"
$apkFile = Get-ChildItem -Path $apkPath -Filter "*.apk" | Select-Object -First 1

if ($apkFile) {
    $size = [math]::Round($apkFile.Length / 1MB, 2)
    
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "  APK erfolgreich erstellt!" -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Datei: $($apkFile.Name)" -ForegroundColor White
    Write-Host "Größe: $size MB" -ForegroundColor White
    Write-Host "Pfad:  $($apkFile.FullName)`n" -ForegroundColor Gray
    
    # Installation anbieten
    Write-Host "Möchtest du die APK jetzt auf einem verbundenen Gerät installieren? (j/n)" -ForegroundColor Yellow
    $install = Read-Host
    
    if ($install -eq "j" -or $install -eq "J" -or $install -eq "y") {
        $adbPath = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
        
        if (Test-Path $adbPath) {
            Write-Host "`nSuche nach Geräten..." -ForegroundColor Cyan
            & $adbPath devices
            
            $devices = & $adbPath devices | Select-Object -Skip 1 | Where-Object { $_ -match '\t' }
            
            if ($devices) {
                Write-Host "`nInstalliere APK..." -ForegroundColor Cyan
                & $adbPath install -r $apkFile.FullName
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "`n✓ Installation erfolgreich!`n" -ForegroundColor Green
                } else {
                    Write-Host "`n✗ Installation fehlgeschlagen`n" -ForegroundColor Red
                }
            } else {
                Write-Host "`n⚠ Kein Gerät verbunden" -ForegroundColor Yellow
                Write-Host "Verbinde ein Android-Gerät per USB oder starte einen Emulator.`n"
            }
        } else {
            Write-Host "ADB nicht gefunden. Installiere APK manuell.`n" -ForegroundColor Yellow
        }
    }
    
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "`nNaechste Schritte:`n" -ForegroundColor Yellow
    
    Write-Host "APK manuell installieren:" -ForegroundColor White
    Write-Host "   1. APK auf Android-Gerät kopieren"
    Write-Host "   2. Mit Dateimanager öffnen und installieren`n"
    
    Write-Host "Weitere Builds:" -ForegroundColor White
    Write-Host "   .\build-app.ps1                    -> Standard Debug Build"
    Write-Host "   .\build-app.ps1 -Install           -> Bauen und Installieren"
    Write-Host "   .\build-app.ps1 -BuildType release -> Release Build`n"
    
    Write-Host "In Android Studio entwickeln:" -ForegroundColor White
    Write-Host "   .\build-app.ps1 -OpenStudio`n"
    
    Write-Host "Vollstaendige Dokumentation:" -ForegroundColor White
    Write-Host "   BUILD-GUIDE.md`n"
    
} else {
    Write-Host "APK nicht gefunden im erwarteten Pfad`n" -ForegroundColor Yellow
}

Write-Host "=========================================================`n" -ForegroundColor Cyan
