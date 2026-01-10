# PRASCO Raspberry Pi Offline-Modus mit WiFi Hotspot

Anleitung zur Konfiguration des Raspberry Pi als eigenständiger WiFi Access Point für PRASCO, ohne externe Netzwerkanbindung.

## 📡 Übersicht

Der Offline-Modus ermöglicht:
- ✅ Raspberry Pi als WiFi Access Point (Hotspot)
- ✅ PRASCO läuft komplett lokal ohne Internet
- ✅ Admin-Panel über WiFi erreichbar
- ✅ Mehrere Geräte können sich verbinden (PC, Tablet, Smartphone)
- ✅ Ideal für mobile Events, Outdoor-Displays, Demo-Zwecke
- ✅ Kein externes Netzwerk oder Router erforderlich

## 🎯 Anwendungsfälle

- **Mobile Events**: Messen, Konferenzen, Veranstaltungen ohne vorhandenes WLAN
- **Outdoor-Displays**: Parks, Baustellen, temporäre Installationen
- **Demo-Modus**: Präsentationen ohne Internet-Abhängigkeit
- **Remote Locations**: Standorte ohne Netzwerkinfrastruktur
- **Backup-Lösung**: Bei Ausfall der Hauptnetzwerk-Infrastruktur
- **Entwicklung/Testing**: Isolierte Test-Umgebung

## 🏗️ Architektur

```
┌─────────────────────────────────────────┐
│         Raspberry Pi 4                  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   PRASCO Server (Node.js)        │  │
│  │   Port 3000                      │  │
│  │   • Display Frontend             │  │
│  │   • Admin Panel                  │  │
│  │   • API Endpoints                │  │
│  │   • SQLite Datenbank             │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   WiFi Hotspot (hostapd)         │  │
│  │   SSID: PRASCO-Display           │  │
│  │   IP: 192.168.4.1                │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   DHCP Server (dnsmasq)          │  │
│  │   Range: 192.168.4.10-50         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
           │
           │ WiFi 
           ├──────────── 💻 PC/Laptop
           ├──────────── 📱 Smartphone
           └──────────── 📱 Tablet
```

## 🚀 Schnellinstallation (Automatisches Script)

### Schritt 1: Auto-Setup Script herunterladen

```bash
# Via curl
curl -sSL https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/setup-hotspot.sh | sudo bash

# Oder manuell:
cd /home/pi
wget https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/setup-hotspot.sh
chmod +x setup-hotspot.sh
sudo ./setup-hotspot.sh
```

### Schritt 2: Neustart

```bash
sudo reboot
```

Nach dem Neustart:
- WiFi Hotspot ist aktiv: **PRASCO-Display**
- Passwort: **prasco123**
- PRASCO erreichbar unter: **http://192.168.4.1:3000**

---

## 📝 Manuelle Installation (Schritt für Schritt)

### Voraussetzungen

- Raspberry Pi 3B+ oder neuer (mit integriertem WiFi)
- Raspberry Pi OS (Bullseye oder neuer)
- PRASCO bereits installiert
- Root-Zugriff (sudo)

### Schritt 1: Pakete installieren

```bash
# System aktualisieren
sudo apt update
sudo apt upgrade -y

# Benötigte Pakete installieren
sudo apt install -y hostapd dnsmasq iptables-persistent

# Services vorerst stoppen
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq
```

### Schritt 2: Statische IP für WiFi-Interface konfigurieren

```bash
# dhcpcd.conf bearbeiten
sudo nano /etc/dhcpcd.conf
```

Am Ende der Datei hinzufügen:

```conf
# PRASCO Hotspot Konfiguration
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
```

Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

### Schritt 3: DHCP Server (dnsmasq) konfigurieren

Backup der Original-Konfiguration:

```bash
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
```

Neue Konfiguration erstellen:

```bash
sudo nano /etc/dnsmasq.conf
```

Folgende Konfiguration einfügen:

