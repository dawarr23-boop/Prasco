# PRASCO Android TV App

Native Android TV App (WebView-basiert) für das **PRASCO Digital Signage System**.

## Übersicht

Die PRASCO TV App ist ein dedizierter Display-Client für Android TV Geräte. Sie zeigt
Inhalte (Posts, Präsentationen, Videos, HTML) von einem PRASCO-Server im Kiosk-Modus an.

### Architektur

```
┌─────────────────────────────────┐
│     Android TV Gerät            │
│  ┌──────────────────────────┐   │
│  │   PRASCO TV App          │   │
│  │  ┌────────────────────┐  │   │
│  │  │    WebView          │  │   │
│  │  │  (Server Display)   │  │   │
│  │  └────────────────────┘  │   │
│  │  ┌─────┐ ┌─────┐ ┌────┐ │   │
│  │  │Kiosk│ │D-Pad│ │Boot│ │   │
│  │  └─────┘ └─────┘ └────┘ │   │
│  └──────────────────────────┘   │
└────────────┬────────────────────┘
             │ HTTP
┌────────────▼────────────────────┐
│     PRASCO Server               │
│  (Node.js / Port 3000)         │
└─────────────────────────────────┘
```

## Features

- **WebView Display:** Zeigt Server-Inhalte (Posts, Slides, Videos, HTML)
- **Kiosk-Modus:** Sperrt das Gerät auf die Display-Ansicht
- **Auto-Start:** Startet automatisch nach dem Booten
- **D-Pad Navigation:** Volle Fernbedienungs-Unterstützung
- **Offline-Cache:** Zeigt gecachte Inhalte bei Serververlust
- **Auto-Reconnect:** Automatische Wiederverbindung mit Backoff
- **Setup Wizard:** Geführte Ersteinrichtung
- **Settings:** Konfiguration über verstecktes Menü (5× Menü-Taste)

## Zielgeräte

| Gerät                       | Status                |
| --------------------------- | --------------------- |
| NVIDIA Shield TV (Pro)      | ✅ Primär             |
| Chromecast with Google TV   | ✅ Primär             |
| Xiaomi Mi Box S             | ✅ Getestet           |
| Amazon Fire TV Stick 4K     | ⚠️ Leanback-Anpassung |
| Sony/Philips Android TV     | ✅ Kompatibel         |
| Generische Android TV Boxen | ✅ API 21+            |

## Schnellstart

### Voraussetzungen

- Android Studio Hedgehog (2023.1.1) oder neuer
- JDK 17
- Android SDK 34
- Kotlin 1.9+

### Bauen

```bash
# Debug APK
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease

# Tests
./gradlew test
```

### Auf Gerät installieren

```bash
# Über ADB (USB/WLAN)
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Oder mit dem Script
./scripts/install-on-device.sh
```

### Server konfigurieren

1. App starten → Setup Wizard beginnt
2. PRASCO Server URL eingeben (z.B. `http://192.168.1.100:3000`)
3. Verbindung testen
4. Display-Name vergeben
5. Fertig!

**Nachträglich:** 5× Menü-Taste drücken → Einstellungen öffnen

## Tech-Stack

| Komponente | Technologie                 |
| ---------- | --------------------------- |
| Sprache    | Kotlin 1.9.20               |
| Min SDK    | 21 (Android 5.0 Lollipop)   |
| Target SDK | 34 (Android 14)             |
| Build      | Gradle 8.5, AGP 8.2.0       |
| Netzwerk   | Retrofit 2.9.0, OkHttp 4.12 |
| Datenbank  | Room 2.6.1                  |
| Background | WorkManager 2.9.0           |
| Async      | Coroutines 1.7.3, Flow      |

## Projektstruktur

```
app/src/main/java/net/prasco/tv/
├── PrascoApp.kt              # Application-Klasse
├── config/
│   ├── AppConfig.kt          # Zentrale Konfiguration
│   └── PreferencesManager.kt # SharedPreferences Wrapper
├── util/
│   ├── Logger.kt             # Zentrales Logging
│   ├── Extensions.kt         # Kotlin Extensions
│   └── DeviceInfo.kt         # Geräte-Informationen
├── webview/
│   ├── PrascoWebViewClient.kt
│   ├── PrascoWebChromeClient.kt
│   ├── JavaScriptBridge.kt   # JS ↔ Native Bridge
│   └── WebViewPool.kt        # WebView-Konfiguration
├── network/
│   ├── ApiModels.kt          # API Datenklassen
│   ├── PrascoApiClient.kt    # Retrofit Client
│   ├── ConnectivityMonitor.kt
│   └── HealthCheckWorker.kt
├── cache/
│   ├── CacheDatabase.kt      # Room DB
│   └── OfflineCacheManager.kt
├── ui/overlay/
│   ├── StatusOverlay.kt
│   └── ErrorOverlay.kt
├── receiver/
│   └── BootReceiver.kt
├── service/
│   └── DisplayService.kt
├── MainActivity.kt
├── SettingsActivity.kt
└── SetupWizardActivity.kt
```

## Dokumentation

- [API-Integration](docs/API-INTEGRATION.md)
- [Build-Guide](docs/BUILD-GUIDE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Architektur](docs/ARCHITECTURE.md)

## Lizenz

Copyright © 2024 PRASCO. Alle Rechte vorbehalten.
