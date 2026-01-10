# PRASCO Android TV App - Implementierungsguide

Dieser Guide beschreibt die Implementierung von PRASCO als native Android TV App.

## 📺 Android TV Übersicht

Android TV ist eine spezialisierte Android-Version für Fernseher und Set-Top-Boxen. Diese Implementierung optimiert PRASCO für:

- **TV-Bildschirme**: 1080p/4K Displays im Landscape-Format
- **Fernbedienung**: D-Pad Navigation statt Touch
- **10-Foot UI**: Optimiert für Betrachtung aus der Ferne
- **Kiosk-Modus**: Digital Signage ohne Nutzerinteraktion

## 🎯 Unterschiede zu Standard-Android

| Feature | Standard Android | Android TV |
|---------|-----------------|------------|
| Eingabe | Touchscreen | Fernbedienung (D-Pad) |
| UI-Größe | Klein (Phone/Tablet) | Groß (TV) |
| Betrachtungsabstand | 30cm - 50cm | 3m+ (10 Foot) |
| App-Kategorie | Mobile/Tablet | Leanback |
| Installation | Play Store | Play Store for Android TV |
| Navigation | Gestures | D-Pad, Zurück, Home |

## 🚀 Implementierung

### Option 1: WebView für Android TV ⭐⭐⭐ (Empfohlen)

Die einfachste Methode - nutzt die bestehende Web-Implementierung.

#### Schritt 1: Android Studio Projekt erstellen

```bash
# Android Studio öffnen
File → New → New Project → TV → Empty Activity

# Projekt-Details:
Name: PRASCO Display TV
Package: net.prasco.display.tv
Language: Kotlin
Minimum SDK: API 21 (Android 5.0)
```

#### Schritt 2: AndroidManifest.xml für TV konfigurieren

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="net.prasco.display.tv">

    <!-- TV-spezifische Features -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="true" />
    
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />

    <!-- Berechtigungen -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:banner="@drawable/app_banner"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.Leanback"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:banner="@drawable/app_banner"
            android:configChanges="keyboard|keyboardHidden|navigation|orientation|screenSize"
            android:launchMode="singleTask"
            android:screenOrientation="landscape"
            android:exported="true">
            
            <!-- TV Launcher Intent -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

#### Schritt 3: MainActivity.kt für Android TV

```kotlin
package net.prasco.display.tv

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.fragment.app.FragmentActivity

/**
 * PRASCO Display TV - Android TV App
 * 
 * Optimiert für Android TV mit Fernbedienungs-Support
 */
class MainActivity : FragmentActivity() {

    private lateinit var webView: WebView
    
    /**
     * PRASCO Server URL - Anpassen!
     */
    private val SERVER_URL = "http://192.168.1.100:3000"
    
    /**
     * Reload-Intervall in Millisekunden (optional)
     * 0 = kein Auto-Reload
     */
    private val AUTO_RELOAD_INTERVAL = 0L

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Fullscreen für TV
        setupTVFullscreen()
        
        // WebView erstellen
        webView = WebView(this)
        setContentView(webView)
        
        // WebView konfigurieren
        setupWebView()
        
        // URL laden
        webView.loadUrl(SERVER_URL)
        
        // Optional: Auto-Reload
        if (AUTO_RELOAD_INTERVAL > 0) {
            scheduleAutoReload()
        }
    }

    /**
     * TV Fullscreen-Modus
     */
    private fun setupTVFullscreen() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )
    }

    /**
     * WebView für TV konfigurieren
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
        }
        
        webView.webChromeClient = WebChromeClient()
        
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        
        // TV-optimierte Einstellungen
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        
        // Hardware-Beschleunigung
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }

    /**
     * Fernbedienungs-Tasten behandeln
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            // D-Pad Tasten - an WebView weitergeben
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_CENTER -> {
                // Optional: An JavaScript weitergeben
                injectKeyEvent(keyCode)
                return true
            }
            
            // Zurück-Taste ignorieren (Kiosk-Modus)
            KeyEvent.KEYCODE_BACK -> {
                return true // Taste blockieren
            }
            
            // Home-Taste kann nicht blockiert werden
            KeyEvent.KEYCODE_HOME -> {
                return super.onKeyDown(keyCode, event)
            }
            
            // Media-Tasten
            KeyEvent.KEYCODE_MEDIA_PLAY,
            KeyEvent.KEYCODE_MEDIA_PAUSE,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                // Optional: Media-Steuerung implementieren
                return true
            }
        }
        
        return super.onKeyDown(keyCode, event)
    }
    
    /**
     * Tastendruck an JavaScript weitergeben (optional)
     */
    private fun injectKeyEvent(keyCode: Int) {
        val key = when (keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
            KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
            KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
            KeyEvent.KEYCODE_DPAD_CENTER -> "Enter"
            else -> return
        }
        
        val js = """
            var event = new KeyboardEvent('keydown', {
                key: '$key',
                code: '$key',
                bubbles: true
            });
            document.dispatchEvent(event);
        """.trimIndent()
        
        webView.evaluateJavascript(js, null)
    }

    /**
     * Auto-Reload planen
     */
    private fun scheduleAutoReload() {
        webView.postDelayed({
            webView.reload()
            scheduleAutoReload()
        }, AUTO_RELOAD_INTERVAL)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        setupTVFullscreen()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
    }
    
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            setupTVFullscreen()
        }
    }
}
```

