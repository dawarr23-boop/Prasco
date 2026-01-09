# PRASCO Android TV App

Android TV optimierte Version des PRASCO Digital Signage Display.

## 📺 Übersicht

Diese Implementierung ist speziell für Android TV optimiert mit:

- **TV Launcher Support**: App erscheint im Android TV Launcher
- **Leanback UI**: Optimiert für 10-Foot Experience  
- **Fernbedienungs-Navigation**: D-Pad und Remote Control Support
- **Fullscreen Kiosk-Modus**: Keine UI-Elemente, nur Content
- **Auto-Start**: Startet automatisch beim TV-Booten (optional)
- **4K Ready**: Optimiert für HD/4K TV-Displays

## 🚀 Schnellstart

### 1. Android Studio Projekt erstellen

```bash
File → New → New Project → TV → Empty Activity

Name: PRASCO Display TV
Package: net.prasco.display.tv
Language: Kotlin
Minimum SDK: API 21 (Android 5.0)
```

### 2. Dateien kopieren

Kopiere alle Dateien aus diesem Verzeichnis in dein Android Studio Projekt:

- `AndroidManifest.xml` → `app/src/main/AndroidManifest.xml`
- `MainActivity.kt` → `app/src/main/java/net/prasco/display/tv/MainActivity.kt`
- `build.gradle` → `app/build.gradle`
- `strings.xml` → `app/src/main/res/values/strings.xml`

### 3. App Banner erstellen

Erstelle ein App-Banner (320x180px) als `res/drawable/app_banner.png`

### 4. Server-URL konfigurieren

Editiere `MainActivity.kt`:

```kotlin
private val SERVER_URL = "http://192.168.1.100:3000"  // Deine PRASCO Server-IP
```

### 5. Build und Install

```bash
# Debug-APK bauen
./gradlew assembleDebug

# Auf Android TV installieren (via ADB)
adb connect <TV-IP>
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 📁 Dateistruktur

```
android-tv-app/
├── README.md                    # Diese Datei
├── AndroidManifest.xml          # TV-optimiertes Manifest
├── MainActivity.kt              # Hauptactivity mit TV-Support
├── MainActivity.java            # Java-Version (Alternative)
├── build.gradle                 # Gradle Build-Konfiguration
├── strings.xml                  # App-Strings
├── proguard-rules.pro           # ProGuard-Regeln
└── preferences.xml              # Settings (optional)
```

## ⚙️ Features

### Implementiert

- ✅ Android TV Launcher Integration
- ✅ Leanback UI Support
- ✅ Fullscreen Kiosk-Modus
- ✅ Fernbedienungs-Unterstützung (D-Pad)
- ✅ Hardware-beschleunigte Video-Wiedergabe
- ✅ Display immer an (kein Screensaver)
- ✅ WebView mit JavaScript-Support
- ✅ Auto-Reload (optional)
- ✅ Landscape-Orientierung erzwungen

### Optional

- ⚙️ Settings via Fernbedienung (geheime Tastenkombination)
- 🔄 Auto-Start beim TV-Booten
- 🔒 Lock Task Mode (Kiosk)
- 📡 Wake on LAN
- 🎮 HDMI-CEC Support

## 🎮 Fernbedienung

### Unterstützte Tasten

| Taste | Aktion | Notizen |
|-------|--------|---------|
| D-Pad Hoch/Runter/Links/Rechts | Optional: Navigation in Display | Wird an JavaScript weitergeleitet |
| OK/Select | Optional: Auswahl | Kann implementiert werden |
| Zurück | Blockiert | Kiosk-Modus |
| Home | TV Home | Kann nicht blockiert werden |
| Menu (5x) | Einstellungen | Geheime Kombination |

### Einstellungen öffnen

Drücke die **Menu-Taste 5x schnell** um Einstellungen zu öffnen.

## 🔧 Konfiguration

### Server-URL ändern

**Option 1: Im Code** (MainActivity.kt):
```kotlin
private val SERVER_URL = "http://192.168.1.100:3000"
```

**Option 2: Settings Activity** (zur Laufzeit):
- Menu-Taste 5x drücken
- URL eingeben
- App neu starten

### Auto-Reload aktivieren

In `MainActivity.kt`:
```kotlin
private val AUTO_RELOAD_INTERVAL = 300000L  // 5 Minuten in ms
```

## 📺 Kompatible Geräte

### Getestet auf:

- ✅ **NVIDIA Shield TV** (beste Performance)
- ✅ **Mi Box S** 
- ✅ **Chromecast with Google TV**
- ✅ **Sony Bravia Android TVs**
- ✅ **Philips Android TVs**
- ✅ **Fire TV Stick 4K** (mit Sideload)

### Systemanforderungen:

- Android TV OS 5.0+ (API 21+)
- 100 MB freier Speicher
- WLAN-Verbindung zum PRASCO Server
- Empfohlen: 2GB+ RAM für 4K Content

## 🚀 Installation auf Android TV

### Methode 1: ADB (empfohlen)

```bash
# TV-IP-Adresse finden (Einstellungen → Netzwerk)
# Beispiel: 192.168.1.200

