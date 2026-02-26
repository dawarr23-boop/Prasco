# PRASCO Android TV App – Vollständige Entwicklungsanleitung für AI-Agent

> **Ziel:** Erweitere die bestehende Android TV WebView-App um eine native Display-Auswahl, Server-Konfiguration, Connectivity-Handling und Offline-Fallback.

---

## 1. PROJEKTÜBERSICHT

### 1.1 Was ist PRASCO?
PRASCO ist eine Enterprise Digital Signage Plattform (Node.js/Express/TypeScript/PostgreSQL). Inhalte (Text, Bilder, Videos, PDFs, PowerPoints, HTML) werden über ein Admin-Dashboard verwaltet und auf Displays angezeigt. Die Android TV App ist ein WebView-Wrapper, der die Web-Oberfläche `/display?id={identifier}` lädt.

### 1.2 Aktueller Stand
Es existiert ein funktionierender **minimaler WebView-Wrapper** im Verzeichnis `android-tv-project/`. Dieser lädt eine fest eingestellte URL und zeigt den PRASCO Display-Inhalt. Er hat **keine** Display-Auswahl, keine Server-Konfiguration und kein Offline-Handling.

### 1.3 Server-Details
- **Produktions-URL:** `https://212.227.20.158` (Nginx Reverse Proxy → Port 3000)
- **Internes HTTP:** `http://212.227.20.158:3000` (direkt, ohne SSL)
- **SSL:** Selbstsigniertes Zertifikat (10 Jahre) — die App MUSS selbstsignierte Zertifikate akzeptieren
- **Health-Check:** `GET /api/health` → `{ "status": "ok", "timestamp": "...", "uptime": ... }`

---

## 2. BESTEHENDER CODE

### 2.1 Projektstruktur
```
android-tv-project/
├── app/
│   ├── build.gradle                    # Kotlin, SDK 34, minSdk 21
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml         # Leanback, Landscape, Cleartext
│       ├── java/net/prasco/display/tv/
│       │   └── MainActivity.kt         # Minimaler WebView-Wrapper
│       └── res/
│           ├── drawable/banner.xml     # TV Launcher Banner
│           ├── mipmap-hdpi/ic_launcher.xml
│           └── values/strings.xml
├── build.gradle                        # Root, Kotlin 1.9.0, AGP 8.1.2
├── settings.gradle
├── gradle.properties
├── gradlew / gradlew.bat
└── gradle/
    └── wrapper/gradle-wrapper.properties
```

### 2.2 Aktuelle MainActivity.kt
```kotlin
package net.prasco.display.tv

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val DEFAULT_URL = "http://192.168.1.100:3000/display"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        )
        webView = WebView(this)
        setContentView(webView)
        webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                setRenderPriority(WebSettings.RenderPriority.HIGH)
                useWideViewPort = true
                loadWithOverviewMode = true
                setSupportZoom(false)
            }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean = false
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    view?.evaluateJavascript("document.body.style.cursor = 'none';", null)
                }
            }
            loadUrl(DEFAULT_URL)
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
    }

    override fun onPause() { super.onPause(); webView.onPause() }
    override fun onDestroy() { super.onDestroy(); webView.destroy() }
}
```

### 2.3 Aktuelle AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-feature android:name="android.software.leanback" android:required="true" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.Leanback"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="landscape"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
        <meta-data android:name="android.app.banner" android:resource="@drawable/banner" />
    </application>
