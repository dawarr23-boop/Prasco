# PRASCO Android Offline-Modus mit Ad-Hoc WiFi

Implementierungsanleitung für einen Offline-Modus, bei dem das Android-Gerät als PRASCO-Server und WiFi-Hotspot fungiert.

## 📡 Übersicht

Der Offline-Modus ermöglicht:
- ✅ Betrieb ohne Internet/externes Netzwerk
- ✅ Android-Gerät erstellt eigenen WiFi-Hotspot
- ✅ Andere Geräte (PC, Tablet, Smartphone) können sich verbinden
- ✅ Zugriff auf Admin-Panel über lokales Netzwerk
- ✅ Display läuft weiterhin normal
- ✅ Keine externe Server-Infrastruktur nötig

## 🎯 Anwendungsfälle

- **Mobile Events**: Messen, Konferenzen ohne WLAN
- **Outdoor-Displays**: Parks, Baustellen, temporäre Installationen
- **Notfall-Backup**: Bei Ausfall der Netzwerkinfrastruktur
- **Demo-Modus**: Vorführungen ohne Internet
- **Remote Locations**: Standorte ohne Netzwerkanbindung

## 🏗️ Architektur-Optionen

### Option 1: Embedded Node.js Server ⭐⭐⭐ (Empfohlen)

**Konzept:** Node.js Server direkt in der Android-App eingebettet

**Vorteile:**
- Vollständige PRASCO-Funktionalität
- Admin-Panel nutzbar
- API-Zugriff möglich
- Datenbank lokal (SQLite)

**Nachteile:**
- Größere App (~50-100 MB)
- Komplexere Implementierung
- Performance abhängig vom Gerät

**Technologie:** Node.js auf Android via J2V8 oder Termux

### Option 2: Embedded Web Server (Lightweight) ⭐⭐

**Konzept:** Einfacher HTTP-Server in der App

**Vorteile:**
- Kleiner (~10 MB zusätzlich)
- Einfacher zu implementieren
- Gute Performance

**Nachteile:**
- Nur statische Inhalte
- Kein Admin-Panel (nur lesend)
- Keine dynamischen API-Calls

**Technologie:** NanoHTTPD oder AndroidAsync

### Option 3: WiFi Direct + WebRTC ⭐

**Konzept:** Peer-to-Peer Verbindung ohne Server

**Vorteile:**
- Keine Server-Komponente
- Direkte Verbindung

**Nachteile:**
- Sehr komplex
- Nur für einzelne Clients
- Eingeschränkte Funktionalität

## 🚀 Implementierung: Option 1 - Embedded Node.js Server

### Schritt 1: Abhängigkeiten hinzufügen

```gradle
// app/build.gradle
dependencies {
    // Existing dependencies
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.leanback:leanback:1.0.0'
    
    // Node.js Integration
    implementation 'com.eclipsesource.j2v8:j2v8:6.2.1@aar'
    
    // NanoHTTPD als Fallback
    implementation 'org.nanohttpd:nanohttpd:2.3.1'
    implementation 'org.nanohttpd:nanohttpd-webserver:2.3.1'
    
    // SQLite
    implementation 'androidx.sqlite:sqlite:2.4.0'
}
```

### Schritt 2: Permissions hinzufügen

```xml
<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="net.prasco.display.tv">

    <!-- Bestehende Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- NEU: Offline-Modus Permissions -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
    <!-- Android 13+ -->
    <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" 
        android:usesPermissionFlags="neverForLocation" />
    
    <!-- Hotspot erstellen (benötigt System-App oder Root) -->
    <uses-permission android:name="android.permission.WRITE_SETTINGS" 
        tools:ignore="ProtectedPermissions" />

    <application>
        <!-- ... -->
    </application>
</manifest>
```

### Schritt 3: WiFi Hotspot Service erstellen

