#!/bin/bash
##############################################################################
# Datenbank-Reset-Skript für PRASCO
# Löscht die komplette Datenbank und erstellt sie neu mit Seed-Daten
##############################################################################

set -e

echo "=========================================="
echo "PRASCO Datenbank Reset"
echo "=========================================="
echo ""
echo "⚠️  WARNUNG: Dies löscht ALLE Daten in der Datenbank!"
echo ""
read -p "Möchten Sie fortfahren? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Abgebrochen."
    exit 1
fi

# Lade Umgebungsvariablen
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME="${DB_NAME:-prasco}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"

echo ""
echo "📊 Datenbank-Konfiguration:"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# 1. Stoppe die Anwendung
echo "🛑 Stoppe PRASCO..."
pm2 stop prasco 2>/dev/null || true

# 2. Lösche die Datenbank
echo "🗑️  Lösche alte Datenbank..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"

# 3. Erstelle die Datenbank neu
echo "🆕 Erstelle neue Datenbank..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 4. Führe die Seeds aus
echo "🌱 Führe Database Seeds aus..."
cd "$(dirname "$0")/.."
node scripts/seed.js
echo ""
echo "📝 Standard-Benutzer:"
echo "   Superadmin: superadmin@prasco.net / superadmin123"
echo "   Admin: admin@prasco.net / admin123"
   echo "   Editor: editor@prasco.net / editor123"
echo ""

# 5. Starte die Anwendung neu
echo "🚀 Starte PRASCO..."
pm2 restart prasco

echo ""
echo "✅ Setup abgeschlossen!"
echo "🌐 Admin-Panel: http://localhost:3000/admin"
echo ""
