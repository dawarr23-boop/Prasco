# 🚀 Schnellstart: PRASCO als Android App

Drei einfache Wege, um PRASCO auf Android-Geräten zu nutzen.

## 📱 Option 1: Standard Android App (Phones/Tablets)

### ⏱️ 5-Minuten Setup

1. **Android Studio öffnen**
   - File → New → New Project → Empty Activity
   - Name: `PrascoDisplay`
   - Package: `net.prasco.display`

2. **Dateien kopieren**
   ```bash
   # Alle Dateien aus android-app/ ins Projekt kopieren
   cp android-app/AndroidManifest.xml app/src/main/AndroidManifest.xml
   cp android-app/MainActivity.kt app/src/main/java/net/prasco/display/MainActivity.kt
   cp android-app/build.gradle app/build.gradle
   ```

3. **Server-URL anpassen**
   ```kotlin
   // In MainActivity.kt:
   private val SERVER_URL = "http://192.168.1.100:3000"  // Deine IP
   ```

4. **Build & Install**
   ```bash
   ./gradlew installDebug
   ```

**Fertig!** 🎉

---

## 📺 Option 2: Android TV App (Empfohlen für TV-Displays)

### ⏱️ 5-Minuten Setup

1. **Android Studio öffnen**
   - File → New → New Project → **TV** → Empty Activity
   - Name: `PrascoDisplayTV`
   - Package: `net.prasco.display.tv`

2. **Dateien kopieren**
   ```bash
   # Alle Dateien aus android-tv-app/ ins Projekt kopieren
   cp android-tv-app/AndroidManifest.xml app/src/main/AndroidManifest.xml
   cp android-tv-app/MainActivity.kt app/src/main/java/net/prasco/display/tv/MainActivity.kt
   cp android-tv-app/build.gradle app/build.gradle
   ```

3. **Server-URL anpassen**
   ```kotlin
   // In MainActivity.kt:
   private val SERVER_URL = "http://192.168.1.100:3000"  // Deine IP
   ```

4. **App-Banner erstellen** (320x180px)
   - Platziere Banner als `app/src/main/res/drawable/app_banner.png`

5. **Build & Install auf TV**
   ```bash
   adb connect <TV-IP>
   ./gradlew installDebug
   ```

**Fertig!** 🎉📺

---

## 🌐 Option 3: Ohne Programmierung (nur Android TV)

### Alternative: Kiosk Browser App verwenden

Nutze eine fertige Kiosk-Browser-App aus dem Play Store:

1. **"Fully Kiosk Browser"** installieren (empfohlen)
   - Play Store → Fully Kiosk Browser
   - URL setzen: `http://192.168.1.100:3000`
   - Kiosk-Modus aktivieren

2. **Oder "Kiosk Browser Lockdown"**
   - Play Store → Kiosk Browser Lockdown
   - PRASCO URL eingeben
   - Vollbild aktivieren

**Vorteile:**
- ✅ Keine Entwicklung nötig
- ✅ Sofort einsatzbereit
- ✅ Viele Kiosk-Features

**Nachteile:**
- ❌ Kostenpflichtig für alle Features
- ❌ Nicht individualisierbar
- ❌ Fremd-App mit Updates

---

## 🔧 Quick Fixes

### Problem: App verbindet nicht zum Server

**Lösung 1:** Server-IP prüfen
```bash
# Finde Server-IP
ifconfig  # Linux/Mac
ipconfig  # Windows
```

**Lösung 2:** Firewall-Regel hinzufügen
```bash
# Port 3000 öffnen
sudo ufw allow 3000
```

**Lösung 3:** Cleartext Traffic erlauben
```xml
<!-- In AndroidManifest.xml -->
android:usesCleartextTraffic="true"
```

### Problem: Videos spielen nicht

**Lösung:** Bereits implementiert in MainActivity
```kotlin
webSettings.mediaPlaybackRequiresUserGesture = false
```

### Problem: Display geht in Standby

**Lösung:** Bereits implementiert
```kotlin
window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
```

---

## 📋 Checkliste

**Vor dem Start:**
- [ ] Android Studio installiert
- [ ] PRASCO Server läuft
- [ ] Server-IP bekannt
- [ ] Android-Gerät oder Emulator bereit

**Android App:**
- [ ] Projekt erstellt
- [ ] Dateien kopiert
- [ ] Server-URL angepasst
- [ ] App gebaut und installiert
- [ ] Verbindung getestet

**Android TV App:**
- [ ] TV-Projekt erstellt
- [ ] Dateien kopiert
- [ ] Server-URL angepasst
- [ ] App-Banner erstellt
- [ ] Auf TV installiert
- [ ] Fernbedienung getestet

---

## 🎯 Was passt zu mir?

| Use Case | Empfehlung |
|----------|------------|
| Tablet als Display | Standard Android App |
| TV/Monitor mit Android Box | **Android TV App** ⭐ |
| Schnellster Start ohne Code | Kiosk Browser App |
| Mehrere Plattformen (iOS+Android) | Capacitor (siehe ANDROID-APP.md) |
| Vollständig native App | React Native (aufwendig) |

---

## 📚 Weitere Hilfe

- **Vollständige Anleitung:** [ANDROID-APP.md](ANDROID-APP.md)
- **TV-spezifisch:** [ANDROID-TV-APP.md](ANDROID-TV-APP.md)
- **PRASCO Hauptdoku:** [README.md](README.md)

---

## 🆘 Support

**Probleme?**
1. Prüfe [Troubleshooting in ANDROID-APP.md](ANDROID-APP.md#-troubleshooting)
2. Schaue in Android Studio Logcat
3. Öffne ein Issue auf GitHub

---

**Viel Erfolg! 🚀**