```conf
# PRASCO WiFi Hotspot - DHCP Konfiguration

# Interface
interface=wlan0

# DHCP-Server aktivieren
dhcp-range=192.168.4.10,192.168.4.50,255.255.255.0,24h

# DNS
# Google DNS als Fallback (wenn später Internet-Zugang gewünscht)
server=8.8.8.8
server=8.8.4.4

# Domain
domain=prasco.local

# Logging (optional)
log-queries
log-dhcp

# Lokale Domain-Namen
address=/prasco.local/192.168.4.1
address=/admin.prasco.local/192.168.4.1
address=/display.prasco.local/192.168.4.1
```

Speichern und schließen.

### Schritt 4: WiFi Access Point (hostapd) konfigurieren

```bash
sudo nano /etc/hostapd/hostapd.conf
```

Folgende Konfiguration einfügen:

```conf
# PRASCO WiFi Hotspot Konfiguration

# Interface und Driver
interface=wlan0
driver=nl80211

# SSID und Hotspot-Name
ssid=PRASCO-Display

# WiFi-Modus (g = 2.4GHz)
hw_mode=g

# Kanal (1-13, empfohlen: 6 oder 11)
channel=6

# Maximale Anzahl Verbindungen
max_num_sta=10

# WMM aktivieren (Quality of Service)
wmm_enabled=1

# WiFi Security - WPA2
auth_algs=1
wpa=2
wpa_passphrase=prasco123
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP

# Verstecktes Netzwerk (0 = sichtbar, 1 = versteckt)
ignore_broadcast_ssid=0

# Country Code (Deutschland)
country_code=DE

# IEEE 802.11n (für bessere Performance)
ieee80211n=1
ht_capab=[HT40+][SHORT-GI-20][SHORT-GI-40][DSSS_CCK-40]

# Optional: 5GHz aktivieren (nur Pi 3B+, Pi 4)
# hw_mode=a
# channel=36
# ieee80211ac=1
```

**Wichtig:** Passe `wpa_passphrase` an (mindestens 8 Zeichen)!

Speichern und schließen.

hostapd-Konfiguration aktivieren:

```bash
sudo nano /etc/default/hostapd
```

Diese Zeile hinzufügen/ändern:

```conf
DAEMON_CONF="/etc/hostapd/hostapd.conf"
```

Speichern und schließen.

### Schritt 5: IP-Forwarding aktivieren (optional)

Nur nötig wenn später Internet-Zugang über Ethernet gewünscht:

```bash
sudo nano /etc/sysctl.conf
```