```kotlin
// HotspotService.kt
package net.prasco.display.tv

import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import java.lang.reflect.Method

class HotspotService : Service() {

    private lateinit var wifiManager: WifiManager
    private var isHotspotEnabled = false
    
    companion object {
        const val TAG = "HotspotService"
        const val HOTSPOT_SSID = "PRASCO-Display"
        const val HOTSPOT_PASSWORD = "prasco123"
        const val SERVER_PORT = 3000
    }

    override fun onCreate() {
        super.onCreate()
        wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "START_HOTSPOT" -> startHotspot()
            "STOP_HOTSPOT" -> stopHotspot()
        }
        return START_STICKY
    }

    private fun startHotspot() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Android 8+ - Verwendet neue API
            startHotspotModern()
        } else {
            // Android 7 und älter - Verwendet Reflection
            startHotspotLegacy()
        }
    }

    @Suppress("DEPRECATION")
    private fun startHotspotLegacy() {
        try {
            val wifiConfig = WifiConfiguration().apply {
                SSID = HOTSPOT_SSID
                preSharedKey = HOTSPOT_PASSWORD
                allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK)
            }

            val method: Method = wifiManager.javaClass.getMethod(
                "setWifiApEnabled",
                WifiConfiguration::class.java,
                Boolean::class.javaPrimitiveType
            )
            
            method.invoke(wifiManager, wifiConfig, true)
            isHotspotEnabled = true
            
            Log.i(TAG, "Hotspot gestartet: $HOTSPOT_SSID")
        } catch (e: Exception) {
            Log.e(TAG, "Fehler beim Starten des Hotspots", e)
        }
    }

    private fun startHotspotModern() {
        // Android 8+ - Benutzer muss Hotspot manuell aktivieren
        // Wir können nur anleiten
        Log.w(TAG, "Android 8+ - Hotspot muss manuell aktiviert werden")
        
        // Zeige Notification mit Anleitung
        showHotspotInstructions()
    }

    private fun showHotspotInstructions() {
        // TODO: Notification mit Anleitung anzeigen
        // "Bitte aktiviere WiFi-Hotspot in Einstellungen"
    }

    private fun stopHotspot() {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                val method: Method = wifiManager.javaClass.getMethod(
                    "setWifiApEnabled",
                    WifiConfiguration::class.java,
                    Boolean::class.javaPrimitiveType
                )
                method.invoke(wifiManager, null, false)
            }
            isHotspotEnabled = false
            Log.i(TAG, "Hotspot gestoppt")
        } catch (e: Exception) {
            Log.e(TAG, "Fehler beim Stoppen des Hotspots", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
```

### Schritt 4: Embedded HTTP Server erstellen

```kotlin
// EmbeddedServer.kt
package net.prasco.display.tv

import android.content.Context
import android.util.Log
import fi.iki.elonen.NanoHTTPD
import java.io.File
import java.io.FileInputStream

class EmbeddedServer(private val context: Context, port: Int = 3000) : NanoHTTPD(port) {

    companion object {
        const val TAG = "EmbeddedServer"
    }

    init {
        // Kopiere Assets zu lokalem Storage
        copyAssetsToStorage()
    }

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri
        Log.d(TAG, "Request: $uri")

        return when {
            uri == "/" || uri == "/display" -> serveDisplayPage()
            uri.startsWith("/admin") -> serveAdminPage()
            uri.startsWith("/api") -> serveAPI(session)
            uri.startsWith("/css") -> serveStaticFile(uri, "text/css")
            uri.startsWith("/js") -> serveStaticFile(uri, "application/javascript")
            uri.startsWith("/uploads") -> serveStaticFile(uri, getMimeType(uri))
            else -> newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "404 Not Found")
        }
    }

    private fun serveDisplayPage(): Response {
        return try {
            val html = context.assets.open("display.html").bufferedReader().use { it.readText() }
            newFixedLengthResponse(Response.Status.OK, "text/html", html)
        } catch (e: Exception) {
            Log.e(TAG, "Error serving display page", e)
            newFixedLengthResponse(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, "Error: ${e.message}")
        }
    }

    private fun serveAdminPage(): Response {
        return try {
            val html = context.assets.open("admin/dashboard.html").bufferedReader().use { it.readText() }
            newFixedLengthResponse(Response.Status.OK, "text/html", html)
        } catch (e: Exception) {
            Log.e(TAG, "Error serving admin page", e)
            newFixedLengthResponse(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, "Error: ${e.message}")
        }
    }

    private fun serveAPI(session: IHTTPSession): Response {
        // Einfache API-Implementation
        // Für vollständige API müsste Node.js Backend integriert werden
        
        val uri = session.uri
        return when {
            uri.startsWith("/api/posts") -> servePostsAPI(session)
            uri.startsWith("/api/settings") -> serveSettingsAPI()
            else -> newFixedLengthResponse(
                Response.Status.NOT_FOUND, 
                "application/json", 
                "{\"error\": \"API endpoint not found\"}"
            )
        }
    }

    private fun servePostsAPI(session: IHTTPSession): Response {
        // Mock-Daten für Demo
        val json = """
        [
            {
                "id": 1,
                "title": "Willkommen",
                "content": "PRASCO Offline-Modus aktiv",
                "type": "text",
                "duration": 10
            }
        ]
        """.trimIndent()
        
        return newFixedLengthResponse(Response.Status.OK, "application/json", json)
    }

    private fun serveSettingsAPI(): Response {
        val json = """
        {
            "displayRefreshInterval": {"value": "5"},
            "displayDefaultDuration": {"value": "10"}
        }
        """.trimIndent()
        
        return newFixedLengthResponse(Response.Status.OK, "application/json", json)
    }

    private fun serveStaticFile(uri: String, mimeType: String): Response {
        return try {
            val path = uri.substring(1) // Remove leading /
            val inputStream = context.assets.open(path)
            newFixedLengthResponse(Response.Status.OK, mimeType, inputStream, inputStream.available().toLong())
        } catch (e: Exception) {
            newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "File not found")
        }
    }

    private fun copyAssetsToStorage() {
        // Assets zu /data/data/package/files/ kopieren für Schreibzugriff
        // Wird benötigt für Uploads und dynamische Inhalte
    }

    private fun getMimeType(uri: String): String {
        return when {
            uri.endsWith(".html") -> "text/html"
            uri.endsWith(".css") -> "text/css"
            uri.endsWith(".js") -> "application/javascript"
            uri.endsWith(".json") -> "application/json"
            uri.endsWith(".png") -> "image/png"
            uri.endsWith(".jpg") || uri.endsWith(".jpeg") -> "image/jpeg"
            uri.endsWith(".gif") -> "image/gif"
            uri.endsWith(".mp4") -> "video/mp4"
            else -> "application/octet-stream"
        }
    }
}
```

