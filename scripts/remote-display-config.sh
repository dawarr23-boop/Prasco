#!/bin/bash
# PRASCO Remote Display Configuration Update
# Aktualisiert Display-Konfiguration auf einem Raspberry Pi via SSH

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Header
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PRASCO Remote Display Configuration  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Parameter prüfen
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <pi-hostname-or-ip> <display-id> [display-name] [server-url]"
  echo ""
  echo "Beispiele:"
  echo "  $0 192.168.2.173 empfang \"Empfangsbereich\""
  echo "  $0 pi-display-1 raum-1 \"Raum 1\" https://192.168.2.100:3000"
  echo ""
  exit 1
fi

PI_HOST="$1"
DISPLAY_ID="$2"
DISPLAY_NAME="${3:-$DISPLAY_ID}"
SERVER_URL="${4:-https://localhost:3000}"

echo -e "${BLUE}🎯 Ziel-Pi:${NC} $PI_HOST"
echo -e "${BLUE}📺 Display-ID:${NC} $DISPLAY_ID"
echo -e "${BLUE}📝 Display-Name:${NC} $DISPLAY_NAME"
echo -e "${BLUE}🌐 Server-URL:${NC} $SERVER_URL"
echo ""

# SSH-Verbindung testen
echo -e "${BLUE}🔌 Teste SSH-Verbindung...${NC}"
if ! ssh -o ConnectTimeout=5 "$PI_HOST" "exit" 2>/dev/null; then
  echo -e "${RED}✗ SSH-Verbindung zu $PI_HOST fehlgeschlagen${NC}"
  echo "Stellen Sie sicher, dass:"
  echo "  - Der Pi erreichbar ist"
  echo "  - SSH aktiviert ist"
  echo "  - Ihre SSH-Keys konfiguriert sind"
  exit 1
fi
echo -e "${GREEN}✓ SSH-Verbindung erfolgreich${NC}"
echo ""

# Config-JSON erstellen
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CONFIG_JSON=$(cat <<EOF
{
  "displayId": "$DISPLAY_ID",
  "displayName": "$DISPLAY_NAME",
  "autoStart": true,
  "serverUrl": "$SERVER_URL",
  "configVersion": "1.0",
  "lastUpdated": "$TIMESTAMP"
}
EOF
)

echo -e "${BLUE}💾 Neue Konfiguration:${NC}"
echo "$CONFIG_JSON"
echo ""

# Bestätigung
read -p "Konfiguration auf $PI_HOST anwenden? (j/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Jj]$ ]]; then
  echo -e "${YELLOW}⚠️  Abgebrochen${NC}"
  exit 0
fi

# Config auf Pi erstellen
echo -e "${BLUE}📤 Übertrage Konfiguration...${NC}"
ssh "$PI_HOST" "sudo mkdir -p /etc/prasco && echo '$CONFIG_JSON' | sudo tee /etc/prasco/display-config.json > /dev/null"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Konfiguration erfolgreich übertragen${NC}"
else
  echo -e "${RED}✗ Fehler beim Übertragen der Konfiguration${NC}"
  exit 1
fi

# Permissions setzen
echo -e "${BLUE}🔒 Setze Dateiberechtigungen...${NC}"
ssh "$PI_HOST" "sudo chmod 644 /etc/prasco/display-config.json"
echo -e "${GREEN}✓ Berechtigungen gesetzt${NC}"

# Config anzeigen
echo ""
echo -e "${BLUE}📄 Gespeicherte Konfiguration auf Pi:${NC}"
ssh "$PI_HOST" "sudo cat /etc/prasco/display-config.json"
echo ""

# Kiosk-Neustart anbieten
read -p "Kiosk-Modus jetzt neu starten? (j/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Jj]$ ]]; then
  echo -e "${BLUE}🔄 Starte Kiosk-Modus neu...${NC}"
  
  # Chromium beenden
  ssh "$PI_HOST" "pkill chromium || true" 2>/dev/null
  sleep 2
  
  # Kiosk-Modus starten
  ssh "$PI_HOST" "DISPLAY=:0 nohup bash ~/Prasco/scripts/start-kiosk.sh > /dev/null 2>&1 &"
  
  echo -e "${GREEN}✓ Kiosk-Modus wurde neu gestartet${NC}"
  echo -e "${BLUE}ℹ️  Der Pi öffnet jetzt: $SERVER_URL/public/display.html?id=$DISPLAY_ID${NC}"
else
  echo -e "${YELLOW}⚠️  Kiosk-Modus wurde nicht neu gestartet${NC}"
  echo "Manueller Neustart:"
  echo "  ssh $PI_HOST 'bash ~/Prasco/scripts/start-kiosk.sh'"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Konfiguration abgeschlossen!     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════╝${NC}"
echo ""
