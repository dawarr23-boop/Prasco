#!/bin/bash
#
# PRASCO WiFi Hotspot Deaktivieren
# Stoppt den Hotspot und stellt normalen WiFi-Client-Modus wieder her
#

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO WiFi Hotspot Deaktivieren    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Fehler: Bitte als root ausführen (sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}➜ Stoppe Services...${NC}"
systemctl stop hostapd
systemctl stop dnsmasq

echo -e "${YELLOW}➜ Deaktiviere Autostart...${NC}"
systemctl disable hostapd
systemctl disable dnsmasq

echo -e "${YELLOW}➜ Entferne statische IP-Konfiguration...${NC}"
# Backup erstellen
cp /etc/dhcpcd.conf /etc/dhcpcd.conf.backup

# PRASCO Hotspot Konfiguration entfernen
sed -i '/# PRASCO Hotspot Konfiguration/,/nohook wpa_supplicant/d' /etc/dhcpcd.conf

echo -e "${YELLOW}➜ Aktiviere wpa_supplicant...${NC}"
systemctl enable wpa_supplicant

echo ""
echo -e "${GREEN}✓ Hotspot deaktiviert!${NC}"
echo ""
echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. Neustart: sudo reboot"
echo "2. Normaler WiFi-Client-Modus ist wiederhergestellt"
echo ""

read -p "Jetzt neustarten? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo "Starte neu..."
    reboot
fi
