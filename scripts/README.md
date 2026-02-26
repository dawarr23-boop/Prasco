# PRASCO Scripts

Dieses Verzeichnis enthält Hilfs-Skripte für Installation, Wartung und Deployment.

## 📋 Script-Übersicht

### 🚀 Installation & Setup

#### `auto-install.sh` ✅
**Status:** Aktuell
**Zweck:** Automatischer Installer für First-Boot (Raspberry Pi)
**Verwendung:** `curl -sSL https://raw.githubusercontent.com/.../auto-install.sh | bash`
**Features:**
- Installiert Node.js 18.x
- Installiert PostgreSQL, PM2
- Klont Repository
- Startet interaktive Einrichtung

#### `first-run.sh` ✅
**Status:** Aktuell
**Zweck:** Schnellstart für Ersteinrichtung
**Verwendung:** `./scripts/first-run.sh`
**Features:**
- Prüft Voraussetzungen (Node.js, PostgreSQL)
- Erstellt Standard-.env Datei
- Minimales Setup für schnellen Start

#### `setup-production.sh` ✅
**Status:** Aktuell
**Zweck:** Vollständige interaktive Produktions-Einrichtung
**Verwendung:** `./scripts/setup-production.sh`
**Features:**
- Komplettes Setup mit allen Abhängigkeiten
- PostgreSQL-Konfiguration
- PM2-Setup
- SSL-Zertifikate
- Kiosk-Mode für Raspberry Pi

#### `firstboot-setup.sh` ✅
**Status:** Aktuell
**Zweck:** First-Boot Service Installer für Raspberry Pi
**Verwendung:** Automatisch beim First-Boot (via systemd)
**Features:**
- Wartet auf Netzwerkverbindung
- Setzt Hostname
- Installiert Node.js 18.x, PostgreSQL, PM2
- Klont Repository
- Bereitet interaktives Setup vor

