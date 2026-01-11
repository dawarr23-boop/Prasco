#!/bin/bash
#
# PRASCO Boot Progress Setup
# Installiert Boot-Fortschrittsanzeige
#

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO Boot Progress Setup          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Fehler: Bitte als root ausführen${NC}"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}➜ Installiere Boot-Progress Script...${NC}"

# Kopiere Script
if [ -f "$SCRIPT_DIR/boot-progress.sh" ]; then
    cp "$SCRIPT_DIR/boot-progress.sh" /usr/local/bin/prasco-boot-progress
    chmod +x /usr/local/bin/prasco-boot-progress
    echo -e "${GREEN}  ✓ Script installiert${NC}"
else
    echo -e "${RED}  ✗ boot-progress.sh nicht gefunden${NC}"
    exit 1
fi

echo -e "${YELLOW}➜ Erstelle Systemd Service...${NC}"

cat > /etc/systemd/system/prasco-boot-progress.service << 'EOF'
[Unit]
Description=PRASCO Boot Progress Display
After=prasco-boot-menu.service
After=network-pre.target
Before=getty@tty1.service
DefaultDependencies=no

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-boot-progress
StandardInput=tty
StandardOutput=tty
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}  ✓ Service erstellt${NC}"

echo -e "${YELLOW}➜ Aktiviere Service...${NC}"
systemctl daemon-reload
systemctl enable prasco-boot-progress.service
echo -e "${GREEN}  ✓ Service aktiviert${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Boot Progress installiert         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Beim nächsten Boot wird ein Fortschrittsbalken angezeigt${NC}"
echo ""

# Test-Frage
read -p "Boot-Progress jetzt testen? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo ""
    /usr/local/bin/prasco-boot-progress
fi

echo ""
exit 0
