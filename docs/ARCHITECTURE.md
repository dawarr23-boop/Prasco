# Architektur

## Überblick

Die PRASCO TV App folgt einer **WebView + Native Shell** Hybrid-Architektur.
Der Kern der Anzeige-Logik lebt auf dem PRASCO Server, die Android App
stellt die native Laufzeitumgebung bereit.

## Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRASCO Android TV App                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MainActivity                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │                    WebView                         │  │   │
│  │  │                                                    │  │   │
│  │  │   ← Server Display (HTML/CSS/JS) →                 │  │   │
│  │  │                                                    │  │   │
│  │  │   window.PrascoNative ← JavaScriptBridge           │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ StatusOverlay│  │ ErrorOverlay│  │ Loading Overlay │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Settings   │  │ SetupWizard  │  │ DisplayService          │ │
│  │ Activity   │  │ Activity     │  │ (Foreground, WakeLock)  │ │
│  └────────────┘  └──────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Infrastructure                          │   │
│  │  ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐  │   │
│  │  │Connectivity│ │HealthChk │ │ Cache   │ │ Boot      │  │   │
│  │  │ Monitor   │ │ Worker   │ │ (Room)  │ │ Receiver  │  │   │
│  │  └───────────┘ └──────────┘ └─────────┘ └────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                                          │
         │  HTTP (REST API)                         │ HTTP (WebView)
         ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PRASCO Server                               │
│                                                                 │
│  /api/public/posts  /api/settings  /health  /display.html      │
└─────────────────────────────────────────────────────────────────┘
```

## Schichten

### 1. Presentation Layer

| Komponente            | Verantwortung                                |
| --------------------- | -------------------------------------------- |
| `MainActivity`        | WebView-Host, Kiosk-Modus, D-Pad, Fullscreen |
| `SettingsActivity`    | Server-/App-Konfiguration                    |
| `SetupWizardActivity` | Ersteinrichtung (3 Schritte)                 |
| `StatusOverlay`       | Verbindungsstatus-Anzeige                    |
| `ErrorOverlay`        | Fehlerseite mit Retry                        |

### 2. WebView Layer

| Komponente              | Verantwortung                                 |
| ----------------------- | --------------------------------------------- |
| `PrascoWebViewClient`   | Seitenlade-Events, Fehlerbehandlung, SSL      |
| `PrascoWebChromeClient` | Console-Logging, Fullscreen Video, JS-Dialoge |
| `JavaScriptBridge`      | `window.PrascoNative` Interface für Server-JS |
| `WebViewPool`           | WebView-Konfiguration und -Verwaltung         |

### 3. Network Layer

| Komponente            | Verantwortung                                  |
| --------------------- | ---------------------------------------------- |
| `PrascoApiClient`     | Retrofit HTTP-Client, API-Aufrufe              |
| `ApiModels`           | Data Classes für API-Responses                 |
| `ConnectivityMonitor` | Netzwerk-Status (NetworkCallback, StateFlow)   |
| `HealthCheckWorker`   | Periodischer Server-Health-Check (WorkManager) |

### 4. Cache Layer

| Komponente            | Verantwortung                                   |
| --------------------- | ----------------------------------------------- |
| `CacheDatabase`       | Room DB mit CachedPost/CachedMedia Entities     |
| `OfflineCacheManager` | Post-Caching, Cleanup, Offline-HTML-Generierung |

### 5. Core Layer

| Komponente           | Verantwortung                          |
| -------------------- | -------------------------------------- |
| `PrascoApp`          | Application-Klasse, WorkManager-Config |
| `AppConfig`          | Zentrale Konstanten und Konfiguration  |
| `PreferencesManager` | SharedPreferences-Wrapper              |
| `Logger`             | Zentrales Logging (Logcat + File)      |
| `Extensions`         | Kotlin Extension Functions             |
| `DeviceInfo`         | Geräteinformationen, Feature Detection |

### 6. Services & Receivers

| Komponente       | Verantwortung                |
| ---------------- | ---------------------------- |
| `DisplayService` | Foreground Service, WakeLock |
| `BootReceiver`   | Auto-Start nach Boot         |

## Datenfluss

### Normal (Online)

```
1. App Start → MainActivity
2. Prüfe: Setup abgeschlossen?
   - Nein → SetupWizardActivity
   - Ja → Weiter
3. ConnectivityMonitor starten
4. WebView laden: {serverUrl}/display.html
5. HealthCheckWorker schedulen
6. DisplayService starten (WakeLock)
7. Server-JS nutzt window.PrascoNative Bridge
```

### Offline (Server nicht erreichbar)

```
1. WebViewClient meldet Fehler
2. Prüfe: Cache vorhanden?
   - Ja → OfflineCacheManager.generateOfflineHtml()
   - Nein → offline_display.html (aus /res/raw/)
3. Auto-Reconnect starten (Backoff: 5s → 10s → 30s → 60s)
4. ConnectivityMonitor meldet Netzwerk-Änderung
5. Bei Verbindung → WebView reload
```

### D-Pad Navigation

```
D-Pad Taste → MainActivity.onKeyDown()
  - Menü (5×) → SettingsActivity
  - Back (Kiosk) → Blockiert
  - Back (Normal) → App beenden
  - Enter auf Retry → WebView reload
```

## State Management

Die App verwendet **SharedPreferences** für persistenten State:

- `serverUrl` — Konfigurierter Server
- `displayIdentifier` — Geräte-ID
- `displayName` — Anzeigename
- `isSetupCompleted` — Ersteinrichtung abgeschlossen
- `isKioskModeEnabled` — Kiosk-Modus aktiv
- `isAutoStartEnabled` — Autostart nach Boot

Für flüchtigen State werden **Kotlin StateFlow** und **LiveData** verwendet.

## Sicherheit

- **Kein Auth nötig** für Public API Endpunkte
- **HTTP** im lokalen Netzwerk erlaubt (network_security_config.xml)
- **HTTPS** bevorzugt für externe Verbindungen
- **SSL-Fehler** werden in Debug ignoriert, in Release blockiert
- **JavaScript Bridge** nur für vertrauenswürdige Server-URL
- **Kiosk-Modus** verhindert App-Verlassen
