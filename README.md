# PRASCO - Digitales Schwarzes Brett

Ein vollständiges digitales Schwarzes Brett (Digital Signage) für Raspberry Pi mit Webinterface zur Verwaltung von Inhalten.

[![GitHub](https://img.shields.io/github/license/dawarr23-boop/Prasco)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 📋 Übersicht

Dieses Projekt stellt ein digitales Schwarzes Brett bereit, das auf einem Fernseher über einen Raspberry Pi angezeigt wird. Es verfügt über:

- **Public Display**: Vollbild-Anzeige mit automatischer Rotation von Beiträgen
- **Responsive Layout**: Inhalte passen sich automatisch ohne Scrollen an die Bildschirmgröße an
- **Admin-Panel**: Webbasierte Verwaltungsoberfläche mit persistenten Einstellungen
- **Flexible Inhalte**: Text, Bilder, Videos, HTML, PowerPoint-Präsentationen
- **Zeitplanung**: Start- und End-Datum für Beiträge
- **Kategorien**: Organisierung und Filterung von Inhalten mit Farbcodierung
- **Auto-Refresh**: Automatische Aktualisierung der Anzeige
- **Hintergrundmusik**: Globale Musik-Unterstützung mit automatischer Video-Stummschaltung
- **Vortragsmodus**: Manuelle Navigation für Präsentationen
- **Multi-DB Support**: SQLite für Entwicklung, PostgreSQL für Produktion

## 📁 Projektstruktur

```
digital-bulletin-board/
├── views/
│   ├── admin/
│   │   ├── login.html       # Admin-Login
│   │   └── dashboard.html   # Admin-Dashboard
│   └── public/
│       └── display.html     # Öffentliche Anzeige
├── css/
│   ├── display.css          # Styles für Display
│   ├── admin.css            # Styles für Admin
│   └── styles.css           # Allgemeine Styles
├── js/
│   ├── display.js           # Display-Logik
│   ├── admin.js             # Admin-Dashboard-Logik
│   ├── admin-login.js       # Login-Logik
│   └── script.js            # Allgemeine Scripts
├── server.js                # Node.js Express Server
├── package.json             # NPM Dependencies
├── .env.example             # Umgebungsvariablen Template
└── README.md                # Dokumentation
```

## 🚀 Schnellstart

### Voraussetzungen

- **Node.js** (v18 oder höher)
- **NPM** oder **Yarn**
- Für Raspberry Pi: Raspberry Pi 3B+ oder 4
- Fernseher mit HDMI-Anschluss

### Installation

```powershell
# Dependencies installieren
npm install

# Umgebungsvariablen einrichten (SQLite wird automatisch verwendet)
copy .env.example .env

# Server starten (erstellt SQLite-Datenbank automatisch)
npm start
```

### Entwicklungsmodus

```powershell
# Development-Server mit SQLite und Auto-Reload
npm run dev
```

> **Hinweis:** Für lokale Entwicklung wird automatisch SQLite verwendet. Für Produktion auf Raspberry Pi wird PostgreSQL empfohlen (siehe Deployment-Abschnitt).

## 💻 Verwendung

### Display öffnen

Nach dem Start des Servers:

- **Display-Ansicht**: `http://localhost:3000`
- **Admin-Login**: `http://localhost:3000/admin`

**Demo-Zugangsdaten:**

- Benutzername: `admin`
- Passwort: `admin`

### Funktionen

#### Public Display

- Automatische Rotation von Beiträgen
- Anzeige von Text, Bildern und Videos
- Echtzeit-Uhr und Datum
- Tastatur-Navigation (Pfeiltasten, R für Refresh)
- Auto-Refresh alle 5 Minuten

#### Admin-Panel

- Dashboard mit Statistiken
- Beiträge erstellen, bearbeiten, löschen
- Kategorien verwalten
- Zeitplanung für Beiträge
- Prioritäten festlegen
- Anzeigedauer konfigurieren

## 🛠️ Verfügbare Skripte

PRASCO enthält mehrere Hilfsskripte für Einrichtung, Wartung und Betrieb:

### SD-Karten Vorbereitung (Windows)

| Skript                        | Beschreibung                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `scripts/prepare-sd-card.ps1` | **SD-Karten Setup** - Lädt Pi OS, schreibt auf SD-Karte, konfiguriert Auto-Setup |

### Raspberry Pi Installation

| Skript                        | Beschreibung                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/auto-install.sh`     | **One-Liner Installation** - `curl -sSL https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/auto-install.sh \| bash` |
| `scripts/setup-production.sh` | **Interaktives Produktions-Setup** - Vollständige Ersteinrichtung mit Datenbank, PM2, Kiosk-Modus                                    |
| `scripts/firstboot-setup.sh`  | First-Boot Service für automatische Installation                                                                                     |

### Wartung & Betrieb

| Skript                     | Beschreibung                               |
| -------------------------- | ------------------------------------------ |
| `scripts/first-run.sh`     | Schnellstart nach dem Klonen               |
| `scripts/health-check.sh`  | Systemdiagnose und Status-Übersicht        |
| `scripts/update.sh`        | PRASCO auf neueste Version aktualisieren   |
| `scripts/backup.sh`        | Backup von Datenbank und Uploads erstellen |
| `scripts/restore.sh`       | Backup wiederherstellen                    |
| `scripts/start-kiosk.sh`   | Browser im Kiosk-Modus starten             |
| `scripts/deploy-to-pi.ps1` | Windows: Deploy auf Raspberry Pi           |

### Verwendung

```bash
# Produktions-Setup (empfohlen für Ersteinrichtung)
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh

# Systemstatus prüfen
./scripts/health-check.sh

# Backup erstellen
./scripts/backup.sh

# Update durchführen
./scripts/update.sh
```

---

## 🍓 Raspberry Pi Deployment

### Option 1: Vollautomatische SD-Karten-Vorbereitung (Windows) ⭐⭐⭐

Das einfachste Setup - bereitet eine SD-Karte vor, die beim ersten Start automatisch alles installiert:

```powershell
# PowerShell als Administrator ausführen
.\scripts\prepare-sd-card.ps1
```

Das Skript:

1. Lädt Raspberry Pi OS automatisch herunter
2. Schreibt das Image auf die SD-Karte
3. Konfiguriert SSH, WLAN und Benutzer
4. Richtet automatische PRASCO-Installation beim ersten Start ein

Nach dem ersten Boot: SSH-Verbindung herstellen und interaktives Setup starten.

---

### Option 2: One-Liner Installation (auf bestehendem Pi) ⭐⭐

Auf einem frischen Raspberry Pi OS einfach ausführen:

```bash
curl -sSL https://raw.githubusercontent.com/dawarr23-boop/Prasco/main/scripts/auto-install.sh | bash
```

Dies installiert automatisch alle Abhängigkeiten und startet das interaktive Setup.

---

### Option 3: Manuelles Setup ⭐

```bash
# Repository klonen
git clone https://github.com/dawarr23-boop/Prasco.git
cd prasco

# Interaktives Setup starten
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

Das Setup-Skript installiert automatisch alle Abhängigkeiten, richtet die Datenbank ein und konfiguriert den Kiosk-Modus.

Siehe [RASPBERRY-PI-SETUP.md](RASPBERRY-PI-SETUP.md) für die vollständige Anleitung.

---

### Manuelle Installation (Schritt für Schritt)

#### 1. Raspberry Pi vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 für Process Management
sudo npm install -g pm2

# PostgreSQL installieren
sudo apt-get install postgresql postgresql-contrib -y
```

#### 2. Projekt auf Raspberry Pi übertragen

```bash
# Via Git
git clone https://github.com/dawarr23-boop/Prasco.git
cd Prasco

# Dependencies installieren
npm install

# Umgebungsvariablen setzen
cp .env.example .env
nano .env
```

#### 3. Server mit PM2 starten

```bash
# Anwendung bauen
npm run build

# Anwendung starten
pm2 start dist/server.js --name prasco

# Auto-Start beim Booten
pm2 startup
pm2 save

# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs prasco
```

### 4. Browser im Kiosk-Modus (Autostart)

Datei bearbeiten: `/home/pi/.config/lxsession/LXDE-pi/autostart`

```bash
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --noerrdialogs --kiosk --incognito --disable-restore-session-state http://localhost:3000
```

Oder für vollständige Kontrolle eine Desktop-Datei erstellen:

```bash
nano ~/.config/autostart/bulletin-board.desktop
```

Inhalt:

```
[Desktop Entry]
Type=Application
Name=Digital Bulletin Board
Exec=chromium-browser --kiosk --incognito http://localhost:3000
```

### 5. Nginx Reverse Proxy (optional)

```nginx
# /etc/nginx/sites-available/bulletin-board
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktivieren:

```bash
sudo ln -s /etc/nginx/sites-available/bulletin-board /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🛠️ Konfiguration

### Umgebungsvariablen (.env)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
MAX_FILE_SIZE=10485760
```

### Display-Einstellungen

In `js/display.js`:

```javascript
// Auto-Refresh Intervall (Millisekunden)
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minuten

// Standard Anzeigedauer
const DEFAULT_DURATION = 10; // Sekunden
```

## 🎨 Anpassungen

### Farben ändern

In `css/display.css` oder `css/admin.css`:

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --dark-color: #1a1a1a;
  --light-color: #f8f9fa;
}
```

### Logo/Branding

Passen Sie die Header in den HTML-Dateien an:

```html
<div class="logo">Ihr Firmenname</div>
```

## 🔒 Sicherheit

⚠️ **Wichtig für Produktivbetrieb:**

1. Ändern Sie die Demo-Zugangsdaten
2. Verwenden Sie starke Secrets in `.env`
3. Implementieren Sie echte Authentifizierung (aktuell nur LocalStorage)
4. Aktivieren Sie HTTPS
5. Beschränken Sie Admin-Zugriff auf lokales Netzwerk

## 📱 Android Deployment

PRASCO kann auch als native Android App auf Smartphones, Tablets und Android TVs bereitgestellt werden:

### Option 1: Android App (Smartphones/Tablets)

WebView-basierte App für Android-Geräte mit Touchscreen:

```bash
# Siehe vollständige Anleitung
cat android-app/README.md
```

**Features:**
- WebView mit vollem JavaScript-Support
- Kiosk-Modus für Digital Signage
- Auto-Start beim Booten
- Offline-Cache

**Dokumentation:** [ANDROID-APP.md](ANDROID-APP.md)

### Option 2: Android TV App ⭐ (Empfohlen für TV-Displays)

Optimiert für Android TVs, Set-Top-Boxen und TV-Sticks:

```bash
# Siehe vollständige Anleitung
cat android-tv-app/README.md
```

**Features:**
- Leanback UI für TV
- Fernbedienungs-Navigation (D-Pad)
- 4K-optimiert
- Kiosk-Modus
- Hardware-beschleunigte Video-Wiedergabe

**Kompatibel mit:**
- NVIDIA Shield TV
- Mi Box
- Chromecast with Google TV
- Fire TV Stick
- Sony/Philips Android TVs

**Dokumentation:** [ANDROID-TV-APP.md](ANDROID-TV-APP.md)

### Option 3: Offline-Modus (Android mit WiFi Hotspot)

Android-Gerät als eigenständiger Server mit WiFi-Hotspot:

**Dokumentation:** [ANDROID-OFFLINE-MODE.md](ANDROID-OFFLINE-MODE.md)

---

## 📡 Raspberry Pi Offline-Modus / WiFi Hotspot

Raspberry Pi als WiFi Access Point für vollständigen Offline-Betrieb:

```bash
# Automatisches Setup
sudo bash scripts/setup-hotspot.sh
```

**Features:**
- ✅ Raspberry Pi als WiFi Hotspot
- ✅ Kein externes Netzwerk erforderlich
- ✅ Admin-Panel über WiFi erreichbar
- ✅ Ideal für mobile Events, Outdoor-Displays
- ✅ 5-Minuten Setup

**Nach Installation:**
- WiFi: `PRASCO-Display` (Passwort: `prasco123`)
- URL: `http://192.168.4.1:3000`
- Admin: `http://192.168.4.1:3000/admin`

**Anwendungsfälle:**
- Mobile Messen und Events ohne WLAN
- Outdoor-Installationen
- Demo-Präsentationen
- Remote Locations ohne Netzwerk
- Notfall-Backup bei Netzwerkausfall

**Dokumentation:** [RASPBERRY-PI-OFFLINE-MODE.md](RASPBERRY-PI-OFFLINE-MODE.md)

### 🎮 Boot-Menü für Modus-Auswahl

Automatisches Boot-Menü zur Auswahl zwischen Normal- und Hotspot-Modus:

```bash
# Boot-Menü installieren
sudo bash scripts/setup-boot-menu.sh
```

**Features:**
- ✅ Auswahl beim Booten zwischen Normal- und Hotspot-Modus
- ✅ 10 Sekunden Timeout für automatischen Start
- ✅ Permanente Speicherung der Auswahl
- ✅ Manueller Wechsel jederzeit: `prasco-mode`
- ✅ Status-Anzeige: `prasco-status`

**Beim Booten:**
```
╔════════════════════════════════════════════════╗
║          🍓 PRASCO Boot Modus Auswahl         ║
╚════════════════════════════════════════════════╝

  1) Normal-Modus (Standard)
  2) Hotspot-Modus (Offline)
  3) Aktuellen Modus ändern
  4) Beenden
```

**Dokumentation:** [RASPBERRY-PI-BOOT-MENU.md](RASPBERRY-PI-BOOT-MENU.md)

---

## 🔧 Entwicklung

### Backend-API erweitern

Die Grundstruktur für eine REST-API ist vorbereitet. Implementieren Sie:

1. Database-Anbindung (SQLite/PostgreSQL)
2. Authentication mit JWT
3. API-Routes in `src/routes/`
4. Controllers in `src/controllers/`
5. Models in `src/models/`

Beispiel-Struktur:

```
src/
├── config/
│   └── database.js
├── controllers/
│   ├── authController.js
│   ├── postController.js
│   └── publicController.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── models/
│   ├── User.js
│   └── Post.js
└── routes/
    ├── auth.js
    ├── posts.js
    └── public.js
```

## 📝 Roadmap

- [x] Backend-API mit SQLite/PostgreSQL
- [x] Echte Authentifizierung
- [x] Medien-Upload Funktion
- [ ] Multi-Display-Support
- [ ] WebSocket für Real-time Updates
- [ ] QR-Code Generator
- [ ] Wetter-Widget
- [ ] Kalender-Integration
- [ ] Analytics/Statistiken
- [x] **Android App** (WebView & Capacitor)
- [x] **Android TV App** (optimiert für TV-Displays)

## 🐛 Troubleshooting

### Browser startet nicht im Kiosk-Modus

```bash
# X-Server Zugriff erlauben
export DISPLAY=:0
xhost +
```

### Port bereits belegt

```bash
# Port prüfen
sudo netstat -tulpn | grep :3000

# Prozess beenden
sudo kill -9 <PID>
```

### PM2 Probleme

```bash
# PM2 zurücksetzen
pm2 kill
pm2 start server.js --name bulletin-board
```

## 📄 Lizenz

MIT License - Frei verwendbar für private und kommerzielle Zwecke

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

## ✨ Credits

- Erstellt mit Node.js, Express und Vanilla JavaScript
- UI-Design inspiriert von modernen Digital Signage Lösungen
- Entwickelt mit VS Code und GitHub Copilot

## 📞 Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue auf GitHub.

---

**Viel Erfolg mit Ihrem digitalen Schwarzen Brett! 🚀**
