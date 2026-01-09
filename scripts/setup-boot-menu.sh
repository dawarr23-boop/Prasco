#!/bin/bash
#
# PRASCO Boot Menu Setup
# Installiert Boot-Modus-Auswahl für Raspberry Pi
#
# Usage: sudo ./setup-boot-menu.sh
#

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO Boot Menu Setup               ║${NC}"
echo -e "${GREEN}║   Raspberry Pi Boot Modus Auswahl      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Fehler: Bitte als root ausführen${NC}"
    echo -e "${YELLOW}Verwende: sudo $0${NC}"
    exit 1
fi

echo -e "${BLUE}Dieses Script installiert ein Boot-Menü für PRASCO${NC}"
echo ""
echo -e "${YELLOW}Funktionen:${NC}"
echo "  • Auswahl zwischen Normal- und Hotspot-Modus beim Booten"
echo "  • 10 Sekunden Timeout für automatischen Start"
echo "  • Permanente Speicherung der Auswahl"
echo ""

read -p "Fortfahren? (j/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
    echo -e "${RED}Abgebrochen.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Installation startet...${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# 1. Erstelle Config-Verzeichnis
echo -e "${BLUE}[1/5]${NC} ${YELLOW}➜ Erstelle Konfigurations-Verzeichnis...${NC}"
mkdir -p /etc/prasco
echo "normal" > /etc/prasco/boot-mode
echo -e "${GREEN}      ✓ Verzeichnis erstellt${NC}"

# 2. Kopiere Boot-Selector Script
echo -e "${BLUE}[2/5]${NC} ${YELLOW}➜ Installiere Boot-Selector Script...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/boot-mode-selector.sh" ]; then
    cp "$SCRIPT_DIR/boot-mode-selector.sh" /usr/local/bin/prasco-boot-selector
    chmod +x /usr/local/bin/prasco-boot-selector
    echo -e "${GREEN}      ✓ Script installiert${NC}"
else
    echo -e "${RED}      ✗ boot-mode-selector.sh nicht gefunden${NC}"
    echo -e "${YELLOW}      Erstelle Script manuell...${NC}"
    
    # Script inline erstellen falls nicht vorhanden
    cat > /usr/local/bin/prasco-boot-selector << 'EOFSCRIPT'
#!/bin/bash
# Boot Mode Selector - siehe boot-mode-selector.sh für vollständige Version
MODE_FILE="/etc/prasco/boot-mode"
if [ -f "$MODE_FILE" ]; then
    MODE=$(cat "$MODE_FILE")
    if [ "$MODE" = "hotspot" ]; then
        systemctl start hostapd
        systemctl start dnsmasq
    fi
fi
EOFSCRIPT
    chmod +x /usr/local/bin/prasco-boot-selector
    echo -e "${GREEN}      ✓ Basis-Script erstellt${NC}"
fi

# 3. Erstelle Systemd Service
echo -e "${BLUE}[3/5]${NC} ${YELLOW}➜ Erstelle Systemd Service...${NC}"

cat > /etc/systemd/system/prasco-boot-menu.service << 'EOF'
[Unit]
Description=PRASCO Boot Mode Selector
After=local-fs.target
Before=network-pre.target
Wants=network-pre.target
DefaultDependencies=no

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-boot-selector
StandardInput=tty
StandardOutput=tty
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}      ✓ Service erstellt${NC}"

# 4. Aktiviere Service
echo -e "${BLUE}[4/5]${NC} ${YELLOW}➜ Aktiviere Service...${NC}"
systemctl daemon-reload
systemctl enable prasco-boot-menu.service
echo -e "${GREEN}      ✓ Service aktiviert${NC}"

# 5. Erstelle Hilfsbefehle
echo -e "${BLUE}[5/5]${NC} ${YELLOW}➜ Erstelle Hilfsbefehle...${NC}"

# Befehl zum manuellen Öffnen des Menüs
cat > /usr/local/bin/prasco-mode << 'EOF'
#!/bin/bash
sudo /usr/local/bin/prasco-boot-selector
EOF
chmod +x /usr/local/bin/prasco-mode

# Befehl zum Anzeigen des aktuellen Modus
cat > /usr/local/bin/prasco-status << 'EOF'
#!/bin/bash
if [ -f /etc/prasco/boot-mode ]; then
    MODE=$(cat /etc/prasco/boot-mode)
    echo "Aktueller PRASCO Modus: $MODE"
    
    if [ "$MODE" = "hotspot" ]; then
        echo ""
        echo "Hotspot-Informationen:"
        echo "  SSID:       PRASCO-Display"
        echo "  Passwort:   prasco123"
        echo "  Admin-URL:  http://192.168.4.1:3000/admin"
    fi
else
    echo "Kein Modus konfiguriert"
fi
EOF
chmod +x /usr/local/bin/prasco-status

echo -e "${GREEN}      ✓ Hilfsbefehle erstellt${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Boot Menu erfolgreich installiert ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Info-Ausgabe
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Installation abgeschlossen!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Verfügbare Befehle:${NC}"
echo ""
echo -e "${GREEN}  prasco-mode${NC}"
echo "    Öffnet das Boot-Menü zur Modus-Auswahl"
echo ""
echo -e "${GREEN}  prasco-status${NC}"
echo "    Zeigt aktuellen Boot-Modus an"
echo ""
echo -e "${YELLOW}Beim nächsten Boot:${NC}"
echo "  • Boot-Menü erscheint automatisch"
echo "  • 10 Sekunden Zeit zur Auswahl"
echo "  • Automatischer Start mit gespeichertem Modus"
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Test-Frage
read -p "Boot-Menü jetzt testen? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo ""
    /usr/local/bin/prasco-boot-selector
fi

echo ""
echo -e "${YELLOW}Hinweis: Boot-Menü wird beim nächsten Neustart angezeigt${NC}"
echo ""

exit 0
