# 🍓 Raspberry Pi Setup-Anleitung für PRASCO

Vollständige Schritt-für-Schritt-Anleitung zur Einrichtung eines Raspberry Pi als digitales Schwarzes Brett.

## Inhaltsverzeichnis

1. [Benötigte Hardware](#1-benötigte-hardware)
2. [SD-Karte vorbereiten](#2-sd-karte-vorbereiten)
3. [Erster Start & Grundkonfiguration](#3-erster-start--grundkonfiguration)
4. [Netzwerk konfigurieren](#4-netzwerk-konfigurieren)
5. [PRASCO installieren](#5-prasco-installieren)
6. [Kiosk-Modus einrichten](#6-kiosk-modus-einrichten)
7. [Wartung & Updates](#7-wartung--updates)

---

## 1. Benötigte Hardware

### Raspberry Pi

| Komponente        | Empfohlen                 | Minimum                  |
| ----------------- | ------------------------- | ------------------------ |
| **Raspberry Pi**  | Pi 4 (4GB RAM)            | Pi 3B+                   |
| **MicroSD-Karte** | 32GB Class 10             | 16GB Class 10            |
| **Netzteil**      | 5V/3A USB-C (Pi 4)        | 5V/2.5A Micro-USB (Pi 3) |
| **HDMI-Kabel**    | Micro-HDMI zu HDMI (Pi 4) | HDMI (Pi 3)              |
| **Netzwerk**      | Ethernet-Kabel (LAN)      | WLAN                     |

### Zusätzlich

- Windows/Mac/Linux PC zum Flashen der SD-Karte
- SD-Kartenleser (falls nicht im PC integriert)
- Fernseher oder Monitor mit HDMI-Eingang
- Optional: Tastatur & Maus für die Ersteinrichtung

---

## 2. SD-Karte vorbereiten

### 2.1 Raspberry Pi Imager herunterladen

1. Öffne https://www.raspberrypi.com/software/
2. Lade den **Raspberry Pi Imager** für dein Betriebssystem herunter
3. Installiere und starte den Imager

### 2.2 Betriebssystem flashen

1. **SD-Karte einlegen** in den Kartenleser

2. **Imager starten** und konfigurieren:

   ![Raspberry Pi Imager](https://www.raspberrypi.com/documentation/computers/images/imager/welcome.png)

3. **GERÄT WÄHLEN:**
   - Klicke auf "GERÄT WÄHLEN"
   - Wähle dein Raspberry Pi Modell (z.B. "Raspberry Pi 4")

4. **OS WÄHLEN:**
   - Klicke auf "OS WÄHLEN"
   - Wähle **"Raspberry Pi OS (64-bit)"** oder **"Raspberry Pi OS (32-bit)"**
   - Empfehlung: "Raspberry Pi OS with desktop" für den Kiosk-Modus

5. **SD-KARTE WÄHLEN:**
   - Klicke auf "SD-KARTE WÄHLEN"
   - Wähle deine MicroSD-Karte aus

### 2.3 Erweiterte Einstellungen (WICHTIG!)

**Vor dem Schreiben:** Klicke auf das **Zahnrad-Symbol** ⚙️ oder drücke `Strg+Shift+X`

Konfiguriere folgende Einstellungen:

#### Hostname

```
☑ Hostname: prasco
```

#### SSH aktivieren

```
☑ SSH aktivieren
   ◉ Passwort zur Authentifizierung verwenden
```

#### Benutzername und Passwort

```
☑ Benutzername und Passwort festlegen
   Benutzername: pi
   Passwort: [SICHERES PASSWORT EINGEBEN]
```

> ⚠️ **WICHTIG:** Verwende ein starkes Passwort! Nicht "raspberry"!

#### WLAN konfigurieren (optional)

```
☑ WiFi einrichten
   SSID: [DEIN WLAN NAME]
   Passwort: [DEIN WLAN PASSWORT]
   WLAN-Land: DE
```

#### Spracheinstellungen

```
☑ Spracheinstellungen festlegen
   Zeitzone: Europe/Berlin
   Tastaturlayout: de
```

### 2.4 SD-Karte schreiben

1. Klicke auf **"SPEICHERN"** für die Einstellungen
2. Klicke auf **"SCHREIBEN"**
3. Bestätige mit **"JA"**
4. Warte bis der Vorgang abgeschlossen ist (ca. 5-10 Minuten)
5. Klicke auf **"WEITER"** und entferne die SD-Karte sicher

---

## 3. Erster Start & Grundkonfiguration

### 3.1 Hardware verbinden

1. **SD-Karte** in den Raspberry Pi einlegen
2. **HDMI-Kabel** an Monitor/TV und Pi anschließen
3. **Netzwerkkabel** anschließen (empfohlen) ODER WLAN nutzen
4. Optional: Tastatur und Maus anschließen
5. **Netzteil** anschließen → Pi startet automatisch

### 3.2 IP-Adresse herausfinden

**Methode 1: Am Monitor (mit Desktop)**

- Öffne Terminal (schwarzes Icon in der Taskleiste)
- Tippe: `hostname -I`

**Methode 2: Über den Router**

- Öffne Router-Webinterface (z.B. http://192.168.1.1)
- Suche nach "prasco" oder "raspberrypi" in der Geräteliste

**Methode 3: Network Scanner (von Windows)**

```powershell
# PowerShell: Netzwerk scannen
1..254 | ForEach-Object { Test-Connection -ComputerName "192.168.1.$_" -Count 1 -Quiet -AsJob } | Wait-Job | Receive-Job | Where-Object { $_ }
```

### 3.3 SSH-Verbindung herstellen

Verbinde dich von deinem PC aus:

**Windows (PowerShell):**

```powershell
ssh pi@prasco.local
# oder mit IP:
ssh pi@192.168.1.XXX
```

**Windows (PuTTY):**

1. Lade PuTTY herunter: https://www.putty.org/
2. Host Name: `prasco.local` oder IP-Adresse
3. Port: 22
4. Connection type: SSH
5. Klicke "Open"

**Mac/Linux:**

```bash
ssh pi@prasco.local
```

### 3.4 System aktualisieren

Nach der SSH-Verbindung:

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Neustart
sudo reboot
```

Warte 1-2 Minuten und verbinde dich erneut per SSH.

---

## 4. Netzwerk konfigurieren

### 4.1 Statische IP-Adresse (empfohlen)

Für ein Digital Signage System ist eine statische IP wichtig, damit du den Pi immer unter der gleichen Adresse erreichst.

**Methode 1: Über DHCP-Reservation im Router (empfohlen)**

1. Öffne dein Router-Webinterface
2. Finde die DHCP-Einstellungen
3. Erstelle eine Reservierung für die MAC-Adresse des Pi
4. Weise eine feste IP zu (z.B. 192.168.1.100)

**Methode 2: Statische IP auf dem Pi konfigurieren**

```bash
# Aktuelle Netzwerkkonfiguration anzeigen
ip addr show

# NetworkManager konfigurieren (Raspberry Pi OS Bookworm)
sudo nmcli con show

# Ethernet auf statische IP umstellen
sudo nmcli con mod "Wired connection 1" \
  ipv4.method manual \
  ipv4.addresses "192.168.1.100/24" \
  ipv4.gateway "192.168.1.1" \
  ipv4.dns "192.168.1.1,8.8.8.8"

# Verbindung neu starten
sudo nmcli con up "Wired connection 1"
```

**Für ältere Pi OS Versionen (dhcpcd):**

```bash
# /etc/dhcpcd.conf bearbeiten
sudo nano /etc/dhcpcd.conf

# Am Ende einfügen (für WLAN):
interface wlan0
static ip_address=192.168.2.132/24
static routers=192.168.2.1
static domain_name_servers=192.168.2.1 8.8.8.8

# Speichern: Strg+O, Enter, Strg+X
# Neustart
sudo reboot
```

### 4.2 WLAN konfigurieren (falls nicht bei Installation)

```bash
# WLAN-Netzwerke anzeigen
sudo nmcli dev wifi list

# Mit WLAN verbinden
sudo nmcli dev wifi connect "DEIN_NETZWERK_NAME" password "DEIN_PASSWORT"

# Verbindung prüfen
nmcli con show --active
```

### 4.3 Hostname ändern (optional)

```bash
# Hostname anzeigen
hostname

# Hostname ändern
sudo hostnamectl set-hostname prasco-display

# /etc/hosts aktualisieren
sudo nano /etc/hosts
# Ändere "raspberrypi" zu "prasco-display"

sudo reboot
```

### 4.4 Netzwerk-Verbindung testen

```bash
# Internet-Verbindung prüfen
ping -c 4 google.com

# DNS-Auflösung prüfen
nslookup google.com

# Lokales Netzwerk prüfen
ping -c 4 192.168.1.1  # Router
```

---

## 5. PRASCO installieren

### 🚀 Schnellstart: Automatisches Setup (Empfohlen)

PRASCO enthält ein interaktives Setup-Skript, das alle folgenden Schritte automatisiert:

```bash
# Nach Home-Verzeichnis wechseln
cd ~

# Repository klonen
git clone https://github.com/dawarr23-boop/Prasco.git

# In Projektverzeichnis wechseln
cd Prasco

# Interaktives Setup starten
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

Das Setup-Skript führt dich durch:

- ✅ Systemprüfung (Node.js, PostgreSQL, PM2)
- ✅ Automatische Installation fehlender Abhängigkeiten
- ✅ Datenbank-Erstellung mit sicherem Passwort
- ✅ .env Konfiguration mit allen Einstellungen
- ✅ Kompilierung und Build
- ✅ PM2 Prozessmanager einrichten
- ✅ Kiosk-Modus konfigurieren (optional)
- ✅ Statische IP einrichten (optional)

> 💡 **Tipp:** Das Skript generiert automatisch sichere Passwörter und JWT-Secrets!

---

### Weitere Skripte

| Skript                        | Beschreibung                             |
| ----------------------------- | ---------------------------------------- |
| `scripts/setup-production.sh` | Vollständige interaktive Ersteinrichtung |
| `scripts/first-run.sh`        | Schnellstart nach dem Klonen             |
| `scripts/health-check.sh`     | Systemdiagnose und Status                |

```bash
# Systemdiagnose ausführen
./scripts/health-check.sh
```

---

### 5.1 Manuelle Installation (Alternative)

Falls du die manuelle Installation bevorzugst:

#### Abhängigkeiten installieren

```bash
# Node.js 18.x installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Version prüfen
node --version   # sollte v18.x.x zeigen
npm --version    # sollte 9.x.x oder höher zeigen

# PostgreSQL installieren
sudo apt install -y postgresql postgresql-contrib

# PM2 (Process Manager) installieren
sudo npm install -g pm2

# Chromium Browser (falls nicht vorhanden)
sudo apt install -y chromium-browser

# Bildschirmschoner deaktivieren Tools
sudo apt install -y xdotool unclutter
```

### 5.2 Datenbank einrichten

```bash
# Als postgres User anmelden
sudo -u postgres psql

# In der PostgreSQL-Konsole:
CREATE USER prasco WITH PASSWORD 'SICHERES_PASSWORT_HIER';
CREATE DATABASE bulletin_board OWNER prasco;
GRANT ALL PRIVILEGES ON DATABASE bulletin_board TO prasco;
\q
```

### 5.3 PRASCO herunterladen (falls noch nicht geschehen)

```bash
# Nach Home-Verzeichnis wechseln
cd ~

# Repository klonen
git clone https://github.com/dawarr23-boop/Prasco.git

# In Projektverzeichnis wechseln
cd Prasco
```

### 5.4 Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
cp .env.production .env

# .env bearbeiten
nano .env
```

**Wichtige Einstellungen anpassen:**

```env
# Server
PORT=3000
NODE_ENV=production

# Datenbank (Passwort anpassen!)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bulletin_board
DB_USER=prasco
DB_PASSWORD=DEIN_SICHERES_PASSWORT

# JWT Secrets (lange, zufällige Strings!)
JWT_SECRET=hier_einen_sehr_langen_zufaelligen_string_eingeben_mindestens_64_zeichen
JWT_REFRESH_SECRET=ein_anderer_sehr_langer_zufaelliger_string_mindestens_64_zeichen

# Admin (Passwort anpassen!)
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=SICHERES_ADMIN_PASSWORT

# Upload
UPLOAD_MAX_SIZE=52428800
UPLOAD_PATH=./uploads
```

> 💡 **Tipp:** Generiere sichere Zufallsstrings mit:
>
> ```bash
>
> ```

<!-- !!!^! -->openssl rand -hex 32

> ```
>
> ```

Speichern: `Strg+O`, `Enter`, `Strg+X`

### 5.5 App installieren und starten

```bash
# Dependencies installieren
npm ci --only=production

# TypeScript kompilieren
npm run build

# Mit PM2 starten
pm2 start dist/server.js --name prasco

# PM2 beim Systemstart aktivieren
pm2 startup
# Folge den Anweisungen und führe den angezeigten Befehl aus!

# Aktuelle Konfiguration speichern
pm2 save
```

### 5.6 Installation prüfen

```bash
# PM2 Status prüfen
pm2 status

# Logs anzeigen
pm2 logs prasco

# API testen
curl http://localhost:3000/api/health
```

---

## 6. Kiosk-Modus einrichten

Der Kiosk-Modus startet automatisch den Browser im Vollbild mit der Display-Seite.

### 6.1 Autostart-Skript erstellen

```bash
# Skript erstellen
mkdir -p ~/.config/autostart
nano ~/.config/autostart/prasco-kiosk.desktop
```

**Inhalt:**

```ini
[Desktop Entry]
Type=Application
Name=PRASCO Kiosk
Exec=/home/pi/Prasco/scripts/start-kiosk.sh
X-GNOME-Autostart-enabled=true
```

### 6.2 Kiosk-Skript prüfen/anpassen

```bash
# Skript anzeigen
cat ~/Prasco/scripts/start-kiosk.sh

# Falls nicht vorhanden, erstellen:
nano ~/Prasco/scripts/start-kiosk.sh
```

**Inhalt:**

```bash
#!/bin/bash

# Warte auf Desktop
sleep 10

# Bildschirmschoner deaktivieren
xset s off
xset -dpms
xset s noblank

# Mauszeiger verstecken
unclutter -idle 0.1 -root &

# Chromium im Kiosk-Modus starten
# WICHTIG: --autoplay-policy für Video mit Ton!
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --disable-component-update \
  http://localhost:3000/public/display.html
```

```bash
# Ausführbar machen
chmod +x ~/Prasco/scripts/start-kiosk.sh
```

### 6.3 Bildschirm-Einstellungen

```bash
# Bildschirmschoner dauerhaft deaktivieren
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart

# Füge hinzu:
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
```

### 6.4 Bildschirm-Auflösung anpassen (optional)

```bash
# Raspberry Pi Konfiguration
sudo raspi-config

# → Display Options → Resolution
# Wähle die passende Auflösung für deinen Monitor
```

### 6.5 Neustart und Test

```bash
sudo reboot
```

Nach dem Neustart sollte:

1. Der Raspberry Pi hochfahren
2. Automatisch die Desktop-Umgebung laden
3. Chromium im Vollbild starten
4. Die PRASCO Display-Seite anzeigen

---

## 7. Wartung & Updates

### 7.1 Logs anzeigen

```bash
# PRASCO Logs
pm2 logs prasco

# Nur Fehler
pm2 logs prasco --err

# System-Logs
journalctl -u pm2-pi -f
```

### 7.2 PRASCO aktualisieren

```bash
# SSH-Verbindung herstellen
ssh pi@prasco.local

# In Projektverzeichnis wechseln
cd ~/Prasco

# Updates holen
git pull

# Dependencies aktualisieren
npm ci --only=production

# Neu kompilieren
npm run build

# Neustart
pm2 restart prasco
```

### 7.3 System aktualisieren

```bash
# Alle Pakete aktualisieren
sudo apt update && sudo apt upgrade -y

# Aufräumen
sudo apt autoremove -y

# Neustart (falls Kernel-Update)
sudo reboot
```

### 7.4 Backup erstellen

```bash
# Datenbank-Backup
pg_dump -U prasco bulletin_board > ~/backup_$(date +%Y%m%d).sql

# Uploads sichern
tar -czf ~/uploads_backup_$(date +%Y%m%d).tar.gz ~/Prasco/uploads/
```

### 7.5 Fernzugriff auf Admin-Panel

Aus deinem lokalen Netzwerk:

- **Display:** http://prasco.local:3000/public/display.html
- **Admin:** http://prasco.local:3000/admin
- **API Docs:** http://prasco.local:3000/api-docs

### 7.6 Häufige Probleme

| Problem               | Lösung                                  |
| --------------------- | --------------------------------------- |
| Kein Bild             | `raspi-config` → Display Options prüfen |
| Schwarzer Bildschirm  | HDMI vor Strom anschließen              |
| Browser startet nicht | `pm2 logs` prüfen, Server läuft?        |
| Videos ohne Ton       | `--autoplay-policy` Flag prüfen         |
| Kein Netzwerk         | `ip addr`, Kabelverbindung prüfen       |

---

## Schnellstart-Checkliste

### Mit automatischem Setup-Skript (Empfohlen) ⭐

- [ ] SD-Karte mit Raspberry Pi Imager geflasht
- [ ] SSH aktiviert, Passwort gesetzt
- [ ] PRASCO geklont: `git clone https://github.com/dawarr23-boop/Prasco.git`
- [ ] Setup-Skript gestartet: `./scripts/setup-production.sh`
- [ ] Interaktive Fragen beantwortet
- [ ] System getestet

### Manuelle Installation

- [ ] SD-Karte mit Raspberry Pi Imager geflasht
- [ ] SSH aktiviert, Passwort gesetzt
- [ ] Netzwerk konfiguriert (LAN/WLAN)
- [ ] Statische IP eingerichtet
- [ ] Node.js 18 installiert
- [ ] PostgreSQL installiert und konfiguriert
- [ ] PRASCO geklont
- [ ] `.env` Datei konfiguriert
- [ ] `npm ci && npm run build` ausgeführt
- [ ] PM2 konfiguriert und gestartet
- [ ] Kiosk-Modus eingerichtet
- [ ] System getestet

---

## Support

Bei Problemen:

1. **Systemdiagnose:** `./scripts/health-check.sh`
2. Logs prüfen: `pm2 logs prasco`
3. System-Status: `pm2 status`
4. Netzwerk: `ip addr`, `ping google.com`
5. Browser manuell testen: `chromium-browser http://localhost:3000`

---

_Letzte Aktualisierung: Dezember 2024_
