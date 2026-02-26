# PRASCO Display-Konfiguration

Anleitung zur Einrichtung und Verwaltung von Display-spezifischen Inhalten auf Raspberry Pi Geräten.

## 🎯 Konzept

Jeder Raspberry Pi kann mit einer eindeutigen Display-ID konfiguriert werden. Der Pi lädt dann automatisch nur die Posts, die:
- Mit `displayMode: 'all'` markiert sind (für alle Displays), **oder**
- Explizit diesem Display zugewiesen sind

## 📋 Voraussetzungen

- Raspberry Pi mit installiertem PRASCO
- Display im Admin-Panel erstellt
- SSH-Zugriff zum Pi (für Remote-Konfiguration)

---

## 🚀 Schnellstart

### 1. Display im Admin-Panel erstellen

1. Login im Admin-Panel: `https://192.168.2.173:3000/admin`
2. Navigiere zu "Displays" im Menü
3. Klicke auf "Neues Display erstellen"
4. Gib folgende Daten ein:
   - **Name:** `Empfangsbereich` (Anzeigename)
   - **Identifier:** `empfang` (eindeutige ID, nur Buchstaben, Zahlen, Bindestriche, Unterstriche)
   - **Beschreibung:** Optional
   - **Status:** Aktiv ☑️
5. Speichern

### 2. Pi konfigurieren

**Option A: Lokale Konfiguration (auf dem Pi)**

```bash
# Auf dem Raspberry Pi
cd ~/Prasco/scripts
sudo bash setup-display-config.sh
```

Das interaktive Setup-Script fragt nach:
- Display-Identifier (z.B. `empfang`)
- Display-Name (z.B. `Empfangsbereich`)
- Auto-Start (empfohlen: ja)
- Server-URL (Standard: `https://localhost:3000`)

**Option B: Remote-Konfiguration (von deinem Computer)**

```bash
# Auf deinem Computer
cd ~/Prasco/scripts
bash remote-display-config.sh 192.168.2.173 empfang "Empfangsbereich"
```

Syntax:
```bash
./remote-display-config.sh <pi-ip> <display-id> [display-name] [server-url]
```

### 3. Pi neu starten oder Kiosk-Modus neu laden

```bash
# Neu starten (empfohlen)
sudo reboot

# Oder nur Kiosk-Modus neu starten
pkill chromium
bash ~/Prasco/scripts/start-kiosk.sh
```

---

## 📁 Konfigurationsdatei

Die Display-Konfiguration wird in `/etc/prasco/display-config.json` gespeichert:

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

### Manuelle Bearbeitung

```bash
# Config ansehen
sudo cat /etc/prasco/display-config.json

# Config bearbeiten
sudo nano /etc/prasco/display-config.json

# Änderungen anwenden
pkill chromium && bash ~/Prasco/scripts/start-kiosk.sh
```

---

## 🎬 Post-Zuweisung

### Alle Displays

Posts mit `displayMode: 'all'` (Standard) werden auf **allen** Displays angezeigt.

Im Post-Formular:
- ☑️ **Alle Displays** (Standard)

### Spezifische Displays

Posts können spezifischen Displays zugewiesen werden:

Im Post-Formular:
1. Wähle ☑️ **Bestimmte Displays**
2. Wähle die gewünschten Displays aus der Liste:
   - ☑️ Empfangsbereich
   - ☑️ Raum 1
   - ☐ Raum 2

---

## 🔧 Troubleshooting

### Display wird nicht gefunden

**Problem:** Pi zeigt "Display nicht gefunden" Overlay

**Lösung:**
1. Prüfe ob Display im Admin-Panel existiert
2. Prüfe ob Display **aktiv** ist (grüner Indikator)
3. Prüfe Identifier in Config: `sudo cat /etc/prasco/display-config.json`
4. Prüfe Identifier im Admin-Panel (muss exakt übereinstimmen)

### Keine Posts werden angezeigt

**Problem:** Display zeigt "Keine Beiträge verfügbar"

**Mögliche Ursachen:**
1. Keine aktiven Posts vorhanden
2. Alle Posts sind anderen Displays zugewiesen
3. Display-Filter zu restriktiv

**Lösung:**
```bash
# Temporär alle Posts anzeigen (Config entfernen)
sudo rm /etc/prasco/display-config.json
pkill chromium && bash ~/Prasco/scripts/start-kiosk.sh

# Wenn Posts jetzt angezeigt werden: Display-Zuweisungen prüfen
```

### Config wird nicht geladen

**Problem:** Start-Script findet Config nicht

**Lösung:**
```bash
# Prüfe ob Datei existiert
ls -la /etc/prasco/display-config.json

# Prüfe Berechtigungen
sudo chmod 644 /etc/prasco/display-config.json

# Prüfe JSON-Syntax
cat /etc/prasco/display-config.json | jq .
```