### Schritt 5: MainActivity erweitern

```kotlin
// MainActivity.kt (Erweitert)
package net.prasco.display.tv

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.fragment.app.FragmentActivity
import android.widget.Toast

class MainActivity : FragmentActivity() {

    private lateinit var webView: WebView
    private var embeddedServer: EmbeddedServer? = null
    private var isOfflineMode = false
    
    // Server-Konfiguration
    private val EXTERNAL_SERVER_URL = "http://192.168.1.100:3000"
    private val LOCAL_SERVER_URL = "http://localhost:3000"
    private val SERVER_PORT = 3000
    
    // Bestehender Code...
    private var secretKeyPresses = 0
    private val SECRET_KEY_COUNT = 5

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setupTVFullscreen()
        
        // Prüfe ob externer Server erreichbar ist
        checkServerAvailability()
        
        // WebView erstellen
        webView = WebView(this)
        setContentView(webView)
        
        setupWebView()
        
        // Lade passende URL
        val url = if (isOfflineMode) LOCAL_SERVER_URL else EXTERNAL_SERVER_URL
        webView.loadUrl(url)
    }

    private fun checkServerAvailability() {
        // Versuche externen Server zu erreichen
        Thread {
            try {
                val url = java.net.URL(EXTERNAL_SERVER_URL)
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 3000
                connection.connect()
                connection.disconnect()
                
                // Server erreichbar - normaler Modus
                isOfflineMode = false
            } catch (e: Exception) {
                // Server nicht erreichbar - Offline-Modus aktivieren
                isOfflineMode = true
                runOnUiThread {
                    startOfflineMode()
                }
            }
        }.start()
    }

    private fun startOfflineMode() {
        Toast.makeText(this, "Offline-Modus aktiviert", Toast.LENGTH_LONG).show()
        
        // Starte embedded Server
        try {
            embeddedServer = EmbeddedServer(this, SERVER_PORT)
            embeddedServer?.start()
            
            // Starte Hotspot Service
            val intent = Intent(this, HotspotService::class.java)
            intent.action = "START_HOTSPOT"
            startService(intent)
            
            // Zeige Info-Dialog
            showOfflineModeInfo()
        } catch (e: Exception) {
            Toast.makeText(this, "Fehler beim Starten des Offline-Modus", Toast.LENGTH_LONG).show()
        }
    }

    private fun showOfflineModeInfo() {
        val dialog = android.app.AlertDialog.Builder(this)
            .setTitle("Offline-Modus aktiv")
            .setMessage("""
                PRASCO läuft jetzt im Offline-Modus.
                
                WiFi-Hotspot:
                SSID: ${HotspotService.HOTSPOT_SSID}
                Passwort: ${HotspotService.HOTSPOT_PASSWORD}
                
                Admin-Zugriff:
                URL: http://192.168.43.1:${SERVER_PORT}/admin
                
                Verbinden Sie Ihren PC/Tablet mit dem Hotspot und öffnen Sie die URL im Browser.
            """.trimIndent())
            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
            .create()
        
        dialog.show()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> {
                secretKeyPresses++
                if (secretKeyPresses >= SECRET_KEY_COUNT) {
                    secretKeyPresses = 0
                    toggleOfflineMode()
                    return true
                }
                return true
            }
            // Bestehender Code für andere Tasten...
        }
        
        secretKeyPresses = 0
        return super.onKeyDown(keyCode, event)
    }

    private fun toggleOfflineMode() {
        if (isOfflineMode) {
            // Deaktiviere Offline-Modus
            stopOfflineMode()
        } else {
            // Aktiviere Offline-Modus
            startOfflineMode()
        }
    }

    private fun stopOfflineMode() {
        embeddedServer?.stop()
        embeddedServer = null
        
        val intent = Intent(this, HotspotService::class.java)
        intent.action = "STOP_HOTSPOT"
        startService(intent)
        
        isOfflineMode = false
        webView.loadUrl(EXTERNAL_SERVER_URL)
        
        Toast.makeText(this, "Offline-Modus deaktiviert", Toast.LENGTH_SHORT).show()
    }

    // Bestehende Methoden...
    private fun setupTVFullscreen() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }

    override fun onDestroy() {
        super.onDestroy()
        stopOfflineMode()
        webView.destroy()
    }
}
```

