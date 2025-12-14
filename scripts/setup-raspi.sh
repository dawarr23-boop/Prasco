#!/bin/bash
# PRASCO Digital Signage - Raspberry Pi Setup Script (Legacy)
# 
# HINWEIS: Dieses Skript ist veraltet!
# Verwende stattdessen das neue interaktive Setup:
#   ./scripts/setup-production.sh
#
# Ausführen (legacy): sudo bash setup-raspi.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  PRASCO Digital Signage - Raspberry Pi Setup (Legacy)        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  HINWEIS: Dieses Skript ist veraltet!"
echo ""
echo "Empfohlen: Verwende das neue interaktive Setup:"
echo "  ./scripts/setup-production.sh"
echo ""
echo "Das neue Setup bietet:"
echo "  ✓ Interaktive Konfiguration"
echo "  ✓ Automatische sichere Passwort-Generierung"
echo "  ✓ Kein root erforderlich"
echo "  ✓ Bessere Fehlerbehandlung"
echo ""
read -p "Trotzdem mit Legacy-Setup fortfahren? [j/N]: " response
if [[ ! "$response" =~ ^[jJyY]$ ]]; then
    echo "Verwende: ./scripts/setup-production.sh"
    exit 0
fi
echo ""

# Prüfe root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Bitte als root ausführen: sudo bash setup-raspi.sh"
  exit 1
fi

# System aktualisieren
echo "📦 System aktualisieren..."
apt update && apt upgrade -y

# Node.js 18.x installieren
echo "📦 Node.js installieren..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi
echo "✅ Node.js Version: $(node --version)"

# PM2 installieren
echo "📦 PM2 installieren..."
npm install -g pm2

# PostgreSQL installieren
echo "📦 PostgreSQL installieren..."
apt install -y postgresql postgresql-contrib

# PostgreSQL Benutzer und Datenbank erstellen
echo "🗄️ Datenbank einrichten..."
sudo -u postgres psql -c "CREATE USER prasco WITH PASSWORD 'prasco123';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE bulletin_board OWNER prasco;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bulletin_board TO prasco;" 2>/dev/null || true

# Chromium für Kiosk-Modus installieren
echo "📦 Chromium installieren..."
apt install -y chromium-browser unclutter

# App-Verzeichnis erstellen
echo "📁 App-Verzeichnis erstellen..."
APP_DIR="/home/pi/prasco"
mkdir -p $APP_DIR
chown pi:pi $APP_DIR

# Autostart für Kiosk-Modus konfigurieren
echo "🖥️ Kiosk-Modus konfigurieren..."
mkdir -p /home/pi/.config/autostart

cat > /home/pi/.config/autostart/prasco-kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=PRASCO Kiosk
Exec=/home/pi/prasco/start-kiosk.sh
X-GNOME-Autostart-enabled=true
EOF

chown pi:pi /home/pi/.config/autostart/prasco-kiosk.desktop

# Kiosk-Start-Skript erstellen
cat > $APP_DIR/start-kiosk.sh << 'EOF'
#!/bin/bash
# PRASCO Kiosk Mode Starter

# Warte auf Netzwerk
sleep 10

# Bildschirmschoner deaktivieren
xset s off
xset -dpms
xset s noblank

# Mauszeiger verstecken
unclutter -idle 0.5 -root &

# Warte auf Server
while ! curl -s http://localhost:3000/api/health > /dev/null; do
  echo "Warte auf Server..."
  sleep 2
done

# Chromium im Kiosk-Modus starten
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --start-fullscreen \
  http://localhost:3000/public/display.html
EOF

chmod +x $APP_DIR/start-kiosk.sh
chown pi:pi $APP_DIR/start-kiosk.sh

# PM2 Startup konfigurieren
echo "⚙️ PM2 Autostart konfigurieren..."
pm2 startup systemd -u pi --hp /home/pi
systemctl enable pm2-pi

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Kopiere die App-Dateien nach $APP_DIR"
echo "2. Erstelle die .env Datei: cp .env.production .env"
echo "3. Passe die .env Datei an"
echo "4. Installiere Dependencies: npm install"
echo "5. Baue die App: npm run build"
echo "6. Starte mit PM2: pm2 start dist/server.js --name prasco"
echo "7. Speichere PM2 Status: pm2 save"
echo "8. Starte neu: sudo reboot"
echo ""
