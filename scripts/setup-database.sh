#!/bin/bash
###############################################################################
# PRASCO Database Setup Script
# Erstellt und konfiguriert die PostgreSQL Datenbank mit korrekten Berechtigungen
###############################################################################

set -e  # Exit on error

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO Database Setup                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Lade .env wenn vorhanden
if [ -f .env ]; then
    echo -e "${YELLOW}→ Lade .env Konfiguration${NC}"
    export $(grep -v '^#' .env | xargs)
fi

# Setze Defaults falls nicht in .env
DB_NAME=${DB_NAME:-prasco}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

echo -e "${YELLOW}→ Datenbank: ${DB_NAME}${NC}"
echo -e "${YELLOW}→ User: ${DB_USER}${NC}"
echo ""

# Schritt 1: Postgres User Passwort setzen
echo -e "${YELLOW}[1/6] Setze PostgreSQL User Passwort...${NC}"
sudo -u postgres psql -c "ALTER USER ${DB_USER} PASSWORD '${DB_PASSWORD}';" 2>/dev/null || true
echo -e "${GREEN}✓ Passwort gesetzt${NC}"

# Schritt 2: Prüfe ob Datenbank existiert, wenn ja - bestätige Löschung
echo -e "${YELLOW}[2/6] Prüfe Datenbank...${NC}"
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME}; then
    echo -e "${RED}⚠ Datenbank '${DB_NAME}' existiert bereits!${NC}"
    read -p "Möchten Sie die Datenbank löschen und neu erstellen? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${YELLOW}→ Lösche existierende Datenbank...${NC}"
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
        echo -e "${GREEN}✓ Datenbank gelöscht${NC}"
    else
        echo -e "${YELLOW}→ Behalte existierende Datenbank${NC}"
    fi
fi

# Schritt 3: Erstelle Datenbank
echo -e "${YELLOW}[3/6] Erstelle Datenbank...${NC}"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || {
    echo -e "${YELLOW}→ Datenbank existiert bereits${NC}"
}
echo -e "${GREEN}✓ Datenbank vorhanden${NC}"

# Schritt 4: Setze Berechtigungen
echo -e "${YELLOW}[4/6] Setze Berechtigungen...${NC}"
sudo -u postgres psql -d prasco -c "GRANT ALL PRIVILEGES ON DATABASE prasco TO postgres;" 2>/dev/null || true
sudo -u postgres psql -d prasco -c "GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;" 2>/dev/null || true
sudo -u postgres psql -d prasco -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;" 2>/dev/null || true
sudo -u postgres psql -d prasco -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;" 2>/dev/null || true
sudo -u postgres psql -d prasco -c "ALTER SCHEMA public OWNER TO postgres;" 2>/dev/null || true
echo -e "${GREEN}✓ Berechtigungen gesetzt${NC}"

# Schritt 5: Erstelle Tabellen via sync
echo -e "${YELLOW}[5/6] Erstelle Datenbank-Tabellen...${NC}"
node scripts/sync-all-tables.js || {
    echo -e "${RED}✗ Fehler beim Erstellen der Tabellen${NC}"
    exit 1
}
echo -e "${GREEN}✓ Tabellen erstellt${NC}"

# Schritt 6: Führe Seeding aus
echo -e "${YELLOW}[6/6] Führe Daten-Seeding aus...${NC}"
npm run db:seed || {
    echo -e "${RED}✗ Fehler beim Seeding${NC}"
    exit 1
}
echo -e "${GREEN}✓ Seeding abgeschlossen${NC}"

# Zusammenfassung
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Setup erfolgreich abgeschlossen   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Datenbank-Details:${NC}"
echo -e "  • Datenbank: ${DB_NAME}"
echo -e "  • User: ${DB_USER}"
echo -e "  • Host: ${DB_HOST:-localhost}"
echo -e "  • Port: ${DB_PORT:-5432}"
echo ""

# Zeige erstellte Tabellen
echo -e "${YELLOW}Erstellte Tabellen:${NC}"
sudo -u postgres psql -d ${DB_NAME} -c '\dt' | grep -v "^$" || true

echo ""
echo -e "${GREEN}Sie können den Server jetzt starten mit: pm2 restart prasco${NC}"
