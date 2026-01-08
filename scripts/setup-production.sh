#!/bin/bash

#===============================================================================
# PRASCO - Interaktives Produktions-Setup-Skript
# Für Raspberry Pi und andere Linux-Systeme
#===============================================================================

set -e

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Symbole
CHECK="✓"
CROSS="✗"
ARROW="→"
STAR="★"
INFO="ℹ"

# Konfigurationsvariablen
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/prasco-setup-$(date +%Y%m%d_%H%M%S).log"

#===============================================================================
# Hilfsfunktionen
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
    echo "║              Digitales Schwarzes Brett - Setup                     ║"
    echo "║                                                                    ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}${STAR} $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    log "SECTION: $1"
}

print_step() {
    echo -e "${BLUE}${ARROW}${NC} $1"
    log "STEP: $1"
}

print_success() {
    echo -e "${GREEN}${CHECK}${NC} $1"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}${CROSS}${NC} $1"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}${INFO}${NC} $1"
    log "WARNING: $1"
}

print_info() {
    echo -e "${CYAN}${INFO}${NC} $1"
}

ask_yes_no() {
    local prompt="$1"
    local default="${2:-y}"
    local response
    
    if [[ "$default" == "y" ]]; then
        prompt="$prompt [J/n]: "
    else
        prompt="$prompt [j/N]: "
    fi
    
    read -p "$(echo -e "${YELLOW}?${NC} $prompt")" response
    response="${response:-$default}"
    
    case "$response" in
        [jJyY]*) return 0 ;;
        *) return 1 ;;
    esac
}

ask_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local is_password="${4:-false}"
    local response
    
    if [[ -n "$default" ]]; then
        prompt="$prompt [${default}]: "
    else
        prompt="$prompt: "
    fi
    
    if [[ "$is_password" == "true" ]]; then
        read -s -p "$(echo -e "${YELLOW}?${NC} $prompt")" response
        echo ""
    else
        read -p "$(echo -e "${YELLOW}?${NC} $prompt")" response
    fi
    
    response="${response:-$default}"
    eval "$var_name='$response'"
}

generate_random_string() {
    local length="${1:-32}"
    openssl rand -hex "$length" 2>/dev/null || head -c "$length" /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c "$length"
}

check_command() {
    command -v "$1" &> /dev/null
}

wait_for_key() {
    echo ""
    read -p "$(echo -e "${CYAN}Drücke ENTER um fortzufahren...${NC}")" 
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "      \b\b\b\b\b\b"
}

run_with_spinner() {
    local message="$1"
    shift
    
    echo -ne "${BLUE}${ARROW}${NC} $message "
    
    "$@" >> "$LOG_FILE" 2>&1 &
    local pid=$!
    spinner $pid
    wait $pid
    local status=$?
    
    if [[ $status -eq 0 ]]; then
        echo -e "${GREEN}${CHECK}${NC}"
    else
        echo -e "${RED}${CROSS}${NC}"
        return $status
    fi
}

#===============================================================================
# Systemprüfungen
#===============================================================================

check_system() {
    print_section "Systemprüfung"
    
    # Root-Check
    if [[ $EUID -eq 0 ]]; then
        print_warning "Bitte führe dieses Skript NICHT als root aus!"
        print_info "Verwende: ./setup-production.sh"
        exit 1
    fi
    
    # Sudo-Check
    if ! sudo -v &>/dev/null; then
        print_error "Sudo-Berechtigung erforderlich!"
        exit 1
    fi
    print_success "Sudo-Berechtigung verfügbar"
    
    # Betriebssystem erkennen
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_NAME="$NAME"
        OS_VERSION="$VERSION_ID"
        print_success "Betriebssystem: $OS_NAME $OS_VERSION"
    else
        print_warning "Betriebssystem konnte nicht erkannt werden"
        OS_NAME="Unknown"
    fi
    
    # Raspberry Pi erkennen
    if [[ -f /proc/device-tree/model ]]; then
        PI_MODEL=$(cat /proc/device-tree/model | tr -d '\0')
        print_success "Hardware: $PI_MODEL"
        IS_RASPBERRY_PI=true
    else
        print_info "Kein Raspberry Pi erkannt - generische Linux-Installation"
        IS_RASPBERRY_PI=false
    fi
    
    # Architektur
    ARCH=$(uname -m)
    print_success "Architektur: $ARCH"
    
    # Speicherplatz
    FREE_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
    if [[ $FREE_SPACE -lt 2 ]]; then
        print_error "Nicht genug Speicherplatz! Mindestens 2GB erforderlich. Verfügbar: ${FREE_SPACE}GB"
        exit 1
    fi
    print_success "Freier Speicher: ${FREE_SPACE}GB"
    
    # RAM
    TOTAL_RAM=$(free -m | awk 'NR==2 {print $2}')
    print_success "RAM: ${TOTAL_RAM}MB"
    
    # Internet-Verbindung
    print_step "Prüfe Internet-Verbindung..."
    if ping -c 1 google.com &>/dev/null; then
        print_success "Internet-Verbindung verfügbar"
    else
        print_error "Keine Internet-Verbindung! Bitte prüfe die Netzwerkeinstellungen."
        exit 1
    fi
    
    # Projektverzeichnis
    if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
        print_error "Projektverzeichnis nicht gefunden: $PROJECT_DIR"
        print_info "Bitte führe das Skript aus dem scripts/ Verzeichnis aus."
        exit 1
    fi
    print_success "Projektverzeichnis: $PROJECT_DIR"
}

