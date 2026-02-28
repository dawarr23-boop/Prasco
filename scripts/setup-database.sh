#!/bin/bash
################################################################################
# PRASCO Datenbank-Setup (Erstinstallation auf dem Server)
#
# Verwendung: ./scripts/setup-database.sh
#
# Was passiert:
#   1. PostgreSQL-Passwort setzen
#   2. Datenbank erstellen (oder vorhandene behalten / loeschen)
#   3. Berechtigungen setzen
#   4. TypeScript-Sourcen kompilieren (npm run build)
#   5. SQL-Migrationen ausfuehren (node scripts/migrate.js)
#   6. Seed-Daten einspielen (node scripts/seed.js)
################################################################################

set -e

# Farben
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log_ok()   { echo -e "${GREEN}OK  $1${NC}"; }
log_warn() { echo -e "${YELLOW}WARN  $1${NC}"; }
log_info() { echo -e "${CYAN}->  $1${NC}"; }
log_err()  { echo -e "${RED}ERR  $1${NC}"; }

echo ""
echo "PRASCO Datenbank-Setup"
echo "======================"
echo ""

# Wechsle in Projekt-Root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Lade .env
if [ -f .env ]; then
    log_info "Lade .env Konfiguration"
    set -o allexport; source .env; set +o allexport
fi

DB_NAME="${DB_NAME:-prasco}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_DIALECT="${DB_DIALECT:-postgres}"

log_info "Datenbank : $DB_NAME"
log_info "User      : $DB_USER"
log_info "Host      : $DB_HOST:$DB_PORT"
log_info "Dialekt   : $DB_DIALECT"
echo ""

# SQLite: vereinfachter Flow
if [ "$DB_DIALECT" = "sqlite" ]; then
    echo "SQLite-Modus - ueberspringe PostgreSQL-Setup."
    npm run build && log_ok "Build abgeschlossen"
    echo "(Migrationen werden uebersprungen - SQLite nutzt sequelize.sync)"
    node scripts/seed.js && log_ok "Seeding abgeschlossen"
    echo ""; log_ok "Setup abgeschlossen!"; exit 0
fi

# [1/6] Passwort
echo "[1/6] Setze PostgreSQL Benutzerpasswort..."
sudo -u postgres psql -c "ALTER USER ${DB_USER} PASSWORD '${DB_PASSWORD}';" 2>/dev/null \
    && log_ok "Passwort gesetzt" || log_warn "Passwort nicht gesetzt (fehlende sudo-Rechte?)"

# [2/6] Datenbank anlegen
echo ""
echo "[2/6] Pruefe Datenbank '${DB_NAME}'..."
if sudo -u postgres psql -lqt 2>/dev/null | cut -d'|' -f1 | tr -d ' ' | grep -qx "$DB_NAME"; then
    log_warn "Datenbank '${DB_NAME}' existiert bereits."
    read -r -p "  Loeschen und neu erstellen? (yes/no): " REPLY
    if [[ "$REPLY" =~ ^[Yy][Ee][Ss]$ ]]; then
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null
        sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
        log_ok "Datenbank neu erstellt"
    else
        log_info "Behalte vorhandene Datenbank"
    fi
else
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null \
        && log_ok "Datenbank '${DB_NAME}' erstellt" \
        || log_warn "Datenbank konnte nicht angelegt werden (existiert mglw. bereits)"
fi

# [3/6] Berechtigungen
echo ""
echo "[3/6] Setze Datenbankberechtigungen..."
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON SCHEMA public TO ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO ${DB_USER};" 2>/dev/null || true
log_ok "Berechtigungen gesetzt"

# [4/6] Build
echo ""
echo "[4/6] Kompiliere TypeScript..."
npm run build && log_ok "Build erfolgreich" || { log_err "Build fehlgeschlagen"; exit 1; }

# [5/6] Migrationen
echo ""
echo "[5/6] Fuehre SQL-Migrationen aus..."
node scripts/migrate.js && log_ok "Migrationen abgeschlossen" || { log_err "Migrationen fehlgeschlagen"; exit 1; }

# [6/6] Seeding
echo ""
echo "[6/6] Fuehre Seeding aus..."
node scripts/seed.js && log_ok "Seeding abgeschlossen" || { log_err "Seeding fehlgeschlagen"; exit 1; }

echo ""
echo "Setup erfolgreich abgeschlossen!"
echo ""
echo "Zugaenge:"
echo "  superadmin@prasco.net  /  superadmin123"
echo "  admin@prasco.net       /  admin123"
echo "  editor@prasco.net      /  editor123"
echo ""
echo "Server starten: pm2 restart prasco  oder  docker compose up -d"
echo ""