</manifest>
```

### 2.4 Build-Konfiguration (app/build.gradle)
```gradle
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}
android {
    namespace 'net.prasco.display.tv'
    compileSdk 34
    defaultConfig {
        applicationId "net.prasco.display.tv"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
    buildTypes {
        release { minifyEnabled true; shrinkResources true; proguardFiles ... }
        debug { minifyEnabled false; debuggable true }
    }
    compileOptions { sourceCompatibility JavaVersion.VERSION_1_8; targetCompatibility JavaVersion.VERSION_1_8 }
    kotlinOptions { jvmTarget = '1.8' }
}
dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.leanback:leanback:1.0.0'
}
```

---

## 3. ZIEL-FEATURES (zu implementieren)

### Feature 1: Server-Konfiguration (Erststart)
Beim ersten Start (oder wenn kein Server konfiguriert ist) zeige einen nativen Setup-Screen:
- Eingabefeld für **Server-URL** (z.B. `https://212.227.20.158` oder `http://192.168.1.100:3000`)
- **"Verbindung testen"**-Button → ruft `GET {serverUrl}/api/health` auf
- Erfolg: Grünes Häkchen + "Verbunden mit PRASCO v2.0.0"
- Fehler: Rote Meldung + Retry
- Speichere URL in `SharedPreferences` (`prasco_server_url`)
- Der Setup-Screen muss mit **D-Pad / Fernbedienung** bedienbar sein (kein Touchscreen!)

### Feature 2: Display-Auswahl
Nach erfolgreicher Server-Verbindung zeige eine **Display-Auswahlliste**:
- Rufe `GET {serverUrl}/api/public/displays` auf (kein Auth nötig!)
- Zeige eine Liste/Grid aller aktiven Displays mit Name und Identifier
- User wählt per D-Pad/Enter ein Display aus
- Speichere gewählten `identifier` in `SharedPreferences` (`selected_display_id`)
- Lade dann WebView mit URL: `{serverUrl}/display?id={identifier}`

**API-Response von `/api/public/displays`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Prasco Display 1",
      "identifier": "display01",
      "description": null,
      "isActive": true,
      "organizationId": 1
    },
    {
      "id": 2,
      "name": "Prasco Display 2",
      "identifier": "display02",
      "description": null,
      "isActive": true,
      "organizationId": 1
    }
  ],
  "count": 2
}
```

### Feature 3: App-Flow
```
App-Start
  │
  ├── SharedPreferences hat server_url UND selected_display_id?
  │     ├── JA → Health-Check → OK? → WebView laden
  │     │                       └── FAIL → Offline-Screen / Retry
  │     └── NEIN → Setup-Screen anzeigen
  │
  Setup-Screen
  │  ├── Server-URL eingeben
  │  ├── "Verbindung testen" → GET /api/health
  │  └── Erfolg → Display-Auswahl anzeigen
  │
  Display-Auswahl
  │  ├── GET /api/public/displays
  │  ├── Liste anzeigen (D-Pad navigierbar)
  │  └── Auswahl → SharedPreferences speichern → WebView starten
  │
  WebView (Hauptansicht)
  │  ├── URL: {serverUrl}/display?id={identifier}
  │  ├── Fullscreen, Immersive, KEEP_SCREEN_ON
  │  ├── Fernbedienung: Menü-Taste → Settings-Overlay
  │  └── Connectivity-Loss → Overlay "Keine Verbindung" + Auto-Retry
```

### Feature 4: Settings-Zugang über Fernbedienung
- **Menü-Taste** (KEYCODE_MENU) oder **Langdruck auf Zurück** öffnet ein Settings-Overlay:
  - Aktueller Server: `https://212.227.20.158`
  - Aktuelles Display: `Prasco Display 1 (display01)`
  - Button: "Server ändern" → Setup-Screen
  - Button: "Display ändern" → Display-Auswahl
  - Button: "Cache leeren" → WebView Cache löschen + Reload
  - Button: "Schließen" → Zurück zum WebView
- Das Overlay muss per D-Pad steuerbar sein

### Feature 5: Connectivity-Handling
- Überwache Netzwerkstatus mit `ConnectivityManager`
- Bei Verbindungsverlust: Zeige natives Overlay über dem WebView:
  ```
  ⚠️ Keine Netzwerkverbindung
  Versuche Wiederverbindung in 10s...
  [Jetzt erneut versuchen]
  ```
