# PRASCO Splash Screen

Dynamischer Boot-Splash-Screen für Raspberry Pi OS mit PRASCO-Branding.

## Features

- **PSplash Integration**: Leichtgewichtiger grafischer Splash während des Boots
- **ASCII-Art Splash**: Stilvoller Text-Splash auf TTY1
- **Boot-Progress-Anzeige**: Zeigt Fortschritt beim Systemstart
- **PRASCO-Branding**: Mit Logo und Farben
- **Stiller Boot**: Versteckt Kernel-Meldungen

## Installation

### 1. Schnellinstallation (empfohlen)

```bash
cd /home/pi/Prasco
sudo ./scripts/install-splash-screen.sh
sudo reboot
```

### 2. Mit eigenem Bild (optional)

Wenn du ein eigenes Splash-Screen-Bild erstellen möchtest:

```bash
# Installiere ImageMagick
sudo apt-get install imagemagick

# Erstelle Splash-Screen-Bilder
./scripts/create-splash-image.sh

# Installiere Splash Screen
sudo ./scripts/install-splash-screen.sh
```

## Was wird installiert?

### PSplash Service
- Leichtgewichtiger Splash-Screen-Dienst
- Zeigt Boot-Progress an
- Automatische Integration in systemd

### Boot-Progress-Skript
- Zeigt Ladefortschritt (0-100%)
- Statusmeldungen während des Boots:
  - "Netzwerk wird initialisiert..."
  - "PostgreSQL wird gestartet..."
  - "Node.js wird vorbereitet..."
  - "PRASCO wird gestartet..."
  - "PRASCO bereit!"

### ASCII-Art Splash
- Alternative oder zusätzlicher Splash für TTY1
- Zeigt PRASCO-Logo im Terminal
- Animierter Ladebalken

### Boot-Konfiguration
- Entfernt Rainbow-Splash
- Reduziert Kernel-Meldungen
- Optimiert für sauberen Boot

## Anpassung

### Eigenes Logo/Bild verwenden

1. Erstelle ein PNG-Bild (empfohlen: 480x272 oder 1920x1080)
2. Speichere es als `/usr/share/psplash/psplash-prasco.png`
3. Starte neu

### ASCII-Art anpassen

Bearbeite die Logo-Datei:
```bash
nano assets/prasco-logo.txt
```

Oder bearbeite direkt das Skript:
```bash
sudo nano /usr/local/bin/prasco-ascii-splash.sh
```

### Boot-Meldungen anpassen

Bearbeite das Progress-Skript:
```bash
sudo nano /usr/local/bin/prasco-boot-progress.sh
```

## Deinstallation

```bash
# Services deaktivieren
sudo systemctl disable prasco-splash.service
sudo systemctl disable prasco-splash-progress.service
sudo systemctl disable prasco-ascii-splash.service

# Services entfernen
sudo rm /etc/systemd/system/prasco-splash*.service
sudo rm /usr/local/bin/prasco-boot-progress.sh
sudo rm /usr/local/bin/prasco-ascii-splash.sh

# PSplash deinstallieren (optional)
sudo apt-get remove psplash

# Boot-Konfiguration zurücksetzen
sudo nano /boot/firmware/cmdline.txt  # Entferne "quiet splash"
sudo nano /boot/firmware/config.txt   # Setze disable_splash=1

sudo reboot
```

## Troubleshooting

### Splash Screen wird nicht angezeigt

1. **Prüfe Service-Status:**
   ```bash
   systemctl status prasco-splash.service
   systemctl status prasco-splash-progress.service
   ```

2. **Prüfe Boot-Konfiguration:**
   ```bash
   cat /boot/firmware/cmdline.txt | grep "quiet splash"
   cat /boot/firmware/config.txt | grep "disable_splash"
   ```

3. **Logs prüfen:**
   ```bash
   journalctl -u prasco-splash.service
   journalctl -u prasco-splash-progress.service
   ```

### Boot dauert zu lange

Das Progress-Skript wartet auf den PRASCO-Server. Wenn der Server langsam startet:

```bash
# Timeout hinzufügen
sudo nano /usr/local/bin/prasco-boot-progress.sh

# Ändere die while-Schleife:
TIMEOUT=60
ELAPSED=0
while ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    if [[ $ELAPSED -ge $TIMEOUT ]]; then
        progress 100 "Timeout - Prüfe manuell"
        break
    fi
done
```

### ASCII-Splash wird nicht angezeigt

Der ASCII-Splash wird nur auf TTY1 angezeigt. Wenn Kiosk-Mode aktiv ist, wird dieser übersprungen.

Um es zu sehen:
```bash
# Deaktiviere Kiosk-Mode temporär
sudo systemctl stop prasco-kiosk.service
# Wechsle zu TTY1
Ctrl + Alt + F1
```

## Technische Details

### Services

1. **prasco-splash.service**
   - Startet PSplash früh im Boot-Prozess
   - Zeigt initialen Progress
   - Läuft bis zum Ende des Boot-Prozesses

2. **prasco-splash-progress.service**
   - Läuft nach Netzwerk/PostgreSQL
   - Zeigt detaillierten Boot-Fortschritt
   - Beendet Splash nach PRASCO-Start

3. **prasco-ascii-splash.service**
   - Optionaler TTY1-Splash
   - Zeigt vor Getty-Login
   - Rein visuell, blockiert nicht

### Boot-Reihenfolge

```
1. Kernel lädt
2. prasco-splash.service startet (PSplash)
3. Systemd-Services starten
4. Netzwerk + PostgreSQL
5. prasco-splash-progress.service zeigt Progress
6. PRASCO startet
7. Splash wird beendet
8. Kiosk-Mode startet (falls aktiviert)
```

## Erweiterte Features

### Animierter Boot-Splash

Für einen animierten Splash kannst du PSplash erweitern oder Plymouth verwenden:

```bash
# Plymouth installieren (schwerer, aber mehr Features)
sudo apt-get install plymouth plymouth-themes

# PRASCO-Theme erstellen
# Siehe: /usr/share/plymouth/themes/
```

### Netzwerk-Status im Splash

Füge Netzwerk-Check zum Progress-Skript hinzu:

```bash
# In /usr/local/bin/prasco-boot-progress.sh
while ! ping -c 1 -W 2 8.8.8.8 &>/dev/null; do
    progress 30 "Warte auf Netzwerk..."
    sleep 1
done
progress 40 "Netzwerk verbunden!"
```

## Credits

- PSplash: https://git.yoctoproject.org/psplash
- PRASCO ASCII-Art: Custom
- Boot-Optimierung: systemd best practices
