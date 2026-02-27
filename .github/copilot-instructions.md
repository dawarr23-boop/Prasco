# PRASCO Android TV App - Copilot Instructions

## Projektbeschreibung

Native Android TV App (WebView-basiert) für das PRASCO Digital Signage System.
Die App zeigt Inhalte (Posts, Präsentationen, Videos, HTML) von einem PRASCO-Server
auf Android TV Geräten an.

## Tech-Stack

- **Sprache:** Kotlin 1.9+ (KEIN Java, außer für Legacy-Kompatibilität)
- **Min SDK:** 21 (Android TV Lollipop)
- **Target SDK:** 34 (Android 14)
- **Build:** Gradle 8.4+ mit Kotlin DSL (.gradle.kts)
- **Architektur:** Single-Activity + WebView, MVVM wo nötig
- **Abhängigkeiten:**
    - AndroidX Core, AppCompat, Leanback
    - Retrofit 2 + OkHttp (API-Kommunikation)
    - Room (Offline-Cache DB)
    - WorkManager (Background Tasks)
    - Kotlin Coroutines + Flow (Async)

## PRASCO Server API

- **Base URL:** Konfigurierbar, Standard: `http://<server-ip>:3000`
- **Kein Auth nötig für Display:** `GET /api/public/posts`, `GET /api/settings`
- **Health Check:** `GET /health`
- **Content Types:** text, image, video, html, powerpoint (als Slides)
- **Vollständige API-Doku:** Siehe docs/API-INTEGRATION.md

## Architektur-Regeln

1. **WebView ist das Herzstück** — Die Display-Logik (display.js/css) lebt auf dem Server
2. **Native Shell** nur für: Kiosk-Modus, Settings, Boot-Start, Connectivity, D-Pad
3. **Offline-Fallback:** Wenn Server nicht erreichbar → zeige gecachte Inhalte
4. **Kein UI-Framework** (kein Compose, kein Leanback BrowseFragment) — nur WebView + native Overlays
5. **SharedPreferences** für App-Config, **Room DB** nur für Offline-Cache

## Zielgeräte

- NVIDIA Shield TV (Pro)
- Xiaomi Mi Box S
- Chromecast with Google TV
- Amazon Fire TV Stick 4K (ggf. mit Leanback-Anpassung)
- Sony/Philips/Samsung Smart TVs mit Android TV
- Generische Android TV Boxen (API 21+)

## Coding-Richtlinien

- Kotlin Coding Conventions (ktlint)
- Coroutines statt Callbacks
- Extension Functions für Wiederverwendung
- `sealed class` für States und Events
- `data class` für API-Models
- Logging über zentrale Logger-Klasse (kein `Log.d` direkt)
- Alle Strings in strings.xml (Deutsch + Englisch)
- Kommentare auf Deutsch (Dokumentation)
- TV-spezifisch: Immer Landscape, 10-foot UI, D-Pad-Fokus

## Bekannte Einschränkungen

- Android TV hat KEINEN Touchscreen → nur D-Pad/Remote
- `SYSTEM_ALERT_WINDOW` Permission schwierig auf TV
- Kein Google Play Store für alle TV-Geräte → APK Sideloading
- WebView-Version variiert je nach Gerät → Feature Detection nötig
- Fire TV nutzt Amazon App Store → kein Google Play Services

## Ordner-Konventionen

- `network/` → API Client, Models, Connectivity
- `cache/` → Offline-Caching, Room DB
- `webview/` → WebView-spezifische Klassen
- `receiver/` → BroadcastReceiver
- `service/` → Background Services
- `ui/overlay/` → Native UI-Overlays
- `config/` → App-Konfiguration
- `util/` → Hilfsfunktionen