#### Schritt 4: build.gradle für Android TV

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
}

android {
    namespace 'net.prasco.display.tv'
    compileSdk 34

    defaultConfig {
        applicationId "net.prasco.display.tv"
        minSdk 21  // Android TV unterstützt ab API 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.leanback:leanback:1.0.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
```

### Option 2: Native Android TV Leanback App ⭐⭐

Für eine vollständig native TV-Experience mit Leanback UI.

#### Leanback Browse Fragment

```kotlin
class BrowseFragment : androidx.leanback.app.BrowseFragment() {
    
    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)
        
        title = "PRASCO Display"
        headersState = HEADERS_DISABLED
        isHeadersTransitionOnBackEnabled = false
        
        // Display WebView in Fragment
        val fragment = DisplayFragment()
        fragmentManager?.beginTransaction()
            ?.replace(R.id.main_frame, fragment)
            ?.commit()
    }
}

class DisplayFragment : Fragment() {
    private lateinit var webView: WebView
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        webView = WebView(requireContext())
        // WebView konfigurieren wie oben
        return webView
    }
}
```

## 📱 App Banner erstellen

Android TV Apps benötigen ein Banner (320x180px):

```xml
<!-- res/drawable/app_banner.xml -->
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#0066cc"/>
    <corners android:radius="4dp"/>
</shape>
```

Oder als PNG-Bild in `res/drawable/app_banner.png` (320x180px).

## 🎨 TV-optimiertes Design

### Empfohlene Anpassungen für PRASCO Display

1. **Schriftgrößen**: Mindestens 16sp, besser 18-24sp
2. **Touch-Targets**: Mindestens 48dp (nicht relevant bei Fernbedienung)
3. **Kontrast**: Höherer Kontrast für TV-Displays
4. **Overscan**: 48dp Padding zu allen Seiten
5. **Fokus-Indikatoren**: Klar sichtbare Fokus-Highlights

### CSS-Anpassungen für TV

Füge in `display.css` hinzu:

```css
/* TV-spezifische Styles */
@media (min-width: 1920px) {
  body {
    font-size: 1.5rem;
    padding: 48px; /* Overscan safe area */
  }
  
  .display-header {
    font-size: 2.5rem;
    padding: 2rem 3rem;
  }
  
  .post-container {
    padding: 3rem;
  }
  
  /* Höherer Kontrast für TV */
  .post {
    background: #ffffff;
    color: #000000;
  }
}
```

## 🔧 Konfiguration

### Server-URL Konfiguration

Für Android TV empfohlen: Konfiguration via Shared Preferences

```kotlin
class SettingsFragment : PreferenceFragmentCompat() {
    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        setPreferencesFromResource(R.xml.preferences, rootKey)
    }
}
```

```xml
<!-- res/xml/preferences.xml -->
<PreferenceScreen xmlns:android="http://schemas.android.com/apk/res/android">
    <EditTextPreference
        android:key="server_url"
        android:title="Server URL"
        android:defaultValue="http://192.168.1.100:3000"
        android:inputType="textUri" />
</PreferenceScreen>
```

### Zugriff über TV-Fernbedienung

Einstellungen-Zugriff mit geheimer Tastenkombination:

```kotlin
private var secretKeyPresses = 0

override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    // Geheime Kombination: 5x Menu-Taste
    if (keyCode == KeyEvent.KEYCODE_MENU) {
        secretKeyPresses++
        if (secretKeyPresses >= 5) {
            secretKeyPresses = 0
            openSettings()
            return true
        }
    } else {
        secretKeyPresses = 0
    }
    return super.onKeyDown(keyCode, event)
}

private fun openSettings() {
    val intent = Intent(this, SettingsActivity::class.java)
    startActivity(intent)
}
```

## 🚀 Build und Installation

### APK für Android TV bauen

```bash
# Debug-APK bauen
./gradlew assembleDebug

# Auf Android TV installieren
adb connect <TV-IP-ADDRESS>
adb install app/build/outputs/apk/debug/app-debug.apk