Diese Zeile auskommentieren (# entfernen):

```conf
net.ipv4.ip_forward=1
```

Speichern und Änderung aktivieren:

```bash
sudo sysctl -p
```

### Schritt 6: iptables Regeln (optional)

Nur für Internet-Zugang über Ethernet → WiFi:

```bash
# NAT aktivieren
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT

# Regeln permanent speichern
sudo netfilter-persistent save
```

### Schritt 7: Services aktivieren und starten

```bash
# Services beim Boot aktivieren
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq

# dhcpcd neu starten
sudo systemctl restart dhcpcd

# Services starten
sudo systemctl start hostapd
sudo systemctl start dnsmasq

# Status prüfen
sudo systemctl status hostapd
sudo systemctl status dnsmasq
```

### Schritt 8: PRASCO auf alle Interfaces binden

PRASCO sollte auf alle Netzwerk-Interfaces lauschen:

```bash
nano /home/pi/Prasco/.env
```

Stelle sicher, dass folgende Einstellung vorhanden ist:

```env
# Server auf allen Interfaces
HOST=0.0.0.0
PORT=3000
```

PRASCO neu starten:

```bash
pm2 restart prasco
# oder
sudo systemctl restart prasco
```

### Schritt 9: Neustart und Test

```bash
sudo reboot
```

Nach dem Neustart:

1. **WiFi-Netzwerk suchen** auf PC/Smartphone
2. **Verbinden mit:** `PRASCO-Display`
3. **Passwort:** `prasco123`
4. **Browser öffnen:**
   - Display: `http://192.168.4.1:3000`
   - Admin: `http://192.168.4.1:3000/admin`
   - Oder: `http://prasco.local:3000`

---

## 🔧 Auto-Setup Script

Erstelle ein automatisches Setup-Script für einfache Installation:

```bash
sudo nano /home/pi/Prasco/scripts/setup-hotspot.sh
```

Script-Inhalt:

```bash
#!/bin/bash
#
# PRASCO WiFi Hotspot Auto-Setup
# Konfiguriert Raspberry Pi als WiFi Access Point für PRASCO
#

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PRASCO WiFi Hotspot Setup           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Fehler: Bitte als root ausführen (sudo)${NC}"
    exit 1
fi

# Konfiguration
SSID="PRASCO-Display"
PASSWORD="prasco123"
HOTSPOT_IP="192.168.4.1"
DHCP_START="192.168.4.10"
DHCP_END="192.168.4.50"

echo -e "${YELLOW}➜ Konfiguration:${NC}"
echo "   SSID: $SSID"
echo "   Passwort: $PASSWORD"
echo "   IP-Adresse: $HOTSPOT_IP"
echo ""

read -p "Fortfahren? (j/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
    echo "Abgebrochen."
    exit 1
fi

echo -e "${YELLOW}➜ Installiere Pakete...${NC}"
apt update
apt install -y hostapd dnsmasq iptables-persistent

echo -e "${YELLOW}➜ Stoppe Services...${NC}"
systemctl stop hostapd
systemctl stop dnsmasq

echo -e "${YELLOW}➜ Konfiguriere statische IP...${NC}"
cat >> /etc/dhcpcd.conf << EOF

# PRASCO Hotspot Konfiguration
interface wlan0
    static ip_address=${HOTSPOT_IP}/24
    nohook wpa_supplicant
EOF

echo -e "${YELLOW}➜ Konfiguriere DHCP-Server...${NC}"
mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig 2>/dev/null || true
cat > /etc/dnsmasq.conf << EOF
interface=wlan0
dhcp-range=${DHCP_START},${DHCP_END},255.255.255.0,24h
server=8.8.8.8
server=8.8.4.4
domain=prasco.local
address=/prasco.local/${HOTSPOT_IP}
address=/admin.prasco.local/${HOTSPOT_IP}
EOF

echo -e "${YELLOW}➜ Konfiguriere WiFi Access Point...${NC}"
cat > /etc/hostapd/hostapd.conf << EOF
interface=wlan0
driver=nl80211
ssid=${SSID}
hw_mode=g
channel=6
max_num_sta=10
wmm_enabled=1
auth_algs=1
wpa=2
wpa_passphrase=${PASSWORD}
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
country_code=DE
ieee80211n=1
ht_capab=[HT40+][SHORT-GI-20][SHORT-GI-40]
EOF

echo -e "${YELLOW}➜ Aktiviere hostapd...${NC}"
sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd

echo -e "${YELLOW}➜ Aktiviere Services...${NC}"
systemctl unmask hostapd
systemctl enable hostapd
systemctl enable dnsmasq

echo ""
echo -e "${GREEN}✓ Hotspot erfolgreich konfiguriert!${NC}"
echo ""
echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. Neustart: sudo reboot"
echo "2. Verbinde mit WiFi: $SSID (Passwort: $PASSWORD)"
echo "3. Öffne Browser: http://${HOTSPOT_IP}:3000"
echo ""
echo -e "${YELLOW}Admin-Zugriff:${NC}"
echo "   URL: http://${HOTSPOT_IP}:3000/admin"
echo "   User: admin"
echo "   Pass: admin"
echo ""

read -p "Jetzt neustarten? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo "Starte neu..."
    reboot
fi
```

Ausführbar machen:

```bash
chmod +x /home/pi/Prasco/scripts/setup-hotspot.sh
```

Ausführen:

```bash
sudo /home/pi/Prasco/scripts/setup-hotspot.sh
```

---

## 🔄 Dual-Mode: Hotspot + Client

Raspberry Pi kann gleichzeitig Hotspot UND mit anderem WLAN verbunden sein (für Internet-Zugang):

### Voraussetzung
- Raspberry Pi 3B+ oder Pi 4 (beide WiFi-Chips)
- Oder: USB-WiFi-Adapter

### Konfiguration

```bash
# wlan0 = Hotspot
# wlan1 = Client (USB WiFi Adapter)

sudo nano /etc/dhcpcd.conf
```

Hinzufügen:

```conf
# wlan0 = Hotspot
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant

# wlan1 = Internet-Verbindung
interface wlan1
    # DHCP vom Router
```

WiFi-Verbindung auf wlan1 einrichten:

```bash
sudo nmcli dev wifi connect "DeinWLAN" password "DeinPasswort" ifname wlan1
```

---

## 📱 Verbinden und Nutzen

### Von PC/Laptop

1. **WiFi-Einstellungen öffnen**
2. **Netzwerk wählen:** `PRASCO-Display`
3. **Passwort eingeben:** `prasco123`
4. **Browser öffnen:**
   - Display: http://192.168.4.1:3000
   - Admin: http://192.168.4.1:3000/admin

### Von Smartphone/Tablet

1. **Einstellungen → WLAN**
2. **Verbinden mit:** `PRASCO-Display`
3. **Passwort:** `prasco123`
4. **Browser-App öffnen**
5. **URL:** http://192.168.4.1:3000

### Lokale Domain-Namen (optional)

```bash
# Funktioniert nach DNS-Konfiguration:
http://prasco.local:3000
http://display.prasco.local:3000
http://admin.prasco.local:3000
```

---

## 🔒 Sicherheit

### Sicheres Passwort setzen

```bash
sudo nano /etc/hostapd/hostapd.conf
```

Ändern:

```conf
wpa_passphrase=IhrSicheresPasswort123!
```

Mindestens 12 Zeichen, mit Sonderzeichen!

### SSID verstecken (optional)

```conf
ignore_broadcast_ssid=1
```

Clients müssen dann SSID manuell eingeben.

### MAC-Adress-Filter (optional)

Nur bestimmte Geräte erlauben:

```conf
macaddr_acl=1
accept_mac_file=/etc/hostapd/hostapd.accept
```

Datei erstellen:

```bash
sudo nano /etc/hostapd/hostapd.accept
```

MAC-Adressen eintragen (eine pro Zeile):

```
aa:bb:cc:dd:ee:ff
11:22:33:44:55:66
```

### Firewall konfigurieren

```bash
# Installieren
sudo apt install ufw

# Nur lokales Netzwerk erlauben
sudo ufw allow from 192.168.4.0/24 to any port 3000
sudo ufw enable
```

---

## 🧪 Troubleshooting

### Problem: Hotspot startet nicht

**Diagnose:**

```bash
sudo systemctl status hostapd
sudo journalctl -u hostapd -n 50
```

**Häufige Ursachen:**

1. **WiFi-Interface bereits belegt:**
   ```bash
   sudo rfkill unblock wifi
   sudo systemctl restart hostapd
   ```

2. **Falsche Konfiguration:**
   ```bash
   # Testen:
   sudo hostapd -d /etc/hostapd/hostapd.conf
   # Ctrl+C zum Beenden
   ```

3. **wpa_supplicant stört:**
   ```bash
   sudo systemctl disable wpa_supplicant
   sudo reboot
   ```

### Problem: Clients können sich nicht verbinden

**Prüfen:**

```bash
# DHCP-Server läuft?
sudo systemctl status dnsmasq

# Logs prüfen
sudo tail -f /var/log/syslog | grep dnsmasq
```

**Fix:**

```bash
sudo systemctl restart dnsmasq
```

### Problem: Keine Internet-Verbindung auf Clients

**IP-Forwarding prüfen:**

```bash
cat /proc/sys/net/ipv4/ip_forward
# Sollte "1" sein
```

**iptables prüfen:**

```bash
sudo iptables -L -v -n
sudo iptables -t nat -L -v -n
```

### Problem: PRASCO nicht erreichbar

**Server läuft?**

```bash
pm2 status
# oder
sudo systemctl status prasco
```

**Port prüfen:**

```bash
sudo netstat -tlnp | grep 3000
```

**Firewall prüfen:**

```bash
sudo ufw status
```

---

## 📊 Performance

**Empfohlene Hardware:**
- Raspberry Pi 4 (4GB): Optimal für 10+ Clients
- Raspberry Pi 3B+: Gut für 5-10 Clients
- Raspberry Pi Zero W: Nur für 1-3 Clients

**Gleichzeitige Verbindungen:**
- 2.4 GHz WiFi: Bis zu 10 Clients
- Mit USB-WiFi-Adapter: Bis zu 20 Clients

**Reichweite:**
- Indoor: ~15-20 Meter
- Outdoor: ~30-50 Meter
- Mit externer Antenne: >50 Meter

---

## 🎯 Anwendungsbeispiel: Mobile Messe

**Szenario:**
Event ohne WLAN, Display auf Rollständer

**Setup:**

1. **Hardware:**
   - Raspberry Pi 4 + Powerbank
   - Portable Monitor (USB-C)
   - Optional: USB-WiFi für bessere Reichweite

2. **Vorbereitung:**
   ```bash
   # Hotspot-Mode aktivieren
   sudo /home/pi/Prasco/scripts/setup-hotspot.sh
   ```

3. **Vor Ort:**
   - Pi einschalten (automatischer Start)
   - Display zeigt Inhalte
   - Mitarbeiter verbinden sich per WiFi
   - Admin-Panel für Live-Updates

**Vorteile:**
- Keine Abhängigkeit von Veranstaltungs-WLAN
- Mobile Content-Verwaltung
- Schnelles Setup (<5 Min)

---

## 📚 Erweiterte Konfiguration

### 5GHz WiFi aktivieren (Pi 3B+, Pi 4)

```conf
# In /etc/hostapd/hostapd.conf
hw_mode=a
channel=36
ieee80211ac=1
vht_capab=[MAX-MPDU-11454][SHORT-GI-80][TX-STBC-2BY1][RX-STBC-1]
```

**Vorteile:**
- Weniger Störungen
- Höhere Geschwindigkeit
- Kürzere Reichweite

### Captive Portal (optional)

Automatische Weiterleitung zu PRASCO:

```bash
sudo apt install nodogsplash
```

Konfiguration folgt...

### Bandwidth Management

Geschwindigkeit pro Client limitieren:

```bash
sudo apt install wondershaper
sudo wondershaper wlan0 10000 10000  # 10 Mbps
```

---

## 🔄 Wartung

### Hotspot-Status prüfen

```bash
# Schnell-Check
./scripts/health-check.sh

# Detailliert
sudo systemctl status hostapd dnsmasq
```

### Logs anzeigen

```bash
# Hotspot
sudo journalctl -u hostapd -f

# DHCP
sudo journalctl -u dnsmasq -f

# Kombiniert
sudo tail -f /var/log/syslog
```

### Verbundene Clients anzeigen

```bash
# Aktive DHCP-Leases
cat /var/lib/misc/dnsmasq.leases

# Aktive Verbindungen
iw dev wlan0 station dump
```

---

## 📖 Zusammenfassung

**✅ Nach Installation:**
- WiFi Hotspot: `PRASCO-Display`
- Passwort: `prasco123`
- PRASCO URL: `http://192.168.4.1:3000`
- Admin URL: `http://192.168.4.1:3000/admin`

**🎯 Perfekt für:**
- Mobile Displays
- Events ohne WLAN
- Demo-Präsentationen
- Outdoor-Installationen
- Backup-Lösung

**⚡ Setup-Zeit:**
- Automatisch: 5 Minuten + Neustart
- Manuell: 15-20 Minuten

---

**Bei Fragen:** Öffne ein Issue auf GitHub oder siehe [RASPBERRY-PI-SETUP.md](RASPBERRY-PI-SETUP.md)
