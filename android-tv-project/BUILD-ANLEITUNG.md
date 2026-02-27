# PRASCO Android TV App - Client Software v2.0 📺

## ✅ Übersicht

Vollwertige Android TV Client-App für das PRASCO Digital Signage System.

### Features (v2.0):

- **Kiosk-Modus**: Vollbild ohne System-UI, Zurück-Taste blockiert
- **Fernbedienungs-Navigation**: D-Pad Tasten → JavaScript Events
- **Blend-Effekte**: Hardware-beschleunigtes Rendering für flüssige Übergänge
- **Auto-Reconnect**: Automatische Wiederverbindung bei Serververlust (15s Intervall)
- **Persistente Konfiguration**: Server-URL in SharedPreferences gespeichert
- **Einstellungs-Dialog**: 5× Menu-Taste → URL-Konfiguration ohne Rebuild
- **Auto-Start**: Startet automatisch beim TV-Booten (BootReceiver)
- **Mixed Content**: HTTP-Ressourcen auf HTTPS erlaubt

### APK-Dateien:

1. **Debug-Version** (zum Testen)
   - Pfad: `app/build/outputs/apk/debug/app-debug.apk`

2. **Release-Version** (signiert für Produktion)
   - Pfad: `app/build/outputs/apk/release/app-release.apk`

## 📦 Installation auf Android TV

### Methode 1: ADB (Android Debug Bridge)

```powershell
# 1. Android TV mit USB verbinden oder IP-Adresse ermitteln

# 2. ADB-Verbindung über Netzwerk (wenn kein USB verfügbar)
adb connect 192.168.1.XXX:5555

# 3. APK installieren
cd C:\Users\chris\Prasco2\prasco\android-tv-project\app\build\outputs\apk\debug
adb install app-debug.apk

# 4. App starten
adb shell am start -n net.prasco.display.tv/.MainActivity
```

### Methode 2: USB-Stick

1. APK auf USB-Stick kopieren
2. Auf Android TV einen Dateimanager installieren (z.B. "X-plore File Manager")
3. APK vom USB-Stick öffnen und installieren

### Methode 3: Netzwerk-Installation

1. APK-Datei auf einen Webserver hochladen
2. Auf Android TV Browser öffnen und APK herunterladen
3. Installation erlauben und APK installieren

## ⚙️ Konfiguration

Die App lädt standardmäßig diese URL:
```
http://192.168.1.100:3000
```

### URL ändern (ohne Rebuild):

**Auf dem TV:** 5× die Menu-Taste auf der Fernbedienung drücken → Einstellungs-Dialog öffnet sich → Neue URL eingeben → "Speichern & Neu laden"

Die URL wird dauerhaft gespeichert (SharedPreferences) und überlebt App-Neustarts.

### URL ändern (im Code):

Bearbeite die Datei `app/src/main/java/net/prasco/display/tv/MainActivity.kt`:

```kotlin
private const val DEFAULT_SERVER_URL = "http://DEINE-IP:3000"
```

Dann neu bauen:
```powershell
cd C:\Users\chris\Prasco2\prasco\android-tv-project
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\chris\AppData\Local\Android\Sdk"
.\gradlew.bat assembleDebug
```

## 🔧 Release-Version signieren

Für den Play Store oder produktiven Einsatz muss die APK signiert werden:

```powershell
# 1. Keystore erstellen (einmalig)
cd C:\Users\chris\Prasco2\prasco\android-tv-project
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& "$env:JAVA_HOME\bin\keytool.exe" -genkey -v -keystore prasco-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias prasco

# 2. APK signieren
& "$env:JAVA_HOME\bin\jarsigner.exe" -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore prasco-release-key.jks app\build\outputs\apk\release\app-release-unsigned.apk prasco

# 3. APK optimieren (zipalign)
& "$env:ANDROID_HOME\build-tools\34.0.0\zipalign.exe" -v 4 app\build\outputs\apk\release\app-release-unsigned.apk app\build\outputs\apk\release\app-release-signed.apk
```

## 🎯 Features der App

- ✅ Vollbild-Modus (Kiosk-Mode)
- ✅ WebView-basiert (zeigt PRASCO Web-Interface)
- ✅ TV-optimiertes Leanback-Design
- ✅ Fernbedienungs-Navigation
- ✅ Hardware-beschleunigtes Rendering
- ✅ Automatischer Start beim TV-Boot (optional konfigurierbar)

## 🔄 App neu bauen

Wenn du Änderungen gemacht hast:

```powershell
cd C:\Users\chris\Prasco2\prasco\android-tv-project
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\chris\AppData\Local\Android\Sdk"

# Debug-Version
.\gradlew.bat assembleDebug

# Release-Version
.\gradlew.bat assembleRelease
```

## 🚀 Deployment

### Option 1: Direktinstallation
- APK direkt auf jedes Android TV Gerät installieren

### Option 2: Google Play Store
- Signierte APK in Google Play Console hochladen
- App im Play Store for Android TV veröffentlichen

### Option 3: MDM (Mobile Device Management)
- APK über Unternehmensverwaltung verteilen
- Automatische Installation auf allen verwalteten Geräten

## 📝 Weitere Anpassungen

### Auto-Start beim Boot

Ist bereits eingebaut! Der `BootReceiver` startet die App automatisch nach dem Booten.
Falls nicht gewünscht, entferne den `<receiver>`-Eintrag aus `AndroidManifest.xml`.

### App-Icon anpassen

Ersetze die Icons in:
- `app/src/main/res/mipmap-*/ic_launcher.xml`
- `app/src/main/res/drawable/banner.xml` (TV Banner: 320x180px)

## 🐛 Problembehandlung

### App startet nicht
- Überprüfe die URL in MainActivity.kt
- Stelle sicher, dass der PRASCO-Server erreichbar ist
- Checke die Netzwerkverbindung des TV-Geräts

### WebView zeigt leere Seite
- Aktiviere "Unbekannte Quellen" in TV-Einstellungen
- Überprüfe ob `android:usesCleartextTraffic="true"` in AndroidManifest.xml gesetzt ist

### Build-Fehler
```powershell
# Gradle-Cache löschen
cd C:\Users\chris\Prasco2\prasco\android-tv-project
.\gradlew.bat clean

# Neu bauen
.\gradlew.bat assembleDebug
```

## 📚 Weitere Dokumentation

- [Android TV Developer Guide](https://developer.android.com/tv)
- [PRASCO Android TV Guide](../ANDROID-TV-APP.md)
- [Gradle Build-Dokumentation](https://gradle.org/guides/)

---

**Status:** ✅ Client Software v2.0  
**Gradle Version:** 8.2  
**Android SDK:** 34 (Android 14)  
**Kotlin:** 1.9.20
