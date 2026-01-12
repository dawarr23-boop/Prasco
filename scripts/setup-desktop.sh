#!/bin/bash
# PRASCO Desktop Setup - Deaktiviere Netzwerk-Benachrichtigungen und zeige IP

echo "====================================="
echo "PRASCO Desktop-Konfiguration"
echo "====================================="

# 1. NetworkManager-Benachrichtigungen deaktivieren
echo "Deaktiviere Netzwerk-Benachrichtigungen..."

# Erstelle NetworkManager-Konfiguration ohne Notifications
NM_CONF="/etc/NetworkManager/NetworkManager.conf"
if [ -f "$NM_CONF" ]; then
    if ! grep -q "\[connectivity\]" "$NM_CONF"; then
        echo "" | sudo tee -a "$NM_CONF"
        echo "[connectivity]" | sudo tee -a "$NM_CONF"
        echo "enabled=false" | sudo tee -a "$NM_CONF"
    fi
    sudo systemctl restart NetworkManager
    echo "✓ NetworkManager-Benachrichtigungen deaktiviert"
else
    echo "⚠ NetworkManager.conf nicht gefunden"
fi

# Deaktiviere notification-daemon für Netzwerk-Meldungen
if systemctl is-active --quiet notification-daemon; then
    sudo systemctl stop notification-daemon
    sudo systemctl disable notification-daemon
    echo "✓ Notification-Daemon deaktiviert"
fi

# 2. Python-Dependencies für IP-Overlay installieren
echo ""
echo "Installiere Python-Dependencies..."
sudo apt-get update -qq
sudo apt-get install -y python3-tk python3-psutil

# 3. IP-Overlay Autostart einrichten
echo ""
echo "Richte IP-Overlay Autostart ein..."

AUTOSTART_DIR="$HOME/.config/autostart"
AUTOSTART_FILE="$AUTOSTART_DIR/prasco-ip-overlay.desktop"

mkdir -p "$AUTOSTART_DIR"

cat > "$AUTOSTART_FILE" << 'EOF'
[Desktop Entry]
Type=Application
Name=PRASCO IP Overlay
Comment=Zeigt IP-Adresse bis Kiosk-Modus startet
Exec=/home/pi/Prasco/scripts/show-ip-overlay.py
Terminal=false
Hidden=false
X-GNOME-Autostart-enabled=true
EOF

chmod +x "$AUTOSTART_FILE"
echo "✓ Autostart konfiguriert: $AUTOSTART_FILE"

# 4. Script ausführbar machen
SCRIPT_PATH="/home/pi/Prasco/scripts/show-ip-overlay.py"
if [ -f "$SCRIPT_PATH" ]; then
    chmod +x "$SCRIPT_PATH"
    echo "✓ IP-Overlay-Script ausführbar gemacht"
else
    echo "⚠ IP-Overlay-Script nicht gefunden: $SCRIPT_PATH"
fi

# 5. Verstecke Desktop-Icons (optional für sauberen Look)
echo ""
read -p "Möchten Sie Desktop-Icons ausblenden? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    pcmanfm --set-wallpaper=/usr/share/rpd-wallpaper/temple.jpg --desktop-pref 2>/dev/null || true
    echo "✓ Desktop-Icons ausgeblendet"
fi

echo ""
echo "====================================="
echo "Setup abgeschlossen!"
echo "====================================="
echo ""
echo "Änderungen:"
echo "  1. Netzwerk-Benachrichtigungen deaktiviert"
echo "  2. IP-Overlay wird beim Boot gestartet"
echo "  3. Overlay verschwindet automatisch wenn Chromium startet"
echo ""
echo "Bitte System neu starten für volle Wirkung:"
echo "  sudo reboot"
echo ""
