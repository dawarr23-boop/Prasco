# PRASCO Android TV App - Detaillierter Umsetzungsplan

## Ziel

Entwicklung einer professionellen Android TV APK für das PRASCO Digital Signage System. Die App soll als **dedizierter Display-Client** auf Android TV Geräten (NVIDIA Shield, Fire TV, Chromecast w/ Google TV, etc.) laufen und die vorhandene PRASCO-Server-API konsumieren.

---

## Inhaltsverzeichnis

1. [Projekt-Scope & Entscheidungen](#1-projekt-scope--entscheidungen)
2. [Architektur-Übersicht](#2-architektur-übersicht)
3. [Neues Projekt Setup (Workspace)](#3-neues-projekt-setup-workspace)
4. [VS Code & KI-Konfiguration](#4-vs-code--ki-konfiguration)
5. [Toolset & Abhängigkeiten](#5-toolset--abhängigkeiten)
6. [Feature-Matrix](#6-feature-matrix)
7. [Datenmodell & API-Integration](#7-datenmodell--api-integration)
8. [Implementierungsphasen](#8-implementierungsphasen)
9. [Dateistruktur](#9-dateistruktur)
10. [Build, Test & Deployment](#10-build-test--deployment)
11. [Qualitätssicherung](#11-qualitätssicherung)
12. [Bekannte Limitierungen & Risiken](#12-bekannte-limitierungen--risiken)

---

## 1. Projekt-Scope & Entscheidungen

### 1.1 Architektur-Entscheidung: Hybrid (WebView + Native Shell)

| Ansatz | Bewertung | Begründung |
|--------|-----------|------------|
| **WebView + Native Shell** | **⭐⭐⭐⭐⭐ Gewählt** | Maximale Code-Wiederverwendung (display.html/js/css), schnellste Umsetzung, einfache Updates |
| Native Leanback | ⭐⭐ | Zu aufwändig, müsste komplette Display-Logik neu implementieren |
| Jetpack Compose for TV | ⭐⭐ | Zu neu, noch kein stabiles Ecosystem |
| Flutter | ⭐⭐ | Zusätzliche Sprache (Dart), WebView-Integration suboptimal |

**Begründung:**
- Die gesamte Display-Logik (Posts, Slideshows, Blend-Effekte, Uhr, Transit-Daten) existiert bereits in `display.js`
- Server-Updates (neues CSS/JS) werden automatisch reflektiert
- Einzige native Ergänzungen: Kiosk-Modus, Boot-Start, Settings, D-Pad Navigation, Connectivity

### 1.2 Was EXISTIERT bereits (aus vorhanderem Projekt übernehmen)

```
Aus prasco/android-tv-project/:
├── Grundstruktur (Gradle 8.2, AGP 8.2.0, Kotlin 1.9.20)
├── MainActivity.kt (WebView-Setup, Fullscreen, D-Pad)
├── AndroidManifest.xml (Leanback, Landscape)
├── build.gradle (compileSdk 34, leanback dependency)
├── Banner & Icons (320x180px, 48x48px)
└── Build-Anleitung (debug + release APK)

Aus prasco/android-app/:
├── SettingsActivity.kt (SharedPreferences, URL-Konfiguration)
├── BootReceiver.kt (Auto-Start nach Boot)
├── strings.xml (Deutsche Lokalisierung)
└── activity_settings.xml (Settings UI Layout)
```

### 1.3 Was NEU gebaut werden muss

| Feature | Priorität | Aufwand |
|---------|-----------|---------|
| Robuste Connectivity-Handling | P0 | 4h |
| Offline-Fallback mit Cache | P0 | 8h |
| Settings-Activity (vollständig) | P0 | 4h |
| Auto-Reconnect & Heartbeat | P0 | 4h |
| OTA-Update-Mechanismus | P1 | 8h |
| Native Overlay (Uhr, Status) | P1 | 6h |
| Remote-Config via API | P1 | 4h |
| Wake-on-LAN / Scheduled Power | P2 | 6h |
| Admin-PIN-Schutz | P2 | 3h |
| Push-Notifications (FCM) | P3 | 8h |
| MDM-Integration | P3 | 12h |

---

## 2. Architektur-Übersicht

```
┌──────────────────────────────────────────────────────────┐
│                    PRASCO Android TV App                  │
├──────────────┬──────────────┬────────────────────────────┤
│  Native      │  WebView     │  Services                  │
│  Shell       │  Layer       │  (Background)              │
│              │              │                            │
│ • Kiosk Mode │ • display.js │ • ConnectivityMonitor      │
│ • D-Pad Nav  │ • display.css│ • HealthCheckService       │
│ • Settings   │ • Blend FX   │ • CacheService             │
│ • Boot Start │ • Slides     │ • UpdateService            │
│ • Status Bar │ • Clock      │ • ScheduleService          │
│ • Admin PIN  │ • Transit    │ • WakeLockManager          │
│              │ • Traffic    │                            │
├──────────────┴──────────────┴────────────────────────────┤
│                    Data Layer                             │
│  SharedPreferences │ Room DB (Cache) │ File Cache         │
├──────────────────────────────────────────────────────────┤
│                    PRASCO Server API                      │
│  GET /api/public/posts │ GET /api/settings │ /health     │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Neues Projekt Setup (Workspace)

### 3.1 Workspace-Struktur

```
prasco-android-tv/                    ← NEUES REPOSITORY
├── .github/
│   ├── copilot-instructions.md       ← KI-Anweisungen (siehe §4)
│   ├── workflows/
│   │   ├── build.yml                 ← CI: Build Debug APK
│   │   ├── release.yml               ← CI: Build Release APK + Signierung
│   │   └── lint.yml                  ← CI: Lint + Tests
│   └── CODEOWNERS
├── .vscode/
│   ├── settings.json                 ← VS Code Workspace Settings
│   ├── extensions.json               ← Empfohlene Extensions
│   ├── launch.json                   ← Debug-Konfigurationen
│   └── tasks.json                    ← Build Tasks
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/net/prasco/tv/
│   │   │   │   ├── PrascoApp.kt                 ← Application-Klasse
│   │   │   │   ├── MainActivity.kt               ← Haupt-Activity (WebView)
│   │   │   │   ├── SettingsActivity.kt            ← Einstellungen
│   │   │   │   ├── SetupWizardActivity.kt         ← Ersteinrichtung
│   │   │   │   │
│   │   │   │   ├── config/
│   │   │   │   │   ├── AppConfig.kt              ← Zentrale Konfiguration
│   │   │   │   │   └── PreferencesManager.kt     ← SharedPreferences Wrapper
│   │   │   │   │
│   │   │   │   ├── network/
│   │   │   │   │   ├── PrascoApiClient.kt        ← Retrofit API Client
│   │   │   │   │   ├── ApiModels.kt              ← Data Classes (Post, Category, etc.)
│   │   │   │   │   ├── HealthCheckWorker.kt      ← WorkManager Health Check
│   │   │   │   │   └── ConnectivityMonitor.kt    ← Netzwerk-Überwachung
│   │   │   │   │
│   │   │   │   ├── cache/
│   │   │   │   │   ├── OfflineCacheManager.kt    ← Offline-Caching-Logik
│   │   │   │   │   ├── MediaCacheWorker.kt       ← Background Media Download
│   │   │   │   │   └── CacheDatabase.kt          ← Room DB für Offline-Daten
│   │   │   │   │
│   │   │   │   ├── webview/
│   │   │   │   │   ├── PrascoWebViewClient.kt    ← Custom WebViewClient
│   │   │   │   │   ├── PrascoWebChromeClient.kt  ← Chrome Client (Videos, Console)
│   │   │   │   │   ├── JavaScriptBridge.kt       ← JS ↔ Kotlin Interface
│   │   │   │   │   └── WebViewPool.kt            ← WebView Lifecycle Management
│   │   │   │   │
│   │   │   │   ├── receiver/
│   │   │   │   │   ├── BootReceiver.kt           ← Auto-Start nach Boot
│   │   │   │   │   └── UpdateReceiver.kt         ← App-Update Handling
│   │   │   │   │
│   │   │   │   ├── service/
│   │   │   │   │   ├── DisplayService.kt         ← Foreground Service
│   │   │   │   │   └── ScheduleService.kt        ← Schedule-basiertes An/Aus
│   │   │   │   │
│   │   │   │   ├── ui/
│   │   │   │   │   ├── overlay/
│   │   │   │   │   │   ├── StatusOverlay.kt      ← Nativer Status-Overlay
│   │   │   │   │   │   └── ErrorOverlay.kt       ← Fehler-Anzeige
│   │   │   │   │   └── theme/
│   │   │   │   │       └── Theme.kt              ← TV-Theme
│   │   │   │   │
│   │   │   │   └── util/
│   │   │   │       ├── Logger.kt                 ← Logging-Wrapper
│   │   │   │       ├── DeviceInfo.kt             ← Geräte-Informationen
│   │   │   │       └── Extensions.kt             ← Kotlin Extensions
│   │   │   │
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── activity_main.xml         ← WebView + Overlay Container
│   │   │   │   │   ├── activity_settings.xml     ← Settings UI (TV-optimiert)
│   │   │   │   │   ├── activity_setup.xml        ← Setup Wizard
│   │   │   │   │   └── overlay_status.xml        ← Status-Overlay Layout
│   │   │   │   ├── drawable/
│   │   │   │   │   ├── banner.xml                ← TV Banner (320x180)
│   │   │   │   │   └── ic_launcher*.xml          ← App Icons
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml               ← Deutsche + Englische Strings
│   │   │   │   │   ├── colors.xml                ← PRASCO Brand Colors
│   │   │   │   │   ├── dimens.xml                ← TV-Dimensionen (10-foot)
│   │   │   │   │   └── themes.xml                ← App Theme
│   │   │   │   ├── values-de/
│   │   │   │   │   └── strings.xml               ← Deutsche Strings
│   │   │   │   ├── xml/
│   │   │   │   │   ├── network_security_config.xml
│   │   │   │   │   └── preferences.xml           ← Settings Schema
│   │   │   │   └── raw/
│   │   │   │       └── offline_display.html       ← Offline-Fallback Seite
│   │   │   │
│   │   │   └── AndroidManifest.xml
│   │   │
│   │   ├── debug/
│   │   │   └── AndroidManifest.xml               ← Debug-spezifisch
│   │   │
│   │   └── test/
│   │       └── java/net/prasco/tv/
│   │           ├── ApiClientTest.kt
│   │           ├── CacheManagerTest.kt
│   │           └── PreferencesTest.kt
│   │
│   ├── build.gradle.kts                          ← App Modul Build (Kotlin DSL)
│   └── proguard-rules.pro
│
├── build.gradle.kts                              ← Root Build (Kotlin DSL)
├── settings.gradle.kts                           ← Settings (Kotlin DSL)
├── gradle.properties                             ← Gradle Konfiguration
├── gradlew / gradlew.bat                         ← Gradle Wrapper
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties             ← Gradle 8.4+
│
├── docs/
│   ├── API-INTEGRATION.md                        ← API Dokumentation
│   ├── BUILD-GUIDE.md                            ← Build-Anleitung
│   ├── DEPLOYMENT.md                             ← Deployment auf Geräte
│   ├── ARCHITECTURE.md                           ← Architektur-Dokumentation
│   ├── TESTING.md                                ← Test-Strategie
│   └── TROUBLESHOOTING.md                        ← Häufige Probleme
│
├── scripts/
│   ├── install-on-device.ps1                     ← ADB Install Script (Windows)
│   ├── install-on-device.sh                      ← ADB Install Script (Linux)
│   ├── generate-keystore.ps1                     ← Keystore Generator
│   └── build-release.ps1                         ← Release Build Script
│
├── .gitignore
├── .editorconfig
├── LICENSE
├── README.md                                     ← Projekt-Readme
└── CHANGELOG.md
```

### 3.2 Repository erstellen

```powershell
# Neues Repository auf GitHub erstellen
# Name: prasco-android-tv
# Visibility: Private
# License: MIT
# .gitignore: Android

# Lokal klonen
git clone https://github.com/dawarr23-boop/prasco-android-tv.git
cd prasco-android-tv
```

---

## 4. VS Code & KI-Konfiguration

### 4.1 `.github/copilot-instructions.md`

```markdown
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
  - Hilt (Dependency Injection, optional)

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
```

### 4.2 `.vscode/settings.json`

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[kotlin]": {
    "editor.defaultFormatter": "mathiasfrohlich.Kotlin",
    "editor.tabSize": 4
  },
  "[xml]": {
    "editor.tabSize": 4
  },
  "[gradle]": {
    "editor.tabSize": 4
  },
  "files.exclude": {
    "**/.gradle": true,
    "**/build": true,
    "**/.idea": true,
    "**/local.properties": true
  },
  "files.associations": {
    "*.gradle.kts": "kotlin"
  },
  "search.exclude": {
    "**/build": true,
    "**/.gradle": true,
    "**/gradle/wrapper": true
  },
  "java.configuration.updateBuildConfiguration": "automatic",
  "kotlin.languageServer.enabled": true,
  "editor.rulers": [120],
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true
}
```

### 4.3 `.vscode/extensions.json`

```json
{
  "recommendations": [
    "mathiasfrohlich.Kotlin",
    "fwcd.kotlin",
    "vscjava.vscode-java-pack",
    "naco-siren.gradle-language",
    "visualstudioexptteam.vscodeintellicode",
    "github.copilot",
    "github.copilot-chat",
    "editorconfig.editorconfig",
    "redhat.vscode-xml",
    "esbenp.prettier-vscode"
  ]
}
```

### 4.4 `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build Debug APK",
      "type": "shell",
      "command": "./gradlew assembleDebug",
      "group": { "kind": "build", "isDefault": true },
      "problemMatcher": [],
      "presentation": { "reveal": "always", "panel": "shared" }
    },
    {
      "label": "Build Release APK",
      "type": "shell",
      "command": "./gradlew assembleRelease",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Install Debug on Device",
      "type": "shell",
      "command": "./gradlew installDebug",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Run Unit Tests",
      "type": "shell",
      "command": "./gradlew test",
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "Lint Check",
      "type": "shell",
      "command": "./gradlew lint",
      "group": "test",
      "problemMatcher": []
    },
    {
      "label": "Clean Project",
      "type": "shell",
      "command": "./gradlew clean",
      "group": "build",
      "problemMatcher": []
    }
  ]
}
```

### 4.5 `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "android",
      "request": "launch",
      "name": "Launch PRASCO TV (Debug)",
      "appSrcRoot": "${workspaceFolder}/app/src/main",
      "apkFile": "${workspaceFolder}/app/build/outputs/apk/debug/app-debug.apk",
      "adbPort": 5037
    }
  ]
}
```

---

## 5. Toolset & Abhängigkeiten

### 5.1 Entwicklungsumgebung

| Tool | Version | Zweck |
|------|---------|-------|
| **VS Code** | Latest | Primäre IDE (mit Kotlin-Support) |
| **Android Studio** | Hedgehog+ | Nur für Emulator + ADB + SDK Manager |
| **JDK** | 17 (Android Studio JBR) | Kotlin/Gradle Compilation |
| **Android SDK** | 34 (API 34) | Target SDK |
| **Gradle** | 8.4+ | Build System |
| **ADB** | Latest | Deployment auf Geräte |
| **Git** | Latest | Versionskontrolle |

### 5.2 SDK & Build Konfiguration

```
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME = C:\Users\chris\AppData\Local\Android\Sdk

Benötigte SDK Pakete:
- Android SDK Platform 34
- Android TV System Image (API 34)
- Android SDK Build-Tools 34.0.0
- Android SDK Platform-Tools
- Android Emulator
```

### 5.3 Gradle Dependencies

```kotlin
// build.gradle.kts (app)
dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.leanback:leanback:1.0.0")
    implementation("androidx.preference:preference-ktx:1.2.1")

    // WebView
    implementation("androidx.webkit:webkit:1.9.0")    // Modern WebView APIs

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Offline Cache
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // Background Work
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // JSON
    implementation("com.google.code.gson:gson:2.10.1")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.8")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
```

### 5.4 Android Emulator für Android TV

```powershell
# Android TV Emulator erstellen (via sdkmanager)
sdkmanager "system-images;android-34;google_apis;x86_64"
avdmanager create avd -n "PRASCO_TV" -k "system-images;android-34;google_apis;x86_64" -d "tv_1080p"

# Starten
emulator -avd PRASCO_TV

# Alternativ: Physisches Gerät via ADB über Netzwerk
adb connect <tv-ip>:5555
```

---

## 6. Feature-Matrix

### 6.1 MVP (Phase 1) - Must Have

| Feature | Beschreibung | Status |
|---------|-------------|--------|
| WebView Display | PRASCO Display-Seite laden und anzeigen | 🔄 Basis existiert |
| Fullscreen Kiosk | Permanenter Fullscreen, kein Zugriff auf Android UI | 🔄 Basis existiert |
| D-Pad Navigation | Fernbedienung → JavaScript-Events | 🔄 Basis existiert |
| Server-URL Config | Einstellbare Server-URL (Setup Wizard) | ⬜ Neu |
| Auto-Reconnect | Bei Verbindungsverlust automatisch reconnecten | ⬜ Neu |
| Offline-Fallback | Letzten Stand aus Cache anzeigen | ⬜ Neu |
| Boot Auto-Start | App startet automatisch nach Geräte-Boot | 🔄 Basis existiert |
| Screen Always On | Display bleibt immer an | 🔄 Basis existiert |
| Health Check | Periodischer Server-Ping | ⬜ Neu |
| Error Overlay | Nativer Fehler-Hinweis bei Problemen | ⬜ Neu |

### 6.2 Phase 2 - Should Have

| Feature | Beschreibung |
|---------|-------------|
| Admin PIN | Einstellungen nur mit PIN zugänglich |
| Remote Config | App-Einstellungen über PRASCO-Server laden |
| Display Identifier | App identifiziert sich als benanntes Display |
| Media Pre-Cache | Bilder/Videos im Voraus herunterladen |
| Scheduled On/Off | Zeitgesteuertes Display An/Aus |
| Crash Recovery | Automatischer Neustart bei Absturz |
| Log-Upload | Fehler-Logs an Server senden |

### 6.3 Phase 3 - Nice to Have

| Feature | Beschreibung |
|---------|-------------|
| OTA-Update | App-Update ohne Sideloading |
| FCM Push | Server kann Display aktualisieren |
| MDM Support | Enterprise Device Management |
| Wake-on-LAN | Gerät remote einschalten |
| Analytics | Viewcount, Uptime Tracking |
| Multi-Display | Mehrere Displays von einem Gerät |

---

## 7. Datenmodell & API-Integration

### 7.1 Relevante API-Endpoints (Public, kein Auth)

```kotlin
// PrascoApi.kt - Retrofit Interface

interface PrascoApi {

    // ============ Display Content (NO AUTH) ============

    /** Alle aktiven Posts für die Anzeige */
    @GET("/api/public/posts")
    suspend fun getPublicPosts(
        @Query("organization") organization: String? = null,
        @Query("category") category: String? = null
    ): List<PostDto>

    /** Posts für ein spezifisches Display */
    @GET("/api/public/display/{identifier}/posts")
    suspend fun getDisplayPosts(
        @Path("identifier") displayIdentifier: String
    ): List<PostDto>

    /** Einzelner aktiver Post */
    @GET("/api/public/posts/{id}")
    suspend fun getPublicPost(@Path("id") id: Int): PostDto

    /** Aktive Kategorien */
    @GET("/api/public/categories")
    suspend fun getPublicCategories(
        @Query("organization") organization: String? = null
    ): List<CategoryDto>

    // ============ Settings (NO AUTH) ============

    /** Alle System-Einstellungen */
    @GET("/api/settings")
    suspend fun getSettings(): Map<String, Any>

    /** Einzelne Einstellung */
    @GET("/api/settings/{key}")
    suspend fun getSetting(@Path("key") key: String): SettingDto

    // ============ Health ============

    /** Server Health Check */
    @GET("/health")
    suspend fun healthCheck(): HealthDto

    // ============ Transit (optional) ============

    @GET("/api/transit/departures/{stationId}")
    suspend fun getDepartures(@Path("stationId") stationId: String): DepartureDto

    // ============ Presentations ============

    /** Slides einer Präsentation */
    @GET("/api/media/presentations/{presentationId}/slides")
    suspend fun getPresentationSlides(
        @Path("presentationId") presentationId: String
    ): List<SlideDto>
}
```

### 7.2 Datenmodelle

```kotlin
// ApiModels.kt

data class PostDto(
    val id: Int,
    val title: String,
    val content: String?,
    val contentType: String,      // "text", "image", "video", "html"
    val mediaUrl: String?,
    val thumbnailUrl: String?,
    val duration: Int?,            // Sekunden
    val priority: Int,
    val isActive: Boolean,
    val startDate: String?,
    val endDate: String?,
    val showTitle: Boolean?,
    val category: CategoryDto?,
    val presentation: PresentationDto?,
    val createdAt: String,
    val updatedAt: String
)

data class CategoryDto(
    val id: Int,
    val name: String,
    val color: String?,
    val icon: String?
)

data class PresentationDto(
    val presentationId: String,
    val originalName: String?,
    val slides: List<SlideDto>?
)

data class SlideDto(
    val slideNumber: Int,
    val imageUrl: String
)

data class SettingDto(
    val key: String,
    val value: String
)

data class HealthDto(
    val status: String       // "ok"
)
```

### 7.3 Offline-Cache Schema (Room)

```kotlin
// CacheDatabase.kt

@Database(entities = [CachedPost::class, CachedMedia::class], version = 1)
abstract class CacheDatabase : RoomDatabase() {
    abstract fun postDao(): CachedPostDao
    abstract fun mediaDao(): CachedMediaDao
}

@Entity(tableName = "cached_posts")
data class CachedPost(
    @PrimaryKey val id: Int,
    val jsonData: String,          // Serialisierter PostDto
    val cachedAt: Long             // Timestamp
)

@Entity(tableName = "cached_media")
data class CachedMedia(
    @PrimaryKey val url: String,
    val localPath: String,         // Pfad zur lokalen Datei
    val mimeType: String,
    val size: Long,
    val cachedAt: Long
)
```

---

## 8. Implementierungsphasen

### Phase 1: Foundation (Woche 1-2)

```
Tag 1-2: Projekt-Setup
├── [ ] Neues Android Studio Projekt erstellen (net.prasco.tv)
├── [ ] Gradle Kotlin DSL konfigurieren
├── [ ] AndroidManifest.xml (Leanback, Permissions, Landscape)
├── [ ] build.gradle.kts mit allen Dependencies
├── [ ] .github/copilot-instructions.md einrichten
├── [ ] .vscode/ Konfigurationen erstellen
├── [ ] Git + GitHub Repository einrichten
└── [ ] README.md mit Quick Start

Tag 3-4: Core WebView
├── [ ] MainActivity.kt mit WebView (aus existierendem Code)
├── [ ] PrascoWebViewClient.kt (Error Handling, URL Filtering)
├── [ ] PrascoWebChromeClient.kt (Console Logs, Video Fullscreen)
├── [ ] Fullscreen Immersive Mode
├── [ ] D-Pad Key → JavaScript event injection
├── [ ] Hardware Acceleration konfigurieren
├── [ ] WebView Settings optimieren (Cache, DOM Storage, etc.)
└── [ ] Back-Button blockieren (Kiosk)

Tag 5-6: Connectivity & Error Handling
├── [ ] ConnectivityMonitor.kt (NetworkCallback API)
├── [ ] HealthCheckWorker.kt (WorkManager, alle 60s)
├── [ ] Auto-Reconnect bei Verbindungsverlust
├── [ ] Native ErrorOverlay.kt (Verbindungsfehler-Anzeige)
├── [ ] StatusOverlay.kt (Verbindungsstatus-Icon)
├── [ ] WebView Error Pages abfangen
└── [ ] Retry-Logic mit exponential backoff

Tag 7-8: Settings & Setup
├── [ ] PreferencesManager.kt (SharedPreferences)
├── [ ] SetupWizardActivity.kt (Ersteinrichtung)
│   ├── Server-URL Eingabe
│   ├── Verbindungstest
│   ├── Display-Name Vergabe
│   └── Bestätigung
├── [ ] SettingsActivity.kt (TV-optimiert mit D-Pad)
│   ├── Server-URL ändern
│   ├── Display Identifier
│   ├── Cache leeren
│   ├── App-Info (Version, Gerät)
│   └── Neustart
├── [ ] Geheime Tastenkombination (5x Menu → Settings)
└── [ ] AppConfig.kt (zentrale Konfiguration)

Tag 9-10: Auto-Start & Kiosk
├── [ ] BootReceiver.kt konfigurieren
├── [ ] DisplayService.kt (Foreground Service)
├── [ ] WakeLock Management
├── [ ] Lock Task Mode (Device Owner optional)
├── [ ] Screen-Timeout deaktivieren
└── [ ] Crash Recovery (PM-style auto-restart)
```

### Phase 2: Robustheit (Woche 3-4)

```
Tag 11-13: Offline-Cache
├── [ ] Room Database Setup (CacheDatabase)
├── [ ] OfflineCacheManager.kt
│   ├── Posts als JSON cachen
│   ├── Bilder lokal speichern
│   ├── Cache-Invalidierung (TTL)
│   └── Max Cache-Größe (100MB default)
├── [ ] Offline Display Page (raw/offline_display.html)
│   ├── Gecachte Posts anzeigen
│   ├── "Offline-Modus" Hinweis
│   └── Auto-Reconnect-Versuch
├── [ ] MediaCacheWorker.kt (Background Download)
└── [ ] JavaScript Bridge für Cache-Status

Tag 14-15: JavaScript Bridge
├── [ ] JavaScriptBridge.kt (@JavascriptInterface)
│   ├── getAppVersion() → String
│   ├── getDeviceInfo() → JSON
│   ├── getDisplayIdentifier() → String
│   ├── isOnline() → Boolean
│   ├── getCacheStatus() → JSON
│   ├── openSettings() → void
│   ├── log(message) → void
│   └── restartApp() → void
├── [ ] JS → Kotlin: Native Features aufrufen
└── [ ] Kotlin → JS: evaluateJavascript() für Events

Tag 16-17: Remote Configuration
├── [ ] PrascoApiClient.kt (Retrofit Setup)
├── [ ] Settings vom Server laden
│   ├── display.refreshInterval
│   ├── display.defaultDuration
│   ├── display.blendEffectsEnabled
│   └── display.transitionsExternalOnly
├── [ ] Display-Registrierung am Server
└── [ ] Heartbeat (alle 5 Min. Status an Server)

Tag 18-20: Testing & Polish
├── [ ] Unit Tests (API Client, Cache, Preferences)
├── [ ] Emulator Tests (TV Emulator)
├── [ ] Physische Geräte-Tests
│   ├── NVIDIA Shield
│   ├── Fire TV Stick
│   └── Chromecast w/ Google TV
├── [ ] Performance-Profiling (Memory, CPU)
├── [ ] APK Size Optimierung (ProGuard, shrinkResources)
└── [ ] Dokumentation aktualisieren
```

### Phase 3: Enterprise Features (Woche 5-6)

```
Tag 21-23: Admin & Sicherheit
├── [ ] Admin PIN (4-6 Ziffern, D-Pad-optimiert)
├── [ ] Verschlüsselte Speicherung (EncryptedSharedPreferences)
├── [ ] Certificate Pinning (optional)
├── [ ] Network Security Config (HTTPS/Cleartext)
└── [ ] ProGuard-Regeln finalisieren

Tag 24-26: OTA & Updates
├── [ ] UpdateService.kt
│   ├── Version-Check gegen Server (/api/system/app-version)
│   ├── APK Download im Hintergrund
│   ├── Update-Notification
│   └── PackageInstaller Intent
├── [ ] Auto-Update Einstellung
└── [ ] Rollback-Mechanismus

Tag 27-30: Scheduled Power & Analytics
├── [ ] ScheduleService.kt
│   ├── Display An/Aus nach Zeitplan
│   ├── Wochenplan (Mo-Fr 8-18, Sa-So aus)
│   ├── Feiertage (manuell konfigurierbar)
│   └── Bildschirm dimmen vs. komplett aus
├── [ ] Analytics Tracking
│   ├── Post View Counts
│   ├── Uptime Tracking
│   ├── Error Reporting
│   └── An Server senden
└── [ ] CI/CD Pipeline finalisieren
```

---

## 9. Dateistruktur - Initiale Dateien zum Erstellen

### 9.1 Reihenfolge der Datei-Erstellung

```
Runde 1: Projekt-Grundgerüst
1.  settings.gradle.kts
2.  build.gradle.kts (root)
3.  gradle.properties
4.  app/build.gradle.kts
5.  app/src/main/AndroidManifest.xml
6.  app/proguard-rules.pro
7.  .gitignore
8.  .editorconfig

Runde 2: Core-Klassen
9.  app/src/main/java/net/prasco/tv/PrascoApp.kt
10. app/src/main/java/net/prasco/tv/config/AppConfig.kt
11. app/src/main/java/net/prasco/tv/config/PreferencesManager.kt
12. app/src/main/java/net/prasco/tv/util/Logger.kt
13. app/src/main/java/net/prasco/tv/util/Extensions.kt
14. app/src/main/java/net/prasco/tv/util/DeviceInfo.kt

Runde 3: WebView
15. app/src/main/java/net/prasco/tv/MainActivity.kt
16. app/src/main/java/net/prasco/tv/webview/PrascoWebViewClient.kt
17. app/src/main/java/net/prasco/tv/webview/PrascoWebChromeClient.kt
18. app/src/main/java/net/prasco/tv/webview/JavaScriptBridge.kt

Runde 4: Network
19. app/src/main/java/net/prasco/tv/network/PrascoApiClient.kt
20. app/src/main/java/net/prasco/tv/network/ApiModels.kt
21. app/src/main/java/net/prasco/tv/network/ConnectivityMonitor.kt
22. app/src/main/java/net/prasco/tv/network/HealthCheckWorker.kt

Runde 5: UI & Settings
23. app/src/main/res/layout/activity_main.xml
24. app/src/main/res/layout/activity_settings.xml
25. app/src/main/res/layout/activity_setup.xml
26. app/src/main/res/layout/overlay_status.xml
27. app/src/main/java/net/prasco/tv/SettingsActivity.kt
28. app/src/main/java/net/prasco/tv/SetupWizardActivity.kt
29. app/src/main/java/net/prasco/tv/ui/overlay/StatusOverlay.kt
30. app/src/main/java/net/prasco/tv/ui/overlay/ErrorOverlay.kt

Runde 6: Services & Receiver
31. app/src/main/java/net/prasco/tv/receiver/BootReceiver.kt
32. app/src/main/java/net/prasco/tv/service/DisplayService.kt

Runde 7: Cache
33. app/src/main/java/net/prasco/tv/cache/CacheDatabase.kt
34. app/src/main/java/net/prasco/tv/cache/OfflineCacheManager.kt

Runde 8: Ressourcen
35. app/src/main/res/values/strings.xml
36. app/src/main/res/values-de/strings.xml
37. app/src/main/res/values/colors.xml
38. app/src/main/res/values/dimens.xml
39. app/src/main/res/values/themes.xml
40. app/src/main/res/xml/network_security_config.xml
41. app/src/main/res/drawable/banner.xml
42. app/src/main/res/raw/offline_display.html

Runde 9: Dokumentation
43. README.md
44. docs/API-INTEGRATION.md
45. docs/BUILD-GUIDE.md
46. docs/DEPLOYMENT.md
47. docs/ARCHITECTURE.md
48. CHANGELOG.md
```

---

## 10. Build, Test & Deployment

### 10.1 Build-Konfiguration

```kotlin
// app/build.gradle.kts

android {
    namespace = "net.prasco.tv"
    compileSdk = 34

    defaultConfig {
        applicationId = "net.prasco.tv"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        // Standard-Server URL (überschreibbar via Settings)
        buildConfigField("String", "DEFAULT_SERVER_URL", "\"http://192.168.1.100:3000\"")
        buildConfigField("String", "DISPLAY_PAGE_PATH", "\"/public/display.html\"")
        buildConfigField("String", "HEALTH_ENDPOINT", "\"/health\"")
    }

    buildTypes {
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
    }
}
```

### 10.2 Signierung (Release)

```powershell
# Keystore generieren (einmalig)
keytool -genkey -v `
  -keystore prasco-tv-release.keystore `
  -alias prasco-tv `
  -keyalg RSA -keysize 2048 `
  -validity 10000 `
  -storepass <password> `
  -keypass <password> `
  -dname "CN=PRASCO Digital Signage, O=PRASCO, L=City, C=DE"

# In gradle.properties (NICHT einchecken!)
RELEASE_STORE_FILE=../prasco-tv-release.keystore
RELEASE_STORE_PASSWORD=<password>
RELEASE_KEY_ALIAS=prasco-tv
RELEASE_KEY_PASSWORD=<password>
```

### 10.3 Deployment auf Geräte

```powershell
# Debug APK bauen + installieren
./gradlew installDebug

# Release APK bauen
./gradlew assembleRelease

# Über Netzwerk installieren (Android TV)
adb connect <tv-ip>:5555
adb install -r app/build/outputs/apk/release/app-release.apk

# Fire TV Stick
adb connect <fire-tv-ip>:5555
adb install -r app/build/outputs/apk/release/app-release.apk
```

### 10.4 CI/CD (GitHub Actions)

```yaml
# .github/workflows/build.yml
name: Build APK

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: gradle/actions/setup-gradle@v3
      - run: ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - run: ./gradlew test
      - run: ./gradlew lint
```

---

## 11. Qualitätssicherung

### 11.1 Testing-Strategie

| Ebene | Tool | Was testen |
|-------|------|------------|
| **Unit Tests** | JUnit 5, MockK | API Client, Cache, Preferences, Utils |
| **Integration Tests** | AndroidX Test | Room DB, WorkManager, WebView |
| **UI Tests** | Espresso | Settings Activity, Setup Wizard |
| **Manual Tests** | Physische Geräte | WebView-Rendering, D-Pad, Kiosk |

### 11.2 Test-Geräte Matrix

| Gerät | Android | Chip | Preis | Priorität |
|-------|---------|------|-------|-----------|
| Android TV Emulator | 14 | x86_64 | Kostenlos | P0 |
| NVIDIA Shield TV | 11+ | Tegra X1+ | ~150€ | P1 |
| Chromecast with Google TV | 12+ | Amlogic | ~40€ | P1 |
| Fire TV Stick 4K | Fire OS 7+ | MT8696 | ~35€ | P2 |
| Xiaomi Mi Box S | 9+ | Amlogic | ~60€ | P2 |

### 11.3 Checkliste vor Release

```
□ APK Size < 10MB (Debug < 15MB)
□ Kein ANR (Application Not Responding) in 24h Dauertest
□ Memory Leak Check (kein dauerhafter Anstieg)
□ Alle D-Pad Richtungen funktionieren
□ Boot Auto-Start funktioniert
□ Offline-Fallback zeigt gecachte Inhalte
□ Reconnect nach Netzwerk-Wiederherstellung < 10s
□ Video-Playback funktioniert (HTML5 + YouTube)
□ PowerPoint-Slides werden korrekt angezeigt
□ Blend-Effekte/Transitions laufen flüssig
□ Settings via geheime Tastenkombination erreichbar
□ ProGuard-Build startet korrekt
□ Keine Crashes in Logcat
□ Back-Button ist blockiert (Kiosk)
□ Screen bleibt dauerhaft an
```

---

## 12. Bekannte Limitierungen & Risiken

### 12.1 Technische Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------|--------|------------|
| WebView-Version variiert | Hoch | Mittel | Feature Detection, Minimum WebView Version Check |
| Fire TV hat kein Google Play | Hoch | Niedrig | Leanback-Abhängigkeit optional machen |
| Hardware-Beschleunigung instabil | Mittel | Hoch | Fallback auf Software-Rendering |
| Mixed Content (HTTP + HTTPS) | Mittel | Mittel | `network_security_config.xml` |
| CORS bei lokalen Dateien | Niedrig | Mittel | WebView `setAllowFileAccessFromFileURLs` |
| Android TV Standby killt App | Mittel | Hoch | Foreground Service + WakeLock |

### 12.2 Fire TV Spezifika

```
Amazon Fire TV nutzt eine modifizierte Android-Version:
- Kein Google Play Services → kein FCM Push
- Eigener App Store → zusätzlicher Review-Prozess
- Amazon-eigene Remote → andere Key-Codes möglich
- Fire OS Updates kommen verzögert
→ Lösung: Fire TV als sekundäres Ziel, nicht primär
```

### 12.3 WebView-Versionsprobleme

```
Android TV Geräte aktualisieren den System WebView oft nicht:
- API 21 (Lollipop): WebView ~Chrome 37 → Kein ES6 Modules
- API 24 (Nougat): WebView ~Chrome 51 → Basis ES6 Support
- API 28+ : WebView ~Chrome 70+ → Modernes JS
→ Lösung: display.js muss ES5-kompatibel bleiben oder Polyfills nutzen
```

---

## Zusammenfassung der Aufwandsschätzung

| Phase | Zeitraum | Aufwand | Ergebnis |
|-------|----------|---------|----------|
| **Phase 1: Foundation** | Woche 1-2 | ~40h | Funktionsfähige App mit WebView, Settings, Kiosk |
| **Phase 2: Robustheit** | Woche 3-4 | ~40h | Offline-Cache, JS Bridge, Remote Config, Tests |
| **Phase 3: Enterprise** | Woche 5-6 | ~40h | Admin PIN, OTA, Scheduling, Analytics |
| **Gesamt** | 6 Wochen | ~120h | Production-Ready Android TV App |

---

## Quick Start für KI-gestützte Entwicklung

```
1. Neues VS Code Fenster öffnen
2. Ordner "prasco-android-tv" öffnen
3. Copilot Chat: "Erstelle das Projekt gemäß ANDROID-TV-IMPLEMENTATION-PLAN.md Phase 1, Tag 1-2"
4. Schrittweise durch die Phasen arbeiten
5. Nach jeder Runde: Build testen mit `./gradlew assembleDebug`
6. Nach jeder Phase: Auf physischem Gerät testen
```

---

**Erstellt:** 2026-02-25
**Version:** 1.0
**Autor:** GitHub Copilot
