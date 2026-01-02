#!/bin/bash
# PRASCO First Run - Produktivumgebung Setup
# Erstellt Datenbank neu, seeded Permissions und User

set -e

echo "=========================================="
echo "PRASCO Produktivumgebung - First Run Setup"
echo "=========================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env nicht gefunden, kopiere von .env.production${NC}"
    cp .env.production .env
fi

# Lade Umgebungsvariablen
source .env

echo -e "\n${YELLOW}📦 Installiere Dependencies...${NC}"
npm install

echo -e "\n${YELLOW}🔨 Kompiliere TypeScript...${NC}"
npm run build

echo -e "\n${RED}🗑️  Lösche existierende Datenbank...${NC}"
# PostgreSQL Datenbank droppen und neu erstellen
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
echo -e "${GREEN}✓ Datenbank gelöscht${NC}"

echo -e "\n${GREEN}🆕 Erstelle neue Datenbank...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
echo -e "${GREEN}✓ Datenbank erstellt${NC}"

echo -e "\n${YELLOW}🌱 Initialisiere Datenbank-Schema und Seed-Daten...${NC}"
# Führe das Seeding aus (erstellt Tabellen und initialisiert Daten)
node dist/database/seeders/index.js || {
    echo -e "${RED}❌ Seeding fehlgeschlagen, versuche alternatives Script...${NC}"
    node scripts/full-seed.js || {
        echo -e "${RED}❌ Alternatives Seeding auch fehlgeschlagen${NC}"
        exit 1
    }
}

echo -e "\n${GREEN}👥 Benutzer erstellt:${NC}"
echo -e "  ${GREEN}Super Admin:${NC}"
echo -e "    Email: superadmin@prasco.net"
echo -e "    Passwort: superadmin123"
echo -e "    Rolle: super_admin (versteckt im Login)"
echo -e ""
echo -e "  ${GREEN}Admin:${NC}"
echo -e "    Email: admin@prasco.net"
echo -e "    Passwort: admin123"
echo -e "    Rolle: admin"

echo -e "\n${YELLOW}🚀 Starte PRASCO Server mit PM2...${NC}"
pm2 stop prasco 2>/dev/null || true
pm2 delete prasco 2>/dev/null || true
pm2 start dist/server.js --name prasco
pm2 save

echo -e "\n${GREEN}=========================================="
echo "✅ PRASCO Produktivumgebung bereit!"
echo "=========================================="
echo -e "Server läuft auf: http://localhost:3000${NC}"
echo -e "Admin-Panel: http://localhost:3000/admin"
echo ""
echo -e "${YELLOW}Wichtig: Ändere die Standard-Passwörter nach dem ersten Login!${NC}"
