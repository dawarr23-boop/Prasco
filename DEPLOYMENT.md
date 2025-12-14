# PRASCO Digital Signage - Deployment Guide

Anleitung für das Deployment auf Raspberry Pi und Server-Umgebungen.

## Übersicht

- [Quick Deployment (Docker)](#quick-deployment-docker)
- [Raspberry Pi Deployment](#raspberry-pi-deployment)
- [Server Deployment (Linux)](#server-deployment-linux)
- [Kiosk-Modus Konfiguration](#kiosk-modus-konfiguration)
- [Troubleshooting](#troubleshooting)

---

## Quick Deployment (Docker)

### Voraussetzungen

- Docker & Docker Compose installiert
- Mind. 2GB RAM, 10GB Speicherplatz

### 1. Repository klonen

```bash
git clone <repository-url> prasco
cd prasco
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.production .env
nano .env
```

**Wichtig - Diese Werte ändern:**

```env
DB_PASSWORD=sicheres_passwort_hier
JWT_SECRET=mindestens_64_zeichen_langer_zufallsstring
JWT_REFRESH_SECRET=anderer_langer_zufallsstring
ADMIN_PASSWORD=sicheres_admin_passwort
```

### 3. Production Container starten

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Zugriff

- **Display:** http://localhost:3000/public/display.html
- **Admin:** http://localhost:3000/admin
- **API Docs:** http://localhost:3000/api-docs

---

## Raspberry Pi Deployment

### Hardware-Anforderungen

- Raspberry Pi 4 (empfohlen) oder Pi 3B+
- MicroSD-Karte (mind. 16GB)
- HDMI-Kabel + Fernseher/Monitor
- Netzteil (5V/3A für Pi 4)
- Netzwerkverbindung (LAN empfohlen)

### Automatisches Setup

#### 1. Raspberry Pi OS installieren

- [Raspberry Pi Imager](https://www.raspberrypi.com/software/) herunterladen
- "Raspberry Pi OS (32-bit) with Desktop" wählen
- SSH aktivieren in den Einstellungen
- MicroSD-Karte beschreiben

#### 2. Setup-Skript ausführen

```bash
# Auf dem Raspberry Pi:
git clone https://github.com/dawarr23-boop/Prasco.git ~/Prasco
cd ~/Prasco
sudo bash scripts/setup-raspi.sh
```

Das Skript installiert automatisch:

- Node.js 18.x
- PostgreSQL
- PM2 (Process Manager)
- Chromium Browser
- Kiosk-Modus Autostart

#### 3. App konfigurieren

```bash
cd ~/Prasco
cp .env.production .env
nano .env  # Passwörter anpassen!
```

#### 4. App starten

```bash
npm ci --only=production
npm run build
pm2 start dist/server.js --name prasco
pm2 save
```

#### 5. Neustart

```bash
sudo reboot
```

Nach dem Neustart startet automatisch:

- PRASCO Server (via PM2)
- Chromium im Kiosk-Modus mit Display-Seite

### Deployment von Windows aus

```powershell
# PowerShell:
.\scripts\deploy-to-pi.ps1 -PiHost "192.168.1.100"
```

---

## Server Deployment (Linux)

### Voraussetzungen

- Ubuntu 20.04+ / Debian 11+
- Node.js 18.x
- PostgreSQL 15+
- nginx (optional, für Reverse Proxy)

### 1. Dependencies installieren

```bash
# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# PM2
sudo npm install -g pm2
```

### 2. Datenbank einrichten

```bash
sudo -u postgres psql
CREATE USER prasco WITH PASSWORD 'sicheres_passwort';
CREATE DATABASE bulletin_board OWNER prasco;
\q
```

### 3. App installieren

```bash
cd /opt
sudo git clone <repository-url> prasco
sudo chown -R $USER:$USER prasco
cd prasco

cp .env.production .env
nano .env  # Konfiguration anpassen

npm ci --only=production
npm run build
```

### 4. PM2 konfigurieren

```bash
pm2 start dist/server.js --name prasco
pm2 startup
pm2 save
```

### 5. nginx Reverse Proxy (optional)

```nginx
# /etc/nginx/sites-available/prasco
server {
    listen 80;
    server_name signage.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload-Limit erhöhen
    client_max_body_size 50M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/prasco /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Kiosk-Modus Konfiguration

### Chromium Autostart mit Ton

Der Kiosk-Modus startet automatisch mit diesen Parametern:

```bash
chromium-browser \
  --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --start-fullscreen \
  http://localhost:3000/public/display.html
```

**Wichtige Parameter:**

- `--autoplay-policy=no-user-gesture-required` - Ermöglicht Video-Autoplay mit Ton
- `--kiosk` - Vollbild ohne Browser-UI
- `--disable-infobars` - Keine Benachrichtigungen

### Bildschirm-Einstellungen

```bash
# Bildschirmschoner deaktivieren
xset s off
xset -dpms
xset s noblank

# Mauszeiger verstecken
unclutter -idle 0.5 -root &
```

### Display-Rotation

Für vertikale Monitore in `/boot/config.txt`:

```
display_rotate=1  # 90° im Uhrzeigersinn
# display_rotate=3  # 90° gegen Uhrzeigersinn
```

---

## Backup & Wartung

### Datenbank-Backup

```bash
# Backup erstellen
pg_dump -U prasco bulletin_board > backup_$(date +%Y%m%d).sql

# Backup wiederherstellen
psql -U prasco bulletin_board < backup.sql
```

### Uploads sichern

```bash
tar -czvf uploads_backup.tar.gz uploads/
```

### Logs prüfen

```bash
pm2 logs prasco
pm2 monit
```

### Update durchführen

```bash
cd ~/Prasco
git pull
npm ci --only=production
npm run build
pm2 restart prasco
```

---

## Troubleshooting

### Server startet nicht

```bash
# Logs prüfen
pm2 logs prasco --lines 50

# Datenbank-Verbindung testen
psql -h localhost -U prasco bulletin_board -c "SELECT 1"

# Port prüfen
netstat -tlnp | grep 3000
```

### Display bleibt schwarz

```bash
# Chromium manuell starten
DISPLAY=:0 chromium-browser http://localhost:3000

# Server erreichbar?
curl http://localhost:3000/api/health
```

### YouTube-Videos funktionieren nicht

- **Fehler 153**: Video erlaubt keine Einbettung (Uploader-Einstellung)
- **Kein Ton**: `--autoplay-policy=no-user-gesture-required` prüfen
- **Netzwerk**: Internetzugang auf dem Pi prüfen

### Hohe CPU-Last

```bash
# Prozesse prüfen
htop

# PM2 Neustart
pm2 restart prasco

# Chromium-Cache leeren
rm -rf ~/.cache/chromium
```

---

## Sicherheits-Checkliste

- [ ] Alle Standard-Passwörter geändert
- [ ] JWT_SECRET ist ein langer, zufälliger String
- [ ] Firewall konfiguriert (nur Port 3000 oder 80/443)
- [ ] SSH-Zugang abgesichert (Key-Auth, Port ändern)
- [ ] Regelmäßige Backups eingerichtet
- [ ] HTTPS für öffentliche Server aktiviert
- [ ] Admin-Passwort ist sicher

---

## Unterstützung

Bei Problemen:

1. Logs prüfen: `pm2 logs prasco`
2. GitHub Issues öffnen
3. Dokumentation in README.md lesen
