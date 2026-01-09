# PRASCO Android Display App - Implementierungsguide

Dieser Guide beschreibt verschiedene Ansätze, um die PRASCO Display-Ansicht als Android-App bereitzustellen.

## 📱 Übersicht der Optionen

Es gibt drei Hauptansätze, um das PRASCO Display auf Android zu bringen:

1. **WebView Wrapper** (⭐⭐⭐ Empfohlen für einfache Implementierung)
2. **Capacitor** (⭐⭐ Für hybrid Apps mit nativen Features)
3. **React Native** (⭐ Für vollständig native Performance)

## Option 1: WebView Wrapper (Einfachste Lösung) ⭐⭐⭐

### Vorteile
- ✅ Sehr einfach zu implementieren
- ✅ Keine Änderungen am bestehenden Code nötig
- ✅ Automatische Updates durch Web-Backend
- ✅ Kiosk-Modus für Digital Signage
- ✅ Geringe Wartungskosten

### Nachteile
- ❌ Benötigt Netzwerkverbindung
- ❌ Weniger native Performance
- ❌ Eingeschränkter Zugriff auf Gerätehardware

### Implementierung

#### Schritt 1: Android Studio Setup

```bash
# Android Studio herunterladen
https://developer.android.com/studio

# SDK installieren (API Level 24 oder höher)
```

#### Schritt 2: Neues Android-Projekt erstellen

1. Android Studio öffnen
2. "New Project" → "Empty Activity"
3. Name: `PrascoDisplay`
4. Package: `net.prasco.display`
5. Language: Kotlin (oder Java)
6. Minimum SDK: API 24 (Android 7.0)

#### Schritt 3: AndroidManifest.xml konfigurieren

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="net.prasco.display">

    <!-- Internet-Berechtigung -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Optional: Für Wake Lock (Display an) -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- Optional: Für Kiosk-Modus -->
    <uses-permission android:name="android.permission.REORDER_TASKS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.PrascoDisplay"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:launchMode="singleTask"
            android:screenOrientation="landscape"
            android:theme="@style/Theme.AppCompat.NoActionBar"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

#### Schritt 4: MainActivity implementieren (Kotlin)

Datei: `app/src/main/java/net/prasco/display/MainActivity.kt`

```kotlin
package net.prasco.display

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    
    // PRASCO Server URL - Hier anpassen!
    private val SERVER_URL = "http://192.168.1.100:3000"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Fullscreen und Display immer an
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
        
        // WebView erstellen
        webView = WebView(this)
        setContentView(webView)
        
        // WebView konfigurieren
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        webSettings.allowFileAccess = true
        webSettings.mediaPlaybackRequiresUserGesture = false
        
        // Hardware-Beschleunigung
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        // URL laden
        webView.loadUrl(SERVER_URL)
    }

    // Zurück-Taste deaktivieren (für Kiosk-Modus)
    override fun onBackPressed() {
        // Leer lassen für Kiosk-Modus
        // Oder: super.onBackPressed() für normale Navigation
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        
        // Fullscreen wiederherstellen
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
    }
}
```

#### Schritt 4 Alternative: MainActivity implementieren (Java)

Datei: `app/src/main/java/net/prasco/display/MainActivity.java`

```java
package net.prasco.display;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    
    // PRASCO Server URL - Hier anpassen!
    private static final String SERVER_URL = "http://192.168.1.100:3000";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Fullscreen und Display immer an
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
        
        // WebView erstellen
        webView = new WebView(this);
        setContentView(webView);
        
        // WebView konfigurieren
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAllowFileAccess(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        
        // Hardware-Beschleunigung
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        
        // URL laden
        webView.loadUrl(SERVER_URL);
    }

    // Zurück-Taste deaktivieren (für Kiosk-Modus)
    @Override
    public void onBackPressed() {
        // Leer lassen für Kiosk-Modus
        // Oder: super.onBackPressed(); für normale Navigation
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        
        // Fullscreen wiederherstellen
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        webView.destroy();
    }
}
```

#### Schritt 5: build.gradle konfigurieren

Datei: `app/build.gradle`

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'  // Oder ohne für Java
}

