#!/bin/bash
#===============================================================================
# PRASCO - Framebuffer Splash Screen Installer
# Verwendet fbi (framebuffer image viewer) für einfachen Logo-Splash
#===============================================================================

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/assets"
SPLASH_DIR="$ASSETS_DIR/splash"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        PRASCO Framebuffer Splash Installer                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Root-Rechte prüfen
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}✗${NC} Dieses Skript muss als root ausgeführt werden!"
   echo "   Verwende: sudo $0"
   exit 1
fi

#===============================================================================
# Fbi installieren
#===============================================================================

echo -e "${YELLOW}→${NC} Installiere Fbi (Framebuffer Image Viewer)..."
apt-get update -qq
apt-get install -y fbi imagemagick

echo -e "${GREEN}✓${NC} Fbi installiert"

#===============================================================================
# PRASCO Logo als Bild erstellen
#===============================================================================

echo -e "${YELLOW}→${NC} Erstelle PRASCO Logo-Bild..."

mkdir -p "$SPLASH_DIR"

# Erstelle ein modernes PRASCO Logo-Bild
convert -size 1920x1080 \
    -background '#0a0a1e' \
    -fill '#e94560' \
    -font DejaVu-Sans-Bold \
    -pointsize 140 \
    -gravity center \
    -annotate +0-150 'PRASCO' \
    -fill '#0f3460' \
    -pointsize 50 \
    -annotate +0+50 'Digitales Schwarzes Brett' \
    -fill '#533483' \
    -pointsize 40 \
    -annotate +0+200 'wird gestartet...' \
    "$SPLASH_DIR/prasco-splash-fb.png" 2>/dev/null || {
    
    # Fallback: Verwende ASCII-Art als PNG
    echo -e "${YELLOW}!${NC} ImageMagick-Font nicht verfügbar, verwende einfaches Logo..."
    
    convert -size 1920x1080 xc:'#0a0a1e' \
        -font Courier-Bold \
        -pointsize 20 \
        -fill '#e94560' \
        -gravity center \
        -annotate +0+0 "$(cat $ASSETS_DIR/prasco-logo.txt)" \
        "$SPLASH_DIR/prasco-splash-fb.png"
}

# Kleinere Version für kleinere Displays
convert "$SPLASH_DIR/prasco-splash-fb.png" \
    -resize 1280x720 \
    "$SPLASH_DIR/prasco-splash-fb-720p.png"

echo -e "${GREEN}✓${NC} Logo-Bild erstellt"

#===============================================================================
# Splash Screen Service erstellen
#===============================================================================

echo -e "${YELLOW}→${NC} Erstelle Framebuffer-Splash Service..."

cat > /usr/local/bin/prasco-fb-splash.sh << 'SPLASH_SCRIPT'
#!/bin/bash
# PRASCO Framebuffer Splash

SPLASH_IMAGE="/home/pi/Prasco/assets/splash/prasco-splash-fb.png"
SPLASH_IMAGE_720="/home/pi/Prasco/assets/splash/prasco-splash-fb-720p.png"

# Wähle Bild basierend auf Auflösung
if [[ -f "$SPLASH_IMAGE_720" ]]; then
    IMAGE="$SPLASH_IMAGE_720"
else
    IMAGE="$SPLASH_IMAGE"
fi

# Zeige Bild auf Framebuffer (ohne TTY-Ausgabe)
if command -v fbi &>/dev/null && [[ -f "$IMAGE" ]]; then
    fbi -noverbose -a -T 1 "$IMAGE" < /dev/null &> /dev/null &
    FBI_PID=$!
    
    # Speichere PID für späteren Cleanup
    echo $FBI_PID > /run/prasco-splash.pid
fi
SPLASH_SCRIPT

chmod +x /usr/local/bin/prasco-fb-splash.sh

# Splash-Cleanup-Skript
cat > /usr/local/bin/prasco-fb-splash-stop.sh << 'STOP_SCRIPT'
#!/bin/bash
# Beende PRASCO Framebuffer Splash

if [[ -f /run/prasco-splash.pid ]]; then
    FBI_PID=$(cat /run/prasco-splash.pid)
    if [[ -n "$FBI_PID" ]]; then
        kill $FBI_PID 2>/dev/null || true
        killall fbi 2>/dev/null || true
    fi
    rm -f /run/prasco-splash.pid
fi

# Lösche Framebuffer
if command -v clear &>/dev/null; then
    clear > /dev/tty1 2>/dev/null || true
fi
STOP_SCRIPT

chmod +x /usr/local/bin/prasco-fb-splash-stop.sh

