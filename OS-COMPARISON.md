# 🍓 Betriebssystem-Vergleich für PRASCO

Übersicht über die unterstützten Betriebssysteme für den Raspberry Pi mit PRASCO.

## Schnellvergleich

| Feature | Raspberry Pi OS Lite | Raspberry Pi OS Desktop | DietPi |
|---------|---------------------|------------------------|---------|
| **Größe (Download)** | ~400 MB | ~1 GB | ~150 MB |
| **RAM-Verbrauch (Idle)** | ~50-100 MB | ~300-500 MB | ~30-50 MB |
| **Grafische Oberfläche** | ❌ Nein (Headless) | ✅ Ja (LXDE) | ❌ Nein (Headless) |
| **Kiosk-Modus Support** | ⚠️ Manuell (X11 installieren) | ✅ Nativ | ⚠️ Manuell (X11 installieren) |
| **Boot-Zeit** | ~20-30 Sek | ~40-60 Sek | ~15-20 Sek |
| **Für Anfänger** | ✅ Gut | ✅✅ Sehr gut | ⚠️ Fortgeschritten |
| **Offizielles Support** | ✅✅ Raspberry Pi Foundation | ✅✅ Raspberry Pi Foundation | ✅ Community |
| **Optimierung** | ✅ Standard | ✅ Standard | ✅✅ Maximale Optimierung |

---

## 1. Raspberry Pi OS Lite (64-bit)

### 📦 Beschreibung
Minimales, kommandozeilenbasiertes Betriebssystem ohne grafische Oberfläche.

### ✅ Vorteile
- **Klein und schlank**: Nur ~400 MB Download
- **Niedriger Ressourcenverbrauch**: Ideal für Server/Headless-Betrieb
- **Offiziell unterstützt**: Direkt von der Raspberry Pi Foundation
- **Stabil**: Gut getestet, regelmäßige Updates
- **Schnell**: Kurze Boot-Zeiten

### ❌ Nachteile
- **Kein Desktop**: Kiosk-Modus erfordert manuelle X11-Installation
- **SSH-only**: Zugriff primär über Netzwerk
- **Mehr Konfiguration**: Mehr manuelle Schritte für Display-Setup

### 🎯 Ideal für
- ✅ Headless-Server-Betrieb
- ✅ API-Backend ohne Display
- ✅ Erfahrene Benutzer mit SSH-Zugriff
- ✅ Minimaler Ressourcen-Fußabdruck wichtig
- ❌ NICHT ideal für Kiosk-Modus

### 📋 PRASCO-Setup
```bash
# Nach Erstinstallation (automatisch):
# - Node.js, PostgreSQL, PM2
# - PRASCO Backend läuft

# Für Display/Kiosk (manuell):
sudo apt install xorg chromium-browser
# Dann Kiosk-Setup wie in Dokumentation
```

**Empfehlung**: ⭐⭐⭐ **Gut für Backend-only oder Remote-Administration**

---

## 2. Raspberry Pi OS Desktop (64-bit)

### 📦 Beschreibung
Vollständiges Betriebssystem mit LXDE Desktop-Umgebung und vorinstallierten Anwendungen.

### ✅ Vorteile
- **Grafische Oberfläche**: LXDE Desktop out-of-the-box
- **Kiosk-Ready**: Chromium bereits installiert
- **Anfängerfreundlich**: Einfache Bedienung mit Maus/Tastatur
- **Debugging einfacher**: Visuelle Tools verfügbar
- **Offiziell unterstützt**: Raspberry Pi Foundation

### ❌ Nachteile
- **Größer**: ~1 GB Download
- **Mehr RAM**: ~300-500 MB Grundverbrauch
- **Langsamerer Boot**: ~40-60 Sekunden
- **Mehr Updates**: Größere Update-Pakete

### 🎯 Ideal für
- ✅ Kiosk-Modus / Digital Signage (Display-Betrieb)
- ✅ Lokale Verwaltung mit Monitor/Tastatur/Maus
- ✅ Anfänger ohne Linux-Erfahrung
- ✅ Entwicklung und Testing direkt am Gerät
- ✅ Visuelles Debugging

