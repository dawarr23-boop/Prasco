#!/bin/bash
# PRASCO Display Configuration Setup
# Erstellt initiale Display-Konfiguration für Raspberry Pi

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PRASCO Display Configuration Setup   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Prüfe Root-Rechte für /etc Zugriff
if [ "$EUID" -ne 0 ]; then 
  echo -e "${YELLOW}⚠️  Dieses Script benötigt Root-Rechte für /etc Zugriff${NC}"
  echo "Führe Script mit sudo aus: sudo ./setup-display-config.sh"
  exit 1
fi

# Konfigurationsverzeichnis erstellen
CONFIG_DIR="/etc/prasco"
CONFIG_FILE="$CONFIG_DIR/display-config.json"

echo -e "${BLUE}📁 Erstelle Konfigurationsverzeichnis...${NC}"
mkdir -p "$CONFIG_DIR"
chmod 755 "$CONFIG_DIR"

# Prüfe ob Config bereits existiert
if [ -f "$CONFIG_FILE" ]; then
  echo -e "${YELLOW}⚠️  Konfigurationsdatei existiert bereits: $CONFIG_FILE${NC}"
  echo ""
  cat "$CONFIG_FILE"
  echo ""
  read -p "Möchten Sie die Config neu erstellen? (j/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Jj]$ ]]; then
    echo -e "${BLUE}✓ Setup abgebrochen${NC}"
    exit 0
  fi
fi

# Interaktive Konfiguration
echo ""
echo -e "${GREEN}Bitte geben Sie die Display-Informationen ein:${NC}"
echo ""

# Display-ID eingeben
read -p "Display-Identifier (z.B. empfang, raum-1): " DISPLAY_ID
if [ -z "$DISPLAY_ID" ]; then
  echo -e "${RED}✗ Display-ID ist erforderlich!${NC}"
  exit 1
fi

# Display-Name eingeben
read -p "Display-Name (z.B. Empfangsbereich): " DISPLAY_NAME
if [ -z "$DISPLAY_NAME" ]; then
  DISPLAY_NAME="$DISPLAY_ID"
fi

# Auto-Start
read -p "Kiosk-Modus automatisch starten? (j/n, Standard: j): " -n 1 -r AUTO_START
echo ""
if [[ $AUTO_START =~ ^[Nn]$ ]]; then
  AUTO_START="false"
else
  AUTO_START="true"
fi

# Server-URL
read -p "Server-URL (Standard: https://localhost:3000): " SERVER_URL
if [ -z "$SERVER_URL" ]; then
  SERVER_URL="https://localhost:3000"
fi

# JSON-Config erstellen
echo ""
echo -e "${BLUE}💾 Erstelle Konfigurationsdatei...${NC}"
cat > "$CONFIG_FILE" <<EOF
{
  "displayId": "$DISPLAY_ID",
  "displayName": "$DISPLAY_NAME",
  "autoStart": $AUTO_START,
  "serverUrl": "$SERVER_URL",
  "configVersion": "1.0",
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

chmod 644 "$CONFIG_FILE"

# Ausgabe der Config
echo -e "${GREEN}✓ Konfiguration erfolgreich erstellt!${NC}"
echo ""
echo -e "${BLUE}═══ Konfiguration ═══${NC}"
cat "$CONFIG_FILE"
echo ""

# Validierung
echo -e "${BLUE}🔍 Validiere Konfiguration...${NC}"
if command -v jq &> /dev/null; then
  if jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ JSON ist valide${NC}"
  else
    echo -e "${RED}✗ JSON ist invalide!${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  jq nicht installiert, überspringe JSON-Validierung${NC}"
fi

# Display im Backend prüfen
echo ""
echo -e "${BLUE}🔍 Prüfe ob Display im Backend existiert...${NC}"
API_URL="$SERVER_URL/api/displays/by-identifier/$DISPLAY_ID"

if curl -sk "$API_URL" 2>/dev/null | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Display '$DISPLAY_ID' existiert im Backend${NC}"
else
  echo -e "${YELLOW}⚠️  Display '$DISPLAY_ID' wurde nicht im Backend gefunden${NC}"
  echo "Bitte erstellen Sie das Display im Admin-Panel:"
  echo "  $SERVER_URL/admin"
  echo ""
fi

# Autostart-Info
if [ "$AUTO_START" = "true" ]; then
  echo ""
  echo -e "${GREEN}🚀 Kiosk-Modus wird automatisch beim Boot starten${NC}"
  echo "Das Display wird folgende URL öffnen:"
  echo "  $SERVER_URL/public/display.html?id=$DISPLAY_ID"
  echo ""
  echo "Um den Kiosk-Modus manuell neu zu starten:"
  echo "  bash ~/Prasco/scripts/start-kiosk.sh"
fi

# Abschluss
echo ""
echo -e "${GREEN}╔═══════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup erfolgreich abgeschlossen! ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════╝${NC}"
echo ""
echo "Konfigurationsdatei: $CONFIG_FILE"
echo ""
echo "Nächste Schritte:"
echo "  1. Raspberry Pi neu starten: sudo reboot"
echo "  2. Oder Kiosk-Modus manuell starten: bash ~/Prasco/scripts/start-kiosk.sh"
echo ""
