# PRASCO Raspberry Pi Offline-Mode - Installationsanleitung

## ✅ Implementierung abgeschlossen!

Die vollständige Offline-Mode Implementierung für Raspberry Pi wurde erstellt.

## 📦 Was wurde erstellt?

### Scripts (./scripts/)
- ✅ **setup-hotspot.sh** - Automatische Hotspot-Einrichtung
- ✅ **hotspot-status.sh** - Status-Anzeige
- ✅ **hotspot-restart.sh** - Service-Neustart
- ✅ **hotspot-disable.sh** - Hotspot deaktivieren
- ✅ **health-check.sh** - System-Gesundheitscheck

### Konfigurationsdateien (./scripts/configs/)
- ✅ **dhcpcd.conf** - Statische IP-Konfiguration
- ✅ **dnsmasq.conf** - DHCP-Server-Konfiguration
- ✅ **hostapd.conf** - WiFi Access Point Konfiguration

### Dokumentation
- ✅ **RASPBERRY-PI-OFFLINE-MODE.md** - Vollständige Anleitung (850 Zeilen)
- ✅ **scripts/README.md** - Script-Dokumentation

## 🚀 Installation auf Raspberry Pi

### Option 1: Automatisch (Empfohlen)

```bash
# 1. Repository auf Raspberry Pi klonen (falls noch nicht geschehen)
cd /home/pi
git clone https://github.com/dawarr23-boop/Prasco.git

# 2. Scripts ausführbar machen
cd Prasco
chmod +x scripts/*.sh

# 3. Hotspot einrichten
sudo ./scripts/setup-hotspot.sh

# 4. Neustart
sudo reboot
```

### Option 2: Direkt von GitHub

```bash
# Download und Ausführung in einem Schritt
curl -sSL https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/setup-hotspot.sh | sudo bash
sudo reboot
```

## 📡 Nach der Installation

**WiFi-Hotspot aktiv:**
- SSID: `PRASCO-Display`
- Passwort: `prasco123`
- IP-Adresse: `192.168.4.1`

**PRASCO Zugriff:**
- Display: http://192.168.4.1:3000
- Admin: http://192.168.4.1:3000/admin

## 🔧 Verwaltung

```bash
# Status prüfen
./scripts/hotspot-status.sh

# Health Check
./scripts/health-check.sh

# Neustart der Hotspot-Services
sudo ./scripts/hotspot-restart.sh

# Hotspot deaktivieren
sudo ./scripts/hotspot-disable.sh
```

## 🎯 Anwendungsfälle

✅ **Mobile Events** - Messen ohne vorhandenes WLAN
✅ **Outdoor-Displays** - Parks, Baustellen
✅ **Demo-Modus** - Präsentationen ohne Internet
✅ **Remote Locations** - Standorte ohne Netzwerk
✅ **Backup-Lösung** - Bei Netzwerkausfall

## 🏗️ Architektur

```
┌─────────────────────────────────┐
│     Raspberry Pi 4              │
│  ┌──────────────────────────┐   │
│  │  PRASCO Server (Node.js) │   │
│  │  Port 3000               │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  WiFi Hotspot (hostapd)  │   │
│  │  192.168.4.1             │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
         │ WiFi
         ├─── 💻 PC/Laptop
         ├─── 📱 Smartphone
         └─── 📱 Tablet
```

## 📊 Features

- ✅ Vollständig offline (kein Internet nötig)
- ✅ Bis zu 10 gleichzeitige Clients
- ✅ WPA2-verschlüsselt
- ✅ DHCP-Server integriert
- ✅ DNS-Namen (prasco.local)
- ✅ Automatischer Start beim Boot
- ✅ Health Monitoring

## 🔒 Sicherheit

**Standard-Passwort ändern:**
```bash
sudo nano /etc/hostapd/hostapd.conf
# Ändere: wpa_passphrase=DeinSicheresPasswort123!
sudo ./scripts/hotspot-restart.sh
```

## 📚 Vollständige Dokumentation

Siehe [RASPBERRY-PI-OFFLINE-MODE.md](../RASPBERRY-PI-OFFLINE-MODE.md) für:
- Detaillierte manuelle Installation
- Erweiterte Konfiguration
- 5GHz WiFi aktivieren
- Dual-Mode (Hotspot + Client)
- Troubleshooting
- Performance-Optimierung

## 🐛 Troubleshooting

**Hotspot startet nicht:**
```bash
sudo systemctl status hostapd
sudo journalctl -u hostapd -n 50
./scripts/hotspot-restart.sh
```

**Keine Verbindung möglich:**
```bash
sudo rfkill unblock wifi
sudo systemctl restart hostapd
```

**PRASCO nicht erreichbar:**
```bash
pm2 status
sudo netstat -tlnp | grep 3000
```

## 🎓 Setup-Zeit

- **Automatisch:** ~5 Minuten + Neustart
- **Manuell:** ~15-20 Minuten

## 💡 Nächste Schritte

1. ✅ Scripts auf Raspberry Pi laden
2. ✅ `setup-hotspot.sh` ausführen
3. ✅ Neustart
4. ✅ Mit WiFi verbinden
5. ✅ PRASCO im Browser öffnen

## 📞 Support

Bei Problemen:
- GitHub Issues: https://github.com/dawarr23-boop/Prasco/issues
- Dokumentation: [RASPBERRY-PI-OFFLINE-MODE.md](../RASPBERRY-PI-OFFLINE-MODE.md)
- Health Check: `./scripts/health-check.sh`

---

**Status:** ✅ Implementierung vollständig
**Getestet:** Raspberry Pi 3B+, 4
**Version:** 1.0.0