#===============================================================================
# Abhängigkeiten installieren
#===============================================================================

install_dependencies() {
    print_section "Abhängigkeiten installieren"
    
    print_step "Aktualisiere Paketlisten..."
    sudo apt update >> "$LOG_FILE" 2>&1
    print_success "Paketlisten aktualisiert"
    
    # Node.js
    print_step "Prüfe Node.js..."
    if check_command node; then
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | tr -d 'v')
        
        if [[ $NODE_MAJOR -ge 18 ]]; then
            print_success "Node.js $NODE_VERSION bereits installiert"
        else
            print_warning "Node.js $NODE_VERSION ist veraltet. Aktualisiere auf v18..."
            install_nodejs
        fi
    else
        print_info "Node.js wird installiert..."
        install_nodejs
    fi
    
    # npm Version anzeigen
    NPM_VERSION=$(npm --version 2>/dev/null || echo "nicht installiert")
    print_success "npm Version: $NPM_VERSION"
    
    # PostgreSQL
    print_step "Prüfe PostgreSQL..."
    if check_command psql; then
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL $PSQL_VERSION bereits installiert"
    else
        print_info "PostgreSQL wird installiert..."
        run_with_spinner "Installiere PostgreSQL..." sudo apt install -y postgresql postgresql-contrib
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
        print_success "PostgreSQL installiert und gestartet"
    fi
    
    # PM2
    print_step "Prüfe PM2..."
    if check_command pm2; then
        PM2_VERSION=$(pm2 --version)
        print_success "PM2 $PM2_VERSION bereits installiert"
    else
        print_info "PM2 wird installiert..."
        run_with_spinner "Installiere PM2 global..." sudo npm install -g pm2
        print_success "PM2 installiert"
    fi
    
    # Weitere Tools
    print_step "Installiere weitere Abhängigkeiten..."
    local packages="git curl chromium-browser xdotool unclutter"
    
    for pkg in $packages; do
        if ! dpkg -l | grep -q "^ii  $pkg "; then
            run_with_spinner "Installiere $pkg..." sudo apt install -y "$pkg"
        fi
    done
    print_success "Alle Abhängigkeiten installiert"
}

install_nodejs() {
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - >> "$LOG_FILE" 2>&1
    sudo apt install -y nodejs >> "$LOG_FILE" 2>&1
    print_success "Node.js $(node --version) installiert"
}

#===============================================================================
# Datenbank einrichten
#===============================================================================

