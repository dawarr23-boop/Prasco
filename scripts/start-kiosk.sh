#!/bin/bash
# PRASCO Digital Signage - Kiosk Mode Starter
# Wird automatisch beim Raspberry Pi Start ausgeführt

# Farben für Logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 PRASCO Kiosk-Modus wird gestartet...${NC}"

# Warte auf Netzwerk
sleep 10

# Display-Einstellungen
export DISPLAY=:0

# ============================================
# Display-Konfiguration laden
# ============================================
CONFIG_FILE="/etc/prasco/display-config.json"
DISPLAY_ID=""
SERVER_URL="https://localhost:3000"

if [ -f "$CONFIG_FILE" ]; then
  echo -e "${GREEN}✓ Lade Display-Konfiguration: $CONFIG_FILE${NC}"
  
  # JSON parsen (mit jq wenn verfügbar, sonst mit grep/sed)
  if command -v jq &> /dev/null; then
    DISPLAY_ID=$(jq -r '.displayId // empty' "$CONFIG_FILE" 2>/dev/null)
    SERVER_URL_CONFIG=$(jq -r '.serverUrl // empty' "$CONFIG_FILE" 2>/dev/null)
    DISPLAY_NAME=$(jq -r '.displayName // empty' "$CONFIG_FILE" 2>/dev/null)
    
    if [ -n "$SERVER_URL_CONFIG" ]; then
      SERVER_URL="$SERVER_URL_CONFIG"
    fi
  else
    # Fallback ohne jq
    DISPLAY_ID=$(grep -oP '"displayId"\s*:\s*"\K[^"]+' "$CONFIG_FILE" 2>/dev/null || echo "")
    SERVER_URL_CONFIG=$(grep -oP '"serverUrl"\s*:\s*"\K[^"]+' "$CONFIG_FILE" 2>/dev/null || echo "")
    DISPLAY_NAME=$(grep -oP '"displayName"\s*:\s*"\K[^"]+' "$CONFIG_FILE" 2>/dev/null || echo "")
    
    if [ -n "$SERVER_URL_CONFIG" ]; then
      SERVER_URL="$SERVER_URL_CONFIG"
    fi
  fi
  
  if [ -n "$DISPLAY_ID" ]; then
    echo -e "${GREEN}✓ Display-ID: $DISPLAY_ID${NC}"
    [ -n "$DISPLAY_NAME" ] && echo -e "${GREEN}✓ Display-Name: $DISPLAY_NAME${NC}"
  else
    echo -e "${YELLOW}⚠️  Keine Display-ID in Config gefunden${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Keine Display-Konfiguration gefunden: $CONFIG_FILE${NC}"
  echo -e "${YELLOW}   Verwende Standard-Modus (alle Posts)${NC}"
  echo -e "${BLUE}   Setup-Anleitung: sudo ~/Prasco/scripts/setup-display-config.sh${NC}"
fi

# Bildschirmschoner deaktivieren (optional, ignoriere Fehler)
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true
xset s noblank 2>/dev/null || true

# Mauszeiger verstecken mit unclutter
echo -e "${BLUE}🖱️  Verstecke Mauszeiger...${NC}"
# Beende alte unclutter Prozesse
pkill unclutter 2>/dev/null || true
sleep 0.5

# Starte unclutter neu
if command -v unclutter >/dev/null 2>&1; then
  DISPLAY=:0 unclutter -idle 0.1 -noevents -root &
  echo -e "${GREEN}✓ Unclutter gestartet${NC}"
else
  echo -e "${YELLOW}⚠️  unclutter nicht installiert - Mauszeiger bleibt sichtbar${NC}"
  echo -e "${BLUE}   Installation: sudo apt-get install unclutter${NC}"
fi

# Warte auf Server (HTTPS mit self-signed certificate)
echo "Warte auf PRASCO Server..."
# Prüfe sowohl HTTP als auch HTTPS
while ! (curl -s http://localhost:3000/api/health > /dev/null 2>&1 || curl -sk https://localhost:3000/api/health > /dev/null 2>&1); do
  echo "Server nicht erreichbar, warte..."
  sleep 2
done
echo "Server erreichbar!"

# Bestimme Protokoll (HTTPS bevorzugt wenn verfügbar)
if curl -sk https://localhost:3000/api/health > /dev/null 2>&1; then
  PROTOCOL="https"
  echo -e "${GREEN}✓ Verwende HTTPS${NC}"
else
  PROTOCOL="http"
  echo -e "${YELLOW}⚠️  Verwende HTTP (HTTPS nicht verfügbar)${NC}"
fi

# URL zusammenbauen
BASE_URL="${PROTOCOL}://localhost:3000/public/display.html"
if [ -n "$DISPLAY_ID" ]; then
  KIOSK_URL="${BASE_URL}?id=${DISPLAY_ID}"
  echo -e "${GREEN}✓ Öffne Display-spezifische URL: $KIOSK_URL${NC}"
else
  KIOSK_URL="${BASE_URL}"
  echo -e "${BLUE}ℹ️  Öffne Standard-URL (alle Posts): $KIOSK_URL${NC}"
fi

echo ""
echo -e "${GREEN}🌐 Starte Chromium im Kiosk-Modus...${NC}"
echo ""

# Chromium im Kiosk-Modus starten mit Autoplay-Unterstützung
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --start-fullscreen \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --ignore-certificate-errors \
  --disable-web-security \
  --allow-insecure-localhost \
  --force-device-scale-factor=1 \
  "$KIOSK_URL"

