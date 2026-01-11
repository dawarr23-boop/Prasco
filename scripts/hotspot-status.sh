#!/bin/bash
#
# PRASCO WiFi Hotspot Status Check
# Zeigt Status und verbundene Clients an
#

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO WiFi Hotspot Status          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# hostapd Status
echo -e "${YELLOW}➜ hostapd (WiFi Access Point):${NC}"
if systemctl is-active --quiet hostapd; then
    echo -e "   ${GREEN}✓ Läuft${NC}"
else
    echo -e "   ${RED}✗ Gestoppt${NC}"
fi

# dnsmasq Status
echo -e "${YELLOW}➜ dnsmasq (DHCP Server):${NC}"
if systemctl is-active --quiet dnsmasq; then
    echo -e "   ${GREEN}✓ Läuft${NC}"
else
    echo -e "   ${RED}✗ Gestoppt${NC}"
fi

# WiFi Interface Status
echo ""
echo -e "${YELLOW}➜ WiFi Interface (wlan0):${NC}"
ip addr show wlan0 | grep "inet " | awk '{print "   IP: " $2}'

# SSID anzeigen
echo -e "${YELLOW}➜ Hotspot SSID:${NC}"
if [ -f /etc/hostapd/hostapd.conf ]; then
    grep "^ssid=" /etc/hostapd/hostapd.conf | cut -d'=' -f2 | awk '{print "   " $0}'
fi

# Verbundene Clients
echo ""
echo -e "${YELLOW}➜ Verbundene Clients:${NC}"
if [ -f /var/lib/misc/dnsmasq.leases ]; then
    CLIENT_COUNT=$(wc -l < /var/lib/misc/dnsmasq.leases)
    echo "   Anzahl: $CLIENT_COUNT"
    echo ""
    if [ $CLIENT_COUNT -gt 0 ]; then
        echo "   IP-Adresse       MAC-Adresse       Hostname"
        echo "   ─────────────────────────────────────────────"
        cat /var/lib/misc/dnsmasq.leases | awk '{printf "   %-15s  %-17s  %s\n", $3, $2, $4}'
    fi
else
    echo "   Keine Clients"
fi

# PRASCO Server Status
echo ""
echo -e "${YELLOW}➜ PRASCO Server:${NC}"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "prasco"; then
        echo -e "   ${GREEN}✓ Läuft (via PM2)${NC}"
        pm2 show prasco 2>/dev/null | grep -E "status|uptime|restarts" | awk '{print "   " $0}'
    else
        echo -e "   ${RED}✗ Nicht gefunden (PM2)${NC}"
    fi
elif systemctl is-active --quiet prasco; then
    echo -e "   ${GREEN}✓ Läuft (via systemd)${NC}"
else
    echo -e "   ${RED}✗ Gestoppt${NC}"
fi

# URLs anzeigen
echo ""
echo -e "${YELLOW}➜ Zugriffs-URLs:${NC}"
HOTSPOT_IP=$(ip addr show wlan0 | grep "inet " | awk '{print $2}' | cut -d'/' -f1)
echo "   Display: http://${HOTSPOT_IP}:3000"
echo "   Admin:   http://${HOTSPOT_IP}:3000/admin"
echo ""