# App starten
adb shell am start -n net.prasco.display.tv/.MainActivity
```

### Sideload auf Android TV

1. **Developer-Optionen aktivieren**:
   - Einstellungen → Über → Build-Nummer 7x antippen

2. **USB-Debugging aktivieren**:
   - Einstellungen → Developer → USB-Debugging

3. **APK installieren**:
   - Via ADB (siehe oben)
   - Via USB-Stick und File-Manager
   - Via "Apps2Fire" oder "Send Files to TV"

## 📺 Kompatible Geräte

### Getestet auf:
- ✅ NVIDIA Shield TV
- ✅ Mi Box
- ✅ Fire TV Stick 4K (mit Sideload)
- ✅ Chromecast with Google TV
- ✅ Sony Android TVs
- ✅ Philips Android TVs

### Anforderungen:
- Android TV OS 5.0+ (API 21+)
- 100 MB freier Speicher
- Netzwerkverbindung zum PRASCO Server

## 🔒 Kiosk-Modus für Android TV

### Lock Task Mode (Android Enterprise)

```kotlin
class MainActivity : FragmentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Lock Task Mode starten (benötigt Device Owner)
        if (isTaskLockAvailable()) {
            startLockTask()
        }
    }
    
    private fun isTaskLockAvailable(): Boolean {
        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        return dpm.isDeviceOwnerApp(packageName)
    }
    
    override fun onBackPressed() {
        // Im Lock Task Mode wird Zurück-Taste blockiert
    }
}
```

### Setup als Device Owner (für Kiosk):

```bash
# Via ADB
adb shell dpm set-device-owner net.prasco.display.tv/.DeviceAdminReceiver
```

## 🎮 Remote Control Unterstützung

### Unterstützte Tasten

| Taste | Funktion | Implementierung |
|-------|----------|----------------|
| D-Pad | Navigation | Optional: An Display.js weiterleiten |
| OK/Select | Auswahl | Optional: Implementieren |
| Zurück | - | Blockiert (Kiosk) |
| Home | TV-Home | Kann nicht blockiert werden |
| Menu | - | Geheime Einstellungen |
| Play/Pause | - | Optional: Media-Steuerung |
| Lautstärke | System | Passthrough |

## 🔧 Erweiterte Features

### Screen Saver Prevention

```kotlin
window.addFlags(
    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
)
```

### Wake on LAN (optional)

Für automatisches Einschalten des TVs via Netzwerk.

### HDMI-CEC Integration

Für TV-Steuerung über HDMI (ein/aus, Lautstärke).

## 📊 Performance-Optimierung

### WebView Performance für TV

```kotlin
settings.apply {
    // Rendering-Optimierung
    setRenderPriority(WebSettings.RenderPriority.HIGH)
    
    // Cache-Strategie
    cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
    
    // Mixed Content bei HTTPS
    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
}

// Hardware-Layer für Video-Performance
webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
```

## 🆘 Troubleshooting

### Problem: App wird nicht im TV Launcher angezeigt
**Lösung**: `android.software.leanback` Feature und `LEANBACK_LAUNCHER` Intent prüfen

### Problem: Fernbedienung funktioniert nicht
**Lösung**: `onKeyDown` implementieren und D-Pad Events behandeln

### Problem: Display geht in Standby
**Lösung**: `FLAG_KEEP_SCREEN_ON` und System-Screensaver-Einstellungen prüfen

### Problem: Video spielt nicht
**Lösung**: Hardware-Beschleunigung aktivieren, Codecs prüfen

### Problem: App startet nicht nach Reboot
**Lösung**: Auto-Start Permission und BootReceiver konfigurieren

## 📚 Zusätzliche Ressourcen

- [Android TV Developer Guide](https://developer.android.com/training/tv)
- [Leanback Support Library](https://developer.android.com/jetpack/androidx/releases/leanback)
- [Android TV Input Framework](https://source.android.com/devices/tv/index.html)
- [WebView Best Practices](https://developer.android.com/guide/webapps/webview)

## 🎯 Deployment Checklist

- [ ] App Banner (320x180px) erstellt
- [ ] TV Launcher Intent konfiguriert
- [ ] Leanback Feature deklariert
- [ ] Touchscreen nicht erforderlich markiert
- [ ] Landscape-Orientierung erzwungen
- [ ] Fernbedienungs-Events implementiert
- [ ] Kiosk-Modus aktiviert
- [ ] Auto-Start konfiguriert
- [ ] Performance getestet auf Zielgerät
- [ ] Server-URL konfiguriert

---

**Viel Erfolg mit PRASCO auf Android TV! 📺🚀**
