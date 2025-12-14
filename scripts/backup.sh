#!/bin/bash

#===============================================================================
# PRASCO - Backup-Skript
# Erstellt Backups der Datenbank und Upload-Dateien
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
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS="${PRASCO_BACKUP_KEEP_DAYS:-30}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  PRASCO Backup                             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_DIR"

# .env laden für DB-Credentials
if [[ -f ".env" ]]; then
    export $(grep -E "^DB_" .env | xargs)
else
    echo -e "${RED}✗${NC} .env Datei nicht gefunden!"
    exit 1
fi

# Backup-Verzeichnis erstellen
mkdir -p "$BACKUP_DIR"
CURRENT_BACKUP="$BACKUP_DIR/backup_$TIMESTAMP"
mkdir -p "$CURRENT_BACKUP"

echo -e "${YELLOW}→${NC} Backup-Verzeichnis: $CURRENT_BACKUP"
echo ""

#===============================================================================
# Datenbank-Backup
#===============================================================================

echo -e "${CYAN}[Datenbank]${NC}"

DB_BACKUP_FILE="$CURRENT_BACKUP/database.sql"

if command -v pg_dump &>/dev/null; then
    echo -e "${YELLOW}→${NC} Erstelle Datenbank-Backup..."
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "${DB_HOST:-localhost}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-prasco}" \
        -d "${DB_NAME:-bulletin_board}" \
        -F p \
        > "$DB_BACKUP_FILE" 2>/dev/null
    
    if [[ -s "$DB_BACKUP_FILE" ]]; then
        gzip "$DB_BACKUP_FILE"
        DB_SIZE=$(du -h "${DB_BACKUP_FILE}.gz" | cut -f1)
        echo -e "${GREEN}✓${NC} Datenbank gesichert (${DB_SIZE})"
    else
        echo -e "${RED}✗${NC} Datenbank-Backup fehlgeschlagen!"
        rm -f "$DB_BACKUP_FILE"
    fi
else
    echo -e "${YELLOW}!${NC} pg_dump nicht verfügbar - überspringe Datenbank"
fi

#===============================================================================
# Uploads-Backup
#===============================================================================

echo ""
echo -e "${CYAN}[Uploads]${NC}"

UPLOADS_BACKUP_FILE="$CURRENT_BACKUP/uploads.tar.gz"

if [[ -d "uploads" ]]; then
    UPLOAD_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
    echo -e "${YELLOW}→${NC} Sichere $UPLOAD_COUNT Dateien..."
    
    tar -czf "$UPLOADS_BACKUP_FILE" uploads/ 2>/dev/null
    
    if [[ -f "$UPLOADS_BACKUP_FILE" ]]; then
        UPLOADS_SIZE=$(du -h "$UPLOADS_BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✓${NC} Uploads gesichert (${UPLOADS_SIZE})"
    else
        echo -e "${RED}✗${NC} Uploads-Backup fehlgeschlagen!"
    fi
else
    echo -e "${YELLOW}!${NC} Kein uploads-Verzeichnis vorhanden"
fi

#===============================================================================
# Konfiguration-Backup
#===============================================================================

echo ""
echo -e "${CYAN}[Konfiguration]${NC}"

# .env sichern (ohne sensible Daten anzuzeigen)
if [[ -f ".env" ]]; then
    cp ".env" "$CURRENT_BACKUP/.env"
    echo -e "${GREEN}✓${NC} .env gesichert"
fi

# ecosystem.config.js sichern
if [[ -f "ecosystem.config.js" ]]; then
    cp "ecosystem.config.js" "$CURRENT_BACKUP/"
    echo -e "${GREEN}✓${NC} PM2-Konfiguration gesichert"
fi

#===============================================================================
# Backup-Info erstellen
#===============================================================================

cat > "$CURRENT_BACKUP/backup-info.txt" << EOF
PRASCO Backup
=============
Datum: $(date '+%Y-%m-%d %H:%M:%S')
Hostname: $(hostname)
Version: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")

Inhalt:
$(ls -lh "$CURRENT_BACKUP")
EOF

#===============================================================================
# Alte Backups aufräumen
#===============================================================================

echo ""
echo -e "${CYAN}[Aufräumen]${NC}"

OLD_BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" -mtime +$KEEP_DAYS 2>/dev/null | wc -l)

if [[ $OLD_BACKUPS -gt 0 ]]; then
    echo -e "${YELLOW}→${NC} Lösche $OLD_BACKUPS alte Backups (älter als $KEEP_DAYS Tage)..."
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" -mtime +$KEEP_DAYS -exec rm -rf {} \;
    echo -e "${GREEN}✓${NC} Alte Backups gelöscht"
else
    echo -e "${GREEN}✓${NC} Keine alten Backups zu löschen"
fi

#===============================================================================
# Zusammenfassung
#===============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                Backup abgeschlossen!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_SIZE=$(du -sh "$CURRENT_BACKUP" | cut -f1)
echo -e "Backup-Pfad: ${CYAN}$CURRENT_BACKUP${NC}"
echo -e "Gesamtgröße: ${CYAN}$TOTAL_SIZE${NC}"
echo ""

# Anzahl vorhandener Backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" | wc -l)
echo -e "Vorhandene Backups: $BACKUP_COUNT"
echo ""

#===============================================================================
# Restore-Hinweise
#===============================================================================

echo -e "${CYAN}Restore-Befehle:${NC}"
echo ""
echo "# Datenbank wiederherstellen:"
echo "gunzip -c $CURRENT_BACKUP/database.sql.gz | psql -U prasco -d bulletin_board"
echo ""
echo "# Uploads wiederherstellen:"
echo "tar -xzf $CURRENT_BACKUP/uploads.tar.gz -C $PROJECT_DIR"
echo ""
