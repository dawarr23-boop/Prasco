#!/bin/bash
# Setup Git Repository auf Raspberry Pi

echo "🔧 Erstelle Prasco Verzeichnis..."
cd /home/pi
rm -rf Prasco
git clone https://github.com/dawarr23-boop/Prasco.git

cd Prasco

echo "📦 Installiere Dependencies..."
npm install

echo "🔨 Baue TypeScript..."
npm run build

echo "📝 Kopiere .env.production zu .env..."
cp .env.production .env 2>/dev/null || echo "Keine .env.production gefunden"

echo "✅ Repository erfolgreich geklont und eingerichtet!"
echo "📁 Verzeichnis: /home/pi/Prasco"
echo ""
echo "Nächste Schritte:"
echo "  1. Bearbeite .env Datei mit Datenbank-Credentials"
echo "  2. Starte Server: pm2 start dist/server.js --name prasco"
echo "  3. Speichere PM2: pm2 save"
echo "  4. Display öffnen: http://localhost:3000"
