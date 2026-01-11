#!/bin/bash
#
# PRASCO WiFi Hotspot Neustart
# Startet WiFi Access Point und DHCP Server neu
#

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO WiFi Hotspot Neustart        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}➜ Stoppe Services...${NC}"
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

echo -e "${YELLOW}➜ Starte Services neu...${NC}"
sudo systemctl start hostapd
sudo systemctl start dnsmasq

echo ""
echo -e "${YELLOW}➜ Status prüfen...${NC}"
sleep 2

if systemctl is-active --quiet hostapd; then
    echo -e "   hostapd: ${GREEN}✓ Läuft${NC}"
else
    echo -e "   hostapd: ${RED}✗ Fehler${NC}"
fi

if systemctl is-active --quiet dnsmasq; then
    echo -e "   dnsmasq: ${GREEN}✓ Läuft${NC}"
else
    echo -e "   dnsmasq: ${RED}✗ Fehler${NC}"
fi

echo ""
echo -e "${GREEN}✓ Neustart abgeschlossen!${NC}"
echo ""