### 📋 PRASCO-Setup
```bash
# Nach Erstinstallation (automatisch):
# - Node.js, PostgreSQL, PM2, Chromium
# - PRASCO Backend läuft
# - Kiosk-Modus ist vorkonfiguriert

# Einfach starten:
./scripts/start-kiosk.sh
```

**Empfehlung**: ⭐⭐⭐⭐⭐ **BESTE WAHL für Digital Signage / Kiosk-Modus**

---

## 3. DietPi (64-bit)

### 📦 Beschreibung
Ultra-schlankes, hochoptimiertes Betriebssystem speziell für minimalen Ressourcenverbrauch.

### ✅ Vorteile
- **Extrem klein**: Nur ~150 MB Download
- **Minimal RAM**: Nur ~30-50 MB im Idle
- **Schnellster Boot**: ~15-20 Sekunden
- **Maximale Performance**: Alle unnötigen Services deaktiviert
- **DietPi-Software**: Einfache Installation von Software-Paketen
- **Optimiert**: Speziell für Single-Board-Computer

### ❌ Nachteile
- **Community Support**: Nicht offiziell von RPi Foundation
- **Kein Desktop**: Standard ist Headless
- **Weniger verbreitet**: Weniger Tutorials/Dokumentation
- **Fortgeschritten**: Mehr Linux-Kenntnisse erforderlich

### 🎯 Ideal für
- ✅ Maximale Performance wichtig
- ✅ Sehr alte/schwache Hardware (Pi 3, Pi Zero 2)
- ✅ Mehrere Services auf einem Pi
- ✅ Erfahrene Linux-Benutzer
- ✅ Minimaler Stromverbrauch wichtig
- ⚠️ Mit Vorsicht für Kiosk (manuelles X11-Setup)

### 📋 PRASCO-Setup
```bash
# DietPi-Software nutzen für Basisinstallation:
dietpi-software install 9   # Node.js
dietpi-software install 194 # PostgreSQL
dietpi-software install 113 # X11 (für Kiosk)

# Dann PRASCO wie gewohnt installieren
cd ~/Prasco
./scripts/setup-production.sh
```

**Empfehlung**: ⭐⭐⭐⭐ **Gut für fortgeschrittene Benutzer, die maximale Performance wollen**

---

## Entscheidungshilfe

### Für Digital Signage / Kiosk-Modus (Display):
```
🏆 1. Raspberry Pi OS Desktop  ⭐⭐⭐⭐⭐
   2. DietPi (mit X11)          ⭐⭐⭐⭐
   3. Raspberry Pi OS Lite      ⭐⭐
```

**Warum Desktop?**
- Chromium bereits installiert
- Kiosk-Setup am einfachsten
- Visuelles Debugging möglich
- Plug-and-Play Erfahrung

### Für Headless Backend (ohne Display):
```
🏆 1. DietPi                    ⭐⭐⭐⭐⭐
   2. Raspberry Pi OS Lite     ⭐⭐⭐⭐
   3. Raspberry Pi OS Desktop  ⭐⭐
```

**Warum DietPi/Lite?**
- Minimal Ressourcen
- Schneller
- Kein Desktop verschwendet RAM
- Reine Server-Anwendung

### Für Anfänger:
```
🏆 1. Raspberry Pi OS Desktop  ⭐⭐⭐⭐⭐
   2. Raspberry Pi OS Lite     ⭐⭐⭐
   3. DietPi                    ⭐⭐
```

**Warum Desktop?**
- Bekannte Desktop-Umgebung
- Einfach zu bedienen
- Offiziell unterstützt
- Viele Tutorials verfügbar

### Für maximale Performance:
```
🏆 1. DietPi                    ⭐⭐⭐⭐⭐
   2. Raspberry Pi OS Lite     ⭐⭐⭐⭐
   3. Raspberry Pi OS Desktop  ⭐⭐
```

---

## Hardware-Empfehlungen

### Raspberry Pi 4 (4GB+)
- **Alle OS**: ✅ Funktionieren perfekt
- **Empfehlung**: Desktop für Kiosk, Lite für Headless