### SSH-Fehler bei Remote-Config

**Problem:** `SSH-Verbindung fehlgeschlagen`

**Lösung:**
```bash
# SSH-Key kopieren (einmalig)
ssh-copy-id pi@192.168.2.173

# Oder mit Passwort-Prompt
ssh pi@192.168.2.173
# Passwort eingeben

# SSH-Verbindung testen
ssh pi@192.168.2.173 "echo 'Verbindung OK'"
```

---

## 📊 Multi-Display Setup Beispiel

### Szenario: Büro mit 3 Displays

**Displays erstellen:**
1. `empfang` - Empfangsbereich (allgemeine Infos)
2. `kantine` - Kantine (Speiseplan, Events)
3. `meeting-raum-1` - Meeting Raum 1 (Raumbuchung)

**Raspberry Pis konfigurieren:**
```bash
# Pi 1 (Empfang, IP: 192.168.2.173)
./remote-display-config.sh 192.168.2.173 empfang "Empfangsbereich"

# Pi 2 (Kantine, IP: 192.168.2.174)
./remote-display-config.sh 192.168.2.174 kantine "Kantine"

# Pi 3 (Meeting Raum, IP: 192.168.2.175)
./remote-display-config.sh 192.168.2.175 meeting-raum-1 "Meeting Raum 1"
```

**Post-Beispiele:**

| Post-Titel | displayMode | Zugewiesene Displays | Angezeigt auf |
|------------|-------------|---------------------|---------------|
| Willkommen | all | - | Alle 3 Displays |
| Speiseplan | specific | `kantine` | Nur Kantine |
| Raumbuchung | specific | `meeting-raum-1` | Nur Meeting Raum |
| Notfall-Info | all | - | Alle 3 Displays |
| Firmenevent | specific | `empfang`, `kantine` | Empfang + Kantine |

---

## 🔄 Config-Update Workflow

### Szenario: Display-ID ändern

```bash
# 1. Neues Display im Admin-Panel erstellen (z.B. empfang-neu)

# 2. Pi neu konfigurieren
./remote-display-config.sh 192.168.2.173 empfang-neu "Empfangsbereich Neu"

# 3. Posts umziehen (im Admin-Panel)
#    - Alte Posts von 'empfang' auf 'empfang-neu' umstellen

# 4. Altes Display deaktivieren oder löschen
```

### Szenario: Server-URL ändern

```bash
# Nach Server-Umzug alle Pis aktualisieren
./remote-display-config.sh 192.168.2.173 empfang "Empfang" https://192.168.1.100:3000
./remote-display-config.sh 192.168.2.174 kantine "Kantine" https://192.168.1.100:3000
```

---

## ⚡ Tipps & Best Practices

### Naming Convention

**Display-IDs:**
- Nur Kleinbuchstaben, Zahlen, Bindestriche
- Beschreibend und eindeutig
- ✅ `empfang`, `kantine`, `raum-1-og2`
- ❌ `Display1`, `test`, `neu`

**Display-Namen:**
- Benutzerfreundlich
- Beschreibt Standort
- ✅ `Empfangsbereich`, `Kantine EG`, `Besprechungsraum 1 (OG2)`

### Post-Organisation

1. **Allgemeine Ankündigungen** → `displayMode: all`
2. **Standort-spezifisch** → `displayMode: specific` + Displays wählen
3. **Zeitlich begrenzt** → Ablaufdatum setzen
4. **Priorität** → Wichtige Posts höhere Priorität geben

### Backup

```bash
# Config sichern
ssh pi@192.168.2.173 "sudo cat /etc/prasco/display-config.json" > backup-empfang.json

# Wiederherstellen
cat backup-empfang.json | ssh pi@192.168.2.173 "sudo tee /etc/prasco/display-config.json"
```

---

## 🛠️ Scripts Übersicht

| Script | Zweck | Ausführung |
|--------|-------|------------|
| `setup-display-config.sh` | Interaktive lokale Konfiguration | Auf dem Pi mit sudo |
| `remote-display-config.sh` | Remote-Konfiguration via SSH | Von Computer aus |
| `start-kiosk.sh` | Startet Kiosk-Modus mit Config | Automatisch beim Boot |

---

## 📚 Weiterführende Dokumentation

- [Roadmap](./multidisplay-roadmap.md) - Gesamte Implementierung
- [RASPBERRY-PI-SETUP.md](../RASPBERRY-PI-SETUP.md) - Pi Basis-Setup
- [Admin Dashboard](https://192.168.2.173:3000/admin) - Display-Verwaltung

---

**Version:** 1.0  
**Letzte Aktualisierung:** Februar 2026  
**Getestet mit:** Raspberry Pi 4B, Raspberry Pi Zero 2W, PRASCO v2.0
