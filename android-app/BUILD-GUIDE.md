# Android App Build Guide

## Voraussetzungen

### 1. Android Studio installieren
- Download: https://developer.android.com/studio
- Installiere Android Studio mit Standard-Komponenten
- Öffne Android Studio mindestens einmal, um SDK zu initialisieren

### 2. Java JDK 17
- Android Studio enthält JDK (unter `jbr` Verzeichnis)
- Oder separat installieren: https://adoptium.net/

### 3. Android SDK
- Wird automatisch von Android Studio installiert
- Benötigt: API Level 26 (min) bis 34 (target)

## Build-Methoden

### Methode 1: PowerShell Script (Empfohlen für CLI)

```powershell
# In PowerShell zum android-app Verzeichnis wechseln
cd c:\Users\chris\prasco\android-app

# Debug APK bauen
.\build-app.ps1

# Release APK bauen
.\build-app.ps1 -BuildType release

# Clean Build
.\build-app.ps1 -Clean

# Bauen und auf Gerät installieren
.\build-app.ps1 -Install

# Android Studio öffnen
.\build-app.ps1 -OpenStudio

# App Bundle für Play Store
.\build-app.ps1 -BuildType release -Bundle

# Alle Optionen kombinieren
.\build-app.ps1 -BuildType both -Clean -Install
```

### Methode 2: Android Studio (Empfohlen für Development)

1. **Projekt öffnen**:
   - Android Studio starten
   - File → Open → `c:\Users\chris\prasco\android-app` auswählen
   - Warten bis Gradle Sync abgeschlossen ist

2. **Build Varianten wählen**:
   - View → Tool Windows → Build Variants
   - Debug oder Release wählen

3. **Bauen**:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Oder: Build → Make Project (Ctrl+F9)

4. **Ausführen**:
   - Gerät/Emulator wählen
   - Run → Run 'app' (Shift+F10)

### Methode 3: Gradle Wrapper direkt

```powershell
cd c:\Users\chris\prasco\android-app

# Debug APK
.\gradlew.bat assembleDebug

# Release APK
.\gradlew.bat assembleRelease

# Debug Bundle
.\gradlew.bat bundleDebug

# Release Bundle
.\gradlew.bat bundleRelease

# Clean
.\gradlew.bat clean

# Installieren
.\gradlew.bat installDebug
```

## Build Outputs

### APK Dateien (für Installation)
```
app/build/outputs/apk/debug/app-debug.apk
app/build/outputs/apk/release/app-release-unsigned.apk
```

### Bundle Dateien (für Play Store)
```
app/build/outputs/bundle/debug/app-debug.aab
app/build/outputs/bundle/release/app-release.aab
```

## Fehlerbehebung

### Problem: "JAVA_HOME nicht gesetzt"

**Lösung 1 - Android Studio JDK verwenden**:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

**Lösung 2 - Systemweit setzen**:
1. Windows-Suche: "Umgebungsvariablen"
2. Neue Variable: `JAVA_HOME`
3. Wert: Pfad zu JDK 17 (z.B. `C:\Program Files\Java\jdk-17`)

### Problem: "SDK nicht gefunden"

**Lösung**:
```powershell
# ANDROID_HOME setzen
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Oder systemweit in Umgebungsvariablen
```

### Problem: "Gradle Build fehlgeschlagen"

**Lösung**:
```powershell
# Clean und Neustart
.\gradlew.bat clean
.\gradlew.bat --stop
.\gradlew.bat assembleDebug --stacktrace
```

### Problem: "Emulator startet nicht"

**Lösung**:
1. Android Studio → Tools → AVD Manager
2. Create Virtual Device
3. Wähle Pixel 6 / API 34
4. Download System Image falls nötig

## APK Signieren (für Release)

### 1. Keystore erstellen

```powershell
keytool -genkey -v -keystore prasco-release.keystore `
  -alias prasco `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

### 2. Build-Config anpassen

In `app/build.gradle.kts` ergänzen:

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("../prasco-release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "prasco"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // ...
        }
    }
}
```

### 3. Mit Keystore bauen

```powershell
$env:KEYSTORE_PASSWORD = "your-password"
$env:KEY_PASSWORD = "your-password"
.\build-app.ps1 -BuildType release
```

## Installation

### Auf physischem Gerät

1. **USB-Debugging aktivieren**:
   - Einstellungen → Über das Telefon
   - 7x auf Build-Nummer tippen
   - Entwickleroptionen → USB-Debugging aktivieren

2. **Gerät verbinden und APK installieren**:
```powershell
# Mit Script
.\build-app.ps1 -BuildType debug -Install

# Oder manuell mit ADB
adb install app\build\outputs\apk\debug\app-debug.apk
```

### Auf Emulator

1. **Emulator starten**:
```powershell
# Emulator auflisten
$env:ANDROID_HOME\emulator\emulator.exe -list-avds

# Emulator starten
$env:ANDROID_HOME\emulator\emulator.exe -avd Pixel_6_API_34
```

2. **APK installieren**:
```powershell
.\build-app.ps1 -Install
```

## Nützliche Befehle

```powershell
# Gradle Version
.\gradlew.bat --version

# Verfügbare Tasks anzeigen
.\gradlew.bat tasks

# Dependencies prüfen
.\gradlew.bat dependencies

# Lint Check
.\gradlew.bat lint

# Tests ausführen
.\gradlew.bat test

# APK Größe analysieren
.\gradlew.bat :app:analyzeDebug

# Build Cache löschen
.\gradlew.bat cleanBuildCache
```

## Performance-Optimierung

### Gradle Daemon konfigurieren

Erstelle/Bearbeite `gradle.properties`:

```properties
# Gradle Performance
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true

# Android
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
```

## Continuous Integration

Für automatisierte Builds kann das Script in CI/CD integriert werden:

```yaml
# GitHub Actions Beispiel
- name: Build Android APK
  run: |
    cd android-app
    .\build-app.ps1 -BuildType release -Clean
  shell: pwsh
```

## Weitere Ressourcen

- [Android Developer Docs](https://developer.android.com)
- [Gradle Build Guide](https://developer.android.com/build)
- [Kotlin für Android](https://kotlinlang.org/docs/android-overview.html)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
