#!/bin/bash
#
# PRASCO Boot Progress Display - Conditional
# Zeigt Ladebalken nur wenn 'v' Taste gedrückt wird, sonst Logo
#

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

# Terminal leeren
clear

# Prüfe ob 'v' Taste gedrückt wurde (über Kernel-Parameter)
SHOW_VERBOSE=false
if grep -q "prasco.verbose" /proc/cmdline 2>/dev/null; then
    SHOW_VERBOSE=true
fi

# Alternativ: Prüfe auf Tastendruck während Boot
# Warte 0.5 Sekunden auf Tastendruck
read -t 0.5 -n 1 key 2>/dev/null
if [[ $key == "v" ]] || [[ $key == "V" ]]; then
    SHOW_VERBOSE=true
fi

# Boot-Modus ermitteln
BOOT_MODE="normal"
if [ -f /etc/prasco/boot-mode ]; then
    BOOT_MODE=$(cat /etc/prasco/boot-mode)
fi

if [ "$SHOW_VERBOSE" = true ]; then
    # VERBOSE MODE: Zeige Fortschrittsbalken
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════╗"
    echo "║          🍓 PRASCO wird gestartet...          ║"
    echo "╚════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    if [ "$BOOT_MODE" = "hotspot" ]; then
        echo -e "${YELLOW}Modus: Hotspot${NC}"
    else
        echo -e "${BLUE}Modus: Normal${NC}"
    fi
    echo ""
    
    # Fortschrittsbalken Funktion
    draw_progress() {
        local percent=$1
        local total=50
        local filled=$((percent * total / 100))
        local empty=$((total - filled))
        
        echo -ne "\r${CYAN}["
        printf "%${filled}s" | tr ' ' '█'
        printf "%${empty}s" | tr ' ' '░'
        printf "] %3d%%" "$percent"
        
        if [ $percent -eq 100 ]; then
            echo -ne " ${GREEN}✓${NC}"
        fi
        echo -ne "${NC}"
    }
    
    # Phase 1: System-Dienste (0-20%)
    echo -e "${WHITE}⚙️  System-Dienste starten...${NC}"
    for i in {0..20}; do
        draw_progress $i
        sleep 0.05
    done
    echo ""
    echo ""
    
    # Phase 2: Netzwerk (20-40%)
    echo -e "${WHITE}🌐 Netzwerk wird konfiguriert...${NC}"
    for i in {20..40}; do
        draw_progress $i
        sleep 0.05
    done
    echo ""
    echo ""
    
    # Phase 3: Hotspot oder Netzwerk-Verbindung (40-70%)
    if [ "$BOOT_MODE" = "hotspot" ]; then
        echo -e "${WHITE}📡 WiFi Hotspot wird aktiviert...${NC}"
        for i in {40..60}; do
            draw_progress $i
            sleep 0.05
        done
        echo ""
        echo ""
        
        echo -e "${WHITE}🔧 DHCP Server wird gestartet...${NC}"
        for i in {60..70}; do
            draw_progress $i
            sleep 0.05
        done
    else
        echo -e "${WHITE}🔌 Netzwerk-Verbindung wird hergestellt...${NC}"
        for i in {40..70}; do
            draw_progress $i
            sleep 0.05
        done
    fi
    echo ""
    echo ""
    
    # Phase 4: PRASCO Server (70-90%)
    echo -e "${WHITE}🚀 PRASCO Server wird gestartet...${NC}"
    for i in {70..90}; do
        draw_progress $i
        sleep 0.05
        
        if [ $i -eq 85 ]; then
            timeout=0
            while [ $timeout -lt 30 ]; do
                if curl -s -k https://localhost:3000/api/health > /dev/null 2>&1; then
                    break
                fi
                sleep 0.5
                timeout=$((timeout + 1))
            done
        fi
    done
    echo ""
    echo ""
    
    # Phase 5: Finalisierung (90-100%)
    echo -e "${WHITE}✨ System wird finalisiert...${NC}"
    for i in {90..100}; do
        draw_progress $i
        sleep 0.03
    done
    echo ""
    echo ""
    
    # Erfolgsmeldung
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════╗"
    echo "║            ✅ PRASCO ist bereit!               ║"
    echo "╚════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # Informationen
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$BOOT_MODE" = "hotspot" ]; then
        echo -e "${YELLOW}Hotspot-Modus aktiv:${NC}"
        echo ""
        echo "  SSID:       PRASCO-Display"
        echo "  Passwort:   prasco123"
        echo "  IP:         192.168.4.1"
        echo ""
        echo "  Display:    http://192.168.4.1:3000"
        echo "  Admin:      http://192.168.4.1:3000/admin"
    else
        echo -e "${BLUE}Normal-Modus aktiv:${NC}"
        echo ""
        IP_ADDR=$(hostname -I | awk '{print $1}')
        echo "  IP:         $IP_ADDR"
        echo ""
        echo "  Display:    https://$IP_ADDR:3000/public/display.html"
        echo "  Admin:      https://$IP_ADDR:3000"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    sleep 2

else
    # SILENT MODE: Zeige nur Logo
    
    # Zeige PRASCO-Logo falls vorhanden
    if [ -f /usr/share/prasco/boot-logo.png ]; then
        # Mit fbi (framebuffer imageviewer)
        if command -v fbi &> /dev/null; then
            fbi -noverbose -a /usr/share/prasco/boot-logo.png 2>/dev/null &
            FBI_PID=$!
        fi
    fi
    
    # Warte auf Services im Hintergrund
    timeout=0
    while [ $timeout -lt 60 ]; do
        if curl -s -k https://localhost:3000/api/health > /dev/null 2>&1; then
            break
        fi
        sleep 1
        timeout=$((timeout + 1))
    done
    
    # Beende Logo-Anzeige
    if [ -n "$FBI_PID" ]; then
        kill $FBI_PID 2>/dev/null
    fi
fi

# Kurz warten, dann Chromium übernehmen lassen
sleep 1
exit 0