### Raspberry Pi 4 (2GB)
- **Desktop**: ✅ Funktioniert, kann knapp werden bei vielen Tabs
- **Lite/DietPi**: ✅✅ Perfekt
- **Empfehlung**: Lite oder DietPi

### Raspberry Pi 3B+
- **Desktop**: ⚠️ Funktioniert, aber langsam
- **Lite**: ✅ Gut
- **DietPi**: ✅✅ Am besten
- **Empfehlung**: DietPi für beste Performance

### Raspberry Pi Zero 2 W
- **Desktop**: ❌ Zu langsam
- **Lite**: ⚠️ Funktioniert, aber langsam
- **DietPi**: ✅ Beste Option
- **Empfehlung**: Nur DietPi

---

## Installations-Vergleich

### Mit `prepare-sd-card.ps1` (Windows):
```powershell
# Für alle drei OS identisch einfach:
.\scripts\prepare-sd-card.ps1

# Interaktive Auswahl:
# 1) Raspberry Pi OS Lite
# 2) Raspberry Pi OS Desktop  ← Empfohlen für Kiosk
# 3) DietPi                   ← Empfohlen für Performance
```

### Manuelle Installation:
- **Pi OS**: Raspberry Pi Imager (offiziell, einfach)
- **DietPi**: dietpi.com → Download → Flash mit Imager

---

## Migration zwischen OS

Falls du später wechseln möchtest:

### Datenbank sichern:
```bash
# Auf altem System:
pg_dump -U prasco bulletin_board > ~/backup.sql

# Auf neuem System:
psql -U prasco bulletin_board < ~/backup.sql
```

### Uploads sichern:
```bash
# Auf altem System:
tar -czf ~/uploads-backup.tar.gz ~/Prasco/uploads/

# Auf neuem System:
tar -xzf ~/uploads-backup.tar.gz -C ~/Prasco/
```

### Konfiguration sichern:
```bash
# Sicher .env Datei
cp ~/Prasco/.env ~/prasco-env-backup.txt

# Auf neuem System einfach wieder einfügen
```

---

## FAQ

### Kann ich von Lite auf Desktop upgraden?
Ja, aber **nicht empfohlen**. Besser: Frische Installation.

### Verbraucht DietPi wirklich so viel weniger?
Ja! Tests zeigen:
- DietPi: ~50 MB RAM idle
- Lite: ~100 MB RAM idle  
- Desktop: ~400 MB RAM idle

### Ist DietPi sicher?
Ja, DietPi ist Open Source und wird aktiv gepflegt. Nutzt Debian-Sicherheitsupdates.

### Welches OS für 24/7 Betrieb?
Alle drei sind stabil für 24/7. DietPi hat Vorteile bei Stromverbrauch.

### Kann ich mehrere PRASCO-Instanzen betreiben?
Ja! Benutze verschiedene Hostnamen und statische IPs.

---

## Zusammenfassung

| Use Case | Empfehlung | Grund |
|----------|-----------|-------|
| **Digital Signage (Display)** | 🏆 **Pi OS Desktop** | Chromium inkludiert, einfachstes Setup |
| **Headless Server** | 🏆 **DietPi** | Minimal, schnell, optimiert |
| **Anfänger** | 🏆 **Pi OS Desktop** | Am einfachsten, best supported |
| **Alte Hardware (Pi 3)** | 🏆 **DietPi** | Beste Performance |
| **Entwicklung/Testing** | 🏆 **Pi OS Desktop** | Visuelle Tools, einfaches Debugging |
| **Produktions-Server** | 🏆 **DietPi / Lite** | Stabil, minimal, sicher |

---

**💡 Generelle Empfehlung für PRASCO:**

Wenn du PRASCO als **digitales schwarzes Brett mit Display** nutzen willst:
→ **Raspberry Pi OS Desktop** 🎯

Wenn du PRASCO als **Headless-Backend** betreiben willst:
→ **DietPi** (Performance) oder **Raspberry Pi OS Lite** (Kompatibilität) 🎯

---

_Stand: Dezember 2024 | PRASCO v1.0_
