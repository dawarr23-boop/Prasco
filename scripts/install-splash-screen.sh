#!/bin/bash
#===============================================================================
# PRASCO - Splash Screen Installer
# Installiert einen benutzerdefinierten Boot-Splashscreen mit PRASCO-Logo
#===============================================================================

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          PRASCO Splash Screen Installer                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Root-Rechte prüfen
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}✗${NC} Dieses Skript muss als root ausgeführt werden!"
   echo "   Verwende: sudo $0"
   exit 1
fi

#===============================================================================
# PSplash installieren (leichtgewichtig und schnell)
#===============================================================================

echo -e "${YELLOW}→${NC} Prüfe Splash-Screen-Optionen..."

# Versuche PSplash zu installieren
if apt-cache show psplash &>/dev/null; then
    echo -e "${YELLOW}→${NC} Installiere PSplash..."
    apt-get update -qq
    apt-get install -y psplash
    SPLASH_TYPE="psplash"
    echo -e "${GREEN}✓${NC} PSplash installiert"
else
    echo -e "${YELLOW}!${NC} PSplash nicht verfügbar im Repository"
    echo -e "${YELLOW}→${NC} Verwende Plymouth stattdessen..."
    
    # Prüfe ob Plymouth bereits installiert ist
    if command -v plymouth &>/dev/null; then
        echo -e "${GREEN}✓${NC} Plymouth ist bereits installiert"
        SPLASH_TYPE="plymouth"
    else
        echo -e "${YELLOW}→${NC} Installiere Plymouth..."
        apt-get install -y plymouth plymouth-themes
        SPLASH_TYPE="plymouth"
        echo -e "${GREEN}✓${NC} Plymouth installiert"
    fi
fi

#===============================================================================
# PRASCO Splash Screen Service erstellen
#===============================================================================

echo -e "${YELLOW}→${NC} Erstelle Splash Screen Service..."

if [[ "$SPLASH_TYPE" == "psplash" ]]; then
    # PSplash Service
    cat > /etc/systemd/system/prasco-splash.service << 'EOF'
[Unit]
Description=PRASCO Splash Screen
DefaultDependencies=no
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/usr/bin/psplash
ExecStartPost=/bin/sh -c 'echo "PROGRESS 10" > /run/psplash_fifo; echo "MSG Starte PRASCO..." > /run/psplash_fifo'
StandardInput=tty
StandardOutput=tty
RemainAfterExit=yes

[Install]
WantedBy=sysinit.target
EOF
elif [[ "$SPLASH_TYPE" == "plymouth" ]]; then
    # Plymouth ist bereits via systemd integriert, nur Theme anpassen
    echo -e "${CYAN}ℹ${NC} Plymouth ist bereits systemd-integriert"
    
    # Setze ein einfaches Theme
    plymouth-set-default-theme -R text 2>/dev/null || true
fi

# Service für PRASCO-Start-Progress erstellen
cat > /etc/systemd/system/prasco-splash-progress.service << 'EOF'
[Unit]
Description=PRASCO Boot Progress
After=network.target postgresql.service
Before=display-manager.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-boot-progress.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓${NC} Services erstellt"

#===============================================================================
# Boot-Progress-Skript erstellen
#===============================================================================

echo -e "${YELLOW}→${NC} Erstelle Boot-Progress-Skript..."

cat > /usr/local/bin/prasco-boot-progress.sh << 'PROGRESS_SCRIPT'
#!/bin/bash
# PRASCO Boot Progress Anzeige

FIFO=/run/psplash_fifo
SPLASH_TYPE="${SPLASH_TYPE:-none}"

progress() {
    local percent=$1
    local msg=$2
    
    # Für PSplash
    if [[ "$SPLASH_TYPE" == "psplash" ]] && [[ -p "$FIFO" ]]; then
        echo "PROGRESS $percent" > "$FIFO"
        echo "MSG $msg" > "$FIFO"
    fi
    
    # Für Plymouth
    if [[ "$SPLASH_TYPE" == "plymouth" ]] && command -v plymouth &>/dev/null; then
        plymouth message --text="$msg ($percent%)"
    fi
    
    # Fallback: Console-Ausgabe
    echo "[${percent}%] $msg"
}

# Boot-Fortschritt anzeigen
progress 20 "Netzwerk wird initialisiert..."
sleep 1

progress 40 "PostgreSQL wird gestartet..."
sleep 1

progress 60 "Node.js wird vorbereitet..."
sleep 1

progress 80 "PRASCO wird gestartet..."
sleep 1