#### `setup-raspi.sh` ✅ (Legacy)
**Status:** Veraltet aber funktional
**Zweck:** Legacy Raspberry Pi Setup (manuell)
**Verwendung:** `sudo bash scripts/setup-raspi.sh`
**Hinweis:** 
- Script warnt und empfiehlt `setup-production.sh`
- Enthält Legacy-Warnung
- Verwendet korrekte Pfade (`dist/server.js`)
- Display-URL korrigiert (http://localhost:3000)

### 🔄 Updates & Wartung

#### `update.sh` ✅
**Status:** Aktuell
**Zweck:** PRASCO auf neueste Version aktualisieren
**Verwendung:** `./scripts/update.sh`
**Features:**
- Git Pull mit Stash-Support
- npm Dependencies Update
- TypeScript Build
- PM2 Neustart

#### `backup.sh` ✅
**Status:** Aktuell
**Zweck:** Backup von Datenbank und Uploads
**Verwendung:** `./scripts/backup.sh`
**Features:**
- PostgreSQL Dump
- Upload-Dateien sichern
- Automatische Bereinigung alter Backups

#### `restore.sh` ✅
**Status:** Aktuell
**Zweck:** Backup wiederherstellen
**Verwendung:** `./scripts/restore.sh [backup-path]`
**Features:**
- Interaktive Backup-Auswahl
- Datenbank-Restore (PostgreSQL)
- Upload-Dateien wiederherstellen
- .env Wiederherstellung (optional)
- Sicherheitsabfragen

### 📊 Monitoring & Diagnostik

#### `health-check.sh` ✅
**Status:** Aktuell
**Zweck:** System-Diagnose und Status-Check
**Verwendung:** `./scripts/health-check.sh`
**Features:**
- System-Informationen (CPU, RAM, Disk)
- Service-Status (PostgreSQL, PM2, Node.js)
- PRASCO-Anwendungs-Status
- Netzwerk-Checks

### 🔐 Sicherheit

#### `generate-ssl-cert.sh` ✅
**Status:** Aktuell
**Zweck:** Selbstsignierte SSL-Zertifikate erstellen
**Verwendung:** `./scripts/generate-ssl-cert.sh [hostname] [ip]`
**Features:**
- Erstellt SSL-Zertifikate für HTTPS
- Unterstützt Hostname und IP als Subject Alternative Names

### 🚢 Deployment

#### `deploy-to-pi.ps1` ✅
**Status:** Aktuell (gerade gefixt)
**Zweck:** Windows PowerShell Deployment zu Raspberry Pi
**Verwendung:** `.\scripts\deploy-to-pi.ps1 -PiHost "192.168.1.100" -PiUser "pi"`
**Features:**
- TypeScript Build
- SCP File Transfer
- Remote PM2 Neustart
**Änderungen:**
- ✅ `index.html` entfernt (nicht mehr benötigt)
- ✅ Verwendet `dist/server.js` statt `server.js`

#### `prepare-sd-card.ps1`
**Status:** Zu prüfen
**Zweck:** SD-Karte für Raspberry Pi vorbereiten
**Verwendung:** `.\scripts\prepare-sd-card.ps1`

### 🗄️ Datenbank

#### TypeScript Seeder (Best Practice) ✅
**Status:** Aktuell & Empfohlen
**Zweck:** Vollständiges Database Seeding mit TypeScript
**Verwendung:**
```bash
# Haupt-Seed (User, Organisationen, Kategorien, Demo-Posts)
npm run db:seed

# HTML-Beispielposts (9 verschiedene Designs + 2 Text-Posts)
npm run db:seed-examples
```
**Vorteile:**
- Konsistent mit TypeScript-Projekt
- Type-Safety und IDE-Unterstützung
- Funktioniert lokal UND auf Raspberry Pi (nach Build)
- Teil des offiziellen Seeder-Systems

#### `seed-permissions.js` ✅
**Status:** Aktuell (Legacy JavaScript)
**Zweck:** Berechtigungen in Datenbank seeden
**Verwendung:** `npm run build && node scripts/seed-permissions.js`
**Hinweis:** Wird in Zukunft durch TypeScript-Seeder ersetzt

#### `test-permissions.js` ✅
**Status:** Aktuell (Legacy JavaScript)
**Zweck:** Berechtigungen testen
**Verwendung:** `npm run build && node scripts/test-permissions.js`

### 🖥️ Raspberry Pi Spezifisch

#### `start-kiosk.sh` ✅
**Status:** Aktuell (gerade gefixt)
**Zweck:** Startet Chromium im Kiosk-Modus
**Verwendung:** Automatisch bei Boot (via systemd)
**Features:**
- Wartet auf Server-Verfügbarkeit
- Auto-Erkennung HTTP/HTTPS
- Display-URL korrigiert (http://localhost:3000)
- Bildschirmschoner deaktiviert
- Mauszeiger versteckt

#### `setup-git-on-pi.sh` ✅
**Status:** Aktuell (gerade gefixt)
**Zweck:** Git Repository auf Raspberry Pi klonen und einrichten
**Verwendung:** `./scripts/setup-git-on-pi.sh`
**Features:**
- Klont Repository
- Installiert Dependencies
- Kompiliert TypeScript
- Erstellt .env
- Zeigt nächste Schritte

#### `prepare-sd-card.ps1` ✅
**Status:** Aktuell
**Zweck:** SD-Karte für Raspberry Pi vorbereiten (Windows)
**Verwendung:** `.\scripts\prepare-sd-card.ps1` (Als Administrator)
**Features:**
- Lädt Raspberry Pi OS herunter
- Erstellt bootfähige SD-Karte
- Konfiguriert WiFi und SSH
- Setzt First-Boot Script
**Verwendung:** `./scripts/setup-git-on-pi.sh`

## 🔧 Bekannte Probleme & Fixes

### ✅ Behobene Probleme (2026-01-01)

1. **deploy-to-pi.ps1**: `index.html` entfernt (existiert nicht mehr)
2. **seed-permissions.js**: Pfad zu `dist/` korrigiert
3. **test-permissions.js**: Pfad zu `dist/` korrigiert, verwendet .env Variablen

### ⚠️ Zu behebende Probleme

1. **auto-install.sh**: Node.js Version veraltet (16.x → 18.x/20.x)
2. **JavaScript-Skripte**: Benötigen `npm run build` vorher
3. **Pfad-Konsistenz**: Einige Skripte könnten noch alte Pfade verwenden

## 📝 Verwendungshinweise

### TypeScript-Projekt
Da PRASCO auf TypeScript migriert wurde:

1. **Immer erst kompilieren:**
   ```bash
   npm run build
   ```

2. **Node.js Skripte** benötigen kompilierten Code in `dist/`:
   ```bash
   npm run build && node scripts/seed-permissions.js
   ```

3. **package.json Scripts** verwenden wenn möglich:
   ```bash
   npm run db:seed  # statt direktes Script
   ```

### Für Entwicklung
```bash
npm run dev          # Development mit Auto-Reload
npm run build:watch  # TypeScript im Watch-Modus
```

### Für Produktion
```bash
npm run build        # TypeScript kompilieren
npm start            # Production-Server starten
```

---

## 📺 Display Configuration Scripts

### `start-kiosk.sh` ✅
**Status:** Aktuell (mit Display-Config Support)
**Zweck:** Startet Kiosk-Modus mit Display-spezifischer Konfiguration
**Verwendung:** `bash ~/Prasco/scripts/start-kiosk.sh`
**Features:**
- Lädt Display-Konfiguration aus `/etc/prasco/display-config.json`
- HTTPS/HTTP Auto-Detection
- Display-ID wird an URL angehängt
- Chromium Fullscreen-Kiosk-Modus
- Wartet auf Server-Verfügbarkeit

**Ausgabe:**
```
🚀 PRASCO Kiosk-Modus wird gestartet...
✓ Lade Display-Konfiguration: /etc/prasco/display-config.json
✓ Display-ID: empfang
✓ Verwende HTTPS
✓ Öffne Display-spezifische URL: https://localhost:3000/public/display.html?id=empfang
🌐 Starte Chromium im Kiosk-Modus...
```

### `setup-display-config.sh` ✅
**Status:** Neu (Februar 2026)
**Zweck:** Interaktives Setup für Display-Konfiguration (lokal)
**Verwendung:** `sudo bash ~/Prasco/scripts/setup-display-config.sh`
**Features:**
- Erstellt `/etc/prasco/display-config.json`
- Interaktive Eingabe von Display-ID, Name, Server-URL
- JSON-Validierung
- Prüft Backend-Verfügbarkeit
- Setzt korrekte Berechtigungen

**Workflow:**
```bash
# Auf dem Raspberry Pi
cd ~/Prasco/scripts
sudo bash setup-display-config.sh

# Folge den Anweisungen:
# - Display-Identifier: empfang
# - Display-Name: Empfangsbereich
# - Auto-Start: ja
# - Server-URL: https://localhost:3000
```

### `remote-display-config.sh` ✅
**Status:** Neu (Februar 2026)
**Zweck:** Remote-Konfiguration via SSH (von anderem Computer)
**Verwendung:** `./remote-display-config.sh <pi-host> <display-id> [name] [url]`
**Features:**
- Konfiguration via SSH übertragen
- Kein Login auf dem Pi notwendig
- Automatischer Kiosk-Neustart (optional)
- Für Bulk-Updates mehrerer Pis

**Beispiele:**
```bash
# Von deinem Computer aus
./remote-display-config.sh 192.168.2.173 empfang "Empfangsbereich"
./remote-display-config.sh pi-display-1 raum-1 "Raum 1"
./remote-display-config.sh 192.168.2.175 kantine "Kantine" https://192.168.1.100:3000
```

**Voraussetzungen:**
```bash
# SSH-Key Setup (einmalig)
ssh-copy-id pi@192.168.2.173

# Verbindung testen
ssh pi@192.168.2.173 "echo OK"
```

**Bulk-Konfiguration:**
```bash
#!/bin/bash
# Mehrere Pis auf einmal konfigurieren
./remote-display-config.sh 192.168.2.173 empfang "Empfangsbereich"
./remote-display-config.sh 192.168.2.174 kantine "Kantine"
./remote-display-config.sh 192.168.2.175 raum-1 "Raum 1"
```

### Display Configuration Schema
**Pfad:** `/etc/prasco/display-config.json`

```json
{
  "displayId": "empfang",
  "displayName": "Empfangsbereich",
  "autoStart": true,
  "serverUrl": "https://localhost:3000",
  "configVersion": "1.0",
  "lastUpdated": "2026-02-08T20:45:00Z"
}
```

**Dokumentation:** Siehe [DISPLAY-CONFIGURATION.md](../docs/DISPLAY-CONFIGURATION.md)

---

## 🔄 Empfohlene Update-Reihenfolge

1. `update.sh` - Aktuell, kann verwendet werden
2. `backup.sh` vor größeren Änderungen ausführen
3. `health-check.sh` nach Updates zur Verifikation

## 📚 Weitere Dokumentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Deployment-Guide
- [RASPBERRY-PI-SETUP.md](../RASPBERRY-PI-SETUP.md) - Raspberry Pi spezifisch
- [DEV-SETUP.md](../DEV-SETUP.md) - Entwicklungsumgebung

## 🚨 Wartungsbedarf

### ✅ Alle überprüft und aktuell!
- [x] `auto-install.sh` - Node.js 18.x wird verwendet
- [x] `deploy-to-pi.ps1` - index.html entfernt, dist/ Pfade korrekt
- [x] `seed-permissions.js` - TypeScript Pfade korrekt
- [x] `test-permissions.js` - TypeScript Pfade korrekt
- [x] `firstboot-setup.sh` - Node.js 18.x, korrekte Pfade
- [x] `setup-raspi.sh` - Legacy-Warnung, dist/ Pfade, Display-URL korrigiert
- [x] `setup-git-on-pi.sh` - TypeScript Build, hilfreiche Hinweise
- [x] `start-kiosk.sh` - HTTP/HTTPS Auto-Detect, korrekte Display-URL
- [x] `prepare-sd-card.ps1` - Aktuell, vollständig funktional
- [x] `restore.sh` - Getestet und dokumentiert

### Niedrige Priorität
- [ ] PowerShell-Skripte für Linux-Alternative erwägen
- [ ] CI/CD Integration für automatische Script-Tests