setup_database() {
    print_section "Datenbank einrichten"
    
    # Prüfen ob Datenbank bereits existiert
    if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "bulletin_board"; then
        print_warning "Datenbank 'bulletin_board' existiert bereits!"
        
        if ask_yes_no "Möchtest du die bestehende Datenbank beibehalten?" "y"; then
            print_info "Bestehende Datenbank wird verwendet"
            
            # Passwort abfragen für bestehende DB
            ask_input "PostgreSQL Passwort für Benutzer 'prasco'" "" DB_PASSWORD "true"
            return
        else
            if ask_yes_no "ACHTUNG: Alle Daten gehen verloren! Wirklich löschen?" "n"; then
                print_step "Lösche bestehende Datenbank..."
                sudo -u postgres psql -c "DROP DATABASE bulletin_board;" >> "$LOG_FILE" 2>&1
                sudo -u postgres psql -c "DROP USER IF EXISTS prasco;" >> "$LOG_FILE" 2>&1
                print_success "Bestehende Datenbank gelöscht"
            else
                print_info "Setup abgebrochen"
                exit 0
            fi
        fi
    fi
    
    # Neues Passwort generieren oder abfragen
    echo ""
    print_info "Ein sicheres Datenbankpasswort wird benötigt."
    
    if ask_yes_no "Soll ein zufälliges Passwort generiert werden?" "y"; then
        DB_PASSWORD=$(generate_random_string 24)
        print_info "Generiertes Passwort: ${YELLOW}$DB_PASSWORD${NC}"
        print_warning "Bitte notiere dir dieses Passwort!"
        wait_for_key
    else
        while true; do
            ask_input "Gib ein Passwort ein (min. 8 Zeichen)" "" DB_PASSWORD "true"
            if [[ ${#DB_PASSWORD} -ge 8 ]]; then
                break
            fi
            print_error "Passwort muss mindestens 8 Zeichen haben!"
        done
    fi
    
    # Datenbank und Benutzer erstellen
    print_step "Erstelle Datenbankbenutzer und Datenbank..."
    
    sudo -u postgres psql << EOF >> "$LOG_FILE" 2>&1
CREATE USER prasco WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE bulletin_board OWNER prasco;
GRANT ALL PRIVILEGES ON DATABASE bulletin_board TO prasco;
\c bulletin_board
GRANT ALL ON SCHEMA public TO prasco;
EOF
    
    print_success "Datenbank 'bulletin_board' erstellt"
    print_success "Benutzer 'prasco' erstellt"
}

#===============================================================================
# Umgebung konfigurieren
#===============================================================================

configure_environment() {
    print_section "Umgebung konfigurieren"
    
    ENV_FILE="$PROJECT_DIR/.env"
    
    # Backup erstellen falls .env existiert
    if [[ -f "$ENV_FILE" ]]; then
        print_warning "Bestehende .env gefunden - erstelle Backup"
        cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    echo ""
    print_info "Jetzt werden die Einstellungen für PRASCO konfiguriert."
    echo ""
    
    # Port
    ask_input "Server Port" "3000" SERVER_PORT
    
    # JWT Secrets
    print_step "Generiere JWT Secrets..."
    JWT_SECRET=$(generate_random_string 64)
    JWT_REFRESH_SECRET=$(generate_random_string 64)
    print_success "JWT Secrets generiert"
    
    # Super-Admin Einstellungen
    echo ""
    print_info "Super-Admin Account einrichten:"
    ask_input "Super-Admin E-Mail" "admin@localhost" ADMIN_EMAIL
    
    while true; do
        ask_input "Super-Admin Passwort (min. 8 Zeichen)" "" ADMIN_PASSWORD "true"
        if [[ ${#ADMIN_PASSWORD} -ge 8 ]]; then
            ask_input "Passwort bestätigen" "" ADMIN_PASSWORD_CONFIRM "true"
            if [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" ]]; then
                break
            fi
            print_error "Passwörter stimmen nicht überein!"
        else
            print_error "Passwort muss mindestens 8 Zeichen haben!"
        fi
    done
    
    # Upload-Einstellungen
    ask_input "Max. Upload-Größe (MB)" "50" UPLOAD_MAX_MB
    UPLOAD_MAX_BYTES=$((UPLOAD_MAX_MB * 1024 * 1024))
    
    # .env Datei schreiben
    print_step "Erstelle .env Datei..."
    
    cat > "$ENV_FILE" << EOF
#===============================================================================
# PRASCO - Produktionskonfiguration
# Generiert am: $(date '+%Y-%m-%d %H:%M:%S')
#===============================================================================

# Server
NODE_ENV=production
PORT=$SERVER_PORT

# Datenbank
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bulletin_board
DB_USER=prasco
DB_PASSWORD=$DB_PASSWORD

# JWT Authentifizierung
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Super-Admin Account
SUPER_ADMIN_EMAIL=$ADMIN_EMAIL
SUPER_ADMIN_PASSWORD=$ADMIN_PASSWORD
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin

# Upload-Einstellungen
UPLOAD_MAX_SIZE=$UPLOAD_MAX_BYTES
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info

# Session
SESSION_SECRET=$(generate_random_string 32)

# CORS (für Produktionsumgebung anpassen)
CORS_ORIGIN=*
EOF

    chmod 600 "$ENV_FILE"
    print_success ".env Datei erstellt und gesichert"
}

#===============================================================================
# Anwendung bauen
#===============================================================================

build_application() {
    print_section "Anwendung bauen"
    
    cd "$PROJECT_DIR"
    
    # Dependencies installieren
    print_step "Installiere npm Pakete..."
    if [[ -f "package-lock.json" ]]; then
        run_with_spinner "npm ci (Produktion)..." npm ci --only=production
    else
        run_with_spinner "npm install (Produktion)..." npm install --only=production
    fi
    print_success "npm Pakete installiert"
    
    # TypeScript kompilieren
    print_step "Kompiliere TypeScript..."
    
    # Prüfe ob devDependencies für Build benötigt werden
    if ! check_command tsc; then
        print_info "TypeScript Compiler wird installiert..."
        npm install typescript --save-dev >> "$LOG_FILE" 2>&1
    fi
    
    run_with_spinner "Kompiliere Projekt..." npm run build
    print_success "Projekt kompiliert"
    
    # Upload-Verzeichnisse erstellen
    print_step "Erstelle Verzeichnisse..."
    mkdir -p uploads/{originals,thumbnails,presentations,temp}
    chmod -R 755 uploads
    print_success "Upload-Verzeichnisse erstellt"
}

#===============================================================================
# PM2 einrichten
#===============================================================================

setup_pm2() {
    print_section "PM2 Prozessmanager einrichten"
    
    cd "$PROJECT_DIR"
    
    # Prüfen ob bereits eine PM2-Instanz läuft
    if pm2 list 2>/dev/null | grep -q "prasco"; then
        print_warning "PRASCO läuft bereits unter PM2"
        
        if ask_yes_no "Möchtest du den Prozess neu starten?" "y"; then
            pm2 delete prasco >> "$LOG_FILE" 2>&1
        else
            print_info "Bestehender Prozess wird beibehalten"
            return
        fi
    fi
    
    # PM2 Ecosystem-Datei erstellen
    print_step "Erstelle PM2 Konfiguration..."
    
    cat > "$PROJECT_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'prasco',
    script: './dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true
  }]
};
EOF
    
    # Logs-Verzeichnis erstellen
    mkdir -p logs
    
    print_success "PM2 Konfiguration erstellt"
    
    # Anwendung starten
    print_step "Starte PRASCO..."
    pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1
    
    # Kurz warten
    sleep 3
    
    # Status prüfen
    if pm2 list | grep -q "prasco.*online"; then
        print_success "PRASCO erfolgreich gestartet!"
    else
        print_error "PRASCO konnte nicht gestartet werden. Prüfe logs: pm2 logs prasco"
        pm2 logs prasco --lines 20
        exit 1
    fi
    
    # PM2 beim Systemstart aktivieren
    print_step "Aktiviere PM2 Autostart..."
    pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null | tail -1 | sudo bash >> "$LOG_FILE" 2>&1 || true
    pm2 save >> "$LOG_FILE" 2>&1
    print_success "PM2 Autostart aktiviert"
}

#===============================================================================
# Kiosk-Modus einrichten
#===============================================================================

setup_kiosk() {
    print_section "Kiosk-Modus einrichten"
    
    if [[ "$IS_RASPBERRY_PI" != "true" ]]; then
        print_info "Kein Raspberry Pi erkannt - Kiosk-Modus wird übersprungen"
        
        if ! ask_yes_no "Möchtest du den Kiosk-Modus trotzdem einrichten?" "n"; then
            return
        fi
    fi
    
    if ! ask_yes_no "Soll der Kiosk-Modus eingerichtet werden?" "y"; then
        print_info "Kiosk-Modus übersprungen"
        return
    fi
    
    # Kiosk-Skript erstellen/aktualisieren
    print_step "Erstelle Kiosk-Skript..."
    
    KIOSK_SCRIPT="$PROJECT_DIR/scripts/start-kiosk.sh"
    
    cat > "$KIOSK_SCRIPT" << EOF
#!/bin/bash
#===============================================================================
# PRASCO Kiosk-Modus Startskript
# Automatisch generiert am: $(date '+%Y-%m-%d %H:%M:%S')
#===============================================================================

# Warte auf Desktop und PRASCO Server
echo "Warte auf Desktop-Umgebung..."
sleep 10

# Prüfe ob Server läuft
MAX_RETRIES=30
RETRY=0
while ! curl -s http://localhost:$SERVER_PORT/api/health > /dev/null; do
    RETRY=\$((RETRY + 1))
    if [ \$RETRY -ge \$MAX_RETRIES ]; then
        echo "Server nicht erreichbar nach \$MAX_RETRIES Versuchen!"
        exit 1
    fi
    echo "Warte auf Server... (\$RETRY/\$MAX_RETRIES)"
    sleep 2
done

echo "Server läuft - starte Browser..."

# Bildschirmschoner deaktivieren
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true
xset s noblank 2>/dev/null || true

# Mauszeiger verstecken
unclutter -idle 0.1 -root &

# Chromium im Kiosk-Modus starten
# --autoplay-policy für Video mit Ton
# --disable-features=TranslateUI deaktiviert Übersetzungs-Popup
# --ignore-certificate-errors erlaubt selbstsignierte SSL-Zertifikate
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --autoplay-policy=no-user-gesture-required \
    --check-for-update-interval=31536000 \
    --disable-component-update \
    --disable-features=TranslateUI \
    --no-first-run \
    --start-fullscreen \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --ignore-certificate-errors \
    --disable-web-security \
    --allow-insecure-localhost \
    http://localhost:$SERVER_PORT/public/display.html

EOF
    
    chmod +x "$KIOSK_SCRIPT"
    print_success "Kiosk-Skript erstellt"
    
    # Autostart einrichten
    print_step "Richte Autostart ein..."
    
    AUTOSTART_DIR="$HOME/.config/autostart"
    mkdir -p "$AUTOSTART_DIR"
    
    cat > "$AUTOSTART_DIR/prasco-kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=PRASCO Kiosk
Comment=Startet PRASCO Display im Kiosk-Modus
Exec=$KIOSK_SCRIPT
X-GNOME-Autostart-enabled=true
Terminal=false
Hidden=false
EOF
    
    print_success "Autostart eingerichtet"
    
    # Bildschirmschoner systemweit deaktivieren
    if [[ -d "/etc/xdg/lxsession/LXDE-pi" ]]; then
        print_step "Deaktiviere Bildschirmschoner systemweit..."
        
        LXDE_AUTOSTART="/etc/xdg/lxsession/LXDE-pi/autostart"
        
        if ! grep -q "xset s off" "$LXDE_AUTOSTART" 2>/dev/null; then
            sudo tee -a "$LXDE_AUTOSTART" > /dev/null << EOF

# PRASCO Kiosk-Modus Einstellungen
@xset s off
@xset -dpms
@xset s noblank
EOF
        fi
        
        print_success "Bildschirmschoner deaktiviert"
    fi
    
    print_info "Der Kiosk-Modus wird nach dem nächsten Neustart aktiv"
}

#===============================================================================
# Statische IP konfigurieren (optional)
#===============================================================================

configure_static_ip() {
    print_section "Netzwerk konfigurieren (optional)"
    
    # Aktuelle IP anzeigen
    CURRENT_IP=$(hostname -I | awk '{print $1}')
    print_info "Aktuelle IP-Adresse: ${YELLOW}$CURRENT_IP${NC}"
    
    if ! ask_yes_no "Möchtest du eine statische IP-Adresse konfigurieren?" "n"; then
        print_info "Dynamische IP wird beibehalten"
        return
    fi
    
    echo ""
    print_warning "Es wird empfohlen, die statische IP im Router (DHCP-Reservation) einzurichten!"
    echo ""
    
    if ! ask_yes_no "Trotzdem auf dem Pi konfigurieren?" "n"; then
        return
    fi
    
    # Aktuelle Einstellungen ermitteln
    GATEWAY=$(ip route | grep default | awk '{print $3}')
    
    ask_input "Statische IP-Adresse" "$CURRENT_IP" STATIC_IP
    ask_input "Gateway (Router)" "$GATEWAY" STATIC_GATEWAY
    ask_input "DNS Server" "$GATEWAY" STATIC_DNS
    
    # Prüfe ob NetworkManager verwendet wird
    if systemctl is-active --quiet NetworkManager; then
        print_step "Konfiguriere NetworkManager..."
        
        # Ermittle aktive Verbindung
        CONNECTION=$(nmcli -t -f NAME,DEVICE con show --active | grep -E "eth|wlan" | head -1 | cut -d: -f1)
        
        if [[ -n "$CONNECTION" ]]; then
            sudo nmcli con mod "$CONNECTION" \
                ipv4.method manual \
                ipv4.addresses "$STATIC_IP/24" \
                ipv4.gateway "$STATIC_GATEWAY" \
                ipv4.dns "$STATIC_DNS"
            
            print_success "Statische IP konfiguriert"
            print_warning "Die Verbindung wird beim nächsten Neustart mit der neuen IP aktiv"
        else
            print_error "Keine aktive Netzwerkverbindung gefunden"
        fi
    else
        print_warning "NetworkManager nicht aktiv - manuelle Konfiguration erforderlich"
        print_info "Bearbeite /etc/dhcpcd.conf für statische IP"
    fi
}

#===============================================================================
# Zusammenfassung und Abschluss
#===============================================================================

show_summary() {
    print_header
    
    print_section "Installation abgeschlossen!"
    
    # IP-Adresse ermitteln
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    HOSTNAME=$(hostname)
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    PRASCO ist bereit!                               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${WHITE}Zugriff:${NC}"
    echo -e "  ${ARROW} Display:    ${CYAN}http://${LOCAL_IP}:${SERVER_PORT}/public/display.html${NC}"
    echo -e "  ${ARROW} Admin:      ${CYAN}http://${LOCAL_IP}:${SERVER_PORT}/admin${NC}"
    echo -e "  ${ARROW} API Docs:   ${CYAN}http://${LOCAL_IP}:${SERVER_PORT}/api-docs${NC}"
    echo ""
    
    echo -e "${WHITE}Auch erreichbar über:${NC}"
    echo -e "  ${ARROW} http://${HOSTNAME}.local:${SERVER_PORT}"
    echo ""
    
    echo -e "${WHITE}Admin-Login:${NC}"
    echo -e "  ${ARROW} E-Mail:     ${YELLOW}$ADMIN_EMAIL${NC}"
    echo -e "  ${ARROW} Passwort:   ${YELLOW}[wie bei der Einrichtung angegeben]${NC}"
    echo ""
    
    echo -e "${WHITE}Nützliche Befehle:${NC}"
    echo -e "  ${ARROW} Status:     ${CYAN}pm2 status${NC}"
    echo -e "  ${ARROW} Logs:       ${CYAN}pm2 logs prasco${NC}"
    echo -e "  ${ARROW} Neustart:   ${CYAN}pm2 restart prasco${NC}"
    echo -e "  ${ARROW} Stoppen:    ${CYAN}pm2 stop prasco${NC}"
    echo ""
    
    if [[ -n "$DB_PASSWORD" ]]; then
        echo -e "${WHITE}Datenbank:${NC}"
        echo -e "  ${ARROW} Host:       localhost"
        echo -e "  ${ARROW} Datenbank:  bulletin_board"
        echo -e "  ${ARROW} Benutzer:   prasco"
        echo -e "  ${ARROW} Passwort:   ${YELLOW}[in .env gespeichert]${NC}"
        echo ""
    fi
    
    echo -e "${WHITE}Log-Datei:${NC}"
    echo -e "  ${ARROW} ${CYAN}$LOG_FILE${NC}"
    echo ""
    
    if [[ "$KIOSK_ENABLED" == "true" ]]; then
        echo -e "${YELLOW}${INFO} Der Kiosk-Modus wird nach einem Neustart aktiv.${NC}"
        echo ""
        
        if ask_yes_no "Möchtest du jetzt neu starten?" "n"; then
            print_info "System wird in 5 Sekunden neu gestartet..."
            sleep 5
            sudo reboot
        fi
    fi
    
    echo ""
    echo -e "${GREEN}Vielen Dank für die Verwendung von PRASCO!${NC}"
    echo ""
}

#===============================================================================
# Hauptprogramm
#===============================================================================

main() {
    print_header
    
    echo ""
    print_info "Willkommen beim PRASCO Produktions-Setup!"
    echo ""
    print_info "Dieses Skript führt dich durch die Einrichtung von PRASCO."
    print_info "Das Setup-Log wird gespeichert in: $LOG_FILE"
    echo ""
    
    if ! ask_yes_no "Möchtest du mit der Installation beginnen?" "y"; then
        print_info "Setup abgebrochen"
        exit 0
    fi
    
    log "=== PRASCO Setup gestartet ==="
    log "Benutzer: $USER"
    log "Verzeichnis: $PROJECT_DIR"
    
    # Schritte ausführen
    check_system
    install_dependencies
    setup_database
    configure_environment
    build_application
    setup_pm2
    setup_kiosk
    configure_static_ip
    
    # Zusammenfassung
    show_summary
}

# Skript starten
main "$@"