- Auto-Retry alle 10 Sekunden
- Bei Wiederverbindung: Overlay ausblenden + WebView neu laden
- Bei WebView-Fehler (HTTP-Fehler, Timeout): Ähnliches Overlay mit "Server nicht erreichbar"

### Feature 6: SSL-Handling
- Die App MUSS selbstsignierte SSL-Zertifikate akzeptieren
- Implementiere `WebViewClient.onReceivedSslError()` → `handler.proceed()`
- Implementiere auch für die nativen HTTP-Calls (OkHttp/HttpURLConnection) einen Trust-All-Manager
- **Wichtig:** Dies ist für den produktiven Einsatz mit selbstsignierten Zertifikaten auf dem Strato V-Server gedacht

### Feature 7: Keep Screen On + Wake Lock
- `FLAG_KEEP_SCREEN_ON` setzen (Display bleibt an)
- Optional: `PowerManager.PARTIAL_WAKE_LOCK` als Backup
- Screen darf sich NIEMALS ausschalten während die App läuft

### Feature 8: Autostart bei Boot (optional)
- `BroadcastReceiver` für `BOOT_COMPLETED`
- Starte `MainActivity` automatisch nach TV-Neustart
- Konfigurierbar in Settings (default: aus)

---

## 4. VOLLSTÄNDIGE API-REFERENZ

### 4.1 Für die Android TV App relevante Endpoints (alle OHNE Auth)

| Methode | Pfad | Beschreibung | Response |
|---------|------|-------------|----------|
| `GET` | `/api/health` | Server-Verfügbarkeit prüfen | `{ "status": "ok", "timestamp": "...", "uptime": ... }` |
| `GET` | `/api/public/info` | App-Info (Version, Name) | `{ success, data: { name, version, developer } }` |
| `GET` | `/api/public/displays` | Alle aktiven Displays | `{ success, data: Display[], count }` |
| `GET` | `/api/public/display/{identifier}/posts` | Posts für ein Display | `{ success, data: Post[], display: { id, name, identifier } }` |
| `GET` | `/api/public/posts` | Alle aktiven Posts | `{ success, data: Post[] }` |
| `GET` | `/api/public/categories` | Alle Kategorien | `{ success, data: Category[] }` |
| `GET` | `/api/settings?category=display` | Display-Einstellungen | `{ "display.refreshInterval": "5", ... }` |
| `GET` | `/api/settings?category=transit` | ÖPNV-Einstellungen | `{ "transit.enabled": "true", ... }` |
| `GET` | `/api/settings?category=traffic` | Verkehr-Einstellungen | `{ "traffic.enabled": "true", ... }` |
| `GET` | `/api/transit/departures/{stationId}` | ÖPNV-Abfahrten | `{ success, data: Departure[] }` |
| `GET` | `/api/traffic/highways?roads=A1,A2` | Autobahn-Status | `{ success, data: HighwayStatus[] }` |

### 4.2 WebView-URL
Die Haupt-URL für den WebView ist:
```
{serverUrl}/display?id={displayIdentifier}
```
Beispiel: `https://212.227.20.158/display?id=display01`

Diese Seite rendert automatisch alle Posts für das gewählte Display mit:
- Auto-Rotation (konfigurierbare Dauer pro Post)
- Blend-Effekte/Übergänge
- Video-Wiedergabe (YouTube, Vimeo, lokale Videos)
- PDF-/PowerPoint-Anzeige
- ÖPNV- und Verkehrs-Widgets (zeitgesteuert)
- Hintergrundmusik

Die `/display`-Seite hat ihr eigenes JavaScript (`display.js`), das alles client-seitig handhabt. Die Android App muss hier NICHT eingreifen — sie stellt nur den WebView-Container bereit.

### 4.3 Datenmodelle

**Display:**
```json
{
  "id": 1,
  "name": "Prasco Display 1",
  "identifier": "display01",
  "description": "Beschreibung oder null",
  "isActive": true,
  "organizationId": 1
}
```

