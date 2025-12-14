#!/bin/bash

#===============================================================================
# PRASCO - Update-Skript
# Aktualisiert PRASCO auf die neueste Version
#===============================================================================

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Verzeichnis
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 PRASCO Update                              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_DIR"

# Prüfe ob Git verfügbar
if ! command -v git &>/dev/null; then
    echo -e "${RED}✗${NC} Git nicht gefunden!"
    exit 1
fi

# Prüfe ob es ein Git-Repository ist
if [[ ! -d ".git" ]]; then
    echo -e "${RED}✗${NC} Kein Git-Repository!"
    exit 1
fi

# Aktuelle Version
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unbekannt")
echo -e "${YELLOW}→${NC} Aktuelle Version: $CURRENT_COMMIT"

# Lokale Änderungen prüfen
if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
    echo -e "${YELLOW}!${NC} Es gibt lokale Änderungen."
    read -p "$(echo -e "${YELLOW}?${NC} Fortfahren? Änderungen werden gesichert [j/N]: ")" response
    
    if [[ ! "$response" =~ ^[jJyY]$ ]]; then
        echo "Abgebrochen."
        exit 0
    fi
    
    # Änderungen stashen
    echo -e "${YELLOW}→${NC} Sichere lokale Änderungen..."
    git stash push -m "PRASCO Update $(date +%Y%m%d_%H%M%S)"
    STASHED=true
fi

# Updates holen
echo -e "${YELLOW}→${NC} Hole Updates von Remote..."
git fetch origin

# Prüfe ob Updates verfügbar
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "$LOCAL")

if [[ "$LOCAL" == "$REMOTE" ]]; then
    echo -e "${GREEN}✓${NC} Bereits auf dem neuesten Stand!"
    
    if [[ "$STASHED" == "true" ]]; then
        echo -e "${YELLOW}→${NC} Stelle lokale Änderungen wieder her..."
        git stash pop
    fi
    
    exit 0
fi

# Update durchführen
echo -e "${YELLOW}→${NC} Aktualisiere..."
git pull origin main || git pull origin master || git pull

NEW_COMMIT=$(git rev-parse --short HEAD)
echo -e "${GREEN}✓${NC} Aktualisiert: $CURRENT_COMMIT → $NEW_COMMIT"

# Dependencies prüfen
if [[ "package.json" -nt "node_modules/.package-lock.json" ]] || [[ "package-lock.json" -nt "node_modules/.package-lock.json" ]]; then
    echo -e "${YELLOW}→${NC} Aktualisiere npm Pakete..."
    npm ci --only=production
    echo -e "${GREEN}✓${NC} Pakete aktualisiert"
fi

# Build
echo -e "${YELLOW}→${NC} Kompiliere Projekt..."
npm run build
echo -e "${GREEN}✓${NC} Build abgeschlossen"

# PM2 Neustart
if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "prasco"; then
    echo -e "${YELLOW}→${NC} Starte PRASCO neu..."
    pm2 restart prasco
    echo -e "${GREEN}✓${NC} PRASCO neu gestartet"
fi

# Gestashte Änderungen wiederherstellen
if [[ "$STASHED" == "true" ]]; then
    echo -e "${YELLOW}→${NC} Stelle lokale Änderungen wieder her..."
    if git stash pop; then
        echo -e "${GREEN}✓${NC} Änderungen wiederhergestellt"
    else
        echo -e "${RED}!${NC} Konflikte beim Wiederherstellen. Prüfe mit: git stash show -p"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               Update abgeschlossen!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Changelog anzeigen
echo -e "${CYAN}Änderungen:${NC}"
git log --oneline "$CURRENT_COMMIT..$NEW_COMMIT" 2>/dev/null | head -10

echo ""
