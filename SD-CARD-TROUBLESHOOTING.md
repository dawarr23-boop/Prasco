# 🔧 SD-Karten Vorbereitung - Troubleshooting

Lösungen für häufige Probleme bei der SD-Karten-Vorbereitung mit `prepare-sd-card.ps1`.

## Inhaltsverzeichnis

1. [Download-Probleme](#download-probleme)
2. [Extraktions-Fehler](#extraktions-fehler)
3. [SD-Karte nicht erkannt](#sd-karte-nicht-erkannt)
4. [Image-Schreib-Fehler](#image-schreib-fehler)
5. [Boot-Probleme](#boot-probleme)
6. [Netzwerk-Probleme](#netzwerk-probleme)
7. [PowerShell-Fehler](#powershell-fehler)

---

## Download-Probleme

### Problem: "Download fehlgeschlagen" oder "Datei beschädigt"

**Symptome:**
```
✗ Download fehlgeschlagen: Die Verbindung wurde unterbrochen
```
oder
```
⚠ Archiv scheint unvollständig (247.3 MB)
```

**Ursachen:**
- Instabile Internetverbindung
- Timeout beim Download
- Server-Probleme
- Firewall/Proxy blockiert Download

**Lösungen:**

#### 1. Automatische Wiederholung nutzen
Das Skript versucht automatisch 3x erneut zu downloaden:
```powershell
# Einfach warten und das Skript versucht es erneut
```

#### 2. Größere Timeout-Werte
Wenn Downloads immer abbrechen, ändere im Skript:
```powershell
# Zeile ~370 im Skript:
-TimeoutSec 600  # Von 600 auf 1200 erhöhen
```

#### 3. Manueller Download
Falls der automatische Download weiterhin fehlschlägt:

**Für Raspberry Pi OS Lite:**
```
1. Öffne: https://downloads.raspberrypi.org/raspios_lite_arm64/images/
2. Wähle neueste Version (z.B. raspios_lite_arm64-2024-11-19/)
3. Lade die .img.xz Datei herunter
4. Speichere in: %TEMP%\prasco-setup\
5. Führe Skript mit -SkipDownload aus:
   .\scripts\prepare-sd-card.ps1 -SkipDownload
```

**Für DietPi:**
```
1. Öffne: https://dietpi.com/downloads/
2. Download: DietPi_RPi-ARMv8-Bookworm.img.xz
3. Speichere in: %TEMP%\prasco-setup\
4. Führe Skript mit -SkipDownload aus
```

#### 4. Proxy-Konfiguration
Falls hinter einem Proxy:
```powershell
# Vor dem Skript ausführen:
$env:HTTP_PROXY = "http://proxy.firma.de:8080"
$env:HTTPS_PROXY = "http://proxy.firma.de:8080"

# Dann Skript starten
.\scripts\prepare-sd-card.ps1
```

#### 5. Alternative Download-Methode
```powershell
# Mit curl statt Invoke-WebRequest:
$url = "https://downloads.raspberrypi.org/..."
$output = "$env:TEMP\prasco-setup\image.img.xz"
curl.exe -L -o $output $url

# Dann mit -SkipDownload weitermachen
```

---

## Extraktions-Fehler

### Problem: "Extraktion fehlgeschlagen" oder "7-Zip Fehler"

**Symptome:**
```
✗ Extraktion fehlgeschlagen: 7-Zip Fehler-Code: 2
```
oder
```
✗ Keine .img Datei gefunden nach Extraktion
```

**Ursachen:**
- 7-Zip nicht installiert oder fehlerhaft
- Beschädigtes XZ-Archiv
- Nicht genug Speicherplatz
- Laufwerk schreibgeschützt

**Lösungen:**

#### 1. 7-Zip neu installieren
```powershell
# Deinstalliere alte Version:
winget uninstall 7zip.7zip

# Installiere neu:
winget install 7zip.7zip

# Oder manuell von: https://www.7-zip.org/
```

#### 2. Speicherplatz prüfen
```powershell
# Prüfe verfügbaren Speicher:
Get-PSDrive C | Select-Object Used,Free

# Benötigt: ~4-6 GB für Image-Extraktion
```

Falls zu wenig Speicher:
```powershell
# Ändere Temp-Verzeichnis:
$env:TEMP = "D:\Temp"  # Anderes Laufwerk mit mehr Platz

# Dann Skript starten
.\scripts\prepare-sd-card.ps1
```

#### 3. Beschädigtes Archiv
```powershell
# Lösche das XZ-Archiv:
Remove-Item "$env:TEMP\prasco-setup\*.xz" -Force

# Lade erneut herunter:
.\scripts\prepare-sd-card.ps1
```

#### 4. Manuelle Extraktion
```powershell
# Mit 7-Zip GUI:
1. Rechtsklick auf .xz Datei
2. "7-Zip" → "Hier entpacken"
3. Dann Skript mit -SkipDownload starten
```

#### 5. Alternative: WinRAR
```powershell
# Falls 7-Zip nicht funktioniert, versuche WinRAR:
# Download von: https://www.winrar.de/
# Entpacke manuell, dann -SkipDownload
```

---

## SD-Karte nicht erkannt

### Problem: "Keine SD-Karten/USB-Laufwerke gefunden!"

**Symptome:**
```
✗ Keine SD-Karten/USB-Laufwerke gefunden!
```

**Ursachen:**
- SD-Kartenleser nicht angeschlossen
- SD-Karte nicht richtig eingelegt
- Treiberprobleme
- Windows erkennt SD-Karte nicht

**Lösungen:**

#### 1. Grundlegende Checks
```powershell
# Prüfe ob Windows die SD-Karte sieht:
Get-Disk | Where-Object {$_.BusType -eq 'USB' -or $_.BusType -eq 'SD'}

# Liste alle Laufwerke:
Get-WmiObject Win32_DiskDrive | Select-Object Caption, Size, MediaType, InterfaceType
```

#### 2. SD-Karte neu einstecken
1. SD-Karte entfernen
2. 5 Sekunden warten
3. Wieder einstecken
4. Warten bis Windows-Sound kommt
5. Skript erneut starten

#### 3. Geräte-Manager prüfen
```
1. Windows-Taste + X → Geräte-Manager
2. "Laufwerke" aufklappen
3. Suche nach Ausrufezeichen (!)
4. Falls vorhanden: Rechtsklick → "Treiber aktualisieren"
```

#### 4. Festplattenverwaltung
```
1. Windows-Taste + X → Datenträgerverwaltung
2. Suche nach neuer Disk
3. Falls "Nicht initialisiert" → Rechtsklick → Initialisieren
```

#### 5. Als Administrator ausführen
```powershell
# Rechtsklick auf PowerShell-Icon:
# "Als Administrator ausführen"
# Dann Skript starten
```

#### 6. Anderer USB-Port
- Versuche anderen USB-Port (USB 2.0 statt 3.0)
- Direkt am PC, nicht über Hub
- Vorder- statt Rückseite

#### 7. Anderer Kartenleser
Falls nichts hilft:
- Externen USB-SD-Kartenleser verwenden
- Oder anderen PC/Laptop versuchen

---

## Image-Schreib-Fehler

### Problem: Kann Image nicht auf SD-Karte schreiben

**Symptome:**
```
⚠ Für das Schreiben des Images wird der Raspberry Pi Imager benötigt
```

**Ursachen:**
- Kein geeignetes Tool installiert (dd, rpi-imager)
- SD-Karte schreibgeschützt
- Nicht genug Rechte

**Lösungen:**

#### 1. Raspberry Pi Imager verwenden (Empfohlen)
```powershell
# Installiere Raspberry Pi Imager:
winget install Raspberry.RaspberryPiImager

# Oder manuell von:
# https://www.raspberrypi.com/software/

# Nach Installation Skript neu starten
```

#### 2. Rufus verwenden
```
1. Download Rufus: https://rufus.ie/
2. Image-Datei ist in: %TEMP%\prasco-setup\*.img
3. In Rufus:
   - Device: Deine SD-Karte wählen
   - Boot selection: "DD Image" wählen
   - SELECT: Image-Datei auswählen
   - START klicken
4. Nach Rufus: Skript mit -SkipDownload starten für Konfiguration
```

#### 3. balenaEtcher verwenden
```
1. Download: https://www.balena.io/etcher/
2. Install und starten
3. "Flash from file" → Wähle .img Datei aus %TEMP%\prasco-setup\
4. "Select target" → Wähle SD-Karte
5. "Flash!" klicken
6. Nach balena: Skript mit -SkipDownload starten
```

#### 4. Schreibschutz prüfen
```powershell
# Bei einigen SD-Karten:
# Physischer Schalter an der Seite → Auf "Unlock" stellen

# Oder in Windows:
diskpart
> list disk
> select disk X  # X = Nummer deiner SD-Karte
> attributes disk clear readonly
> exit
```

#### 5. Win32 Disk Imager
```
# Alternativer Image-Writer:
https://sourceforge.net/projects/win32diskimager/

# Gleiche Vorgehensweise wie Rufus
```

---

## Boot-Probleme

### Problem: Raspberry Pi bootet nicht von der SD-Karte

**Symptome:**
- Nur rote LED leuchtet
- Kein Bild auf Monitor
- Endlosschleife beim Booten
- Regenbogen-Bildschirm

**Lösungen:**

#### 1. Grundlegende Checks
```
✓ SD-Karte richtig eingelegt? (Kontakte nach innen)
✓ Netzteil ausreichend? (5V/3A für Pi 4, 5V/2.5A für Pi 3)
✓ HDMI-Kabel vor Strom angeschlossen?
✓ SD-Karte groß genug? (Minimum 8GB, empfohlen 16GB+)
```

#### 2. Image erneut schreiben
```powershell
# Manchmal hilft ein kompletter Neustart:
.\scripts\prepare-sd-card.ps1 -Force

# Oder manuell:
# 1. SD-Karte mit Windows formatieren (FAT32)
# 2. Image erneut schreiben
```

#### 3. Andere SD-Karte testen
```
Manche SD-Karten sind inkompatibel:
✓ Class 10 oder besser verwenden
✓ Von bekanntem Hersteller (SanDisk, Samsung, Kingston)
✓ Nicht älter als 3-4 Jahre
✗ Keine billigen No-Name Karten
```

#### 4. Pi selbst testen
```
# Mit bekannter funktionierender SD-Karte testen
# Oder mit NOOBS-Image testen
```

#### 5. HDMI-Probleme
```
Falls Monitor schwarz bleibt:
1. HDMI vor Strom anstecken
2. Richtigen HDMI-Eingang wählen
3. Bei Pi 4: HDMI 0 (nicht HDMI 1) verwenden
4. Anderen HDMI-Kabel testen
```

#### 6. Boot-Partition prüfen
```powershell
# SD-Karte am PC anschließen
# Sollte als Laufwerk sichtbar sein (z.B. E:)
# Sollte enthalten:
# - config.txt
# - cmdline.txt
# - kernel*.img
# - ssh (leere Datei)
# - prasco-firstboot.sh

# Falls Dateien fehlen → Image neu schreiben
```

---

## Netzwerk-Probleme

### Problem: Pi bootet, aber keine Netzwerkverbindung

**Symptome:**
- `ssh pi@prasco.local` funktioniert nicht
- Pi nicht im Router sichtbar
- "Warte auf Netzwerk..." hängt

**Lösungen:**

#### 1. Ethernet bevorzugen
```
✓ LAN-Kabel anschließen statt WLAN
✓ Nach Boot 2-3 Minuten warten
✓ Router-Webinterface checken (192.168.1.1)
✓ Suche nach neuem Gerät "prasco"
```

#### 2. WLAN-Konfiguration prüfen
```powershell
# Falls WLAN nicht funktioniert:
# SD-Karte am PC öffnen
# Prüfe Datei: wpa_supplicant.conf

# Sollte enthalten:
country=DE
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="DEIN_WLAN_NAME"
    psk="DEIN_PASSWORT"
    key_mgmt=WPA-PSK
}

# Falls falsch → Neu erstellen und SD-Karte entfernen/einstecken
```

#### 3. WLAN-Land-Code
```
# Land-Code muss passen:
DE - Deutschland
AT - Österreich  
CH - Schweiz
US - USA
GB - UK

# Falsche Ländercodes können WLAN blockieren!
```

#### 4. 2.4 GHz vs 5 GHz
```
✓ Raspberry Pi 3: Nur 2.4 GHz
✓ Raspberry Pi 4: 2.4 GHz und 5 GHz

# Stelle sicher, dass Router 2.4 GHz aktiviert hat
```

#### 5. Statische IP testen
```bash
# Falls DHCP nicht funktioniert:
# Am Monitor/Tastatur direkt am Pi:
sudo nano /etc/dhcpcd.conf

# Am Ende hinzufügen:
interface eth0
static ip_address=192.168.1.200/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1

# Speichern (Strg+O), Beenden (Strg+X)
sudo reboot

# Dann versuchen mit: ssh pi@192.168.1.200
```

#### 6. .local funktioniert nicht
```powershell
# Falls prasco.local nicht auflösbar:
# 1. IP-Adresse im Router nachschauen
# 2. Direkt per IP verbinden:
ssh pi@192.168.1.XXX

# Oder Bonjour Print Services installieren (Windows):
# https://support.apple.com/kb/DL999
```

#### 7. Firewall checken
```powershell
# Windows Firewall SSH erlauben:
New-NetFirewallRule -DisplayName "SSH Outbound" -Direction Outbound -Protocol TCP -LocalPort 22 -Action Allow
```

---

## PowerShell-Fehler

### Problem: PowerShell-Skript startet nicht oder Fehler

**Symptome:**
```
Ausführung von Skripts ist auf diesem System deaktiviert
```
oder
```
prepare-sd-card.ps1 kann nicht geladen werden
```

**Lösungen:**

#### 1. Execution Policy setzen
```powershell
# Als Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Dann Skript erneut starten
```

#### 2. Temporär Bypass
```powershell
# Einmalig Skript ausführen:
PowerShell.exe -ExecutionPolicy Bypass -File .\scripts\prepare-sd-card.ps1
```

#### 3. Als Administrator ausführen
```powershell
# Rechtsklick auf PowerShell:
# → "Als Administrator ausführen"

# Dann navigieren:
cd C:\Pfad\zu\Prasco
.\scripts\prepare-sd-card.ps1
```

#### 4. PowerShell-Version prüfen
```powershell
# Mindestens PowerShell 5.1 erforderlich:
$PSVersionTable.PSVersion

# Falls älter → Updaten:
# Windows Update ausführen
# Oder PowerShell 7 installieren:
winget install Microsoft.PowerShell
```

#### 5. Script-Pfad-Probleme
```powershell
# Stelle sicher, dass Pfad keine Sonderzeichen hat:
✓ C:\Projects\Prasco\scripts\prepare-sd-card.ps1
✗ C:\Meine Projekte\Präsco\scripts\prepare-sd-card.ps1

# Umlaute und Leerzeichen können Probleme machen!
```

#### 6. Zeichen-Kodierung
```powershell
# Falls seltsame Zeichen/Fehler:
# Speichere Skript mit UTF-8 BOM in Editor:
notepad .\scripts\prepare-sd-card.ps1
# Datei → Speichern unter → Codierung: UTF-8
```

---

## Häufig gestellte Fragen (FAQ)

### F: Wie lange dauert die komplette Vorbereitung?
**A:** 
- Download: 5-15 Minuten (je nach Internet)
- Extraktion: 2-5 Minuten
- Schreiben: 10-20 Minuten
- **Gesamt: ~20-40 Minuten**

### F: Kann ich die SD-Karte wiederverwenden?
**A:** Ja! Einfach neu formatieren oder mit `-Force` erneut beschreiben.

### F: Funktioniert das Skript auf Mac/Linux?
**A:** Nein, nur Windows. Für Mac/Linux:
- Raspberry Pi Imager verwenden
- Oder dd-Befehl in Terminal
- Siehe: RASPBERRY-PI-SETUP.md

### F: Brauche ich wirklich 7-Zip?
**A:** Ja, für .xz Extraktion. Wird aber automatisch installiert falls nicht vorhanden.

### F: Kann ich mehrere SD-Karten gleichzeitig vorbereiten?
**A:** Nein, nur eine nach der anderen. Aber: Nach erstem Durchlauf ist Image gecached (schneller).

### F: Was passiert beim ersten Boot?
**A:**
1. Pi bootet (~2-3 Min)
2. Automatisches Setup startet:
   - System-Updates (5-10 Min)
   - Node.js Installation (2 Min)
   - PostgreSQL Installation (2 Min)
   - PRASCO Klonen (1 Min)
3. Neustart
4. Fertig! → SSH-Zugriff möglich

### F: Kann ich das Setup abbrechen?
**A:** Ja mit `Strg+C`. Bereits heruntergeladene Dateien bleiben erhalten.

### F: Unterstützt das Skript 32-bit Images?
**A:** Aktuell nur 64-bit. Für 32-bit: Manuelles Setup mit Raspberry Pi Imager.

---

## Weitere Hilfe

Falls diese Lösungen nicht helfen:

1. **Logs prüfen:**
   ```powershell
   # PowerShell Transcript (falls aktiviert):
   $HOME\Documents\PowerShell_transcript*.txt
   ```

2. **Verbose-Modus:**
   ```powershell
   # Mehr Details anzeigen:
   $VerbosePreference = "Continue"
   .\scripts\prepare-sd-card.ps1
   ```

3. **Community:**
   - GitHub Issues: https://github.com/dawarr23-boop/Prasco/issues
   - Raspberry Pi Forum: https://www.raspberrypi.org/forums/

4. **Alternative Tools:**
   - Raspberry Pi Imager (offiziell, GUI)
   - balenaEtcher (plattformübergreifend)
   - Win32 Disk Imager (nur Windows)

---

## Zusammenfassung: Checkliste

Bevor du Hilfe suchst, prüfe:

- [ ] PowerShell als Administrator ausgeführt?
- [ ] Execution Policy korrekt gesetzt?
- [ ] 7-Zip installiert?
- [ ] SD-Karte richtig eingelegt und erkannt?
- [ ] Genug Speicherplatz (6+ GB frei)?
- [ ] Stabile Internetverbindung?
- [ ] Firewall/Antivirus blockiert nicht?
- [ ] SD-Karte nicht schreibgeschützt?
- [ ] Raspberry Pi mit korrektem Netzteil?
- [ ] HDMI vor Strom angeschlossen?

---

_Letzte Aktualisierung: Dezember 2024 | PRASCO v1.0_
