#!/bin/bash
#===============================================================================
# PRASCO First-Boot Auto-Installer
# 
# Dieses Skript wird beim ersten Start des Raspberry Pi ausgeführt und:
# - Installiert alle Abhängigkeiten (Node.js, PostgreSQL, PM2)
# - Klont PRASCO vom Repository
# - Startet die interaktive Einrichtung
#
# Zur manuellen Verwendung:
#   curl -sSL https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/auto-install.sh | bash
#===============================================================================

set -e

# Konfiguration
REPO_URL="https://github.com/dawarr23-boop/Prasco.git"
INSTALL_DIR="$HOME/prasco"
LOG_FILE="/tmp/prasco-install-$(date +%Y%m%d_%H%M%S).log"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

#===============================================================================
# Funktionen
#===============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

print_header() {
    clear
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                    ║"
    echo "║     ██████╗ ██████╗  █████╗ ███████╗ ██████╗ ██████╗              ║"
    echo "║     ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗             ║"
    echo "║     ██████╔╝██████╔╝███████║███████╗██║     ██║   ██║             ║"
    echo "║     ██╔═══╝ ██╔══██╗██╔══██║╚════██║██║     ██║   ██║             ║"
    echo "║     ██║     ██║  ██║██║  ██║███████║╚██████╗╚██████╔╝             ║"
    echo "║     ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝              ║"
    echo "║                                                                    ║"
    echo "║                    Automatischer Installer                         ║"
    echo "║                                                                    ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}→${NC} $1"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "STEP: $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
    log "WARNING: $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Bitte führe dieses Skript NICHT als root aus!"
        print_info "Verwende: curl -sSL https://... | bash"
        exit 1
    fi
}

check_network() {
    print_step "Prüfe Netzwerkverbindung"
    
    local max_retries=30
    local retry=0
    
    while ! ping -c 1 google.com &>/dev/null; do
        retry=$((retry + 1))
        if [[ $retry -ge $max_retries ]]; then
            print_error "Keine Netzwerkverbindung nach $max_retries Versuchen!"
            print_info "Bitte prüfe die Netzwerkeinstellungen und versuche es erneut."
            exit 1
        fi
        echo -ne "\r${YELLOW}→${NC} Warte auf Netzwerk... ($retry/$max_retries)"
        sleep 2
    done
    
    echo ""
    print_success "Netzwerkverbindung verfügbar"
}

check_os() {
    print_step "Prüfe Betriebssystem"
    
    if [[ ! -f /etc/os-release ]]; then
        print_error "Betriebssystem nicht erkannt!"
        exit 1
    fi
    
    . /etc/os-release
    
    if [[ "$ID" != "raspbian" && "$ID" != "debian" && "$ID_LIKE" != *"debian"* ]]; then
        print_warning "Nicht-Debian-basiertes System erkannt: $ID"
        print_info "Das Skript ist für Raspberry Pi OS optimiert."
        read -p "$(echo -e "${YELLOW}?${NC} Trotzdem fortfahren? [j/N]: ")" response
        if [[ ! "$response" =~ ^[jJyY]$ ]]; then
            exit 0
        fi
    fi
    
    print_success "Betriebssystem: $PRETTY_NAME"
    
    # Raspberry Pi erkennen
    if [[ -f /proc/device-tree/model ]]; then
        PI_MODEL=$(cat /proc/device-tree/model | tr -d '\0')
        print_success "Hardware: $PI_MODEL"
    fi
}

