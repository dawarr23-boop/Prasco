#!/bin/bash

###############################################################################
# PRASCO Mode Switcher GUI - Installer
# Installiert grafische Modus-Wechsel-Anwendung
###############################################################################

set -e

echo "╔════════════════════════════════════════╗"
echo "║   PRASCO Mode Switcher GUI Setup     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Installiere zenity falls nicht vorhanden
echo "➜ Prüfe Abhängigkeiten..."
if ! command -v zenity &> /dev/null; then
    echo "  Installiere zenity..."
    sudo apt-get update -qq
    sudo apt-get install -y zenity
    echo "  ✓ zenity installiert"
else
    echo "  ✓ zenity bereits installiert"
fi

# Installiere GUI-Script
echo "➜ Installiere GUI-Script..."
sudo cp prasco-mode-gui.sh /usr/local/bin/prasco-mode-gui
sudo chmod +x /usr/local/bin/prasco-mode-gui
echo "  ✓ Script installiert"

# Erstelle Desktop-Icon
echo "➜ Erstelle Desktop-Verknüpfung..."
mkdir -p /home/pi/Desktop
sudo cp prasco-mode.desktop /home/pi/Desktop/
sudo chmod +x /home/pi/Desktop/prasco-mode.desktop
chown pi:pi /home/pi/Desktop/prasco-mode.desktop

# Auch im Anwendungsmenü verfügbar machen
sudo cp prasco-mode.desktop /usr/share/applications/
echo "  ✓ Desktop-Icon erstellt"

# Erstelle sudo-Regel für passwortlosen Modus-Wechsel
echo "➜ Konfiguriere sudo-Rechte..."
sudo tee /etc/sudoers.d/prasco-mode > /dev/null << 'EOF'
# Allow pi user to change PRASCO mode without password
pi ALL=(ALL) NOPASSWD: /usr/local/bin/prasco-mode-gui
pi ALL=(ALL) NOPASSWD: /usr/local/bin/prasco-mode
pi ALL=(ALL) NOPASSWD: /bin/systemctl enable hostapd
pi ALL=(ALL) NOPASSWD: /bin/systemctl disable hostapd
pi ALL=(ALL) NOPASSWD: /bin/systemctl start hostapd
pi ALL=(ALL) NOPASSWD: /bin/systemctl stop hostapd
pi ALL=(ALL) NOPASSWD: /bin/systemctl enable dnsmasq
pi ALL=(ALL) NOPASSWD: /bin/systemctl disable dnsmasq
pi ALL=(ALL) NOPASSWD: /bin/systemctl start dnsmasq
pi ALL=(ALL) NOPASSWD: /bin/systemctl stop dnsmasq
pi ALL=(ALL) NOPASSWD: /bin/systemctl restart dhcpcd
pi ALL=(ALL) NOPASSWD: /usr/bin/sed -i * /etc/dhcpcd.conf
pi ALL=(ALL) NOPASSWD: /usr/bin/tee -a /etc/dhcpcd.conf
pi ALL=(ALL) NOPASSWD: /usr/bin/tee /etc/prasco/boot-mode
EOF
sudo chmod 440 /etc/sudoers.d/prasco-mode
echo "  ✓ sudo-Rechte konfiguriert"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✓ Mode Switcher GUI installiert    ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Desktop-Icon: ~/Desktop/prasco-mode.desktop"
echo "Kommando:     prasco-mode-gui"
echo ""
