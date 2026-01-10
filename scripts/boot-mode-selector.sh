#!/bin/bash
#
# PRASCO Boot Mode Selector
# Ermöglicht Auswahl zwischen Normal- und Hotspot-Modus beim Booten
#
# Usage: Wird automatisch beim Boot aufgerufen
#

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Konfigurationsdatei
MODE_FILE="/etc/prasco/boot-mode"
CONFIG_DIR="/etc/prasco"

# Erstelle Config-Verzeichnis falls nicht vorhanden
mkdir -p "$CONFIG_DIR"

# Lade gespeicherten Modus
if [ -f "$MODE_FILE" ]; then
    SAVED_MODE=$(cat "$MODE_FILE")
else
    SAVED_MODE="normal"
fi

clear

echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}║          🍓 PRASCO Boot Modus Auswahl         ║${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Wähle den Boot-Modus für PRASCO:${NC}"
echo ""
echo -e "${GREEN}  1)${NC} Normal-Modus ${YELLOW}(Standard)${NC}"
echo "     • Verbindung zum vorhandenen Netzwerk"
echo "     • PRASCO nutzt externe Server-URL"
echo "     • Internet-Zugang erforderlich"
echo ""
echo -e "${GREEN}  2)${NC} Hotspot-Modus ${YELLOW}(Offline)${NC}"
echo "     • Raspberry Pi erstellt WiFi Hotspot"
echo "     • SSID: PRASCO-Display"
echo "     • Admin-Zugriff: http://192.168.4.1:3000"
echo "     • Kein externes Netzwerk erforderlich"
echo ""
echo -e "${BLUE}  3)${NC} Aktuellen Modus ändern"
echo ""
echo -e "${BLUE}  4)${NC} Beenden (keine Änderung)"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "Aktueller Modus: ${GREEN}${SAVED_MODE}${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo ""

# Timeout für automatischen Start
TIMEOUT=10
echo -e "${CYAN}Automatischer Start in ${TIMEOUT} Sekunden...${NC}"
echo -e "${CYAN}Drücke eine Taste zum Wählen${NC}"
echo ""

# Warte auf Eingabe mit Timeout
read -t $TIMEOUT -n 1 -p "Auswahl (1-4): " choice || choice=""
echo ""

# Standard-Auswahl bei Timeout
if [ -z "$choice" ]; then
    echo -e "${YELLOW}Timeout - Verwende gespeicherten Modus: ${SAVED_MODE}${NC}"
    choice="0"
fi

case $choice in
    1)
        echo -e "${GREEN}➜ Normal-Modus wird aktiviert...${NC}"
        echo "normal" > "$MODE_FILE"
        
        # Deaktiviere Hotspot-Services
        systemctl disable hostapd 2>/dev/null || true
        systemctl disable dnsmasq 2>/dev/null || true
        systemctl stop hostapd 2>/dev/null || true
        systemctl stop dnsmasq 2>/dev/null || true
        
        # Reaktiviere normale Netzwerkkonfiguration
        if [ -f /etc/dhcpcd.conf.backup ]; then
            cp /etc/dhcpcd.conf.backup /etc/dhcpcd.conf
        fi
        
        echo -e "${GREEN}✓ Normal-Modus aktiviert${NC}"
        echo -e "${YELLOW}System wird neu gestartet...${NC}"
        sleep 2
        reboot
        ;;
        
    2)
        echo -e "${GREEN}➜ Hotspot-Modus wird aktiviert...${NC}"
        echo "hotspot" > "$MODE_FILE"
        
        # Aktiviere Hotspot-Services
        systemctl enable hostapd 2>/dev/null || true
        systemctl enable dnsmasq 2>/dev/null || true
        
        echo -e "${GREEN}✓ Hotspot-Modus aktiviert${NC}"
        echo ""
        echo -e "${CYAN}═══════════════════════════════════════${NC}"
        echo -e "${CYAN}WiFi Hotspot Informationen:${NC}"
        echo -e "${CYAN}═══════════════════════════════════════${NC}"
        echo "  SSID:       PRASCO-Display"
        echo "  Passwort:   prasco123"
        echo "  Admin-URL:  http://192.168.4.1:3000/admin"
        echo -e "${CYAN}═══════════════════════════════════════${NC}"
        echo ""
        echo -e "${YELLOW}System wird neu gestartet...${NC}"
        sleep 3
        reboot
        ;;
        
    3)
        echo -e "${BLUE}➜ Modus-Änderung...${NC}"
        echo ""
        read -p "Welcher Modus? (normal/hotspot): " new_mode
        
        if [ "$new_mode" = "normal" ] || [ "$new_mode" = "hotspot" ]; then
            echo "$new_mode" > "$MODE_FILE"
            echo -e "${GREEN}✓ Modus gesetzt auf: ${new_mode}${NC}"
            echo -e "${YELLOW}Bitte neu starten: sudo reboot${NC}"
        else
            echo -e "${RED}Ungültige Eingabe${NC}"
        fi
        ;;
        
    4|0|"")
        echo -e "${BLUE}Fortfahren mit Modus: ${SAVED_MODE}${NC}"
        
        # Starte Services basierend auf Modus
        if [ "$SAVED_MODE" = "hotspot" ]; then
            echo -e "${YELLOW}➜ Starte Hotspot-Services...${NC}"
            systemctl start hostapd 2>/dev/null || true
            systemctl start dnsmasq 2>/dev/null || true
        fi
        ;;
        
    *)
        echo -e "${RED}Ungültige Auswahl${NC}"
        echo -e "${BLUE}Fortfahren mit Modus: ${SAVED_MODE}${NC}"
        ;;
esac

exit 0
