#!/bin/bash
#
# PRASCO Boot Progress Display
# Zeigt Ladebalken während des Boot-Vorgangs
#

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Terminal leeren
clear

# Cursor verstecken
tput civis

# Cleanup beim Beenden
cleanup() {
    tput cnorm
    clear
}
trap cleanup EXIT

# Fortschrittsbalken zeichnen
draw_progress_bar() {
    local progress=$1
    local total=50
    local filled=$((progress * total / 100))
    local empty=$((total - filled))
    
    printf "\r["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] %3d%%" "$progress"
}

# Phase anzeigen
show_phase() {
    local phase_name=$1
    local emoji=$2
    echo ""
    echo -e "${CYAN}$emoji ${BLUE}$phase_name${NC}"
}

# Service-Check
check_service() {
    local service=$1
    systemctl is-active --quiet "$service" 2>/dev/null
}

# Hauptanzeige
main() {
    local mode=$(cat /etc/prasco/boot-mode 2>/dev/null || echo "normal")
    
    # Header
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                ║${NC}"
    echo -e "${GREEN}║          🍓 PRASCO wird gestartet...          ║${NC}"
    echo -e "${GREEN}║                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Modus: ${GREEN}$mode${NC}"
    echo ""
    
    # Phase 1: System-Dienste (0-20%)
    show_phase "System-Dienste starten..." "⚙️ "
    for i in {0..20}; do
        draw_progress_bar $i
        sleep 0.1
    done
    echo -e " ${GREEN}✓${NC}"
    
    # Phase 2: Netzwerk-Konfiguration (20-40%)
    show_phase "Netzwerk wird konfiguriert..." "🌐"
    for i in {20..40}; do
        draw_progress_bar $i
        sleep 0.08
    done
    
    # Prüfe ob Hotspot oder Normal
    if [ "$mode" = "hotspot" ]; then
        echo -e " ${GREEN}✓${NC}"
        show_phase "WiFi Hotspot wird aktiviert..." "📡"
        for i in {40..60}; do
            draw_progress_bar $i
            sleep 0.1
        done
        
        # Warte auf hostapd
        local count=0
        while [ $count -lt 20 ]; do
            if check_service hostapd; then
                break
            fi
            sleep 0.5
            ((count++))
        done
        echo -e " ${GREEN}✓${NC}"
        
        show_phase "DHCP Server wird gestartet..." "🔧"
        for i in {60..70}; do
            draw_progress_bar $i
            sleep 0.08
        done
        echo -e " ${GREEN}✓${NC}"
    else
        echo -e " ${GREEN}✓${NC}"
        show_phase "Netzwerk-Verbindung wird hergestellt..." "🔌"
        for i in {40..70}; do
            draw_progress_bar $i
            sleep 0.06
        done
        echo -e " ${GREEN}✓${NC}"
    fi
    
    # Phase 3: PRASCO Server (70-90%)
    show_phase "PRASCO Server wird gestartet..." "🚀"
    for i in {70..85}; do
        draw_progress_bar $i
        sleep 0.1
    done
    
    # Warte auf PRASCO
    local count=0
    while [ $count -lt 30 ]; do
        if check_service prasco || pgrep -f "node.*server.js" >/dev/null; then
            break
        fi
        sleep 0.5
        ((count++))
    done
    
    for i in {85..90}; do
        draw_progress_bar $i
        sleep 0.1
    done
    echo -e " ${GREEN}✓${NC}"
    
    # Phase 4: Finalisierung (90-100%)
    show_phase "System wird finalisiert..." "✨"
    for i in {90..100}; do
        draw_progress_bar $i
        sleep 0.05
    done
    echo -e " ${GREEN}✓${NC}"
    
    # Fertig
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                ║${NC}"
    echo -e "${GREEN}║            ✅ PRASCO ist bereit!               ║${NC}"
    echo -e "${GREEN}║                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Zugriffsinformationen
    if [ "$mode" = "hotspot" ]; then
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}Hotspot-Modus aktiv:${NC}"
        echo ""
        echo -e "  ${BLUE}SSID:${NC}       PRASCO-Display"
        echo -e "  ${BLUE}Passwort:${NC}   prasco123"
        echo -e "  ${BLUE}IP:${NC}         192.168.4.1"
        echo ""
        echo -e "  ${GREEN}Display:${NC}    http://192.168.4.1:3000"
        echo -e "  ${GREEN}Admin:${NC}      http://192.168.4.1:3000/admin"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    else
        local ip=$(hostname -I | awk '{print $1}')
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}Normal-Modus aktiv:${NC}"
        echo ""
        echo -e "  ${BLUE}IP:${NC}         $ip"
        echo ""
        echo -e "  ${GREEN}Display:${NC}    http://$ip:3000"
        echo -e "  ${GREEN}Admin:${NC}      http://$ip:3000/admin"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Tipp: Verwende 'prasco-mode' zum Wechseln des Modus${NC}"
    echo ""
    
    # Warte kurz bevor wir zur Console zurückkehren
    sleep 5
}

# Script ausführen
main

exit 0
