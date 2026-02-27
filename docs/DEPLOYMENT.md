# Deployment Guide

## Übersicht

Die PRASCO TV App wird per APK Sideloading auf Android TV Geräte installiert.
Ein Google Play Store Release ist optional.

## Installations-Methoden

### 1. ADB über USB

```bash
# Gerät per USB verbinden
adb devices

# APK installieren
adb install -r app/build/outputs/apk/debug/app-debug.apk

# App starten
adb shell am start -n net.prasco.tv/.MainActivity
```

### 2. ADB über WLAN

```bash
# Auf dem TV: Einstellungen → Netzwerk → IP-Adresse notieren
# Auf dem TV: Einstellungen → Entwickleroptionen → ADB-Debugging aktivieren

# Verbinden
adb connect 192.168.1.50:5555

# APK installieren
adb install -r app-debug.apk
```

### 3. USB-Stick (ohne ADB)

1. APK auf USB-Stick kopieren
2. Dateimanager-App auf TV installieren (z.B. X-plore, File Commander)
3. USB-Stick am TV einstecken
4. APK über Dateimanager installieren
5. "Installation aus unbekannten Quellen" bestätigen

### 4. Netzwerk-Share

1. APK auf einem Netzlaufwerk/NAS ablegen
2. Dateimanager-App (z.B. Solid Explorer) auf TV
3. Netzlaufwerk einbinden
4. APK installieren

## Ersteinrichtung auf dem Gerät

### Entwickleroptionen aktivieren

1. Einstellungen → Gerätepräferenzen → Info
2. 7× auf "Build-Nummer" tippen
3. Zurück → "Entwickleroptionen" erscheint
4. ADB-Debugging aktivieren

### Nach Installation

1. App öffnen (PRASCO TV im Launcher)
2. Setup Wizard: Server-URL eingeben
3. Verbindung testen
4. Display-Name vergeben
5. Fertig → Anzeige startet

## Geräte-spezifische Hinweise

### NVIDIA Shield TV

- ADB über USB oder WLAN
- Beste Performance
- Cleartext HTTP über ADB erlauben falls nötig:
    ```bash
    adb shell settings put global development_settings_enabled 1
    ```

### Chromecast with Google TV

- Nur ADB über WLAN
- Kein USB-Debugging möglich (kein USB-A)
- Benötigt Sideload-fähigen Dateimanager

### Amazon Fire TV Stick

- ADB über WLAN oder Micro-USB
- Apps from Unknown Sources: Einstellungen → Mein Fire TV → Entwickleroptionen
- Kein Google Play Services → kein Leanback Launcher
- App erscheint unter "Apps aus unbekannten Quellen"

### Xiaomi Mi Box S

- ADB über USB oder WLAN
- Standard Android TV Launcher
- Gute Kompatibilität

## Auto-Start konfigurieren

Die App startet automatisch nach dem Booten wenn:

1. In App-Einstellungen "Autostart" aktiviert ist
2. Der BootReceiver registriert ist (Standard: ja)

### Permanenter Kiosk-Modus

Für einen echten Kiosk-Betrieb:

1. App als Standard-Launcher setzen:

    ```bash
    # Über ADB
    adb shell cmd package set-home-activity net.prasco.tv/.MainActivity
    ```

2. Oder über Device Owner (Android Enterprise):
    ```bash
    adb shell dpm set-device-owner net.prasco.tv/.admin.DeviceAdminReceiver
    ```
    (Erfordert zusätzliche Implementierung)

## Update-Prozess

### Manuell (ADB)

```bash
adb install -r app-release.apk
```

Die App wird aktualisiert ohne Datenverlust (SharedPreferences bleiben erhalten).

### Automatisch (geplant für Phase 2)

- OTA-Update über PRASCO Server
- Benachrichtigung bei neuem Release
- Background Download + Install

## Troubleshooting

### App startet nicht

```bash
# Logs prüfen
adb logcat -s PrascoTV
```

### WebView zeigt nichts

1. Server-URL in Einstellungen prüfen (5× Menü-Taste)
2. Netzwerkverbindung testen
3. Server erreichbar? `curl http://<server>:3000/health`

### Kein Netzwerk nach Boot

Einige Geräte brauchen Zeit für WLAN-Verbindung nach dem Boot.
Die App wartet automatisch und versucht wiederholt eine Verbindung.

### App stürzt ab

```bash
# Crash-Logs anzeigen
adb logcat -b crash

# Alle PRASCO-Logs
adb logcat | grep -i prasco
```
