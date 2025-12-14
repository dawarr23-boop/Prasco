#!/bin/bash
#===============================================================================
# PRASCO First-Boot Service Installer
#
# Dieses Skript wird auf die boot-Partition kopiert und beim ersten Start
# ausgeführt, um PRASCO automatisch zu installieren.
#
# Verwendung:
#   1. Kopiere dieses Skript auf die boot-Partition der SD-Karte
#   2. Beim ersten Start wird es automatisch ausgeführt
#===============================================================================

# Konfiguration - wird vom prepare-sd-card.ps1 Skript angepasst
PRASCO_REPO="https://github.com/dawarr23-boop/Prasco.git"
PRASCO_USER="${PRASCO_USER:-pi}"
PRASCO_HOSTNAME="${PRASCO_HOSTNAME:-prasco}"

# Log-Datei
LOG_FILE="/var/log/prasco-firstboot.log"
MARKER_FILE="/var/lib/prasco-firstboot-done"

# Wenn bereits ausgeführt, beenden
if [[ -f "$MARKER_FILE" ]]; then
    exit 0
fi

# Logging starten
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=============================================="
echo "PRASCO First-Boot Setup"
echo "Start: $(date)"
echo "=============================================="

#===============================================================================
# Warte auf Netzwerk
#===============================================================================

echo "[1/7] Warte auf Netzwerkverbindung..."

MAX_RETRIES=60
RETRY=0

while ! ping -c 1 -W 2 google.com &>/dev/null; do
    RETRY=$((RETRY + 1))
    if [[ $RETRY -ge $MAX_RETRIES ]]; then
        echo "FEHLER: Keine Netzwerkverbindung nach $MAX_RETRIES Versuchen!"
        echo "Bitte verbinde das Gerät mit dem Netzwerk und starte neu."
        exit 1
    fi
    echo "  Warte auf Netzwerk... ($RETRY/$MAX_RETRIES)"
    sleep 5
done

echo "✓ Netzwerk verfügbar"

#===============================================================================
# Hostname setzen
#===============================================================================

echo "[2/7] Setze Hostname..."

hostnamectl set-hostname "$PRASCO_HOSTNAME"

# /etc/hosts aktualisieren
if ! grep -q "$PRASCO_HOSTNAME" /etc/hosts; then
    echo "127.0.1.1 $PRASCO_HOSTNAME" >> /etc/hosts
fi

echo "✓ Hostname: $PRASCO_HOSTNAME"

#===============================================================================
# System aktualisieren
#===============================================================================

echo "[3/7] Aktualisiere System..."

apt-get update -q
apt-get upgrade -y -q

echo "✓ System aktualisiert"

#===============================================================================
# Node.js installieren
#===============================================================================

echo "[4/7] Installiere Node.js 18..."

if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "✓ Node.js $(node --version) installiert"

#===============================================================================
# PostgreSQL installieren
#===============================================================================

echo "[5/7] Installiere PostgreSQL..."

if ! command -v psql &>/dev/null; then
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
fi

echo "✓ PostgreSQL installiert"

#===============================================================================
# PM2 und weitere Tools installieren
#===============================================================================

echo "[6/7] Installiere PM2 und Tools..."

npm install -g pm2 2>/dev/null || true

apt-get install -y git chromium-browser xdotool unclutter 2>/dev/null || true

echo "✓ Tools installiert"

#===============================================================================
# PRASCO klonen
#===============================================================================

echo "[7/7] Klone PRASCO Repository..."

USER_HOME="/home/$PRASCO_USER"
PRASCO_DIR="$USER_HOME/prasco"

if [[ -d "$PRASCO_DIR" ]]; then
    rm -rf "$PRASCO_DIR"
fi

git clone "$PRASCO_REPO" "$PRASCO_DIR"
chown -R "$PRASCO_USER:$PRASCO_USER" "$PRASCO_DIR"

# Skripte ausführbar machen
chmod +x "$PRASCO_DIR/scripts/"*.sh 2>/dev/null || true

echo "✓ PRASCO geklont nach $PRASCO_DIR"

#===============================================================================
# Login-Hinweis einrichten
#===============================================================================

# Erstelle Hinweis bei SSH-Login
cat > "$USER_HOME/.prasco-setup-hint" << 'HINT'

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║    ██████╗ ██████╗  █████╗ ███████╗ ██████╗ ██████╗                       ║
║    ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗                      ║
║    ██████╔╝██████╔╝███████║███████╗██║     ██║   ██║                      ║
║    ██╔═══╝ ██╔══██╗██╔══██║╚════██║██║     ██║   ██║                      ║
║    ██║     ██║  ██║██║  ██║███████║╚██████╗╚██████╔╝                      ║
║    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝                       ║
║                                                                           ║
║           Willkommen! PRASCO wurde erfolgreich installiert.               ║
║                                                                           ║
║   Starte die interaktive Einrichtung mit:                                 ║
║                                                                           ║
║       cd ~/prasco && ./scripts/setup-production.sh                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

HINT

# Füge Hinweis zur .bashrc hinzu (nur einmal)
if ! grep -q "prasco-setup-hint" "$USER_HOME/.bashrc" 2>/dev/null; then
    cat >> "$USER_HOME/.bashrc" << 'BASHRC'

# PRASCO Setup-Hinweis (wird nach Setup entfernt)
if [ -f ~/.prasco-setup-hint ]; then
    cat ~/.prasco-setup-hint
fi
BASHRC
fi

chown "$PRASCO_USER:$PRASCO_USER" "$USER_HOME/.prasco-setup-hint"
chown "$PRASCO_USER:$PRASCO_USER" "$USER_HOME/.bashrc"

#===============================================================================
# Marker setzen und aufräumen
#===============================================================================

# Marker setzen
touch "$MARKER_FILE"

# First-Boot Skript von boot-Partition entfernen
rm -f /boot/prasco-firstboot.sh 2>/dev/null || true
rm -f /boot/firmware/prasco-firstboot.sh 2>/dev/null || true

# Systemd Service deaktivieren (falls verwendet)
systemctl disable prasco-firstboot.service 2>/dev/null || true

#===============================================================================
# Abschluss
#===============================================================================

echo ""
echo "=============================================="
echo "PRASCO First-Boot Setup abgeschlossen!"
echo "Ende: $(date)"
echo "=============================================="
echo ""
echo "Nächste Schritte:"
echo "  1. Verbinde dich per SSH: ssh $PRASCO_USER@$PRASCO_HOSTNAME.local"
echo "  2. Starte das Setup: cd ~/prasco && ./scripts/setup-production.sh"
echo ""

# Optional: Neustart
# reboot