**Post (vereinfacht, wie von /api/public/display/{id}/posts geliefert):**
```json
{
  "id": 42,
  "title": "Willkommen",
  "content": "Text oder URL oder HTML",
  "contentType": "text|image|video|html|presentation|pdf|word",
  "duration": 10,
  "priority": 5,
  "isActive": true,
  "showTitle": true,
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-03-01T00:00:00.000Z",
  "displayMode": "all|specific",
  "blendEffect": "fade|slide-left|slide-right|zoom-in|null",
  "backgroundMusicUrl": "/uploads/originals/music.mp3",
  "backgroundMusicVolume": 50,
  "viewCount": 123,
  "category": { "id": 1, "name": "Allgemein", "color": "#c41e3a", "icon": "📢" },
  "media": { "id": 5, "url": "/uploads/originals/bild.jpg", "thumbnailUrl": "/uploads/thumbnails/bild_thumb.jpg", "mimeType": "image/jpeg" }
}
```

---

## 5. TECHNISCHE ANFORDERUNGEN

### 5.1 Package & IDs
- **Package:** `net.prasco.display.tv`
- **App-Name:** `PRASCO Display`
- **Min SDK:** 21 (Android 5.0 Lollipop)
- **Target SDK:** 34 (Android 14)
- **Kotlin**

### 5.2 Dependencies (bereits vorhanden + neue)
```gradle
// Bestehend:
implementation 'androidx.core:core-ktx:1.12.0'
implementation 'androidx.appcompat:appcompat:1.6.1'
implementation 'androidx.leanback:leanback:1.0.0'

// NEU hinzufügen:
implementation 'com.google.android.material:material:1.11.0'   // Material Design Components
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'  // Coroutines für async HTTP
implementation 'com.squareup.okhttp3:okhttp:4.12.0'  // HTTP-Client für API-Calls
implementation 'org.json:json:20230618'  // JSON-Parsing (oder nutze org.json aus Android SDK)
```

### 5.3 Permissions
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />  <!-- NEU für Autostart -->
```

### 5.4 D-Pad / Fernbedienungs-Navigation
- **ALLE UI-Elemente** müssen mit D-Pad (Pfeiltasten + Enter/OK) navigierbar sein
- `android:focusable="true"` und `android:nextFocusDown/Up/Left/Right` setzen
- Sichtbares Focus-Highlighting (z.B. farbige Border oder Elevation)
- Kein Touch-only UI! Android TV hat keinen Touchscreen
- Textfelder: Software-Tastatur erscheint automatisch bei Fokus auf EditText

### 5.5 Design-Richtlinien
- Dunkel-Design passend zum PRASCO Branding
  - Hintergrund: `#1a1a2e` (dunkelblau)
  - Karten: `#16213e` mit leichter Elevation
  - Primärfarbe: `#4CAF50` (Grün, wie im PRASCO Dashboard)
  - Akzentfarbe: `#2196F3` (Blau)
  - Text: `#ffffff` (Weiß) und `#b0b0b0` (Grau für Sekundärtext)
- Große Schrift (TV wird aus Entfernung gelesen): mindestens 18sp, Überschriften 28sp+
- Großzügige Abstände (`padding: 24dp+`)

---

## 6. DATEISTRUKTUR (Ziel)

