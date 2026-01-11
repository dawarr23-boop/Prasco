# PRASCO Boot-Fortschrittsanzeige

Visueller Fortschrittsbalken während des Boot-Vorgangs, der alle Phasen des PRASCO-Starts anzeigt.

## 📊 Übersicht

Die Boot-Fortschrittsanzeige zeigt einen animierten Ladebalken während des Boot-Prozesses und visualisiert folgende Phasen:

1. **System-Dienste** (0-20%)
2. **Netzwerk-Konfiguration** (20-40%)
3. **WiFi Hotspot / Netzwerk-Verbindung** (40-70%)
4. **PRASCO Server** (70-90%)
5. **Finalisierung** (90-100%)

## 🎨 Darstellung

```
╔════════════════════════════════════════════════╗
║          🍓 PRASCO wird gestartet...          ║
╚════════════════════════════════════════════════╝

Modus: hotspot

⚙️  System-Dienste starten...
[██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20% ✓

🌐 Netzwerk wird konfiguriert...
[████████████████████░░░░░░░░░░░░░░░░░░░░]  40% ✓

📡 WiFi Hotspot wird aktiviert...
[██████████████████████████████░░░░░░░░░░]  60% ✓

🔧 DHCP Server wird gestartet...
[███████████████████████████████████░░░░░]  70% ✓

🚀 PRASCO Server wird gestartet...
[█████████████████████████████████████████]  90% ✓

✨ System wird finalisiert...
[██████████████████████████████████████████] 100% ✓

╔════════════════════════════════════════════════╗
║            ✅ PRASCO ist bereit!               ║
╚════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hotspot-Modus aktiv:

  SSID:       PRASCO-Display
  Passwort:   prasco123
  IP:         192.168.4.1

  Display:    http://192.168.4.1:3000
  Admin:      http://192.168.4.1:3000/admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tipp: Verwende 'prasco-mode' zum Wechseln des Modus
```

## 🚀 Installation

### Automatische Installation

```bash
cd /home/pi/Prasco
sudo ./scripts/install-boot-progress.sh
```

### Mit Makefile

```bash
cd /home/pi/Prasco
make bootprogress
```

### Vollständige Installation (inkl. Boot-Menü)

```bash
make install
```

## 🎯 Features

### Dynamischer Fortschritt

- **Service-Check**: Wartet auf tatsächlichen Start der Services
- **Adaptive Phasen**: Zeigt unterschiedliche Schritte für Normal- vs. Hotspot-Modus
- **Echtzeit-Feedback**: Fortschritt passt sich an tatsächliche Boot-Dauer an

### Visuelle Elemente

- ✅ Animierter Fortschrittsbalken (50 Zeichen breit)
- ✅ Emoji-Icons für jede Phase
- ✅ Farbcodierte Ausgabe
- ✅ Prozentanzeige
- ✅ Checkmarks bei Abschluss

### Modus-spezifische Anzeige

**Hotspot-Modus:**
- Zeigt WiFi-Hotspot Aktivierung
- DHCP Server Start
- Zugriffsinformationen (SSID, Passwort, URLs)

**Normal-Modus:**
- Netzwerk-Verbindungsaufbau
- DHCP Client
- Lokale IP-Adresse

## 🔧 Technische Details

### Boot-Reihenfolge

```
1. prasco-boot-menu.service       (Boot-Menü: Modus-Auswahl)
          ↓
2. prasco-boot-progress.service   (Fortschrittsanzeige)
          ↓
3. network.target                  (Netzwerk-Services)
          ↓
4. prasco.service                  (PRASCO Server)
```

### systemd Service

```ini
[Unit]
Description=PRASCO Boot Progress Display
After=prasco-boot-menu.service
After=network-pre.target
Before=getty@tty1.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-boot-progress
StandardInput=tty
StandardOutput=tty
TTYPath=/dev/tty1
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

### Dateien

```
/usr/local/bin/
└── prasco-boot-progress          # Hauptscript

/etc/systemd/system/
└── prasco-boot-progress.service  # systemd Service

/home/pi/Prasco/scripts/
├── boot-progress.sh              # Source Script
└── install-boot-progress.sh      # Installations-Script
```

## 🎨 Anpassung

### Fortschritts-Geschwindigkeit ändern

Editiere `/usr/local/bin/prasco-boot-progress`:

```bash
# Standard: 0.1 Sekunden pro Schritt
sleep 0.1

# Schneller: 0.05 Sekunden
sleep 0.05

# Langsamer: 0.2 Sekunden
sleep 0.2
```

### Balken-Breite anpassen

```bash
# Standard: 50 Zeichen
local total=50

