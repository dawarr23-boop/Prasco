# ✅ PRASCO Raspberry Pi - Vollständige Offline-Mode Implementation mit Boot-Menü

## 🎯 Übersicht

Die vollständige Implementierung kombiniert drei Hauptkomponenten:

1. **WiFi Hotspot (Offline-Mode)** - Eigenständiger WiFi Access Point
2. **systemd Service** - PRASCO als System-Service
3. **Boot-Menü** - Interaktive Modus-Auswahl beim Booten

## 🏗️ Gesamtarchitektur

```
┌────────────────────────────────────────────────┐
│           Raspberry Pi Boot Sequence           │
└────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────┐
│          🍓 PRASCO Boot-Menü (10s)             │
│  ┌──────────────────────────────────────────┐  │
│  │  1) Normal-Modus                         │  │
│  │  2) Hotspot-Modus (Offline) ←─ Wählen   │  │
│  │  3) Modus ändern                         │  │
│  │  4) Beenden                              │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                      ↓
          ┌───────────┴───────────┐
          ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│  Normal-Modus    │    │  Hotspot-Modus   │
│                  │    │                  │
│  • Netzwerk-     │    │  • WiFi Hotspot  │
│    Verbindung    │    │  • 192.168.4.1   │
│  • Internet      │    │  • Offline       │
│  • DHCP          │    │  • DHCP Server   │
└──────────────────┘    └──────────────────┘
          ↓                       ↓
┌────────────────────────────────────────────────┐
│       PRASCO Server (systemd Service)          │
│  • Node.js + SQLite                            │
│  • Port 3000                                   │
│  • Autostart                                   │
│  • Auto-Restart bei Crash                      │
└────────────────────────────────────────────────┘
```

## 📦 Komponenten-Übersicht

### 1. WiFi Hotspot (Offline-Mode)

**Scripts:**
- `setup-hotspot.sh` - Automatische Installation
- `hotspot-status.sh` - Status-Übersicht
- `hotspot-restart.sh` - Service-Neustart
- `hotspot-disable.sh` - Deaktivierung
- `health-check.sh` - System-Check

**Services:**
- `hostapd` - WiFi Access Point
- `dnsmasq` - DHCP + DNS Server

**Konfiguration:**
- SSID: `PRASCO-Display`
- Passwort: `prasco123`
- IP: `192.168.4.1`
- DHCP: `192.168.4.10-50`

### 2. systemd Service

**Script:**
- `install-service.sh` - Service-Installation

**Service:**
- `prasco.service` - PRASCO als System-Service

**Features:**
- Autostart beim Boot
- Automatischer Neustart bei Crash
- Syslog-Integration
- Läuft als User `pi`

### 3. Boot-Menü

**Scripts:**
- `setup-boot-menu.sh` - Menü-Installation
- `boot-mode-selector.sh` - Interaktives Menü

**Service:**
- `prasco-boot-menu.service` - Menü beim Boot

**Befehle:**
- `prasco-mode` - Menü manuell öffnen
- `prasco-status` - Aktuellen Modus anzeigen

**Features:**
- 10 Sekunden Timeout
- Permanente Modus-Speicherung
- Interaktive Auswahl
- Headless-kompatibel

## 🚀 Vollständige Installation

### Option 1: Schnellinstallation mit Makefile

```bash
# Repository klonen (falls noch nicht vorhanden)
cd /home/pi
git clone https://github.com/dawarr23-boop/Prasco.git
cd Prasco

# Scripts ausführbar machen
chmod +x scripts/*.sh

# Vollständige Installation (Hotspot + Service + Boot-Menü)
sudo make install

# Neustart
sudo reboot
```

### Option 2: Manuelle Installation (Schritt für Schritt)

```bash
cd /home/pi/Prasco

# 1. WiFi Hotspot einrichten
sudo ./scripts/setup-hotspot.sh

# 2. systemd Service installieren
sudo ./scripts/install-service.sh

# 3. Boot-Menü installieren
sudo ./scripts/setup-boot-menu.sh

# 4. Neustart
sudo reboot
```

### Option 3: Direkt von GitHub

```bash
# Hotspot
curl -sSL https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/setup-hotspot.sh | sudo bash

# Boot-Menü
curl -sSL https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/setup-boot-menu.sh | sudo bash

sudo reboot
```

## 🎮 Verwendung nach Installation

### Beim Booten

```
╔════════════════════════════════════════════════╗
║          🍓 PRASCO Boot Modus Auswahl         ║
╚════════════════════════════════════════════════╝

Wähle den Boot-Modus für PRASCO:

  1) Normal-Modus (Standard)
  2) Hotspot-Modus (Offline)
  3) Aktuellen Modus ändern
  4) Beenden (keine Änderung)

Aktueller Modus: normal
═══════════════════════════════════════════════
Automatischer Start in 10 Sekunden...
Drücke eine Taste zum Wählen

Auswahl (1-4): _
```

### Modus wechseln (während des Betriebs)

```bash
# Menü öffnen
prasco-mode

# Status anzeigen
prasco-status

# Über Makefile
make mode
make status
```

### Service-Management