```
android-tv-project/app/src/main/
├── AndroidManifest.xml
├── java/net/prasco/display/tv/
│   ├── MainActivity.kt              # ← ERWEITERN (Flow-Controller)
│   ├── SetupActivity.kt             # NEU: Server-URL eingeben + testen
│   ├── DisplaySelectActivity.kt     # NEU: Display-Auswahl aus API
│   ├── WebViewActivity.kt           # NEU: WebView mit Overlay-Handling
│   ├── BootReceiver.kt              # NEU: Autostart bei Boot
│   ├── NetworkMonitor.kt            # NEU: Connectivity-Überwachung
│   └── PrascoPreferences.kt         # NEU: SharedPreferences Wrapper
└── res/
    ├── layout/
    │   ├── activity_setup.xml        # Server-Setup Screen
    │   ├── activity_display_select.xml  # Display-Auswahl Grid
    │   ├── activity_webview.xml      # WebView + Overlays
    │   ├── item_display_card.xml     # Einzelne Display-Karte
    │   └── overlay_settings.xml      # Settings-Overlay
    ├── drawable/
    │   ├── banner.xml
    │   ├── bg_card.xml               # Karten-Hintergrund
    │   ├── bg_card_focused.xml       # Karten-Fokus
    │   ├── bg_button.xml             # Button-Style
    │   └── ic_prasco_logo.xml        # Logo
    ├── values/
    │   ├── strings.xml
    │   ├── colors.xml                # PRASCO Farbpalette
    │   ├── styles.xml                # TV-optimierte Styles
    │   └── dimens.xml                # Größen
    └── mipmap-*/ (App-Icons)
```

---

## 7. IMPLEMENTIERUNGSDETAILS

### 7.1 PrascoPreferences.kt
```kotlin
class PrascoPreferences(context: Context) {
    private val prefs = context.getSharedPreferences("prasco_config", Context.MODE_PRIVATE)

    var serverUrl: String?
        get() = prefs.getString("prasco_server_url", null)
        set(value) = prefs.edit().putString("prasco_server_url", value).apply()

    var selectedDisplayId: String?
        get() = prefs.getString("selected_display_id", null)
        set(value) = prefs.edit().putString("selected_display_id", value).apply()

    var selectedDisplayName: String?
        get() = prefs.getString("selected_display_name", null)
        set(value) = prefs.edit().putString("selected_display_name", value).apply()

    var autoStartEnabled: Boolean
        get() = prefs.getBoolean("auto_start_enabled", false)
        set(value) = prefs.edit().putBoolean("auto_start_enabled", value).apply()

    fun isConfigured(): Boolean = !serverUrl.isNullOrBlank() && !selectedDisplayId.isNullOrBlank()

    fun getDisplayUrl(): String = "${serverUrl}/display?id=${selectedDisplayId}"

    fun clear() = prefs.edit().clear().apply()
}
```

### 7.2 MainActivity.kt (Router)
```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = PrascoPreferences(this)

        if (prefs.isConfigured()) {
            // Direkt zum WebView
            startActivity(Intent(this, WebViewActivity::class.java))
        } else {
            // Setup erforderlich
            startActivity(Intent(this, SetupActivity::class.java))
        }
        finish()
    }
}
```

### 7.3 SetupActivity.kt — Server-Konfiguration
- Ein großes zentriertes Layout mit:
  - PRASCO Logo oben
  - "PRASCO Display einrichten" Überschrift
  - EditText für Server-URL (Vorausgefüllt mit `https://`)
  - Button "Verbindung testen"
  - Status-Text (Ergebnis: ✅ Verbunden / ❌ Fehler)
  - Button "Weiter" (erst aktiv wenn Test erfolgreich)
- HTTP-Call: `GET {url}/api/health`
  - Timeout: 10 Sekunden
  - SSL: Trust all certificates (selbstsigniert!)
  - Erfolgreich wenn Response JSON enthält `"status": "ok"`
  - Zeige Server-Version aus `GET {url}/api/public/info` → `data.version`

### 7.4 DisplaySelectActivity.kt — Display-Auswahl
- API-Call: `GET {serverUrl}/api/public/displays`
- Zeige Karten-Grid (VerticalGridView aus Leanback oder einfaches RecyclerView):
  ```
  ┌─────────────────────┐  ┌─────────────────────┐
  │  📺                  │  │  📺                  │
  │  Prasco Display 1    │  │  Prasco Display 2    │
  │  display01            │  │  display02            │
  │  Beschreibung...      │  │  Beschreibung...      │
  └─────────────────────┘  └─────────────────────┘
  ```
