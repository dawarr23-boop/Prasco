#!/bin/bash

###############################################################################
# PRASCO Hotspot Service Installer
# Installiert systemd Service für automatischen Hotspot-Start
###############################################################################

set -e

echo "╔════════════════════════════════════════╗"
echo "║   PRASCO Hotspot Service Setup        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Installiere Start-Script
echo "➜ Installiere Hotspot-Start-Script..."
sudo cp start-hotspot.sh /usr/local/bin/prasco-start-hotspot
sudo chmod +x /usr/local/bin/prasco-start-hotspot
echo "  ✓ Script installiert"

# Installiere Systemd Service
echo "➜ Installiere Systemd Service..."
sudo cp configs/prasco-hotspot.service /etc/systemd/system/
echo "  ✓ Service-Datei installiert"

# Aktiviere Service
echo "➜ Aktiviere Service..."
sudo systemctl daemon-reload
sudo systemctl enable prasco-hotspot.service
echo "  ✓ Service aktiviert"

# Erstelle Log-Verzeichnis
echo "➜ Erstelle Log-Verzeichnis..."
sudo touch /var/log/prasco-hotspot.log
sudo chmod 666 /var/log/prasco-hotspot.log
echo "  ✓ Log-Datei erstellt"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✓ Hotspot Service installiert       ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Der Hotspot startet automatisch beim Boot,"
echo "wenn der Modus auf 'hotspot' gesetzt ist."
echo ""
echo "Log-Datei: /var/log/prasco-hotspot.log"
echo ""