# Breiter: 70 Zeichen
local total=70
```

### Phasen-Prozentsätze ändern

```bash
# Phase 1: System-Dienste (0-20%)
for i in {0..20}; do

# Phase 2: Netzwerk (20-40%)
for i in {20..40}; do

# Usw...
```

## 🧪 Testen

### Manueller Test

```bash
# Als Root ausführen
sudo /usr/local/bin/prasco-boot-progress
```

### Service-Test

```bash
# Service manuell starten
sudo systemctl start prasco-boot-progress

# Status prüfen
sudo systemctl status prasco-boot-progress

# Logs anzeigen
sudo journalctl -u prasco-boot-progress -n 50
```

### Automatischer Test beim nächsten Boot

```bash
sudo reboot
# Beobachte die Ausgabe auf TTY1 oder HDMI
```

## 🔄 Integration mit Boot-Menü

Die Fortschrittsanzeige startet automatisch **nach** dem Boot-Menü:

1. **Boot-Menü** (10 Sekunden Auswahl)
2. **Modus-Aktivierung** (Normal/Hotspot)
3. **Fortschrittsanzeige** (Services starten)
4. **PRASCO bereit**

## 📊 Zeitplan

| Phase | Dauer | Prozent |
|-------|-------|---------|
| System-Dienste | ~2s | 0-20% |
| Netzwerk | ~2s | 20-40% |
| Hotspot/Client | ~3s | 40-70% |
| PRASCO Server | ~2s | 70-90% |
| Finalisierung | ~1s | 90-100% |
| **Gesamt** | **~10s** | **100%** |

*Zeiten sind Richtwerte und variieren je nach Hardware*

## 🐛 Troubleshooting

### Problem: Fortschrittsbalken wird nicht angezeigt

**Diagnose:**
```bash
sudo systemctl status prasco-boot-progress
sudo journalctl -u prasco-boot-progress -n 50
```

**Lösung:**
```bash
# Service aktivieren
sudo systemctl enable prasco-boot-progress

# Neustart
sudo reboot
```

### Problem: Anzeige friert ein

**Ursache:** Service wartet auf PRASCO/Hotspot

**Lösung:**
```bash
# PRASCO Status prüfen
sudo systemctl status prasco

# Bei Hotspot: hostapd prüfen
sudo systemctl status hostapd
```

### Problem: Falsche Informationen angezeigt

**Prüfen:**
```bash
# Boot-Modus prüfen
cat /etc/prasco/boot-mode

# Sollte "normal" oder "hotspot" sein
```

**Fix:**
```bash
# Modus zurücksetzen
echo "normal" | sudo tee /etc/prasco/boot-mode
sudo reboot
```

## 🎯 Best Practices

### Für Headless-Setup

Fortschrittsanzeige ist auch ohne Monitor nützlich:
- Logs werden in systemd journal geschrieben
- Service-Status zeigt Fortschritt
- Kann per SSH überprüft werden

### Für Monitor-Setup

- Fortschritt ist auf TTY1 sichtbar
- HDMI-Ausgabe zeigt Anzeige
- Visuelles Feedback für Benutzer

### Für Debugging

```bash
# Detaillierte Logs aktivieren
sudo systemctl edit prasco-boot-progress

# Hinzufügen:
[Service]
StandardError=journal
```

## 🔗 Integration

### Mit Boot-Menü

```bash
# Beide installieren
make bootmenu
make bootprogress
```

### Mit Health-Check

```bash
# Nach Boot: Status prüfen
./scripts/health-check.sh
```

## 📚 Siehe auch

- [RASPBERRY-PI-BOOT-MENU.md](RASPBERRY-PI-BOOT-MENU.md) - Boot-Menü Dokumentation
- [OFFLINE-MODE-BOOTMENU-INTEGRATION.md](OFFLINE-MODE-BOOTMENU-INTEGRATION.md) - Gesamt-Integration
- [RASPBERRY-PI-OFFLINE-MODE.md](RASPBERRY-PI-OFFLINE-MODE.md) - Offline-Mode Details

## 💡 Tipps

**Schnellerer Boot:**
- Reduziere sleep-Zeiten im Script
- Optimiere Service-Start-Reihenfolge

**Mehr Informationen:**
- Füge zusätzliche Phasen hinzu
- Zeige mehr Service-Details

**Custom Branding:**
- Passe Header/Footer an
- Ändere Farben und Emojis

---

**Status:** ✅ Production-ready  
**Kompatibel mit:** Raspberry Pi 3B+, 4, 5  
**Abhängigkeiten:** prasco-boot-menu (optional)