install_dependencies() {
    print_step "Installiere System-Abhängigkeiten"
    
    print_info "Aktualisiere Paketlisten..."
    sudo apt-get update >> "$LOG_FILE" 2>&1
    print_success "Paketlisten aktualisiert"
    
    # Node.js
    if ! command -v node &>/dev/null; then
        print_info "Installiere Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - >> "$LOG_FILE" 2>&1
        sudo apt-get install -y nodejs >> "$LOG_FILE" 2>&1
        print_success "Node.js $(node --version) installiert"
    else
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | tr -d 'v')
        if [[ $NODE_MAJOR -lt 18 ]]; then
            print_warning "Node.js $NODE_VERSION ist veraltet. Aktualisiere..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - >> "$LOG_FILE" 2>&1
            sudo apt-get install -y nodejs >> "$LOG_FILE" 2>&1
            print_success "Node.js $(node --version) installiert"
        else
            print_success "Node.js $NODE_VERSION bereits installiert"
        fi
    fi
    
    # PostgreSQL
    if ! command -v psql &>/dev/null; then
        print_info "Installiere PostgreSQL..."
        sudo apt-get install -y postgresql postgresql-contrib >> "$LOG_FILE" 2>&1
        sudo systemctl enable postgresql >> "$LOG_FILE" 2>&1
        sudo systemctl start postgresql >> "$LOG_FILE" 2>&1
        print_success "PostgreSQL installiert"
    else
        print_success "PostgreSQL bereits installiert"
    fi
    
    # PM2
    if ! command -v pm2 &>/dev/null; then
        print_info "Installiere PM2..."
        sudo npm install -g pm2 >> "$LOG_FILE" 2>&1
        print_success "PM2 installiert"
    else
        print_success "PM2 bereits installiert"
    fi
    
    # Weitere Tools
    print_info "Installiere weitere Tools..."
    sudo apt-get install -y git chromium-browser xdotool unclutter >> "$LOG_FILE" 2>&1
    print_success "Zusätzliche Tools installiert"
}

clone_repository() {
    print_step "Klone PRASCO Repository"
    
    if [[ -d "$INSTALL_DIR" ]]; then
        print_warning "Verzeichnis $INSTALL_DIR existiert bereits"
        
        if [[ -d "$INSTALL_DIR/.git" ]]; then
            print_info "Aktualisiere bestehendes Repository..."
            cd "$INSTALL_DIR"
            git pull >> "$LOG_FILE" 2>&1
            print_success "Repository aktualisiert"
        else
            read -p "$(echo -e "${YELLOW}?${NC} Verzeichnis löschen und neu klonen? [j/N]: ")" response
            if [[ "$response" =~ ^[jJyY]$ ]]; then
                rm -rf "$INSTALL_DIR"
                git clone "$REPO_URL" "$INSTALL_DIR" >> "$LOG_FILE" 2>&1
                print_success "Repository geklont"
            fi
        fi
    else
        git clone "$REPO_URL" "$INSTALL_DIR" >> "$LOG_FILE" 2>&1
        print_success "Repository geklont nach $INSTALL_DIR"
    fi
}

make_scripts_executable() {
    print_step "Setze Skript-Berechtigungen"
    
    chmod +x "$INSTALL_DIR/scripts/"*.sh 2>/dev/null || true
    print_success "Skripte sind ausführbar"
}

show_completion() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  Installation abgeschlossen!                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "N/A")
    HOSTNAME=$(hostname)
    
    echo -e "${CYAN}Nächster Schritt:${NC}"
    echo ""
    echo "  Starte die interaktive Einrichtung:"
    echo ""
    echo -e "    ${YELLOW}cd ~/prasco && ./scripts/setup-production.sh${NC}"
    echo ""
    echo -e "${CYAN}System-Informationen:${NC}"
    echo "  Hostname:   $HOSTNAME"
    echo "  IP-Adresse: $LOCAL_IP"
    echo "  Log-Datei:  $LOG_FILE"
    echo ""
}

start_interactive_setup() {
    echo ""
    read -p "$(echo -e "${YELLOW}?${NC} Interaktives Setup jetzt starten? [J/n]: ")" response
    
    if [[ ! "$response" =~ ^[nN]$ ]]; then
        cd "$INSTALL_DIR"
        exec ./scripts/setup-production.sh
    else
        echo ""
        print_info "Du kannst das Setup später starten mit:"
        echo -e "    ${CYAN}cd ~/prasco && ./scripts/setup-production.sh${NC}"
        echo ""
    fi
}

#===============================================================================
# Hauptprogramm
#===============================================================================

main() {
    print_header
    
    print_info "PRASCO Automatischer Installer"
    print_info "Log-Datei: $LOG_FILE"
    echo ""
    
    log "=== PRASCO Auto-Installer gestartet ==="
    log "User: $USER"
    log "Home: $HOME"
    
    check_root
    check_network
    check_os
    install_dependencies
    clone_repository
    make_scripts_executable
    
    show_completion
    start_interactive_setup
}

# Wenn als Skript ausgeführt
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