# Warte auf PRASCO-Server (mit Timeout)
TIMEOUT=60
ELAPSED=0
while ! (curl -s http://localhost:3000/api/health > /dev/null 2>&1 || curl -sk https://localhost:3000/api/health > /dev/null 2>&1); do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    if [[ $ELAPSED -ge $TIMEOUT ]]; then
        progress 95 "Timeout - Server braucht länger..."
        break
    fi
done

progress 100 "PRASCO bereit!"
sleep 1

# Splash Screen beenden
if [[ "$SPLASH_TYPE" == "psplash" ]] && [[ -p "$FIFO" ]]; then
    echo "QUIT" > "$FIFO"
fi

if [[ "$SPLASH_TYPE" == "plymouth" ]] && command -v plymouth &>/dev/null; then
    plymouth quit
fi
PROGRESS_SCRIPT

chmod +x /usr/local/bin/prasco-boot-progress.sh

echo -e "${GREEN}✓${NC} Boot-Progress-Skript erstellt"

#===============================================================================
# Boot-Konfiguration anpassen
#===============================================================================

echo -e "${YELLOW}→${NC} Passe Boot-Konfiguration an..."

# Entferne Rainbow-Splash und Boot-Meldungen
CONFIG_FILE="/boot/firmware/config.txt"
if [[ ! -f "$CONFIG_FILE" ]]; then
    CONFIG_FILE="/boot/config.txt"
fi

if [[ -f "$CONFIG_FILE" ]]; then
    # Backup erstellen
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup-$(date +%Y%m%d_%H%M%S)"
    
    # Splash-Einstellungen hinzufügen (falls nicht vorhanden)
    if ! grep -q "disable_splash=1" "$CONFIG_FILE"; then
        echo "" >> "$CONFIG_FILE"
        echo "# PRASCO Splash Screen" >> "$CONFIG_FILE"
        echo "disable_splash=0" >> "$CONFIG_FILE"
    fi
fi

# Kernel-Parameter für stillen Boot
CMDLINE_FILE="/boot/firmware/cmdline.txt"
if [[ ! -f "$CMDLINE_FILE" ]]; then
    CMDLINE_FILE="/boot/cmdline.txt"
fi

if [[ -f "$CMDLINE_FILE" ]]; then
    cp "$CMDLINE_FILE" "${CMDLINE_FILE}.backup-$(date +%Y%m%d_%H%M%S)"
    
    # Füge "quiet splash" hinzu, falls nicht vorhanden
    if ! grep -q "quiet" "$CMDLINE_FILE"; then
        sed -i 's/$/ quiet splash loglevel=3 vt.global_cursor_default=0/' "$CMDLINE_FILE"
    fi
fi

echo -e "${GREEN}✓${NC} Boot-Konfiguration angepasst"

#===============================================================================
# Services aktivieren
#===============================================================================

echo -e "${YELLOW}→${NC} Aktiviere Services..."

systemctl daemon-reload

if [[ "$SPLASH_TYPE" == "psplash" ]]; then
    systemctl enable prasco-splash.service 2>/dev/null || true
fi

systemctl enable prasco-splash-progress.service

# ASCII-Splash nur aktivieren wenn der Service erstellt wurde
if [[ -f /etc/systemd/system/prasco-ascii-splash.service ]]; then
    systemctl enable prasco-ascii-splash.service
else
    echo -e "${YELLOW}ℹ${NC} ASCII-Splash Service nicht erstellt (optional)"
fi

echo -e "${GREEN}✓${NC} Services aktiviert"

#===============================================================================
# ASCII-Art Splashscreen erstellen (Alternative)
#===============================================================================

echo -e "${YELLOW}→${NC} Erstelle ASCII-Art Splash Screen..."

cat > /usr/local/bin/prasco-ascii-splash.sh << 'ASCII_SPLASH'
#!/bin/bash
# PRASCO ASCII-Art Boot-Splash für TTY

clear

# Farben für TTY
PURPLE='\e[35m'
CYAN='\e[36m'
GREEN='\e[32m'
YELLOW='\e[33m'
NC='\e[0m'

# Cursor ausblenden
tput civis

# PRASCO Logo zentriert anzeigen
echo -e "${PURPLE}"
cat << 'LOGO'

                ██████╗ ██████╗  █████╗ ███████╗ ██████╗ ██████╗ 
                ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗
                ██████╔╝██████╔╝███████║███████╗██║     ██║   ██║
                ██╔═══╝ ██╔══██╗██╔══██║╚════██║██║     ██║   ██║
                ██║     ██║  ██║██║  ██║███████║╚██████╗╚██████╔╝
                ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ 

                     Digitales Schwarzes Brett wird gestartet...

LOGO
echo -e "${NC}"

# Animierter Ladebalken
echo -e "${CYAN}              [                                        ]  0%${NC}"
sleep 0.3
echo -e "\033[1A\033[K${CYAN}              [==========                            ] 20%${NC}"
sleep 0.3
echo -e "\033[1A\033[K${CYAN}              [====================                  ] 40%${NC}"
sleep 0.3
echo -e "\033[1A\033[K${CYAN}              [==============================        ] 60%${NC}"
sleep 0.3
echo -e "\033[1A\033[K${CYAN}              [========================================] 80%${NC}"
sleep 0.3
echo -e "\033[1A\033[K${GREEN}              [==========================================] 100%${NC}"
sleep 0.5

echo ""
echo -e "${GREEN}              ✓ System bereit!${NC}"
echo ""
sleep 1

# Cursor wieder einblenden
tput cnorm
clear
ASCII_SPLASH

chmod +x /usr/local/bin/prasco-ascii-splash.sh

# ASCII-Splash zum systemd hinzufügen (optional, für TTY1)
cat > /etc/systemd/system/prasco-ascii-splash.service << 'EOF'
[Unit]
Description=PRASCO ASCII Splash Screen
After=systemd-user-sessions.service plymouth-quit.service
Before=getty@tty1.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-ascii-splash.sh
StandardOutput=tty
StandardInput=tty
StandardError=journal
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl enable prasco-ascii-splash.service

echo -e "${GREEN}✓${NC} ASCII-Splash erstellt"

#===============================================================================
# Abschluss
#===============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Splash Screen erfolgreich installiert!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Der PRASCO Splash Screen wird beim nächsten Neustart angezeigt."
echo ""
echo "Installierter Typ: $SPLASH_TYPE"
echo ""
echo "Optionen:"
if [[ "$SPLASH_TYPE" == "psplash" ]]; then
    echo "  - PSplash: Grafischer Splash während des Boots"
elif [[ "$SPLASH_TYPE" == "plymouth" ]]; then
    echo "  - Plymouth: System-integrierter Splash"
fi
echo "  - ASCII-Art: Stilvoller Text-Splash auf TTY1"
echo "  - Boot-Progress: Zeigt PRASCO-Start-Fortschritt"
echo ""
echo -e "${YELLOW}Starte neu mit:${NC} sudo reboot"
echo ""
