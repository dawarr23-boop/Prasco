# PRASCO Raspberry Pi Boot Menu

Boot-Menü für die Auswahl zwischen Normal- und Hotspot-Modus beim Booten des Raspberry Pi.

## 📋 Übersicht

Das Boot-Menü ermöglicht beim Start des Raspberry Pi die Auswahl zwischen zwei Betriebsmodi:

### 1. Normal-Modus
- Verbindung zu vorhandenem Netzwerk
- PRASCO nutzt externe oder lokale Netzwerk-Konfiguration
- Standard-Betrieb mit Internet/Netzwerk-Zugang

### 2. Hotspot-Modus (Offline)
- Raspberry Pi erstellt eigenen WiFi-Hotspot
- SSID: `PRASCO-Display`
- Passwort: `prasco123`
- Admin-Zugriff: `http://192.168.4.1:3000/admin`
- Kein externes Netzwerk erforderlich

## 🚀 Installation

### Schnellinstallation

```bash
cd /home/pi/Prasco/scripts
sudo chmod +x setup-boot-menu.sh
sudo ./setup-boot-menu.sh
```

### Was wird installiert?

1. **Boot-Selector Script** (`/usr/local/bin/prasco-boot-selector`)
   - Zeigt Menü beim Booten
   - 10 Sekunden Timeout für automatische Auswahl
   - Permanente Speicherung der Modus-Auswahl

2. **Systemd Service** (`prasco-boot-menu.service`)
   - Startet automatisch beim Booten
   - Läuft vor Netzwerk-Initialisierung

3. **Hilfsbefehle**
   - `prasco-mode` - Öffnet Menü manuell
   - `prasco-status` - Zeigt aktuellen Modus an

## 💻 Verwendung

### Beim Booten

Nach der Installation erscheint beim Booten automatisch das Menü:

```
╔════════════════════════════════════════════════╗
║                                                ║
║          🍓 PRASCO Boot Modus Auswahl         ║
║                                                ║
╚════════════════════════════════════════════════╝

Wähle den Boot-Modus für PRASCO:

  1) Normal-Modus (Standard)
     • Verbindung zum vorhandenen Netzwerk
     • PRASCO nutzt externe Server-URL
     • Internet-Zugang erforderlich

  2) Hotspot-Modus (Offline)
     • Raspberry Pi erstellt WiFi Hotspot
     • SSID: PRASCO-Display
     • Admin-Zugriff: http://192.168.4.1:3000
     • Kein externes Netzwerk erforderlich

  3) Aktuellen Modus ändern

  4) Beenden (keine Änderung)

═══════════════════════════════════════════════
Aktueller Modus: normal
═══════════════════════════════════════════════

Automatischer Start in 10 Sekunden...
Drücke eine Taste zum Wählen

Auswahl (1-4): _
```

### Manuelle Modus-Auswahl

Während des Betriebs kann der Modus jederzeit geändert werden:

```bash
# Menü öffnen
prasco-mode

# Aktuellen Modus anzeigen
prasco-status
```

### Modus-Wechsel

**Von Normal zu Hotspot:**
```bash
prasco-mode
# Wähle Option 2
# System startet neu in Hotspot-Modus
```

**Von Hotspot zu Normal:**
```bash
prasco-mode
# Wähle Option 1
# System startet neu in Normal-Modus
```

## 🔧 Technische Details

### Dateien und Verzeichnisse

```
/etc/prasco/
├── boot-mode                          # Aktueller Modus (normal/hotspot)

/usr/local/bin/
├── prasco-boot-selector               # Boot-Menü Script
├── prasco-mode                        # Manueller Menü-Aufruf
└── prasco-status                      # Status-Anzeige

/etc/systemd/system/
└── prasco-boot-menu.service          # Systemd Service

/home/pi/Prasco/scripts/
├── setup-boot-menu.sh                # Installation Script
└── boot-mode-selector.sh             # Boot-Menü Script
```

### Systemd Service

Der Service läuft beim Booten **vor** der Netzwerk-Initialisierung:

```ini
[Unit]
Description=PRASCO Boot Mode Selector
After=local-fs.target
Before=network-pre.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/prasco-boot-selector
StandardInput=tty
StandardOutput=tty
```

### Modus-Speicherung

Der ausgewählte Modus wird in `/etc/prasco/boot-mode` gespeichert:

```bash
# Normal-Modus
echo "normal" > /etc/prasco/boot-mode

# Hotspot-Modus
echo "hotspot" > /etc/prasco/boot-mode
```

## 🎮 Optionen im Detail

### Option 1: Normal-Modus

**Aktiviert:**
- Deaktiviert hostapd und dnsmasq Services
- Stellt normale dhcpcd Konfiguration wieder her
- System startet mit Netzwerk-Verbindung neu

**Ideal für:**
- Permanente Installation mit Netzwerk
- Zentrale Verwaltung mehrerer Displays
- Internet-basierte Content-Updates

### Option 2: Hotspot-Modus

**Aktiviert:**
- Aktiviert hostapd und dnsmasq Services
- Konfiguriert WiFi als Access Point
- System startet als Hotspot neu

**Ideal für:**
- Mobile Events und Messen
- Outdoor-Installationen
- Demo-Präsentationen
- Standorte ohne Netzwerk

### Option 3: Modus ändern

Ermöglicht manuelle Eingabe des Modus ohne Neustart.

### Option 4: Beenden

