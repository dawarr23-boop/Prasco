# Build Guide

## Voraussetzungen

### Software

- **Android Studio** Hedgehog (2023.1.1) oder neuer
- **JDK 17** (in Android Studio enthalten)
- **Android SDK 34** (API Level 34)
- **Android Build Tools** 34.0.0
- **Gradle 8.5** (wird automatisch via Wrapper heruntergeladen)

### Optional

- **ADB** (Android Debug Bridge) für Geräte-Deployment
- **Node.js** (für PRASCO Server)

## Projekt öffnen

1. Android Studio starten
2. "Open" → Projektverzeichnis auswählen
3. Gradle Sync abwarten (dauert beim ersten Mal ~5 Min)

## Build-Varianten

### Debug Build

```bash
./gradlew assembleDebug
```

**Ausgabe:** `app/build/outputs/apk/debug/app-debug.apk`

Eigenschaften:

- Debuggable
- HTTP Cleartext für alle Domains erlaubt
- WebView Chrome DevTools aktiviert
- Ausführliches Logging

### Release Build

```bash
./gradlew assembleRelease
```

**Ausgabe:** `app/build/outputs/apk/release/app-release.apk`

Eigenschaften:

- Minified (ProGuard/R8)
- HTTP nur für lokale Netzwerke
- Kein Debug-Logging
- Muss signiert werden (siehe Signing)

## Signing

### Debug Keystore

Wird automatisch von Android Studio erstellt (`~/.android/debug.keystore`).

### Release Keystore erstellen

```bash
keytool -genkey -v -keystore prasco-tv-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias prasco-tv
```

Oder mit dem mitgelieferten Script:

```powershell
.\scripts\generate-keystore.ps1
```

### Signing konfigurieren

In `app/build.gradle.kts` (NICHT einchecken!):

```kotlin
signingConfigs {
    create("release") {
        storeFile = file("../prasco-tv-release.jks")
        storePassword = "your-password"
        keyAlias = "prasco-tv"
        keyPassword = "your-key-password"
    }
}
```

**Besser:** Über `local.properties` oder Umgebungsvariablen:

```properties
# local.properties (nicht in Git!)
signing.storeFile=../prasco-tv-release.jks
signing.storePassword=your-password
signing.keyAlias=prasco-tv
signing.keyPassword=your-key-password
```

## Tests

```bash
# Unit Tests
./gradlew test

# alle Tests mit Report
./gradlew test --info

# Instrumentierte Tests (braucht Emulator/Gerät)
./gradlew connectedAndroidTest
```

## ProGuard / R8

Die Release-Build-Konfiguration aktiviert automatisch R8 Minification.
Die Regeln sind in `app/proguard-rules.pro` definiert und schützen:

- Kotlin Coroutines
- Retrofit API Interfaces
- OkHttp
- Gson Model-Klassen
- Room Entities
- JavaScriptBridge (@JavascriptInterface)
- WebView-Klassen

## Bekannte Build-Probleme

### Gradle Sync schlägt fehl

```
Could not resolve com.android.tools.build:gradle:8.2.0
```

**Lösung:** Sicherstellen, dass `google()` und `mavenCentral()` in Repositories sind.

### JDK Version Mismatch

```
Unsupported class file major version 61
```

**Lösung:** JDK 17 in Android Studio konfigurieren:
Settings → Build → Gradle → Gradle JDK → 17

### Out of Memory

```
java.lang.OutOfMemoryError: Java heap space
```

**Lösung:** In `gradle.properties`:

```
org.gradle.jvmargs=-Xmx4096m
```