### Schritt 6: Assets vorbereiten

Kopiere die PRASCO Web-Dateien in die Android-App:

```
app/src/main/assets/
├── display.html
├── admin/
│   ├── dashboard.html
│   └── login.html
├── css/
│   ├── display.css
│   └── admin.css
├── js/
│   ├── display.js
│   └── admin.js
└── uploads/
    └── (leer, für dynamische Inhalte)
```

## 🚀 Implementierung: Option 2 - Lightweight Server

Für eine einfachere Implementation ohne vollständiges Backend:

```kotlin
// SimplifiedOfflineMode.kt
class SimplifiedOfflineMode(context: Context) {
    
    private val server = object : NanoHTTPD(3000) {
        override fun serve(session: IHTTPSession): Response {
            return when (session.uri) {
                "/" -> serveFile(context, "display.html", "text/html")
                else -> newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "Not Found")
            }
        }
    }
    
    fun start() {
        server.start()
        startHotspot()
    }
    
    fun stop() {
        server.stop()
        stopHotspot()
    }
    
    private fun serveFile(context: Context, filename: String, mimeType: String): Response {
        val html = context.assets.open(filename).bufferedReader().use { it.readText() }
        return newFixedLengthResponse(Response.Status.OK, mimeType, html)
    }
}
```

## 📱 Benutzer-Anleitung

### Offline-Modus aktivieren

**Automatisch:**
- App startet automatisch im Offline-Modus wenn kein externer Server erreichbar ist

**Manuell:**
- Drücke Menu-Taste 5x schnell
- Dialog erscheint mit Hotspot-Informationen

### Verbindung herstellen

1. **Auf PC/Tablet:**
   - Öffne WiFi-Einstellungen
   - Verbinde mit: `PRASCO-Display`
   - Passwort: `prasco123`

2. **Browser öffnen:**
   - Display: `http://192.168.43.1:3000`
   - Admin: `http://192.168.43.1:3000/admin`

3. **Admin-Login:**
   - Benutzer: `admin`
   - Passwort: `admin`

## ⚠️ Einschränkungen

### Android-Versionen

**Android 7 und älter:**
- ✅ Hotspot per App steuerbar
- ✅ Vollständige Automation möglich