Fährt mit dem aktuell gespeicherten Modus fort ohne Änderung.

## 🔄 Automatischer Timeout

**10 Sekunden Timeout:**
- Countdown läuft automatisch ab
- Bei Timeout: Start mit gespeichertem Modus
- Beliebige Taste stoppt Timeout

**Anpassen des Timeouts:**

Editiere `/usr/local/bin/prasco-boot-selector`:

```bash
# Timeout ändern (in Sekunden)
TIMEOUT=30  # Statt 10
```

## 📺 Konsolen-Ausgabe

Das Boot-Menü erscheint auf:
- **TTY1** (Hauptkonsole)
- **HDMI-Ausgang** (wenn Monitor angeschlossen)

Bei **Headless-Betrieb** (ohne Monitor):
- Gespeicherter Modus wird automatisch verwendet
- SSH-Zugriff für manuelle Änderung: `prasco-mode`

## 🛠️ Konfiguration

### Boot-Menü deaktivieren

Temporär:
```bash
sudo systemctl stop prasco-boot-menu
```

Permanent:
```bash
sudo systemctl disable prasco-boot-menu
```

### Boot-Menü reaktivieren

```bash
sudo systemctl enable prasco-boot-menu
sudo systemctl start prasco-boot-menu
```

### Standard-Modus festlegen

```bash
# Normal-Modus als Standard
echo "normal" | sudo tee /etc/prasco/boot-mode

# Hotspot-Modus als Standard
echo "hotspot" | sudo tee /etc/prasco/boot-mode
```

## 🧪 Troubleshooting

### Problem: Menü erscheint nicht beim Booten

**Diagnose:**
```bash
sudo systemctl status prasco-boot-menu
sudo journalctl -u prasco-boot-menu -n 50
```

**Lösung:**
```bash
sudo systemctl enable prasco-boot-menu
sudo systemctl start prasco-boot-menu
```

### Problem: Modus wechselt nicht

**Prüfen:**
```bash
# Aktuelle Konfiguration
cat /etc/prasco/boot-mode

# Service-Status
sudo systemctl status hostapd
sudo systemctl status dnsmasq
```

**Fix:**
```bash
# Manuell wechseln
prasco-mode

# Oder direkt:
echo "hotspot" | sudo tee /etc/prasco/boot-mode
sudo reboot
```

### Problem: Menü friert ein

**Neustart des Service:**
```bash
sudo systemctl restart prasco-boot-menu
```

**Manueller Aufruf zum Testen:**
```bash
sudo /usr/local/bin/prasco-boot-selector
```

## 📊 Vergleich: Mit vs. Ohne Boot-Menü

| Feature | Ohne Boot-Menü | Mit Boot-Menü |
|---------|----------------|---------------|
| Modus-Wechsel | Manuelle Rekonfiguration | Ein Tastendruck |
| Zeit zum Wechseln | 10-15 Minuten | 30 Sekunden + Reboot |
| Fehleranfälligkeit | Hoch (Konfigurationsfehler) | Niedrig (Automatisch) |
| Benutzerfreundlichkeit | Technisches Wissen nötig | Sehr einfach |
| Wiederherstellung | Komplex | Automatisch |

## 🎯 Best Practices

### Für Events/Messen

**Vor dem Event:**
```bash
# Setze Hotspot-Modus als Standard
echo "hotspot" | sudo tee /etc/prasco/boot-mode
sudo reboot
```

**Nach dem Event:**
```bash
# Wechsel zurück zu Normal-Modus
prasco-mode
# Wähle Option 1
```

### Für permanente Installation

**Setze Normal-Modus als Standard:**
```bash
echo "normal" | sudo tee /etc/prasco/boot-mode
```

**Bei Netzwerk-Problemen:**
- Boot-Menü erscheint automatisch
- Wechsel zu Hotspot-Modus für Wartung
- Zurück zu Normal nach Problembehebung

### Für Remote-Verwaltung

**SSH-Zugriff nutzen:**
```bash
# Von Remote
ssh pi@prasco.local
prasco-mode
# Wähle gewünschten Modus
```

## 🔗 Integration mit anderen Tools

### Mit PRASCO Health-Check

```bash
# Status-Check inkl. Boot-Modus
./scripts/health-check.sh
prasco-status
```

### Mit Backup/Restore

```bash
# Modus in Backup einschließen
./scripts/backup.sh

# Nach Restore Modus prüfen
prasco-status
```

## 📚 Weiterführende Dokumentation

- [RASPBERRY-PI-OFFLINE-MODE.md](RASPBERRY-PI-OFFLINE-MODE.md) - Hotspot-Details
- [RASPBERRY-PI-SETUP.md](RASPBERRY-PI-SETUP.md) - Grundlegende Pi-Konfiguration
- [README.md](README.md) - PRASCO Hauptdokumentation

## 💡 Tipps

**Schneller Modus-Wechsel:**
```bash
# Alias in .bashrc
alias pm='prasco-mode'
alias ps='prasco-status'
```

**Automatischer Hotspot bei Netzwerk-Fehler:**
Zukünftige Erweiterung möglich: Automatischer Fallback auf Hotspot-Modus wenn Netzwerk nicht erreichbar.

**Multi-Boot-Szenarien:**
Kombiniere mit verschiedenen PRASCO-Konfigurationen für unterschiedliche Events.

---

**Bei Fragen:** Öffne ein Issue auf GitHub
