#!/bin/bash
# PRASCO TV App – Auf Gerät installieren
# Voraussetzung: ADB muss im PATH sein

set -e

DEVICE_IP=""
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

# Argumente parsen
while [[ $# -gt 0 ]]; do
    case $1 in
        --ip)
            DEVICE_IP="$2"
            shift 2
            ;;
        --release)
            APK_PATH="app/build/outputs/apk/release/app-release.apk"
            shift
            ;;
        *)
            echo "Unbekanntes Argument: $1"
            echo "Nutzung: $0 [--ip <device-ip>] [--release]"
            exit 1
            ;;
    esac
done

echo "=== PRASCO TV – Install on Device ==="

# Prüfe ob APK existiert
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK nicht gefunden: $APK_PATH"
    echo "   Bitte zuerst bauen: ./gradlew assembleDebug"
    exit 1
fi

# WLAN-Verbindung falls IP angegeben
if [ -n "$DEVICE_IP" ]; then
    echo "🔗 Verbinde mit $DEVICE_IP..."
    adb connect "${DEVICE_IP}:5555"
    sleep 2
fi

# Prüfe Geräte-Verbindung
DEVICES=$(adb devices | grep -c "device$")
if [ "$DEVICES" -eq 0 ]; then
    echo "❌ Kein Gerät gefunden!"
    echo "   Bitte per USB verbinden oder IP angeben: $0 --ip 192.168.1.50"
    exit 1
fi

echo "✅ Gerät gefunden. Installiere APK..."

# Installieren
adb install -r "$APK_PATH"

echo "✅ Installation erfolgreich!"

# App starten
echo "🚀 Starte PRASCO TV..."
adb shell am start -n net.prasco.tv/.MainActivity

echo "✅ Fertig!"