**Android 8+:**
- ⚠️ Hotspot muss manuell aktiviert werden
- ⚠️ App kann nur Anleitung anzeigen
- Google hat API-Zugriff eingeschränkt

**Android 13+:**
- ⚠️ Zusätzliche Location-Permissions nötig
- ⚠️ User-Interaktion erforderlich

### Funktionale Einschränkungen

**Mit Embedded Server:**
- ✅ Display funktioniert voll
- ⚠️ Admin-Panel nur eingeschränkt (keine Backend-API)
- ⚠️ Keine persistente Datenbank
- ⚠️ Uploads nicht möglich

**Workaround:**
- Nutze vorbereitete Content-Pakete
- Synchronisiere Daten wenn Online
- Nutze lokale SQLite-Datenbank

## 🔒 Sicherheit

### Hotspot-Sicherheit

```kotlin
// Sicheres Passwort generieren
private fun generateSecurePassword(): String {
    val chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    return (1..12)
        .map { chars.random() }
        .joinToString("")
}

// WPA3 verwenden (Android 10+)
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    wifiConfig.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA3_SAE)
}
```

### Server-Sicherheit

```kotlin
// Nur lokale Verbindungen erlauben
override fun serve(session: IHTTPSession): Response {
    val clientIP = session.remoteIpAddress
    if (!clientIP.startsWith("192.168.43.")) {
        return newFixedLengthResponse(
            Response.Status.FORBIDDEN, 
            MIME_PLAINTEXT, 
            "Access denied"
        )
    }
    // ... normale Verarbeitung
}
```

## 🧪 Testing

### Testen ohne echten Hotspot

```kotlin
// Entwicklungsmodus mit Mock-Hotspot
if (BuildConfig.DEBUG) {
    // Verwende localhost statt Hotspot-IP
    val url = "http://localhost:3000"
}
```

### ADB Testing

```bash
# Port-Forwarding für Testing
adb forward tcp:3000 tcp:3000

# Dann auf PC-Browser: http://localhost:3000
```

## 📊 Performance

**Empfohlene Hardware:**
- Minimum: Android 7.0, 2GB RAM
- Empfohlen: Android 9.0+, 4GB RAM
- Optimal: NVIDIA Shield TV, 8GB RAM

**Gleichzeitige Verbindungen:**
- Embedded Server: 5-10 Clients
- Mit Optimierung: bis 20 Clients
- Abhängig von Content-Typ

## 🚀 Deployment

### Schritt 1: Assets hinzufügen

```bash
# PRASCO Web-Assets kopieren
cp -r ../views/public/* app/src/main/assets/
cp -r ../css app/src/main/assets/
cp -r ../js app/src/main/assets/
```

### Schritt 2: Build

```bash
./gradlew assembleRelease
```

### Schritt 3: Testen

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## 🆘 Troubleshooting

### Problem: Hotspot startet nicht

**Lösung Android 8+:**
- Benutzer muss Hotspot manuell aktivieren
- Einstellungen → Netzwerk → Hotspot
- SSID: `PRASCO-Display` konfigurieren

### Problem: Clients können nicht verbinden

**Lösung:**
```kotlin
// IP-Adresse des Hotspots prüfen
val wifiManager = getSystemService(Context.WIFI_SERVICE) as WifiManager
val dhcpInfo = wifiManager.dhcpInfo
val serverIP = android.text.format.Formatter.formatIpAddress(dhcpInfo.gateway)
Log.d(TAG, "Server IP: $serverIP")
```

### Problem: Server antwortet nicht

**Lösung:**
```kotlin
// Server-Status prüfen
if (embeddedServer?.isAlive == true) {
    Log.d(TAG, "Server läuft auf Port ${SERVER_PORT}")
} else {
    Log.e(TAG, "Server ist gestoppt")
    embeddedServer?.start()
}
```

## 📚 Weiterführende Links

- [Android WiFi Hotspot API](https://developer.android.com/guide/topics/connectivity/wifi-bootstrap)
- [NanoHTTPD Documentation](https://github.com/NanoHttpd/nanohttpd)
- [J2V8 for Node.js on Android](https://github.com/eclipsesource/J2V8)

---

**Status:** ⚠️ Feature-Request - Implementierung erforderlich

Diese Anleitung beschreibt die theoretische Implementation. Die vollständige Umsetzung erfordert ca. 2-3 Tage Entwicklungszeit.
