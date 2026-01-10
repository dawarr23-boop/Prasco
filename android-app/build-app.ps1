#!/usr/bin/env pwsh
# PRASCO Android App Build Script
# Erstellt APK und/oder AAB (Android App Bundle)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("debug", "release", "both")]
    [string]$BuildType = "debug",
    
    [Parameter(Mandatory=$false)]
    [switch]$Clean,
    
    [Parameter(Mandatory=$false)]
    [switch]$Install,
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenStudio,
    
    [Parameter(Mandatory=$false)]
    [switch]$Bundle
)

$ErrorActionPreference = "Stop"

# Farben für Output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success {
    Write-ColorOutput Green "✓ $args"
}

function Write-Info {
    Write-ColorOutput Cyan "ℹ $args"
}

function Write-Warning {
    Write-ColorOutput Yellow "⚠ $args"
}

function Write-Error {
    Write-ColorOutput Red "✗ $args"
}

function Write-Header {
    Write-ColorOutput Magenta "`n═══════════════════════════════════════"
    Write-ColorOutput Magenta "  $args"
    Write-ColorOutput Magenta "═══════════════════════════════════════`n"
}

Write-Header "PRASCO Android App Build"

# Prüfe, ob wir im richtigen Verzeichnis sind
if (-not (Test-Path "build.gradle.kts")) {
    Write-Error "build.gradle.kts nicht gefunden!"
    Write-Info "Bitte führe das Skript im android-app Verzeichnis aus."
    exit 1
}

# Prüfe, ob Gradle Wrapper vorhanden ist
if (-not (Test-Path "gradlew.bat")) {
    Write-Error "Gradle Wrapper (gradlew.bat) nicht gefunden!"
    exit 1
}

# Prüfe JAVA_HOME
if (-not $env:JAVA_HOME) {
    Write-Warning "JAVA_HOME ist nicht gesetzt!"
    Write-Info "Versuche Java zu finden..."
    
    # Suche nach Java in typischen Pfaden
    $possibleJavaPaths = @(
        "C:\Program Files\Java\jdk-17*",
        "C:\Program Files\Java\jdk-*",
        "C:\Program Files\Android\Android Studio\jbr",
        "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr"
    )
    
    foreach ($path in $possibleJavaPaths) {
        $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $env:JAVA_HOME = $found.FullName
            Write-Success "Java gefunden: $env:JAVA_HOME"
            break
        }
    }
    
    if (-not $env:JAVA_HOME) {
        Write-Error "Java nicht gefunden! Bitte installiere JDK 17."
        exit 1
    }
}

Write-Info "Java Version:"
& "$env:JAVA_HOME\bin\java.exe" -version

# Android Studio öffnen (optional)
if ($OpenStudio) {
    Write-Info "Öffne Android Studio..."
    
    $studioPath = @(
        "C:\Program Files\Android\Android Studio\bin\studio64.exe",
        "$env:LOCALAPPDATA\Programs\Android\Android Studio\bin\studio64.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($studioPath) {
        Start-Process $studioPath -ArgumentList (Get-Location).Path
        Write-Success "Android Studio geöffnet"
    } else {
        Write-Warning "Android Studio nicht gefunden"
    }
}

# Clean Build (optional)
if ($Clean) {
    Write-Header "Clean Project"
    .\gradlew.bat clean
    Write-Success "Clean abgeschlossen"
}

# Build Tasks
$buildTasks = @()

switch ($BuildType) {
    "debug" {
        if ($Bundle) {
            $buildTasks += "bundleDebug"
        } else {
            $buildTasks += "assembleDebug"
        }
    }
    "release" {
        if ($Bundle) {
            $buildTasks += "bundleRelease"
        } else {
            $buildTasks += "assembleRelease"
        }
    }
    "both" {
        if ($Bundle) {
            $buildTasks += @("bundleDebug", "bundleRelease")
        } else {
            $buildTasks += @("assembleDebug", "assembleRelease")
        }
    }
}

# Build ausführen
foreach ($task in $buildTasks) {
    Write-Header "Building: $task"
    
    try {
        .\gradlew.bat $task --stacktrace
        Write-Success "$task erfolgreich abgeschlossen"
    } catch {
        Write-Error "Build fehlgeschlagen: $_"
        exit 1
    }
}

# Finde generierte Dateien
Write-Header "Build Artefakte"

$apkPath = "app\build\outputs\apk"
$bundlePath = "app\build\outputs\bundle"

if (Test-Path $apkPath) {
    $apks = Get-ChildItem -Path $apkPath -Recurse -Filter "*.apk"
    if ($apks) {
        Write-Success "APK-Dateien gefunden:"
        foreach ($apk in $apks) {
            $size = [math]::Round($apk.Length / 1MB, 2)
            Write-Info "  📦 $($apk.Name) ($size MB)"
            Write-Info "     $($apk.FullName)"
        }
        
        # Neueste APK merken für Installation
        $latestApk = $apks | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    }
}

if (Test-Path $bundlePath) {
    $bundles = Get-ChildItem -Path $bundlePath -Recurse -Filter "*.aab"
    if ($bundles) {
        Write-Success "Bundle-Dateien gefunden:"
        foreach ($bundle in $bundles) {
            $size = [math]::Round($bundle.Length / 1MB, 2)
            Write-Info "  📦 $($bundle.Name) ($size MB)"
            Write-Info "     $($bundle.FullName)"
        }
    }
}

# Installation auf verbundenem Gerät (optional)
if ($Install -and $latestApk) {
    Write-Header "Installation"
    
    # Prüfe, ob ADB verfügbar ist
    $adbPath = $null
    
    if ($env:ANDROID_HOME) {
        $adbPath = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
    }
    
    if (-not $adbPath -or -not (Test-Path $adbPath)) {
        $possibleAdbPaths = @(
            "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
            "C:\Android\sdk\platform-tools\adb.exe"
        )
        
        foreach ($path in $possibleAdbPaths) {
            if (Test-Path $path) {
                $adbPath = $path
                break
            }
        }
    }
    
    if ($adbPath -and (Test-Path $adbPath)) {
        Write-Info "Suche nach verbundenen Geräten..."
        $devices = & $adbPath devices | Select-Object -Skip 1 | Where-Object { $_ -match '\t' }
        
        if ($devices) {
            Write-Success "Gerät gefunden, installiere APK..."
            & $adbPath install -r $latestApk.FullName
            Write-Success "Installation abgeschlossen"
        } else {
            Write-Warning "Kein Android-Gerät verbunden"
            Write-Info "Verbinde ein Gerät oder starte einen Emulator"
        }
    } else {
        Write-Warning "ADB nicht gefunden. APK muss manuell installiert werden."
        Write-Info "APK: $($latestApk.FullName)"
    }
}

# Zusammenfassung
Write-Header "Build Summary"
Write-Success "Build-Typ: $BuildType"
Write-Success "Build erfolgreich abgeschlossen!"

if ($Bundle) {
    Write-Info "Bundle (AAB) wurde erstellt - bereit für Google Play Store"
} else {
    Write-Info "APK wurde erstellt - bereit für Installation"
}

Write-Info "`nNächste Schritte:"
Write-Info "  1. APK auf Gerät installieren: .\build-app.ps1 -Install"
Write-Info "  2. Android Studio öffnen: .\build-app.ps1 -OpenStudio"
Write-Info "  3. Release Build: .\build-app.ps1 -BuildType release"
Write-Info "  4. App Bundle für Play Store: .\build-app.ps1 -BuildType release -Bundle"
