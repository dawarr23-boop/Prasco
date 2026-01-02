# PRASCO Android App

Mobile App für das PRASCO Digital Signage System.

## Features

- 📱 **Post-Verwaltung**: Erstellen, Bearbeiten, Löschen von Posts
- 🔐 **Authentifizierung**: JWT-basierte Anmeldung
- 📂 **Kategorien**: Posts kategorisieren
- 🔄 **Offline-Sync**: Lokale Datenbank mit automatischer Synchronisation
- 🎨 **Material Design 3**: Moderne Android UI
- 📷 **Medien-Upload**: Bilder und Videos hochladen (geplant)

## Technologie-Stack

- **Sprache**: Kotlin
- **UI**: Jetpack Compose + Material Design 3
- **Architektur**: MVVM
- **DI**: Hilt/Dagger
- **Netzwerk**: Retrofit + OkHttp
- **Datenbank**: Room (SQLite)
- **Async**: Coroutines + Flow

## Voraussetzungen

- Android Studio Hedgehog (2023.1.1) oder neuer
- JDK 17
- Android SDK 34
- Min. Android 8.0 (API 26)

## Setup

1. **Projekt öffnen**:
   ```bash
   cd android-app
   ```

2. **In Android Studio öffnen**:
   - File → Open → `android-app` Ordner auswählen

3. **Gradle Sync**:
   - Android Studio führt automatisch Gradle Sync aus
   - Falls nicht: File → Sync Project with Gradle Files

4. **API-Konfiguration**:
   - Öffne `app/build.gradle.kts`
   - Passe `API_BASE_URL` an (Standard: `https://10.0.162.110:3000/api/`)

5. **Build & Run**:
   - Wähle ein Gerät/Emulator
   - Klicke "Run" (Shift+F10)

## Ordnerstruktur

```
app/src/main/java/com/prasco/mobile/
├── data/
│   ├── local/          # Room Database, DataStore
│   ├── remote/         # Retrofit API, DTOs
│   ├── repository/     # Repository Pattern
│   └── mapper/         # Data Mapping
├── domain/
│   └── model/          # Business Models
├── ui/
│   ├── auth/           # Login Screen
│   ├── posts/          # Post List & Create
│   ├── navigation/     # Navigation Setup
│   └── theme/          # Material Theme
├── di/                 # Hilt Modules
├── MainActivity.kt
└── PrascoApplication.kt
```

## Konfiguration

### API-Endpunkt ändern

In `app/build.gradle.kts`:
```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://your-server.com/api/\"")
```

### Netzwerk-Sicherheit (Development)

Die App akzeptiert selbst-signierte Zertifikate für Development.  
Konfiguration: `app/src/main/res/xml/network_security_config.xml`

## Aktuelle Features (MVP)

✅ Login mit E-Mail/Passwort  
✅ JWT Token Management  
✅ Post-Liste anzeigen  
✅ Post erstellen (Text)  
✅ Post bearbeiten  
✅ Post löschen  
✅ Kategorien-Auswahl  
✅ Offline-Datenbank  
✅ Pull-to-Refresh  

## Geplante Features

- [ ] Bild-Upload mit Kamera
- [ ] Video-Posts
- [ ] Offline-Sync Worker
- [ ] Push-Benachrichtigungen
- [ ] Post-Vorlagen
- [ ] Erweiterte Filter

## Build Varianten

### Debug Build
```bash
./gradlew assembleDebug
```

### Release Build
```bash
./gradlew assembleRelease
```

## Testing

```bash
# Unit Tests
./gradlew test

# Instrumented Tests (Emulator/Device benötigt)
./gradlew connectedAndroidTest
```

## Deployment

1. **Keystore erstellen** (einmalig):
   ```bash
   keytool -genkey -v -keystore prasco-release.keystore -alias prasco -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Signing konfigurieren**:
   In `app/build.gradle.kts`:
   ```kotlin
   signingConfigs {
       create("release") {
           storeFile = file("path/to/prasco-release.keystore")
           storePassword = "your_password"
           keyAlias = "prasco"
           keyPassword = "your_password"
       }
   }
   ```

3. **Release APK bauen**:
   ```bash
   ./gradlew assembleRelease
   ```
   APK: `app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Gradle Sync Fehler
```bash
./gradlew clean
./gradlew build --refresh-dependencies
```

### SSL Certificate Fehler
- Installiere Serverzertifikat auf Android-Gerät
- Oder aktiviere User Certificates in `network_security_config.xml`

### Datenbank Fehler
```bash
# App-Daten löschen
adb shell pm clear com.prasco.mobile
```

## Lizenz

Proprietary - PRASCO Digital Signage System

## Support

Bei Fragen: [GitHub Issues](https://github.com/dawarr23-boop/Prasco/issues)
