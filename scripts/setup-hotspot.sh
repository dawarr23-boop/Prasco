#!/bin/bash
#
# PRASCO WiFi Hotspot Auto-Setup
# Konfiguriert Raspberry Pi als WiFi Access Point für PRASCO
#
# Usage: sudo ./setup-hotspot.sh
#

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO WiFi Hotspot Setup           ║${NC}"
echo -e "${GREEN}║   Raspberry Pi Access Point            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Fehler: Bitte als root ausführen${NC}"
    echo -e "${YELLOW}Verwende: sudo $0${NC}"
    exit 1
fi

# Standard-Konfiguration
SSID="PRASCO-Display"
PASSWORD="prasco123"
HOTSPOT_IP="192.168.4.1"
DHCP_START="192.168.4.10"
DHCP_END="192.168.4.50"
CHANNEL="6"
COUNTRY_CODE="DE"

# Interaktive Konfiguration
echo -e "${BLUE}➜ Konfiguration:${NC}"
echo ""
read -p "SSID [${SSID}]: " input_ssid
SSID="${input_ssid:-$SSID}"

read -p "Passwort [${PASSWORD}]: " input_password
PASSWORD="${input_password:-$PASSWORD}"

read -p "IP-Adresse [${HOTSPOT_IP}]: " input_ip
HOTSPOT_IP="${input_ip:-$HOTSPOT_IP}"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}Hotspot wird konfiguriert mit:${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo "   SSID:        ${SSID}"
echo "   Passwort:    ${PASSWORD}"
echo "   IP-Adresse:  ${HOTSPOT_IP}"
echo "   DHCP-Range:  ${DHCP_START} - ${DHCP_END}"
echo "   Kanal:       ${CHANNEL}"
echo "   Land-Code:   ${COUNTRY_CODE}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
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

# 1. Pakete installieren
echo -e "${BLUE}[1/8]${NC} ${YELLOW}➜ Installiere Pakete...${NC}"
apt update -qq
apt install -y hostapd dnsmasq iptables-persistent > /dev/null 2>&1
echo -e "${GREEN}      ✓ Pakete installiert${NC}"

# 2. Services stoppen
echo -e "${BLUE}[2/8]${NC} ${YELLOW}➜ Stoppe Services...${NC}"
systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true
echo -e "${GREEN}      ✓ Services gestoppt${NC}"

# 3. Statische IP konfigurieren
echo -e "${BLUE}[3/8]${NC} ${YELLOW}➜ Konfiguriere statische IP...${NC}"

# Backup erstellen
if [ -f /etc/dhcpcd.conf ]; then
    cp /etc/dhcpcd.conf /etc/dhcpcd.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Entferne alte Konfiguration falls vorhanden
sed -i '/# PRASCO Hotspot/,/nohook wpa_supplicant/d' /etc/dhcpcd.conf

# Neue Konfiguration hinzufügen
cat >> /etc/dhcpcd.conf << EOF

# PRASCO Hotspot Konfiguration
interface wlan0
    static ip_address=${HOTSPOT_IP}/24
    nohook wpa_supplicant
EOF

echo -e "${GREEN}      ✓ Statische IP konfiguriert${NC}"

# 4. DHCP-Server konfigurieren
echo -e "${BLUE}[4/8]${NC} ${YELLOW}➜ Konfiguriere DHCP-Server (dnsmasq)...${NC}"

# Backup
if [ -f /etc/dnsmasq.conf ]; then
    mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig 2>/dev/null || true
fi

# Neue Konfiguration
cat > /etc/dnsmasq.conf << EOF
# PRASCO WiFi Hotspot - DHCP Konfiguration

# Interface
interface=wlan0

# DHCP-Server
dhcp-range=${DHCP_START},${DHCP_END},255.255.255.0,24h

# DNS-Server (Google DNS als Fallback)
server=8.8.8.8
server=8.8.4.4

# Domain
domain=prasco.local

# Lokale Domain-Namen
address=/prasco.local/${HOTSPOT_IP}
address=/admin.prasco.local/${HOTSPOT_IP}
address=/display.prasco.local/${HOTSPOT_IP}

# Logging
log-queries
log-dhcp

# DHCP-Optionen
dhcp-option=3,${HOTSPOT_IP}     # Gateway
dhcp-option=6,${HOTSPOT_IP}     # DNS Server
EOF

echo -e "${GREEN}      ✓ DHCP-Server konfiguriert${NC}"

# 5. WiFi Access Point konfigurieren
echo -e "${BLUE}[5/8]${NC} ${YELLOW}➜ Konfiguriere WiFi Access Point (hostapd)...${NC}"

cat > /etc/hostapd/hostapd.conf << EOF
# PRASCO WiFi Hotspot Konfiguration

# Interface und Driver
interface=wlan0
driver=nl80211

# SSID und Hotspot-Name
ssid=${SSID}

# WiFi-Modus (g = 2.4GHz)
hw_mode=g

# Kanal (1-13, empfohlen: 6 oder 11)
channel=${CHANNEL}

# Maximale Anzahl Verbindungen
max_num_sta=10

# WMM aktivieren (Quality of Service)
wmm_enabled=1

# WiFi Security - WPA2
auth_algs=1
wpa=2
wpa_passphrase=${PASSWORD}
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP

# Verstecktes Netzwerk (0 = sichtbar, 1 = versteckt)
ignore_broadcast_ssid=0

# Country Code
country_code=${COUNTRY_CODE}

# IEEE 802.11n (für bessere Performance)
ieee80211n=1
ht_capab=[HT40+][SHORT-GI-20][SHORT-GI-40][DSSS_CCK-40]

# Optional: 5GHz aktivieren (nur Pi 3B+, Pi 4)
# Auskommentieren für 5GHz:
# hw_mode=a
# channel=36
# ieee80211ac=1
# vht_capab=[MAX-MPDU-11454][SHORT-GI-80]
EOF

# hostapd Daemon-Konfiguration
if [ -f /etc/default/hostapd ]; then
    cp /etc/default/hostapd /etc/default/hostapd.backup 2>/dev/null || true
fi

sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd
echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' >> /etc/default/hostapd

echo -e "${GREEN}      ✓ WiFi Access Point konfiguriert${NC}"

# 6. Services aktivieren
echo -e "${BLUE}[6/8]${NC} ${YELLOW}➜ Aktiviere Services...${NC}"

systemctl unmask hostapd
systemctl enable hostapd
systemctl enable dnsmasq

echo -e "${GREEN}      ✓ Services aktiviert${NC}"

# 7. PRASCO auf alle Interfaces binden
echo -e "${BLUE}[7/8]${NC} ${YELLOW}➜ Konfiguriere PRASCO...${NC}"

# Suche PRASCO Verzeichnis
PRASCO_DIR=""
if [ -d "/home/pi/Prasco" ]; then
    PRASCO_DIR="/home/pi/Prasco"
elif [ -d "/home/pi/prasco" ]; then
    PRASCO_DIR="/home/pi/prasco"
fi

if [ -n "$PRASCO_DIR" ] && [ -f "$PRASCO_DIR/.env" ]; then
    # Backup .env
    cp "$PRASCO_DIR/.env" "$PRASCO_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Stelle sicher dass Server auf allen Interfaces lauscht
    if ! grep -q "HOST=0.0.0.0" "$PRASCO_DIR/.env"; then
        echo "HOST=0.0.0.0" >> "$PRASCO_DIR/.env"
    fi
    
    echo -e "${GREEN}      ✓ PRASCO konfiguriert${NC}"
else
    echo -e "${YELLOW}      ⚠ PRASCO nicht gefunden - bitte manuell konfigurieren${NC}"
fi

# 8. Firewall-Regeln (optional)
echo -e "${BLUE}[8/8]${NC} ${YELLOW}➜ Konfiguriere Firewall...${NC}"

# Erlaube Port 3000 vom WiFi-Netzwerk
if command -v ufw &> /dev/null; then
    ufw allow from 192.168.4.0/24 to any port 3000 2>/dev/null || true
    echo -e "${GREEN}      ✓ Firewall-Regeln gesetzt${NC}"
else
    echo -e "${YELLOW}      ⚠ UFW nicht installiert - übersprungen${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Hotspot erfolgreich konfiguriert  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Info-Ausgabe
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Hotspot-Informationen:${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}WiFi-Verbindung:${NC}"
echo "   SSID:       ${SSID}"
echo "   Passwort:   ${PASSWORD}"
echo ""
echo -e "${YELLOW}Zugriff auf PRASCO:${NC}"
echo "   Display:    http://${HOTSPOT_IP}:3000"
echo "   Admin:      http://${HOTSPOT_IP}:3000/admin"
echo "   Alternativ: http://prasco.local:3000"
echo ""
echo -e "${YELLOW}Admin-Zugangsdaten:${NC}"
echo "   Benutzer:   admin"
echo "   Passwort:   admin"
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Test-Modus
read -p "Konfiguration jetzt testen (ohne Neustart)? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo ""
    echo -e "${YELLOW}➜ Starte Services zum Testen...${NC}"
    
    systemctl restart dhcpcd
    sleep 2
    systemctl start hostapd
    sleep 2
    systemctl start dnsmasq
    
    echo ""
    echo -e "${YELLOW}➜ Prüfe Service-Status:${NC}"
    echo ""
    
    if systemctl is-active --quiet hostapd; then
        echo -e "   ${GREEN}✓ hostapd läuft${NC}"
    else
        echo -e "   ${RED}✗ hostapd fehler${NC}"
        echo "      Logs: sudo journalctl -u hostapd -n 20"
    fi
    
    if systemctl is-active --quiet dnsmasq; then
        echo -e "   ${GREEN}✓ dnsmasq läuft${NC}"
    else
        echo -e "   ${RED}✗ dnsmasq fehler${NC}"
        echo "      Logs: sudo journalctl -u dnsmasq -n 20"
    fi
    
    echo ""
    echo -e "${YELLOW}Suche nach WiFi-Netzwerk '${SSID}' auf deinem Gerät!${NC}"
    echo ""
fi

# Neustart-Frage
echo ""
read -p "System jetzt neustarten? (empfohlen) (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo ""
    echo -e "${GREEN}System wird neu gestartet...${NC}"
    echo -e "${YELLOW}Nach dem Neustart:${NC}"
    echo "   1. Suche WiFi-Netzwerk: ${SSID}"
    echo "   2. Verbinde mit Passwort: ${PASSWORD}"
    echo "   3. Öffne Browser: http://${HOTSPOT_IP}:3000"
    echo ""
    sleep 3
    reboot
else
    echo ""
    echo -e "${YELLOW}Bitte manuell neustarten mit: sudo reboot${NC}"
    echo ""
fi

exit 0