# Mit TV verbinden
adb connect 192.168.1.200

# APK installieren
adb install app-debug.apk

# App starten
adb shell am start -n net.prasco.display.tv/.MainActivity
```

### Methode 2: USB-Stick

1. APK auf USB-Stick kopieren
2. USB-Stick an TV anschließen
3. File-Manager-App öffnen (z.B. X-plore)
4. APK auswählen und installieren

### Methode 3: Apps2Fire

1. "Apps2Fire" auf Android-Phone installieren
2. Mit TV verbinden
3. APK auswählen und senden

## 🔒 Kiosk-Modus

### Einfacher Kiosk-Modus

Bereits implementiert:
- Zurück-Taste blockiert
- Fullscreen ohne System-UI
- Display immer an

### Enterprise Kiosk-Modus (Lock Task)

Für vollständigen Lockdown:

```bash
# App als Device Owner setzen (ADB)
adb shell dpm set-device-owner net.prasco.display.tv/.DeviceAdminReceiver

# App startet dann im Lock Task Mode
# Home-Taste wird auch blockiert
```

### Auto-Start beim Booten

Aktiviere in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<receiver android:name=".BootReceiver" ...>
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

## 🎨 TV-Optimierung

### Display-Anpassungen

Das PRASCO Display erkennt automatisch große Bildschirme und passt sich an:

```css
/* In display.css bereits vorhanden */
@media (min-width: 1920px) {
  /* Größere Schrift für TV */
  body { font-size: 1.5rem; }
  
  /* Overscan Safe Area */
  body { padding: 48px; }
}
```

### Performance

- Hardware-beschleunigte Wiedergabe aktiviert
- WebView-Cache optimiert
- Render-Priorität auf HIGH

## 🔨 Build-Befehle

```bash
# Debug-Build
./gradlew assembleDebug

# Release-Build (signiert)
./gradlew assembleRelease

# Installieren
./gradlew installDebug

# Deinstallieren
./gradlew uninstallDebug
```

## 📦 Release Build

### Keystore erstellen

```bash
keytool -genkey -v -keystore prasco-tv-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias prascotv
```

### In build.gradle konfigurieren

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../prasco-tv-key.jks')
            storePassword 'your-password'
            keyAlias 'prascotv'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 🆘 Troubleshooting

### App erscheint nicht im TV Launcher

**Problem**: App nicht sichtbar  
**Lösung**: 
- Prüfe `android.software.leanback` in Manifest
- Prüfe `LEANBACK_LAUNCHER` Intent-Filter
- Prüfe App-Banner (320x180px)

### Display geht in Standby

**Problem**: Bildschirm wird dunkel  
**Lösung**:
- `FLAG_KEEP_SCREEN_ON` ist bereits gesetzt
- TV-Screensaver-Einstellungen prüfen
- Energiespar-Modus deaktivieren

### Videos spielen nicht

**Problem**: Video-Content wird nicht angezeigt  
**Lösung**:
- Hardware-Beschleunigung prüfen (bereits aktiviert)
- Video-Codec-Unterstützung prüfen (H.264/H.265)
- Netzwerkgeschwindigkeit prüfen (min 10 Mbps für HD)

### Fernbedienung funktioniert nicht

**Problem**: D-Pad-Tasten haben keine Wirkung  
**Lösung**:
- `onKeyDown` ist implementiert
- Prüfe ob Tasten-Events ankommen (Logcat)
- Optional: JavaScript-Event-Injection aktivieren

### App startet nicht automatisch

**Problem**: Nach Reboot manueller Start nötig  
**Lösung**:
- RECEIVE_BOOT_COMPLETED Permission prüfen
- BootReceiver in Manifest registrieren
- Auto-Start Permission in TV-Einstellungen erlauben

## 📚 Weitere Dokumentation

- [Vollständige TV-Anleitung](../ANDROID-TV-APP.md)
- [Standard Android-App](../android-app/README.md)
- [PRASCO Hauptdokumentation](../README.md)
- [Raspberry Pi Setup](../RASPBERRY-PI-SETUP.md)

## 🎯 Deployment Checklist

Vor dem Deployment prüfen:

- [ ] App-Banner (320x180px) erstellt
- [ ] Server-URL konfiguriert
- [ ] Leanback Feature in Manifest
- [ ] TV Launcher Intent vorhanden
- [ ] Landscape-Modus erzwungen
- [ ] Kiosk-Modus getestet
- [ ] Fernbedienungs-Navigation getestet
- [ ] Auto-Start konfiguriert (optional)
- [ ] Performance auf Zielgerät getestet
- [ ] Release-APK signiert

## 🔗 Nützliche Links

- [Android TV Guidelines](https://developer.android.com/training/tv)
- [Leanback Library](https://developer.android.com/jetpack/androidx/releases/leanback)
- [WebView Best Practices](https://developer.android.com/guide/webapps/webview)

---

**Happy TV Signage! 📺✨**
