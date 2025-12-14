#!/bin/bash

#===============================================================================
# PRASCO - Restore-Skript
# Stellt Backups der Datenbank und Upload-Dateien wieder her
#===============================================================================

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Konfiguration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PRASCO_BACKUP_DIR:-$HOME/prasco-backups}"

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                 PRASCO Restore                             ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_header

cd "$PROJECT_DIR"

# .env laden für DB-Credentials
if [[ -f ".env" ]]; then
    export $(grep -E "^DB_" .env | xargs)
else
    echo -e "${RED}✗${NC} .env Datei nicht gefunden!"
    exit 1
fi

#===============================================================================
# Backup auswählen
#===============================================================================

# Prüfe ob Backup-Pfad als Argument übergeben wurde
if [[ -n "$1" ]]; then
    BACKUP_PATH="$1"
else
    # Verfügbare Backups auflisten
    echo -e "${CYAN}Verfügbare Backups:${NC}"
    echo ""
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        echo -e "${RED}✗${NC} Backup-Verzeichnis nicht gefunden: $BACKUP_DIR"
        exit 1
    fi
    
    BACKUPS=($(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" | sort -r))
    
    if [[ ${#BACKUPS[@]} -eq 0 ]]; then
        echo -e "${RED}✗${NC} Keine Backups gefunden!"
        exit 1
    fi
    
    # Backups mit Nummern auflisten
    for i in "${!BACKUPS[@]}"; do
        BACKUP_NAME=$(basename "${BACKUPS[$i]}")
        BACKUP_DATE=$(echo "$BACKUP_NAME" | sed 's/backup_//' | sed 's/_/ /')
        BACKUP_SIZE=$(du -sh "${BACKUPS[$i]}" 2>/dev/null | cut -f1)
        echo -e "  ${YELLOW}$((i+1)))${NC} $BACKUP_NAME ($BACKUP_SIZE)"
    done
    
    echo ""
    read -p "$(echo -e "${YELLOW}?${NC} Backup-Nummer wählen [1]: ")" selection
    selection="${selection:-1}"
    
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [[ $selection -lt 1 ]] || [[ $selection -gt ${#BACKUPS[@]} ]]; then
        echo -e "${RED}✗${NC} Ungültige Auswahl!"
        exit 1
    fi
    
    BACKUP_PATH="${BACKUPS[$((selection-1))]}"
fi

# Prüfe ob Backup existiert
if [[ ! -d "$BACKUP_PATH" ]]; then
    echo -e "${RED}✗${NC} Backup nicht gefunden: $BACKUP_PATH"
    exit 1
fi

echo ""
echo -e "${YELLOW}→${NC} Ausgewähltes Backup: $(basename "$BACKUP_PATH")"
echo ""

# Backup-Info anzeigen
if [[ -f "$BACKUP_PATH/backup-info.txt" ]]; then
    echo -e "${CYAN}Backup-Info:${NC}"
    cat "$BACKUP_PATH/backup-info.txt" | head -10
    echo ""
fi

#===============================================================================
# Bestätigung
#===============================================================================

echo -e "${RED}WARNUNG: Die Wiederherstellung überschreibt aktuelle Daten!${NC}"
echo ""
read -p "$(echo -e "${YELLOW}?${NC} Fortfahren? [j/N]: ")" confirm

if [[ ! "$confirm" =~ ^[jJyY]$ ]]; then
    echo "Abgebrochen."
    exit 0
fi

#===============================================================================
# Was wiederherstellen?
#===============================================================================

echo ""
echo -e "${CYAN}Was soll wiederhergestellt werden?${NC}"
echo ""

RESTORE_DB=false
RESTORE_UPLOADS=false
RESTORE_CONFIG=false

if [[ -f "$BACKUP_PATH/database.sql.gz" ]] || [[ -f "$BACKUP_PATH/database.sql" ]]; then
    read -p "$(echo -e "${YELLOW}?${NC} Datenbank wiederherstellen? [J/n]: ")" response
    [[ ! "$response" =~ ^[nN]$ ]] && RESTORE_DB=true
fi

if [[ -f "$BACKUP_PATH/uploads.tar.gz" ]]; then
    read -p "$(echo -e "${YELLOW}?${NC} Uploads wiederherstellen? [J/n]: ")" response
    [[ ! "$response" =~ ^[nN]$ ]] && RESTORE_UPLOADS=true
fi

if [[ -f "$BACKUP_PATH/.env" ]]; then
    read -p "$(echo -e "${YELLOW}?${NC} .env wiederherstellen? [j/N]: ")" response
    [[ "$response" =~ ^[jJyY]$ ]] && RESTORE_CONFIG=true
fi

echo ""

#===============================================================================
# PRASCO stoppen
#===============================================================================

if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "prasco.*online"; then
    echo -e "${YELLOW}→${NC} Stoppe PRASCO..."
    pm2 stop prasco 2>/dev/null || true
    RESTART_PM2=true
fi

#===============================================================================
# Datenbank wiederherstellen
#===============================================================================

if [[ "$RESTORE_DB" == "true" ]]; then
    echo ""
    echo -e "${CYAN}[Datenbank]${NC}"
    
    DB_FILE=""
    if [[ -f "$BACKUP_PATH/database.sql.gz" ]]; then
        DB_FILE="$BACKUP_PATH/database.sql.gz"
        echo -e "${YELLOW}→${NC} Entpacke und stelle Datenbank wieder her..."
        gunzip -c "$DB_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
            -h "${DB_HOST:-localhost}" \
            -p "${DB_PORT:-5432}" \
            -U "${DB_USER:-prasco}" \
            -d "${DB_NAME:-bulletin_board}" \
            -q 2>/dev/null
    elif [[ -f "$BACKUP_PATH/database.sql" ]]; then
        DB_FILE="$BACKUP_PATH/database.sql"
        echo -e "${YELLOW}→${NC} Stelle Datenbank wieder her..."
        PGPASSWORD="$DB_PASSWORD" psql \
            -h "${DB_HOST:-localhost}" \
            -p "${DB_PORT:-5432}" \
            -U "${DB_USER:-prasco}" \
            -d "${DB_NAME:-bulletin_board}" \
            -q \
            < "$DB_FILE" 2>/dev/null
    fi
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓${NC} Datenbank wiederhergestellt"
    else
        echo -e "${RED}✗${NC} Fehler bei Datenbank-Wiederherstellung"
    fi
fi

#===============================================================================
# Uploads wiederherstellen
#===============================================================================

if [[ "$RESTORE_UPLOADS" == "true" ]]; then
    echo ""
    echo -e "${CYAN}[Uploads]${NC}"
    
    # Altes uploads-Verzeichnis sichern
    if [[ -d "uploads" ]]; then
        echo -e "${YELLOW}→${NC} Sichere aktuelles uploads-Verzeichnis..."
        mv uploads "uploads_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    echo -e "${YELLOW}→${NC} Stelle Uploads wieder her..."
    tar -xzf "$BACKUP_PATH/uploads.tar.gz" -C "$PROJECT_DIR"
    
    if [[ -d "uploads" ]]; then
        UPLOAD_COUNT=$(find uploads -type f | wc -l)
        echo -e "${GREEN}✓${NC} Uploads wiederhergestellt ($UPLOAD_COUNT Dateien)"
    else
        echo -e "${RED}✗${NC} Fehler bei Uploads-Wiederherstellung"
    fi
fi

#===============================================================================
# Konfiguration wiederherstellen
#===============================================================================

if [[ "$RESTORE_CONFIG" == "true" ]]; then
    echo ""
    echo -e "${CYAN}[Konfiguration]${NC}"
    
    if [[ -f ".env" ]]; then
        cp ".env" ".env.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${YELLOW}→${NC} Aktuelle .env gesichert"
    fi
    
    cp "$BACKUP_PATH/.env" ".env"
    chmod 600 ".env"
    echo -e "${GREEN}✓${NC} .env wiederhergestellt"
fi

#===============================================================================
# PRASCO starten
#===============================================================================

if [[ "$RESTART_PM2" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}→${NC} Starte PRASCO..."
    pm2 start prasco
    echo -e "${GREEN}✓${NC} PRASCO gestartet"
fi

#===============================================================================
# Zusammenfassung
#===============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Wiederherstellung abgeschlossen!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "Wiederhergestellt aus: ${CYAN}$(basename "$BACKUP_PATH")${NC}"
echo ""
[[ "$RESTORE_DB" == "true" ]] && echo -e "  ${GREEN}✓${NC} Datenbank"
[[ "$RESTORE_UPLOADS" == "true" ]] && echo -e "  ${GREEN}✓${NC} Uploads"
[[ "$RESTORE_CONFIG" == "true" ]] && echo -e "  ${GREEN}✓${NC} Konfiguration"
echo ""

echo -e "${YELLOW}!${NC} Prüfe die Anwendung: ./scripts/health-check.sh"
echo ""
