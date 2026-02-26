# PRASCO Android TV App - Build erfolgreich! 📺

## ✅ Build-Ergebnisse

Die Android TV App wurde erfolgreich mit PowerShell und Android Studio gebaut!

### Erstellte APK-Dateien:

1. **Debug-Version** (zum Testen)
   - Datei: `app-debug.apk`
   - Größe: 4,16 MB
   - Pfad: `C:\Users\chris\Prasco2\prasco\android-tv-project\app\build\outputs\apk\debug\app-debug.apk`

2. **Release-Version** (noch unsigniert)
   - Datei: `app-release-unsigned.apk`
   - Größe: 1,18 MB (optimiert!)
   - Pfad: `C:\Users\chris\Prasco2\prasco\android-tv-project\app\build\outputs\apk\release\app-release-unsigned.apk`

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
http://192.168.1.100:3000/display
```

### URL ändern:

Bearbeite die Datei [MainActivity.kt](android-tv-project/app/src/main/java/net/prasco/display/tv/MainActivity.kt#L16):

```kotlin
private val DEFAULT_URL = "http://DEINE-IP:3000/display"
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

### Autostart beim Boot aktivieren

Füge in [AndroidManifest.xml](android-tv-project/app/src/main/AndroidManifest.xml) hinzu:

```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<receiver android:name=".BootReceiver" android:enabled="true" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

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

**Status:** ✅ Build erfolgreich abgeschlossen!  
**Build-Zeit:** ~50 Sekunden  
**Gradle Version:** 8.2  
**Android SDK:** 34 (Android 14)
