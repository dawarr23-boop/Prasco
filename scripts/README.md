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