- Jede Karte ist focusable (D-Pad navigierbar)
- Bei Fokus: Karte vergrößern/hervorheben (scale 1.05 + grüne Border)
- Bei Enter/OK: Display auswählen → speichern → WebViewActivity starten
- Fehler-Handling: Wenn API-Call fehlschlägt → "Keine Displays gefunden" + Retry-Button

### 7.5 WebViewActivity.kt — Hauptansicht
- WebView lädt `{serverUrl}/display?id={identifier}`
- **SSL-Handling:**
  ```kotlin
  webViewClient = object : WebViewClient() {
      override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
          handler?.proceed()  // Selbstsignierte Zertifikate akzeptieren
      }
  }
  ```
- **Keep Screen On:**
  ```kotlin
  window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  ```
- **Fehler-Overlay:** Bei `onReceivedError()` oder `onReceivedHttpError()`:
  - Zeige natives Overlay über dem WebView (FrameLayout)
  - "Server nicht erreichbar" + Countdown + Retry-Button
- **Menü-Taste → Settings-Overlay:**
  - Aktuellen Server und Display anzeigen
  - Buttons: Server ändern, Display ändern, Cache leeren, Schließen
- **Fernbedienungs-Mapping:**
  - `KEYCODE_MENU` → Settings-Overlay
  - `KEYCODE_BACK` (Langdruck 3s) → Settings-Overlay (Fallback wenn kein Menü-Taste)
  - `KEYCODE_BACK` (kurz) → Nichts tun (WebView soll nicht verlassen werden)

### 7.6 NetworkMonitor.kt
```kotlin
class NetworkMonitor(context: Context, private val onStatusChange: (Boolean) -> Unit) {
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) { onStatusChange(true) }
        override fun onLost(network: Network) { onStatusChange(false) }
    }

    fun start() {
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, networkCallback)
    }

    fun stop() { connectivityManager.unregisterNetworkCallback(networkCallback) }

    fun isConnected(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val caps = connectivityManager.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
```

### 7.7 BootReceiver.kt
```kotlin
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val prefs = PrascoPreferences(context)
            if (prefs.autoStartEnabled && prefs.isConfigured()) {
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(launchIntent)
            }
        }
    }
}
```

---

## 8. UI-LAYOUTS (Richtlinie)

### 8.1 Setup-Screen
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    🖥️ PRASCO Logo                        │
│                                                          │
│              PRASCO Display einrichten                    │
│                                                          │
│    ┌──────────────────────────────────────────┐          │
│    │ https://212.227.20.158                    │          │
│    └──────────────────────────────────────────┘          │
│                                                          │
│              [ Verbindung testen ]                        │
│                                                          │
│         ✅ Verbunden mit PRASCO v2.0.0                   │
│                                                          │
│                  [ Weiter → ]                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 8.2 Display-Auswahl
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│           Display auswählen                              │
│           Wähle das Display für dieses Gerät             │
│                                                          │
│  ┌───────────────────┐   ┌───────────────────┐          │
│  │ 📺                │   │ 📺                │          │
│  │ Prasco Display 1  │   │ Prasco Display 2  │          │
│  │ display01          │   │ display02          │          │
│  └───────────────────┘   └───────────────────┘          │
│                                                          │
│  ← Zurück zur Server-Konfiguration                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 8.3 Settings-Overlay (über WebView)
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  WebView (darunter, abgedunkelt)                         │
│                                                          │
│       ┌────────────────────────────┐                     │
│       │  ⚙️ PRASCO Einstellungen   │                     │
│       │                            │                     │
│       │  Server:                   │                     │
│       │  https://212.227.20.158    │                     │
│       │                            │                     │
│       │  Display:                  │                     │
│       │  Prasco Display 1          │                     │
│       │  (display01)               │                     │
│       │                            │                     │
│       │  [ Server ändern    ]      │                     │
│       │  [ Display ändern   ]      │                     │
│       │  [ Cache leeren     ]      │                     │
│       │  [ Autostart: AUS   ]      │                     │
│       │  [ Schließen         ]      │                     │
│       └────────────────────────────┘                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 9. WICHTIGE HINWEISE

