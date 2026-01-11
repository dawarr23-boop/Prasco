#!/bin/bash

###############################################################################
# PRASCO Chromium Kiosk Setup
# Richtet Chromium im Kiosk-Modus ein für localhost:3000
###############################################################################

set -e

echo "╔════════════════════════════════════════╗"
echo "║   PRASCO Chromium Kiosk Setup         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Prüfe ob im Desktop-Modus
if [ ! -d "/home/pi/.config" ]; then
    echo "⚠  Desktop-Umgebung nicht erkannt"
    echo "   Installiere Desktop-Pakete..."
    sudo apt-get update
    sudo apt-get install -y raspberrypi-ui-mods chromium-browser unclutter xdotool
fi

# Erstelle Autostart-Verzeichnis
echo "➜ Erstelle Autostart-Konfiguration..."
mkdir -p /home/pi/.config/lxsession/LXDE-pi
mkdir -p /home/pi/.config/autostart

# Erstelle Autostart-Datei
cat > /home/pi/.config/lxsession/LXDE-pi/autostart << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash

# Deaktiviere Screensaver und Energiesparmodus
@xset s off
@xset s noblank
@xset -dpms

# Verstecke Cursor nach Inaktivität
@unclutter -idle 0.5 -root

# Starte Chromium im Kiosk-Modus
@chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --enable-features=OverlayScrollbar --start-fullscreen http://localhost:3000
EOF

echo "  ✓ Autostart konfiguriert"

# Alternative: Systemd Service für mehr Kontrolle
echo "➜ Erstelle Systemd Service..."
sudo tee /etc/systemd/system/prasco-kiosk.service > /dev/null << 'EOF'
[Unit]
Description=PRASCO Chromium Kiosk
After=prasco.service
Wants=prasco.service
PartOf=graphical.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run --enable-features=OverlayScrollbar --start-fullscreen http://localhost:3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

echo "  ✓ Service erstellt"

# Konfiguriere Boot zum Desktop
echo "➜ Konfiguriere Auto-Login..."
sudo raspi-config nonint do_boot_behaviour B4

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✓ Chromium Kiosk installiert        ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Der Raspberry Pi wird beim nächsten Start"
echo "automatisch Chromium im Kiosk-Modus starten."
echo ""
echo "URL: http://localhost:3000"
echo ""
read -p "Service jetzt aktivieren? (j/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    sudo systemctl enable prasco-kiosk.service
    echo "✓ Service aktiviert"
fi
echo ""
read -p "System jetzt neu starten? (j/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    sudo reboot
fi