```bash
# Status prüfen
sudo systemctl status prasco
make health

# Neustart
sudo systemctl restart prasco
make restart

# Logs anzeigen
sudo journalctl -u prasco -f
```

## 🔄 Typische Workflows

### Workflow 1: Messe/Event (Offline)

**Vorbereitung (zu Hause):**
```bash
ssh pi@raspberrypi.local
prasco-mode
# Wähle: 2) Hotspot-Modus
# Bestätige Neustart
```

**Vor Ort:**
1. Raspberry Pi einschalten
2. WiFi-Hotspot `PRASCO-Display` ist aktiv
3. Verbinden mit Passwort `prasco123`
4. Admin-Panel: `http://192.168.4.1:3000/admin`
5. Content verwalten

**Nach Event:**
```bash
ssh pi@192.168.4.1
prasco-mode
# Wähle: 1) Normal-Modus
# Bestätige Neustart
```

### Workflow 2: Permanente Installation (Normal)

**Einrichtung:**
```bash
sudo make install
sudo reboot
# Beim Boot: Wähle 1) Normal-Modus
```

**Bei Netzwerk-Problemen:**
```bash
# Wechsle zu Hotspot für Wartung
prasco-mode
# Wähle: 2) Hotspot-Modus
# Wartung durchführen
# Zurück zu Normal-Modus
```

### Workflow 3: Demo-Präsentation

**Setup:**
```bash
# Setze Hotspot als Standard
echo "hotspot" | sudo tee /etc/prasco/boot-mode
sudo reboot
```

**Präsentation:**
- Automatischer Start im Hotspot-Modus
- Unabhängig von Location-Netzwerk
- Schnelles Setup

## 📊 Management-Befehle

### Makefile-Befehle

```bash
make help       # Alle Befehle anzeigen
make status     # Hotspot-Status
make health     # System Health Check
make restart    # Services neu starten
make mode       # Boot-Modus wechseln
make install    # Vollständige Installation
```

### System-Befehle

```bash
# Service-Management
sudo systemctl status prasco
sudo systemctl restart prasco
sudo systemctl stop prasco
sudo systemctl start prasco

# Hotspot-Management
sudo systemctl status hostapd
sudo systemctl status dnsmasq
./scripts/hotspot-restart.sh

# Boot-Menü
prasco-mode         # Menü öffnen
prasco-status       # Status anzeigen
```

### Monitoring

```bash
# Live-Status (alle 5 Sekunden)
watch -n 5 './scripts/hotspot-status.sh'

# Logs
sudo journalctl -u prasco -f
sudo journalctl -u hostapd -f
sudo journalctl -u dnsmasq -f

# Verbundene Clients
cat /var/lib/misc/dnsmasq.leases
```

## 🔧 Konfiguration

### Standard-Modus ändern

```bash
# Normal-Modus als Standard
echo "normal" | sudo tee /etc/prasco/boot-mode

# Hotspot-Modus als Standard
echo "hotspot" | sudo tee /etc/prasco/boot-mode
```

### Boot-Menü Timeout anpassen

```bash
sudo nano /usr/local/bin/prasco-boot-selector
# Ändere: TIMEOUT=30  # statt 10 Sekunden
```

### WiFi-Konfiguration ändern

```bash
# SSID oder Passwort
sudo nano /etc/hostapd/hostapd.conf
sudo systemctl restart hostapd

# IP-Adresse
sudo nano /etc/dhcpcd.conf
sudo nano /etc/dnsmasq.conf
sudo reboot
```

## 🎯 Szenarien & Best Practices

### Szenario 1: Mobile Messe

**Hardware:**
- Raspberry Pi 4 + Powerbank
- Portable Monitor

**Setup:**
- Hotspot-Modus als Standard
- Schnelle Inbetriebnahme
- Unabhängig vom Veranstaltungs-Netzwerk

### Szenario 2: Permanent Installation

**Hardware:**
- Raspberry Pi 4 + Netzteil
- Wandmontierter Monitor

**Setup:**
- Normal-Modus als Standard
- Zentrale Verwaltung
- Boot-Menü für Wartung

### Szenario 3: Outdoor-Display

**Hardware:**
- Raspberry Pi 4 + Wetterschutzgehäuse
- Outdoor-Display

**Setup:**
- Hotspot-Modus
- Wartung vor Ort per WiFi
- Keine Kabelanbindung nötig

## 🔒 Sicherheit

### Standard-Passwort ändern

```bash
sudo nano /etc/hostapd/hostapd.conf
# Ändere: wpa_passphrase=DeinSicheresPasswort123!
sudo systemctl restart hostapd
```

### Firewall einrichten

```bash
sudo ufw allow from 192.168.4.0/24 to any port 3000
sudo ufw enable
```

### Admin-Passwort ändern

```bash
# Im Admin-Panel oder direkt in der Datenbank
```

## 🐛 Troubleshooting

### Problem: Boot-Menü erscheint nicht

```bash
# Service prüfen
sudo systemctl status prasco-boot-menu

# Neu starten
sudo systemctl restart prasco-boot-menu

# Logs prüfen
sudo journalctl -u prasco-boot-menu -n 50
```

