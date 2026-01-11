#!/bin/bash
#
# PRASCO systemd Service Installer
# Richtet PRASCO als systemd Service ein
#

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO systemd Service Setup        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Fehler: Bitte als root ausführen (sudo)${NC}"
    exit 1
fi

PRASCO_DIR="/home/pi/Prasco"
SERVICE_FILE="/etc/systemd/system/prasco.service"

# Prüfe ob PRASCO installiert ist
if [ ! -d "$PRASCO_DIR" ]; then
    echo -e "${RED}Fehler: PRASCO nicht gefunden in $PRASCO_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}➜ Erstelle systemd Service...${NC}"

cat > $SERVICE_FILE << 'EOF'
[Unit]
Description=PRASCO Display Server
Documentation=https://github.com/dawarr23-boop/Prasco
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Prasco
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node /home/pi/Prasco/src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=prasco

[Install]
WantedBy=multi-user.target
EOF

echo -e "${YELLOW}➜ Lade systemd neu...${NC}"
systemctl daemon-reload

echo -e "${YELLOW}➜ Aktiviere PRASCO Service...${NC}"
systemctl enable prasco

echo -e "${YELLOW}➜ Starte PRASCO Service...${NC}"
systemctl start prasco

sleep 2

echo ""
echo -e "${YELLOW}➜ Service Status:${NC}"
systemctl status prasco --no-pager -l

echo ""
echo -e "${GREEN}✓ PRASCO systemd Service eingerichtet!${NC}"
echo ""
echo -e "${YELLOW}Befehle:${NC}"
echo "   Status:   sudo systemctl status prasco"
echo "   Starten:  sudo systemctl start prasco"
echo "   Stoppen:  sudo systemctl stop prasco"
echo "   Neustart: sudo systemctl restart prasco"
echo "   Logs:     sudo journalctl -u prasco -f"
echo ""