android {
    namespace 'net.prasco.display'
    compileSdk 34

    defaultConfig {
        applicationId "net.prasco.display"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
}
```

#### Schritt 6: App bauen und installieren

```bash
# Debug-Version bauen
./gradlew assembleDebug

# APK ist hier: app/build/outputs/apk/debug/app-debug.apk

# Direkt auf verbundenem Gerät installieren
./gradlew installDebug

# Oder Release-Version (signiert)
./gradlew assembleRelease
```

### Konfiguration der Server-URL

Die Server-URL muss angepasst werden:

1. **Lokales Netzwerk**: `http://192.168.1.100:3000`
2. **Hostname**: `http://prasco.local:3000`
3. **Cloud-Server**: `https://prasco.example.com`

### Erweiterte Features

#### Settings-Activity für URL-Konfiguration

Um die URL in der App änderbar zu machen, kann eine Settings-Activity hinzugefügt werden:

```kotlin
// SettingsActivity.kt
class SettingsActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // SharedPreferences für URL-Speicherung
        val prefs = getSharedPreferences("prasco_settings", MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", "http://192.168.1.100:3000")
        
        // UI für Eingabe anzeigen
        // ...
    }
}
```

#### Auto-Start beim Booten

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<receiver
    android:name=".BootReceiver"
    android:enabled="true"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

```kotlin
// BootReceiver.kt
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val i = Intent(context, MainActivity::class.java)
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(i)
        }
    }
}
```

---

## Option 2: Capacitor (Hybrid App) ⭐⭐

### Vorteile
- ✅ Zugriff auf native APIs (Kamera, Sensoren, etc.)
- ✅ Einheitliche Codebasis für Web, iOS und Android
- ✅ Plugin-Ökosystem
- ✅ TypeScript/JavaScript

### Nachteile
- ❌ Komplexer als WebView
- ❌ Größere App-Größe
- ❌ Mehr Build-Schritte

### Implementierung

#### Schritt 1: Capacitor installieren

```bash
# In das PRASCO-Projektverzeichnis wechseln
cd /path/to/Prasco

# Capacitor installieren
npm install @capacitor/core @capacitor/cli

# Capacitor initialisieren
npx cap init "PRASCO Display" "net.prasco.display" --web-dir="views/public"
```

#### Schritt 2: Android-Plattform hinzufügen

```bash
# Android-Plattform hinzufügen
npm install @capacitor/android
npx cap add android

# Plugins für erweiterte Funktionen (optional)
npm install @capacitor/status-bar @capacitor/splash-screen
```

#### Schritt 3: Capacitor-Konfiguration

Datei: `capacitor.config.ts`

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.prasco.display',
  appName: 'PRASCO Display',
  webDir: 'views/public',
  server: {
    // Für Entwicklung: Auf lokalen Server zeigen
    // url: 'http://192.168.1.100:3000',
    // cleartext: true
    
    // Für Produktion: App enthält alle Dateien
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
```

#### Schritt 4: Display-HTML für Capacitor anpassen

Erstelle eine separate Version für Capacitor:

Datei: `views/public/display-capacitor.html`

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PRASCO Digitales Schwarzes Brett</title>
    <link rel="stylesheet" href="/css/display.css" />
    
    <!-- Capacitor Script -->
    <script type="module" src="capacitor.js"></script>
  </head>
  <body>
    <!-- Gleicher Inhalt wie display.html -->
    <!-- ... -->
    
    <script src="/js/display.js"></script>
    <script>
      // Capacitor-spezifische Initialisierung
      import { Capacitor } from '@capacitor/core';
      import { StatusBar, Style } from '@capacitor/status-bar';
      
      if (Capacitor.isNativePlatform()) {
        // Statusleiste ausblenden
        StatusBar.hide();
        
        // Display immer an (mit Plugin)
        // import { KeepAwake } from '@capacitor-community/keep-awake';
        // KeepAwake.keepAwake();
      }
    </script>
  </body>
</html>
```

#### Schritt 5: Build und Sync

```bash
# Web-Dateien bauen (falls TypeScript/Build-Prozess)
npm run build

# An Android synchronisieren
npx cap sync android

# Android Studio öffnen
npx cap open android
```

#### Schritt 6: In Android Studio ausführen

1. Warte bis Gradle-Sync fertig ist
2. Wähle Gerät/Emulator
3. Klicke "Run" ▶️

### Erweiterte Capacitor-Features

#### Kiosk-Modus Plugin

```bash
npm install capacitor-plugin-kiosk
```

```typescript
import { KioskPlugin } from 'capacitor-plugin-kiosk';

// Kiosk-Modus aktivieren
await KioskPlugin.enableKioskMode();

// Kiosk-Modus deaktivieren (mit Pin)
await KioskPlugin.disableKioskMode({ pin: '1234' });
```

#### Keep Awake (Display an)

```bash
npm install @capacitor-community/keep-awake
```

```typescript
import { KeepAwake } from '@capacitor-community/keep-awake';

// Display immer an
await KeepAwake.keepAwake();

// Normal zurück
await KeepAwake.allowSleep();
```

---

## Option 3: React Native (Native Performance) ⭐

### Vorteile
- ✅ Beste Performance
- ✅ Native UI-Komponenten
- ✅ Großes Ökosystem
- ✅ Hot Reload während Entwicklung

### Nachteile
- ❌ Komplette Neuimplementierung
- ❌ Steile Lernkurve
- ❌ Mehr Wartungsaufwand
- ❌ Separate Codebasis für mobile App

### Implementierung

Da dies eine komplette Neuimplementierung erfordert, ist dieser Ansatz nur für Projekte sinnvoll, die eine vollständig native mobile App benötigen.

**Kurze Übersicht:**

```bash
# React Native CLI installieren
npm install -g react-native-cli

# Neues Projekt erstellen
npx react-native init PrascoDisplay

# WebView-Komponente hinzufügen
npm install react-native-webview

# Android ausführen
npx react-native run-android
```

**Empfehlung:** Für PRASCO ist React Native überdimensioniert. WebView oder Capacitor sind besser geeignet.

---

## 🔧 Vergleichstabelle

| Feature                | WebView | Capacitor | React Native |
|------------------------|---------|-----------|--------------|
| Implementierungszeit   | 1-2 h   | 4-8 h     | 40+ h        |
| Wartungsaufwand        | Gering  | Mittel    | Hoch         |
| Performance            | Gut     | Gut       | Sehr gut     |
| Code-Wiederverwendung  | 100%    | 90%       | 30%          |
| Native Features        | Begrenzt| Viele     | Alle         |
| App-Größe              | ~5 MB   | ~15 MB    | ~30 MB       |
| Netzwerk erforderlich  | Ja*     | Optional  | Nein         |

*Kann mit lokalem Cache reduziert werden

---

## 📱 Empfohlener Ansatz

**Für PRASCO empfehlen wir: WebView Wrapper** ⭐⭐⭐

### Gründe:
1. Minimaler Implementierungsaufwand
2. Keine Änderungen am bestehenden Code
3. Automatische Updates durch Backend
4. Perfekt für Digital Signage Use-Case
5. Einfache Wartung

### Wann Capacitor?
- Wenn native Features wie Kamera, Push-Notifications, etc. benötigt werden
- Wenn Offline-Fähigkeit wichtig ist
- Wenn auch iOS-App gewünscht ist

### Wann React Native?
- Wenn vollständig native UI gewünscht ist
- Wenn dediziertes mobile Team vorhanden ist
- Wenn komplexe native Integrationen benötigt werden

---

## 🚀 Deployment

### APK signieren (für Release)

```bash
# Keystore erstellen (einmalig)
keytool -genkey -v -keystore prasco-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias prasco

# In app/build.gradle hinzufügen:
android {
    signingConfigs {
        release {
            storeFile file('../prasco-release-key.jks')
            storePassword 'your-password'
            keyAlias 'prasco'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

# Release-APK bauen
./gradlew assembleRelease
```

### Google Play Store

1. APK/AAB bauen
2. Google Play Console → Create App
3. App-Informationen ausfüllen
4. APK/AAB hochladen
5. Release erstellen

---

## 🔒 Sicherheit

### Wichtige Hinweise:

1. **HTTPS verwenden** in Produktion
2. **Zertifikat-Pinning** für Server-Verbindung
3. **SSL-Fehler nicht ignorieren** im WebViewClient
4. **JavaScript-Interface** nur für vertrauenswürdige Inhalte
5. **Updates über Google Play** verteilen

---

## 📚 Zusätzliche Ressourcen

- [Android WebView Dokumentation](https://developer.android.com/reference/android/webkit/WebView)
- [Capacitor Dokumentation](https://capacitorjs.com/docs)
- [React Native Dokumentation](https://reactnative.dev/)
- [Android Kiosk Mode Guide](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode)

---

## 🆘 Troubleshooting

### Problem: WebView zeigt nichts an
**Lösung:** Prüfe Internet-Berechtigung in AndroidManifest.xml und Netzwerkverbindung

### Problem: JavaScript funktioniert nicht
**Lösung:** `webSettings.javaScriptEnabled = true` setzen

### Problem: Videos spielen nicht ab
**Lösung:** `webSettings.mediaPlaybackRequiresUserGesture = false` setzen

### Problem: Display geht in Standby
**Lösung:** `FLAG_KEEP_SCREEN_ON` im MainActivity hinzufügen

### Problem: HTTPS-Fehler
**Lösung:** SSL-Zertifikat korrekt konfigurieren, keine Workarounds mit `onReceivedSslError`

---

Für weitere Fragen oder Probleme, öffne bitte ein Issue auf GitHub.