### 9.1 SSL / Selbstsignierte Zertifikate
Der PRASCO Server unter `https://212.227.20.158` verwendet ein **selbstsigniertes SSL-Zertifikat**. Sowohl der WebView als auch native HTTP-Calls (OkHttp) müssen dies akzeptieren. Ohne dieses Handling funktioniert NICHTS.

### 9.2 Kein Auth erforderlich
Alle für die Display-App relevanten Endpoints sind **öffentlich** (kein Bearer-Token nötig). Die App muss KEIN Login implementieren.

### 9.3 WebView ist die Haupt-Rendering-Engine
Die App rendert Inhalte NICHT selbst nativ. Der WebView lädt die PRASCO `/display`-Seite, die das gesamte Post-Rendering, Video-Playback, Übergänge etc. übernimmt. Die native App ist nur der Container mit Setup, Display-Auswahl und Connectivity-Handling.

### 9.4 D-Pad ist Pflicht
Android TV hat keinen Touchscreen. JEDER Screen muss vollständig mit D-Pad (oben/unten/links/rechts + Enter/OK + Zurück) bedienbar sein.

### 9.5 Bildschirm darf nie ausgehen
Digital Signage Displays laufen 24/7. `FLAG_KEEP_SCREEN_ON` ist Pflicht.

### 9.6 Sprache
Die App-UI soll auf **Deutsch** sein (wie der Rest von PRASCO).

---

## 10. BUILD & TEST

### 10.1 Build-Kommandos (PowerShell)
```powershell
cd C:\Users\chris\Prasco2\prasco\android-tv-project
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\chris\AppData\Local\Android\Sdk"

# Debug-Build
.\gradlew.bat assembleDebug

# APK-Pfad: app\build\outputs\apk\debug\app-debug.apk
```

### 10.2 Installation auf Android TV
```powershell
# Via ADB
adb connect <TV-IP>:5555
adb install -r app\build\outputs\apk\debug\app-debug.apk
adb shell am start -n net.prasco.display.tv/.MainActivity
```

### 10.3 Test-Checkliste
- [ ] Erster Start → Setup-Screen erscheint
- [ ] Server-URL eingeben → "Verbindung testen" → Grünes Häkchen
- [ ] Weiter → Display-Liste wird geladen und angezeigt
- [ ] Display auswählen → WebView startet mit korrektem Content
- [ ] App schließen + neu öffnen → Direkt zum WebView (kein Setup nötig)
- [ ] Menü-Taste → Settings-Overlay erscheint
- [ ] "Display ändern" → Zurück zur Display-Auswahl
- [ ] "Server ändern" → Zurück zum Setup
- [ ] "Cache leeren" → WebView reloaded
- [ ] WLAN ausschalten → "Keine Verbindung" Overlay
- [ ] WLAN einschalten → Overlay verschwindet, WebView lädt nach
- [ ] Alle Screens mit D-Pad bedienbar (kein Touch nötig)
- [ ] Bildschirm bleibt dauerhaft an
- [ ] Selbstsigniertes SSL-Zertifikat wird akzeptiert

---

## 11. ZUSAMMENFASSUNG

| Was | Details |
|-----|---------|
| **Sprache** | Kotlin |
| **Min SDK** | 21 |
| **Architektur** | Native Shell (Setup + Display-Auswahl) + WebView (Content-Rendering) |
| **Server-API** | Alle Endpoints öffentlich, kein Auth nötig |
| **Display-Liste** | `GET /api/public/displays` |
| **WebView-URL** | `{serverUrl}/display?id={identifier}` |
| **Navigation** | D-Pad / Fernbedienung (kein Touchscreen) |
| **SSL** | Selbstsigniert → Trust all |
| **Persistenz** | SharedPreferences für Server-URL + Display-ID |
| **Sprache UI** | Deutsch |
