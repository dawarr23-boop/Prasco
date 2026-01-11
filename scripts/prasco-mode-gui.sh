#!/bin/bash

###############################################################################
# PRASCO Mode Switcher - Grafische Oberfläche
# Benutzerfreundlicher Modus-Wechsel mit zenity
###############################################################################

set -e

# Prüfe ob zenity installiert ist
if ! command -v zenity &> /dev/null; then
    # Fallback auf Terminal-Modus
    exec x-terminal-emulator -e "sudo /usr/local/bin/prasco-mode"
    exit
fi

# Lade aktuellen Modus
MODE_FILE="/etc/prasco/boot-mode"
if [ -f "$MODE_FILE" ]; then
    CURRENT_MODE=$(cat "$MODE_FILE")
else
    CURRENT_MODE="normal"
fi

# Zeige Info-Dialog mit aktuellem Status
zenity --info \
    --title="PRASCO Modus-Wechsel" \
    --width=400 \
    --text="<b>Aktueller Modus:</b> $CURRENT_MODE\n\nWählen Sie den gewünschten Boot-Modus.\nNach der Auswahl wird das System neu gestartet." \
    --ok-label="Weiter"

# Modus-Auswahl
if [ "$CURRENT_MODE" == "normal" ]; then
    SELECTED="Normal-Modus"
else
    SELECTED="Hotspot-Modus"
fi

CHOICE=$(zenity --list \
    --title="PRASCO Modus-Wechsel" \
    --width=500 \
    --height=300 \
    --column="Auswahl" --column="Modus" --column="Beschreibung" \
    TRUE "Normal-Modus" "Verbindung zum vorhandenen Netzwerk" \
    FALSE "Hotspot-Modus" "Raspberry Pi erstellt WiFi Hotspot (PRASCO-Display)" \
    --radiolist \
    --text="Wählen Sie den Boot-Modus:")

if [ -z "$CHOICE" ]; then
    zenity --info --title="Abgebrochen" --text="Keine Änderung vorgenommen."
    exit 0
fi

# Bestätigung
if ! zenity --question \
    --title="Bestätigung" \
    --width=400 \
    --text="<b>Neuer Modus:</b> $CHOICE\n\nDer Modus wird sofort gewechselt.\nFortfahren?" \
    --ok-label="Ja, wechseln" \
    --cancel-label="Abbrechen"; then
    exit 0
fi

# Setze Modus
if [ "$CHOICE" == "Normal-Modus" ]; then
    echo "normal" | sudo tee "$MODE_FILE" > /dev/null
    
    # Stoppe Hotspot-Services sofort
    sudo systemctl stop hostapd 2>/dev/null || true
    sudo systemctl stop dnsmasq 2>/dev/null || true
    sudo systemctl disable hostapd 2>/dev/null || true
    sudo systemctl disable dnsmasq 2>/dev/null || true
    
    # Entferne statische IP von wlan0
    if grep -q "interface wlan0" /etc/dhcpcd.conf; then
        sudo sed -i '/interface wlan0/,/static domain_name_servers/d' /etc/dhcpcd.conf
        sudo systemctl restart dhcpcd
    fi
    
    zenity --info --title="Modus gewechselt" --width=350 --text="<b>Normal-Modus</b> aktiviert.\n\nHotspot gestoppt.\nVerbinde mit bestehendem Netzwerk..." --timeout=3
    
elif [ "$CHOICE" == "Hotspot-Modus" ]; then
    echo "hotspot" | sudo tee "$MODE_FILE" > /dev/null
    
    # Konfiguriere statische IP für wlan0
    if ! grep -q "interface wlan0" /etc/dhcpcd.conf; then
        sudo tee -a /etc/dhcpcd.conf > /dev/null << 'DHCP'

interface wlan0
static ip_address=192.168.4.1/24
nohook wpa_supplicant
DHCP
        sudo systemctl restart dhcpcd
    fi
    
    # Starte Hotspot-Services sofort
    sudo systemctl enable hostapd 2>/dev/null || true
    sudo systemctl enable dnsmasq 2>/dev/null || true
    sudo systemctl start hostapd 2>/dev/null || true
    sudo systemctl start dnsmasq 2>/dev/null || true
    
    zenity --info --title="Modus gewechselt" --width=350 --text="<b>Hotspot-Modus</b> aktiviert!\n\nSSID: PRASCO-Display\nPasswort: prasco123\nIP: 192.168.4.1:3000\n\nHotspot läuft jetzt." --timeout=5
fi