# Systemd Service
cat > /etc/systemd/system/prasco-fb-splash.service << 'EOF'
[Unit]
Description=PRASCO Framebuffer Splash Screen
DefaultDependencies=no
After=local-fs.target
Before=display-manager.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-fb-splash.sh
RemainAfterExit=yes
StandardOutput=journal

[Install]
WantedBy=sysinit.target
EOF

# Progress Service (zeigt Splash bis PRASCO bereit)
cat > /etc/systemd/system/prasco-splash-progress.service << 'EOF'
[Unit]
Description=PRASCO Boot Progress Monitor
After=prasco-fb-splash.service network.target postgresql.service
Before=display-manager.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-boot-progress.sh
ExecStopPost=/usr/local/bin/prasco-fb-splash-stop.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓${NC} Services erstellt"

#===============================================================================
# Boot-Progress-Skript (wartet auf PRASCO)
#===============================================================================

echo -e "${YELLOW}→${NC} Erstelle Boot-Progress-Skript..."

cat > /usr/local/bin/prasco-boot-progress.sh << 'PROGRESS_SCRIPT'
#!/bin/bash
# Warte bis PRASCO bereit ist

# Warte auf PRASCO-Server (mit Timeout)
TIMEOUT=120
ELAPSED=0

while ! (curl -s http://localhost:3000/api/health > /dev/null 2>&1 || curl -sk https://localhost:3000/api/health > /dev/null 2>&1); do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    if [[ $ELAPSED -ge $TIMEOUT ]]; then
        # Timeout - beende trotzdem Splash
        break
    fi
done

# Kurz anzeigen dass PRASCO bereit ist
sleep 2
PROGRESS_SCRIPT

chmod +x /usr/local/bin/prasco-boot-progress.sh

echo -e "${GREEN}✓${NC} Boot-Progress-Skript erstellt"

#===============================================================================
# Boot-Konfiguration anpassen
#===============================================================================

echo -e "${YELLOW}→${NC} Passe Boot-Konfiguration an..."

# Boot-Konfiguration
CONFIG_FILE="/boot/firmware/config.txt"
if [[ ! -f "$CONFIG_FILE" ]]; then
    CONFIG_FILE="/boot/config.txt"
fi

if [[ -f "$CONFIG_FILE" ]]; then
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup-$(date +%Y%m%d_%H%M%S)"
    
    if ! grep -q "disable_splash=0" "$CONFIG_FILE"; then
        echo "" >> "$CONFIG_FILE"
        echo "# PRASCO Splash Screen" >> "$CONFIG_FILE"
        echo "disable_splash=0" >> "$CONFIG_FILE"
    fi
fi

# Kernel-Parameter für stillen Boot
CMDLINE_FILE="/boot/firmware/cmdline.txt"
if [[ ! -f "$CMDLINE_FILE" ]]; then
    CMDLINE_FILE="/boot/cmdline.txt"
fi

if [[ -f "$CMDLINE_FILE" ]]; then
    cp "$CMDLINE_FILE" "${CMDLINE_FILE}.backup-$(date +%Y%m%d_%H%M%S)"
    
    if ! grep -q "quiet" "$CMDLINE_FILE"; then
        sed -i 's/$/ quiet splash loglevel=3 logo.nologo vt.global_cursor_default=0/' "$CMDLINE_FILE"
    fi
fi

echo -e "${GREEN}✓${NC} Boot-Konfiguration angepasst"

#===============================================================================
# Services aktivieren
#===============================================================================

echo -e "${YELLOW}→${NC} Aktiviere Services..."

systemctl daemon-reload
systemctl enable prasco-fb-splash.service
systemctl enable prasco-splash-progress.service

echo -e "${GREEN}✓${NC} Services aktiviert"

#===============================================================================
# Abschluss
#===============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Framebuffer Splash erfolgreich installiert!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Der PRASCO Framebuffer-Splash wird beim nächsten Neustart angezeigt."
echo ""
echo "Features:"
echo "  ✓ PRASCO-Logo direkt auf Framebuffer"
echo "  ✓ Automatisches Ausblenden wenn PRASCO bereit"
echo "  ✓ Stiller Boot (keine Kernel-Meldungen)"
echo "  ✓ Leichtgewichtig (fbi statt Plymouth)"
echo ""
echo "Logo-Dateien:"
echo "  - $SPLASH_DIR/prasco-splash-fb.png (1920x1080)"
echo "  - $SPLASH_DIR/prasco-splash-fb-720p.png (1280x720)"
echo ""
echo -e "${YELLOW}Starte neu mit:${NC} sudo reboot"
echo ""
