#!/bin/bash

#===============================================================================
# PRASCO - Schnellstart für Erstanwendung
# Minimales Setup für sofortigen Start
#===============================================================================

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           PRASCO - Schnellstart Ersteinrichtung              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verzeichnis ermitteln
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "${YELLOW}→${NC} Projektverzeichnis: $PROJECT_DIR"
echo ""

# Prüfe ob vollständige Einrichtung gewünscht
if [[ "$1" == "--full" ]] || [[ "$1" == "-f" ]]; then
    echo -e "${CYAN}Starte vollständige Produktions-Einrichtung...${NC}"
    exec "$SCRIPT_DIR/setup-production.sh"
fi

#===============================================================================
# Schnellprüfungen
#===============================================================================

check_required() {
    local cmd=$1
    local name=$2
    
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${RED}✗${NC} $name nicht gefunden!"
        echo -e "  Installiere mit: ${CYAN}sudo apt install $cmd${NC}"
        return 1
    fi
    echo -e "${GREEN}✓${NC} $name gefunden"
    return 0
}

echo "Prüfe Voraussetzungen..."
echo ""

MISSING=0

check_required "node" "Node.js" || MISSING=1
check_required "npm" "npm" || MISSING=1
check_required "psql" "PostgreSQL" || MISSING=1

echo ""

if [[ $MISSING -eq 1 ]]; then
    echo -e "${YELLOW}Einige Abhängigkeiten fehlen.${NC}"
    echo ""
    echo "Optionen:"
    echo -e "  1) ${CYAN}./scripts/setup-production.sh${NC} - Vollständige Installation"
    echo -e "  2) Manuell installieren und erneut starten"
    echo ""
    exit 1
fi

#===============================================================================
# Schnell-Setup
#===============================================================================

# .env prüfen/erstellen
if [[ ! -f ".env" ]]; then
    echo -e "${YELLOW}→${NC} Erstelle Standard-.env Datei..."
    
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
    elif [[ -f ".env.production" ]]; then
        cp .env.production .env
    else
        cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bulletin_board
DB_USER=prasco
DB_PASSWORD=CHANGE_ME
JWT_SECRET=change_this_to_a_random_string_at_least_32_chars
JWT_REFRESH_SECRET=change_this_to_another_random_string_32_chars
SUPER_ADMIN_EMAIL=admin@localhost
SUPER_ADMIN_PASSWORD=admin123
UPLOAD_MAX_SIZE=52428800
UPLOAD_PATH=./uploads
EOF
    fi
    
    echo -e "${YELLOW}!${NC} Bitte bearbeite die .env Datei mit deinen Einstellungen!"
    echo -e "   ${CYAN}nano .env${NC}"
    echo ""
fi

# Pakete installieren
if [[ ! -d "node_modules" ]] || [[ ! -f "node_modules/.package-lock.json" ]]; then
    echo -e "${YELLOW}→${NC} Installiere npm Pakete..."
    npm install
    echo -e "${GREEN}✓${NC} Pakete installiert"
fi

# TypeScript kompilieren
if [[ ! -d "dist" ]] || [[ "src/server.ts" -nt "dist/server.js" ]]; then
    echo -e "${YELLOW}→${NC} Kompiliere TypeScript..."
    npm run build
    echo -e "${GREEN}✓${NC} Kompilierung abgeschlossen"
fi

# Upload-Verzeichnisse
mkdir -p uploads/{originals,thumbnails,presentations,temp}

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup abgeschlossen!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Starte mit:"
echo -e "  Entwicklung:  ${CYAN}npm run dev${NC}"
echo -e "  Produktion:   ${CYAN}npm start${NC} oder ${CYAN}pm2 start dist/server.js --name prasco${NC}"
echo ""
echo -e "Vollständiges Produktions-Setup: ${CYAN}./scripts/setup-production.sh${NC}"
echo ""