### Problem: Hotspot startet nicht

```bash
# Diagnose
sudo systemctl status hostapd
make health

# Fix
sudo rfkill unblock wifi
make restart
```

### Problem: Modus wechselt nicht

```bash
# Aktuellen Modus prüfen
cat /etc/prasco/boot-mode

# Manuell setzen
echo "hotspot" | sudo tee /etc/prasco/boot-mode
sudo reboot
```

### Kompletter Reset

```bash
# Alle Services stoppen
sudo systemctl stop prasco hostapd dnsmasq

# Neuinstallation
sudo make install
```

## 📈 Performance & Limits

### Hardware-Empfehlungen

| Hardware | Clients | Performance | Empfehlung |
|----------|---------|-------------|------------|
| Pi 4 (4GB) | 10+ | ⭐⭐⭐⭐⭐ | Optimal |
| Pi 3B+ | 5-10 | ⭐⭐⭐⭐ | Gut |
| Pi 3B | 3-5 | ⭐⭐⭐ | OK |
| Pi Zero W | 1-2 | ⭐⭐ | Basic |

### Reichweite

- Indoor: 15-20 Meter
- Outdoor: 30-50 Meter
- Mit USB-WiFi: >50 Meter

## 📚 Vollständige Dokumentation

### Hauptdokumentationen
- **[RASPBERRY-PI-OFFLINE-MODE.md](RASPBERRY-PI-OFFLINE-MODE.md)** - Offline-Mode Details (850 Zeilen)
- **[RASPBERRY-PI-BOOT-MENU.md](RASPBERRY-PI-BOOT-MENU.md)** - Boot-Menü Details (400 Zeilen)
- **[OFFLINE-MODE-IMPLEMENTATION.md](OFFLINE-MODE-IMPLEMENTATION.md)** - Implementierungs-Übersicht

### Script-Dokumentation
- **[scripts/README.md](scripts/README.md)** - Script-Referenz

### Setup-Guides
- **[RASPBERRY-PI-SETUP.md](RASPBERRY-PI-SETUP.md)** - Basis-Setup
- **[RASPBERRY-PI-OFFLINE-SETUP.md](RASPBERRY-PI-OFFLINE-SETUP.md)** - Schnellstart

## ✅ Checkliste: Vollständige Installation

### Pre-Installation
- [ ] Raspberry Pi 3B+ oder neuer
- [ ] Raspberry Pi OS (Bullseye/Bookworm)
- [ ] PRASCO Repository geklont
- [ ] Internet-Zugang verfügbar

### Installation
- [ ] `sudo make install` ausgeführt
- [ ] Oder: Alle 3 Scripts manuell ausgeführt
  - [ ] `setup-hotspot.sh`
  - [ ] `install-service.sh`
  - [ ] `setup-boot-menu.sh`
- [ ] System neugestartet

### Nach Installation
- [ ] Boot-Menü erscheint beim Booten
- [ ] Hotspot-Modus funktioniert
- [ ] Normal-Modus funktioniert
- [ ] PRASCO Service läuft
- [ ] `prasco-mode` Befehl verfügbar
- [ ] `prasco-status` zeigt korrekten Modus

### Sicherheit
- [ ] WiFi-Passwort geändert
- [ ] Admin-Passwort geändert
- [ ] Firewall konfiguriert (optional)

### Tests
- [ ] Modus-Wechsel getestet
- [ ] Service-Neustart getestet
- [ ] Health-Check ausgeführt
- [ ] Client-Verbindung getestet

## 🎉 Zusammenfassung

### Was wurde implementiert?

✅ **WiFi Hotspot (Offline-Mode)**
- 5 Management-Scripts
- 4 Konfigurationsdateien
- DHCP + DNS Server
- Bis zu 10 Clients

✅ **systemd Service**
- PRASCO als System-Service
- Autostart beim Boot
- Auto-Restart bei Crash
- Syslog-Integration

✅ **Boot-Menü**
- Interaktive Modus-Auswahl
- 10 Sekunden Timeout
- Permanente Speicherung
- Manuelle Befehle

✅ **Integration**
- Makefile für einfache Verwaltung
- Vollständige Dokumentation
- Health Monitoring
- Troubleshooting-Guides

### Ergebnis

🎉 **Production-ready Offline-Mode mit Boot-Menü-Integration**

- Vollständig offline nutzbar
- Einfacher Modus-Wechsel
- Automatische Verwaltung
- Enterprise-ready

### Setup-Zeit

- **Automatisch (make install):** 10-15 Minuten
- **Manuell:** 20-30 Minuten

## 📞 Support

**Bei Problemen:**
- 🔍 Health Check: `make health`
- 📋 Status: `make status`
- 📖 Dokumentation: Siehe Links oben
- 🐛 GitHub Issues: https://github.com/dawarr23-boop/Prasco/issues

---

**Status:** ✅ Vollständige Integration implementiert und getestet  
**Version:** 1.0.0  
**Datum:** 10. Januar 2026  
**Komponenten:** Offline-Mode + systemd Service + Boot-Menü
