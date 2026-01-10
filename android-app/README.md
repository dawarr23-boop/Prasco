# PRASCO Android Display App

Dieses Verzeichnis enthält alle notwendigen Dateien für die Android-App-Version des PRASCO Display.

## 🚀 Schnellstart

### Option 1: Komplettes Android Studio Projekt verwenden

Die Dateien in diesem Verzeichnis können in ein neues Android Studio Projekt kopiert werden:

1. Android Studio öffnen → "New Project" → "Empty Activity"
2. Name: `PrascoDisplay`
3. Package: `net.prasco.display`
4. Language: Kotlin (oder Java)
5. Minimum SDK: API 24 (Android 7.0)
6. Dateien aus diesem Verzeichnis ins Projekt kopieren

### Option 2: Gradle-Projekt von Grund auf

Siehe [ANDROID-APP.md](../ANDROID-APP.md) für die komplette Anleitung.

## 📁 Dateistruktur

```
android-app/
├── README.md                           # Diese Datei
├── AndroidManifest.xml                 # App-Manifest mit Berechtigungen
├── MainActivity.kt                     # Kotlin Hauptactivity
├── MainActivity.java                   # Java Hauptactivity (Alternative)
├── build.gradle                        # Gradle Build-Konfiguration
├── strings.xml                         # App-Strings und Texte
├── settings-activity/                  # Optional: Settings für URL-Konfiguration
│   ├── SettingsActivity.kt
│   └── activity_settings.xml
└── boot-receiver/                      # Optional: Auto-Start beim Booten
    └── BootReceiver.kt
```

## ⚙️ Konfiguration

### Server-URL ändern

Editiere die SERVER_URL in `MainActivity.kt` oder `MainActivity.java`:

```kotlin
private val SERVER_URL = "http://192.168.1.100:3000"  // Deine PRASCO Server-IP
```

### App-Name und Icon ändern

- **App-Name**: Editiere `strings.xml`
- **App-Icon**: Ersetze Icons in `res/mipmap-*/`

## 🔨 Build-Befehle

```bash
# Debug-Version bauen
./gradlew assembleDebug

# Release-Version bauen (signiert)
./gradlew assembleRelease

# Direkt installieren
./gradlew installDebug

# Tests ausführen
./gradlew test
```

## 📦 APK Ausgabe

- **Debug**: `app/build/outputs/apk/debug/app-debug.apk`
- **Release**: `app/build/outputs/apk/release/app-release.apk`

## 🔐 Keystore für Release

```bash
# Keystore erstellen
keytool -genkey -v -keystore prasco-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias prasco

# Passwörter sicher aufbewahren!
```

## 📱 Features der App

### Implementiert
- ✅ WebView mit vollem JavaScript-Support
- ✅ Fullscreen (Kiosk-Modus)
- ✅ Display immer an (keine Standby)
- ✅ Landscape-Modus (querformat)
- ✅ Hardware-beschleunigte Wiedergabe
- ✅ Video-/Audio-Support
- ✅ LocalStorage-Unterstützung
- ✅ Zurück-Taste deaktiviert (Kiosk)

### Optional verfügbar
- ⚙️ Settings-Activity für URL-Konfiguration
- 🔄 Auto-Start beim Booten
- 🔒 Admin-Pin für Exit
- 📡 Offline-Modus mit Cache
- 🔔 Push-Notifications

## 🛠️ Entwicklung

### Voraussetzungen

- Android Studio Arctic Fox (2020.3.1) oder neuer
- Java JDK 11 oder neuer
- Android SDK (API 24+)
- Gradle 7.0+

### Import in Android Studio

1. File → Open → `android-app/` Verzeichnis auswählen
2. Gradle Sync abwarten
3. Device/Emulator wählen
4. Run ▶️

### Debugging

```bash
# Logcat anzeigen
adb logcat | grep "PrascoDisplay"

# App auf Device inspizieren
chrome://inspect
```

## 📊 Systemanforderungen

### Minimum
- Android 7.0 (API 24)
- 50 MB freier Speicher
- Netzwerkverbindung zum PRASCO Server

### Empfohlen
- Android 9.0 (API 28) oder neuer
- 100 MB freier Speicher
- Stabile WLAN-Verbindung
- Tablet oder TV-Box mit Landscape-Display

## 🔒 Sicherheit

### Wichtige Hinweise

1. **HTTPS verwenden**: In Produktion immer HTTPS statt HTTP
2. **Network Security Config**: Für bessere Sicherheit konfigurieren
3. **ProGuard**: Bei Release aktivieren
4. **Keine Hardcoded Secrets**: Nie API-Keys fest im Code
5. **SSL Pinning**: Für kritische Produktivumgebungen

### Network Security Config

Erstelle `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.1.0/24</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

## 🚀 Deployment

### Google Play Store

1. APK/AAB signieren
2. Google Play Console → Create App
3. App-Details ausfüllen
4. APK/AAB hochladen
5. Release erstellen

### Private Distribution

1. APK signieren
2. APK auf Gerät übertragen: `adb install app-release.apk`
3. Oder via File-Sharing-Dienst verteilen

### Firebase App Distribution

```bash
# Firebase CLI installieren
npm install -g firebase-tools

# App verteilen
firebase appdistribution:distribute app-release.apk \
  --app YOUR_APP_ID \
  --groups testers
```

## 📚 Weitere Dokumentation

- [Vollständige Implementierungsanleitung](../ANDROID-APP.md)
- [PRASCO Hauptdokumentation](../README.md)
- [Raspberry Pi Setup](../RASPBERRY-PI-SETUP.md)

## 🆘 Support

Bei Fragen oder Problemen:
1. Siehe [Troubleshooting in ANDROID-APP.md](../ANDROID-APP.md#troubleshooting)
2. Öffne ein Issue auf GitHub
3. Prüfe Android Studio Logcat für Fehlermeldungen

---

**Happy Coding! 🎉**
