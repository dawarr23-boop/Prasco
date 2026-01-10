# Android App Build - Schnellreferenz

## 🚀 Schnellstart

```powershell
# Erster Build (interaktiv)
.\quick-build.ps1

# Standard Build
.\build-app.ps1

# Build und sofort installieren
.\build-app.ps1 -Install
```

## 📋 Verfügbare Scripts

| Script | Beschreibung | Verwendung |
|--------|--------------|------------|
| `quick-build.ps1` | Interaktiver erster Build | Für Einsteiger |
| `build-app.ps1` | Hauptbuild-Script | Tägliche Entwicklung |
| `setup-dev.ps1` | Dev-Umgebung prüfen | Einmalig / bei Problemen |

## 🔨 Build-Varianten

### Debug Build (Development)
```powershell
# Schnellste Option
.\build-app.ps1

# Mit Gradle direkt
.\gradlew.bat assembleDebug

# In Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

**Output**: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build (Production)
```powershell
# Mit Script
.\build-app.ps1 -BuildType release

# Mit Gradle
.\gradlew.bat assembleRelease
```

**Output**: `app/build/outputs/apk/release/app-release.apk`

### App Bundle (Play Store)
```powershell
# Debug Bundle
.\build-app.ps1 -Bundle

# Release Bundle
.\build-app.ps1 -BuildType release -Bundle

# Gradle
.\gradlew.bat bundleRelease
```

**Output**: `app/build/outputs/bundle/release/app-release.aab`

## 🛠️ Build-Optionen

### Alle Parameter für build-app.ps1

```powershell
# Build-Typ wählen
-BuildType debug|release|both

# Clean Build
-Clean

# Nach Build auf Gerät installieren
-Install

# Android Studio öffnen
-OpenStudio

# Bundle statt APK erstellen
-Bundle
```

### Kombinationen

```powershell
# Clean Debug Build mit Installation
.\build-app.ps1 -Clean -Install

# Beide Varianten bauen
.\build-app.ps1 -BuildType both

# Release Bundle (Play Store ready)
.\build-app.ps1 -BuildType release -Bundle -Clean

# Alles zusammen
.\build-app.ps1 -BuildType both -Clean -Bundle
```

## 📱 Installation

### Auf verbundenem Gerät
```powershell
# Mit Script
.\build-app.ps1 -Install

# Mit ADB direkt
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Mit Gradle
.\gradlew.bat installDebug
```

### Auf Emulator
```powershell
# Emulator starten
$env:ANDROID_HOME\emulator\emulator.exe -avd Pixel_6_API_34

# APK installieren (in neuem Terminal)
.\build-app.ps1 -Install
```

### Manuell
1. APK auf Gerät kopieren (USB, Cloud, Email)
2. Mit Dateimanager öffnen
3. Installation bestätigen

## 🐛 Fehlerbehebung

### "JAVA_HOME nicht gesetzt"
```powershell
# Android Studio JDK verwenden
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Oder permanent in Windows setzen
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
```

### "SDK nicht gefunden"
```powershell
# Standard-Pfad setzen
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Oder permanent
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```

### Build fehlschlägt
```powershell
# Clean und neu bauen
.\gradlew.bat clean
.\gradlew.bat --stop
.\build-app.ps1 -Clean

# Gradle Cache löschen
.\gradlew.bat cleanBuildCache
```

### Emulator startet nicht
```powershell
# Verfügbare Emulatoren anzeigen
$env:ANDROID_HOME\emulator\emulator.exe -list-avds

# Emulator mit mehr RAM starten
$env:ANDROID_HOME\emulator\emulator.exe -avd Pixel_6_API_34 -memory 4096
```

## 🎯 Typische Workflows

### Tägliche Entwicklung
```powershell
# 1. Code in Android Studio bearbeiten
.\build-app.ps1 -OpenStudio

# 2. Testen auf Gerät
.\build-app.ps1 -Install

# 3. Bei Problemen: Clean Build
.\build-app.ps1 -Clean -Install
```

### Release-Vorbereitung
```powershell
# 1. Clean Build beide Varianten
.\build-app.ps1 -BuildType both -Clean

# 2. Release APK testen
.\build-app.ps1 -BuildType release -Install

# 3. Bundle für Play Store
.\build-app.ps1 -BuildType release -Bundle
```

### Erste Installation
```powershell
# 1. Setup prüfen
.\setup-dev.ps1

# 2. Android Studio öffnen
.\setup-dev.ps1 -OpenStudio

# 3. Ersten Build
.\quick-build.ps1
```

## 📊 Build-Zeiten (ca.)

| Aktion | Erste Build | Nachfolgende |
|--------|-------------|--------------|
| Debug APK | 3-5 Min | 30-60 Sek |
| Release APK | 4-6 Min | 1-2 Min |
| Bundle | 4-6 Min | 1-2 Min |
| Clean Build | +1-2 Min | - |

*Abhängig von Hardware und Gradle Cache*

## 🔗 Nützliche Befehle

```powershell
# Gradle Version
.\gradlew.bat --version

# Verfügbare Tasks
.\gradlew.bat tasks

# Dependencies anzeigen
.\gradlew.bat dependencies

# Lint Check
.\gradlew.bat lint

# Tests
.\gradlew.bat test

# APK Größe analysieren
.\gradlew.bat :app:analyzeDebug

# Verbundene Geräte
adb devices

# App-Logs anzeigen
adb logcat | Select-String "Prasco"
```

## 📚 Weitere Dokumentation

- **[BUILD-GUIDE.md](BUILD-GUIDE.md)** - Ausführliche Build-Anleitung
- **[README.md](README.md)** - Projekt-Übersicht
- **[ANDROID-APP-STATUS.md](ANDROID-APP-STATUS.md)** - Entwicklungsstatus

## 🆘 Hilfe

```powershell
# Script-Hilfe anzeigen
Get-Help .\build-app.ps1 -Detailed
Get-Help .\setup-dev.ps1 -Detailed

# Gradle Hilfe
.\gradlew.bat help
```

## 💡 Tipps

1. **Verwende `-Clean` nur bei Problemen** - verlangsamt Build
2. **Debug für Development** - schneller zu bauen
3. **Release für Testing** - näher an Produktions-App
4. **Bundle für Play Store** - kleinere Download-Größe
5. **Android Studio für Debugging** - bessere Tools

## ⚡ Performance

### Gradle beschleunigen

Erstelle/Bearbeite `gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m
org.gradle.parallel=true
org.gradle.caching=true
kotlin.incremental=true
```

### Build Cache nutzen
```powershell
# Aktiviert standardmäßig
# Bei Problemen löschen:
.\gradlew.bat cleanBuildCache
```

---

**Zuletzt aktualisiert**: Januar 2026  
**PRASCO Version**: 2.0
