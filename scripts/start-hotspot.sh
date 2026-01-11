#!/bin/bash

###############################################################################
# PRASCO Hotspot Startup Script
# Stellt sicher dass Hotspot beim Boot korrekt startet
###############################################################################

set -e

MODE_FILE="/etc/prasco/boot-mode"
LOG_FILE="/var/log/prasco-hotspot.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Lese Boot-Modus
BOOT_MODE="normal"
if [ -f "$MODE_FILE" ]; then
    BOOT_MODE=$(cat "$MODE_FILE" | tr -d '[:space:]')
fi

log "Boot-Modus: $BOOT_MODE"

if [ "$BOOT_MODE" != "hotspot" ]; then
    log "Normal-Modus aktiv, überspringe Hotspot-Setup"
    exit 0
fi

log "Starte Hotspot-Konfiguration..."

# 1. Stoppe NetworkManager für wlan0
log "Konfiguriere NetworkManager..."
cat > /etc/NetworkManager/conf.d/unmanage-wlan0.conf << 'EOF'
[keyfile]
unmanaged-devices=interface-name:wlan0
EOF

systemctl reload NetworkManager || true
sleep 2

# 2. Stoppe wpa_supplicant für wlan0
log "Stoppe wpa_supplicant..."
systemctl stop wpa_supplicant || true
pkill -9 wpa_supplicant || true

# 3. Setze wlan0 down und up
log "Reset wlan0..."
ip link set wlan0 down
sleep 1
ip link set wlan0 up
sleep 2

# 4. Setze statische IP
log "Konfiguriere statische IP..."
ip addr flush dev wlan0
ip addr add 192.168.4.1/24 dev wlan0

# 5. Aktiviere IP Forwarding
log "Aktiviere IP Forwarding..."
echo 1 > /proc/sys/net/ipv4/ip_forward

# 6. Konfiguriere iptables für NAT (falls Internet-Sharing gewünscht)
log "Konfiguriere Firewall..."
iptables -t nat -F
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE || true
iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT || true
iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT || true

# 7. Starte hostapd
log "Starte hostapd..."
systemctl enable hostapd
systemctl restart hostapd
sleep 3

# 8. Starte dnsmasq
log "Starte dnsmasq..."
systemctl enable dnsmasq
systemctl restart dnsmasq
sleep 2

# 9. Prüfe Status
HOSTAPD_STATUS=$(systemctl is-active hostapd)
DNSMASQ_STATUS=$(systemctl is-active dnsmasq)

log "hostapd: $HOSTAPD_STATUS"
log "dnsmasq: $DNSMASQ_STATUS"

if [ "$HOSTAPD_STATUS" = "active" ] && [ "$DNSMASQ_STATUS" = "active" ]; then
    log "✅ Hotspot erfolgreich gestartet!"
    log "   SSID: PRASCO-Display"
    log "   IP: 192.168.4.1"
    log "   URL: http://192.168.4.1:3000"
else
    log "❌ Fehler beim Starten des Hotspots"
    log "   hostapd: $HOSTAPD_STATUS"
    log "   dnsmasq: $DNSMASQ_STATUS"
    exit 1
fi
