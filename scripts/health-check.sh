#!/bin/bash

#===============================================================================
# PRASCO - Systemdiagnose / Health Check
# Prüft alle Komponenten und zeigt den Status an
#===============================================================================

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Symbole
OK="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
WARN="${YELLOW}!${NC}"

# Verzeichnis
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}              PRASCO Systemdiagnose                             ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

#===============================================================================
# Systeminfo
#===============================================================================

echo -e "${CYAN}[System]${NC}"

# Hostname & IP
HOSTNAME=$(hostname)
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "N/A")
echo -e "  Hostname:      $HOSTNAME"
echo -e "  IP-Adresse:    $IP"

# Betriebssystem
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    echo -e "  OS:            $PRETTY_NAME"
fi

# Raspberry Pi?
if [[ -f /proc/device-tree/model ]]; then
    echo -e "  Hardware:      $(cat /proc/device-tree/model | tr -d '\0')"
fi

# Uptime
UPTIME=$(uptime -p 2>/dev/null || uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')
echo -e "  Uptime:        $UPTIME"

# RAM
RAM_TOTAL=$(free -h | awk 'NR==2 {print $2}')
RAM_USED=$(free -h | awk 'NR==2 {print $3}')
RAM_PERCENT=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
if [[ $RAM_PERCENT -gt 90 ]]; then
    echo -e "  RAM:           ${RED}${RAM_USED}/${RAM_TOTAL} (${RAM_PERCENT}%)${NC}"
elif [[ $RAM_PERCENT -gt 70 ]]; then
    echo -e "  RAM:           ${YELLOW}${RAM_USED}/${RAM_TOTAL} (${RAM_PERCENT}%)${NC}"
else
    echo -e "  RAM:           ${GREEN}${RAM_USED}/${RAM_TOTAL} (${RAM_PERCENT}%)${NC}"
fi

# Disk
DISK_USAGE=$(df -h / | awk 'NR==2 {print $3"/"$2" ("$5")"}')
DISK_PERCENT=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [[ $DISK_PERCENT -gt 90 ]]; then
    echo -e "  Speicher:      ${RED}${DISK_USAGE}${NC}"
elif [[ $DISK_PERCENT -gt 70 ]]; then
    echo -e "  Speicher:      ${YELLOW}${DISK_USAGE}${NC}"
else
    echo -e "  Speicher:      ${GREEN}${DISK_USAGE}${NC}"
fi

echo ""

#===============================================================================
# Dienste
#===============================================================================

echo -e "${CYAN}[Dienste]${NC}"

check_service() {
    local name=$1
    local service=$2
    
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        echo -e "  $OK $name"
        return 0
    else
        echo -e "  $FAIL $name (nicht aktiv)"
        return 1
    fi
}

check_service "PostgreSQL" "postgresql"

# PM2 prüfen
if command -v pm2 &>/dev/null; then
    if pm2 list 2>/dev/null | grep -q "prasco.*online"; then
        echo -e "  $OK PM2 (prasco online)"
    elif pm2 list 2>/dev/null | grep -q "prasco"; then
        STATUS=$(pm2 list 2>/dev/null | grep "prasco" | awk '{print $18}')
        echo -e "  $WARN PM2 (prasco: $STATUS)"
    else
        echo -e "  $FAIL PM2 (prasco nicht gefunden)"
    fi
else
    echo -e "  $FAIL PM2 nicht installiert"
fi

echo ""

#===============================================================================
# PRASCO Status
#===============================================================================

echo -e "${CYAN}[PRASCO]${NC}"

cd "$PROJECT_DIR"

# .env
if [[ -f ".env" ]]; then
    echo -e "  $OK .env Datei vorhanden"
    
    # Port aus .env lesen
    PORT=$(grep -E "^PORT=" .env 2>/dev/null | cut -d= -f2 || echo "3000")
else
    echo -e "  $FAIL .env Datei fehlt!"
    PORT=3000
fi

# node_modules
if [[ -d "node_modules" ]]; then
    echo -e "  $OK node_modules vorhanden"
else
    echo -e "  $FAIL node_modules fehlt (npm install erforderlich)"
fi

# dist
if [[ -d "dist" ]] && [[ -f "dist/server.js" ]]; then
    echo -e "  $OK Build vorhanden (dist/server.js)"
else
    echo -e "  $FAIL Build fehlt (npm run build erforderlich)"
fi

# uploads
if [[ -d "uploads" ]]; then
    UPLOAD_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
    echo -e "  $OK uploads Verzeichnis ($UPLOAD_COUNT Dateien)"
else
    echo -e "  $WARN uploads Verzeichnis fehlt"
fi

echo ""

#===============================================================================
# Netzwerk & API
#===============================================================================

echo -e "${CYAN}[Netzwerk & API]${NC}"

# Lokaler Server
if curl -s --connect-timeout 2 "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
    HEALTH=$(curl -s "http://localhost:${PORT}/api/health" 2>/dev/null)
    echo -e "  $OK API erreichbar (localhost:${PORT})"
    
    # DB Status aus Health-Endpoint
    if echo "$HEALTH" | grep -q '"database":"connected"'; then
        echo -e "  $OK Datenbankverbindung"
    elif echo "$HEALTH" | grep -q '"database"'; then
        echo -e "  $WARN Datenbankverbindung (Status unbekannt)"
    fi
else
    echo -e "  $FAIL API nicht erreichbar (localhost:${PORT})"
fi

# Externer Zugriff prüfen
if [[ -n "$IP" ]] && [[ "$IP" != "N/A" ]]; then
    if curl -s --connect-timeout 2 "http://${IP}:${PORT}/api/health" >/dev/null 2>&1; then
        echo -e "  $OK Extern erreichbar (${IP}:${PORT})"
    else
        echo -e "  $WARN Extern nicht erreichbar"
    fi
fi

# Internet
if ping -c 1 -W 2 google.com &>/dev/null; then
    echo -e "  $OK Internet-Verbindung"
else
    echo -e "  $FAIL Kein Internet"
fi

echo ""

#===============================================================================
# Logs (letzte Fehler)
#===============================================================================

echo -e "${CYAN}[Letzte Fehler in Logs]${NC}"

if command -v pm2 &>/dev/null && [[ -f "logs/pm2-error.log" ]]; then
    ERRORS=$(tail -5 logs/pm2-error.log 2>/dev/null | grep -i "error\|fail\|exception" | tail -3)
    if [[ -n "$ERRORS" ]]; then
        echo -e "  ${YELLOW}Letzte Fehler:${NC}"
        echo "$ERRORS" | while read line; do
            echo -e "    $line"
        done
    else
        echo -e "  $OK Keine aktuellen Fehler"
    fi
elif [[ -f "logs/pm2-error.log" ]]; then
    echo -e "  $OK Keine Fehler-Logs gefunden"
else
    echo -e "  $WARN Keine Log-Dateien vorhanden"
fi

echo ""

#===============================================================================
# Zusammenfassung
#===============================================================================

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# URLs anzeigen wenn Server läuft
if curl -s --connect-timeout 2 "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
    echo -e "${GREEN}PRASCO läuft!${NC}"
    echo ""
    echo "  Display:  http://${IP:-localhost}:${PORT}/public/display.html"
    echo "  Admin:    http://${IP:-localhost}:${PORT}/admin"
    echo "  API:      http://${IP:-localhost}:${PORT}/api-docs"
else
    echo -e "${YELLOW}PRASCO ist nicht aktiv.${NC}"
    echo ""
    echo "Starte mit:"
    echo "  pm2 start prasco    (wenn PM2 eingerichtet)"
    echo "  npm start           (direkt)"
fi

echo ""
