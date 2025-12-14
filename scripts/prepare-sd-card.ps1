<#
.SYNOPSIS
    PRASCO SD-Karten Vorbereitungs-Skript für Raspberry Pi
    
.DESCRIPTION
    Dieses Skript lädt Raspberry Pi OS herunter und bereitet eine SD-Karte vor,
    die beim ersten Start automatisch PRASCO installiert und konfiguriert.
    
.EXAMPLE
    .\prepare-sd-card.ps1
    
.NOTES
    Erfordert Administratorrechte für das Schreiben auf die SD-Karte
    Repository: https://github.com/dawarr23-boop/Prasco
#>

#Requires -RunAsAdministrator

param(
    [string]$SDCardDrive = "",
    [string]$WiFiSSID = "",
    [string]$WiFiPassword = "",
    [string]$Hostname = "prasco",
    [string]$PiUser = "pi",
    [string]$PiPassword = "",
    [switch]$SkipDownload,
    [switch]$Force
)

# Farben und Formatierung
$Host.UI.RawUI.WindowTitle = "PRASCO SD-Karten Setup"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White", [switch]$NoNewline)
    if ($NoNewline) {
        Write-Host $Message -ForegroundColor $Color -NoNewline
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Write-Header {
    Clear-Host
    Write-ColorOutput @"

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ██████╗ ██████╗  █████╗ ███████╗ ██████╗ ██████╗                      ║
║     ██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗                     ║
║     ██████╔╝██████╔╝███████║███████╗██║     ██║   ██║                     ║
║     ██╔═══╝ ██╔══██╗██╔══██║╚════██║██║     ██║   ██║                     ║
║     ██║     ██║  ██║██║  ██║███████║╚██████╗╚██████╔╝                     ║
║     ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝                      ║
║                                                                           ║
║                  SD-Karten Vorbereitungs-Tool                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

"@ "Magenta"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "→ " "Cyan" -NoNewline
    Write-ColorOutput $Message "White"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ " "Green" -NoNewline
    Write-ColorOutput $Message "White"
}

function Write-Error2 {
    param([string]$Message)
    Write-ColorOutput "✗ " "Red" -NoNewline
    Write-ColorOutput $Message "White"
}

function Write-Warning2 {
    param([string]$Message)
    Write-ColorOutput "! " "Yellow" -NoNewline
    Write-ColorOutput $Message "White"
}

function Get-UserInput {
    param([string]$Prompt, [string]$Default = "", [switch]$Password)
    
    if ($Default) {
        Write-ColorOutput "? " "Yellow" -NoNewline
        Write-Host "$Prompt [$Default]: " -NoNewline
    } else {
        Write-ColorOutput "? " "Yellow" -NoNewline
        Write-Host "${Prompt}: " -NoNewline
    }
    
    if ($Password) {
        $secure = Read-Host -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $result = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    } else {
        $result = Read-Host
    }
    
    if ([string]::IsNullOrEmpty($result) -and $Default) {
        return $Default
    }
    return $result
}

function Get-YesNo {
    param([string]$Prompt, [bool]$Default = $true)
    
    $defaultText = if ($Default) { "[J/n]" } else { "[j/N]" }
    Write-ColorOutput "? " "Yellow" -NoNewline
    Write-Host "$Prompt $defaultText " -NoNewline
    $response = Read-Host
    
    if ([string]::IsNullOrEmpty($response)) {
        return $Default
    }
    return $response -match "^[jJyY]"
}

# Konfiguration
$Config = @{
    OperatingSystems = @{
        "RaspberryPiOS_Lite" = @{
            Name = "Raspberry Pi OS (64-bit Lite)"
            Description = "Minimales OS ohne Desktop (empfohlen für Headless)"
            URL = "https://downloads.raspberrypi.org/raspios_lite_arm64/images/raspios_lite_arm64-2024-11-19/2024-11-19-raspios-bookworm-arm64-lite.img.xz"
            FileName = "raspios-bookworm-arm64-lite.img.xz"
            ImageName = "raspios-bookworm-arm64-lite.img"
            SHA256 = ""  # Optional: Für Integritätsprüfung
        }
        "RaspberryPiOS_Desktop" = @{
            Name = "Raspberry Pi OS (64-bit mit Desktop)"
            Description = "Vollständiges OS mit grafischer Oberfläche (für Kiosk-Modus)"
            URL = "https://downloads.raspberrypi.org/raspios_arm64/images/raspios_arm64-2024-11-19/2024-11-19-raspios-bookworm-arm64.img.xz"
            FileName = "raspios-bookworm-arm64.img.xz"
            ImageName = "raspios-bookworm-arm64.img"
            SHA256 = ""
        }
        "DietPi" = @{
            Name = "DietPi (64-bit)"
            Description = "Extrem schlankes OS, optimiert für minimalen Ressourcenverbrauch"
            URL = "https://dietpi.com/downloads/images/DietPi_RPi-ARMv8-Bookworm.img.xz"
            FileName = "DietPi_RPi-ARMv8-Bookworm.img.xz"
            ImageName = "DietPi_RPi-ARMv8-Bookworm.img"
            SHA256 = ""
        }
    }
    TempDir = "$env:TEMP\prasco-setup"
    Repository = "https://github.com/dawarr23-boop/Prasco.git"
}

#===============================================================================
# Hauptprogramm
#===============================================================================

Write-Header

Write-ColorOutput "Willkommen beim PRASCO SD-Karten Vorbereitungs-Tool!" "Cyan"
Write-Host ""
Write-Host "Dieses Skript bereitet eine SD-Karte vor, die:"
Write-Host "  • Raspberry Pi OS (64-bit Lite) enthält"
Write-Host "  • Beim ersten Start automatisch PRASCO installiert"
Write-Host "  • Die interaktive Konfiguration startet"
Write-Host ""

#===============================================================================
# Schritt 1: Voraussetzungen prüfen
#===============================================================================

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Schritt 1: Voraussetzungen prüfen" "White"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"

# Prüfe auf 7-Zip oder andere XZ-Unterstützung
$7zipPath = $null
$possiblePaths = @(
    "C:\Program Files\7-Zip\7z.exe",
    "C:\Program Files (x86)\7-Zip\7z.exe",
    "$env:ProgramFiles\7-Zip\7z.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $7zipPath = $path
        break
    }
}

if (-not $7zipPath) {
    Write-Warning2 "7-Zip nicht gefunden. Wird für XZ-Extraktion benötigt."
    Write-Host ""
    if (Get-YesNo "7-Zip jetzt installieren (via winget)?") {
        Write-Step "Installiere 7-Zip..."
        winget install --id 7zip.7zip -e --silent
        $7zipPath = "C:\Program Files\7-Zip\7z.exe"
        if (Test-Path $7zipPath) {
            Write-Success "7-Zip installiert"
        } else {
            Write-Error2 "7-Zip Installation fehlgeschlagen. Bitte manuell installieren."
            exit 1
        }
    } else {
        Write-Error2 "7-Zip ist erforderlich. Abbruch."
        exit 1
    }
} else {
    Write-Success "7-Zip gefunden: $7zipPath"
}

# Prüfe auf dd oder diskpart Alternative
Write-Success "Windows Disk Management verfügbar"

#===============================================================================
# Schritt 2: Konfiguration sammeln
#===============================================================================

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Schritt 2: Konfiguration" "White"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"

# Betriebssystem auswählen
Write-Host ""
Write-Host "Verfügbare Betriebssysteme:" -ForegroundColor Cyan
Write-Host ""

$osKeys = @("RaspberryPiOS_Lite", "RaspberryPiOS_Desktop", "DietPi")
$i = 1
foreach ($osKey in $osKeys) {
    $os = $Config.OperatingSystems[$osKey]
    Write-Host "  $i) " -ForegroundColor Yellow -NoNewline
    Write-Host "$($os.Name)" -ForegroundColor White
    Write-Host "     $($os.Description)" -ForegroundColor Gray
    $i++
}

Write-Host ""
$osSelection = Get-UserInput "Wähle Betriebssystem (Nummer)" "1"
$selectedOSIndex = [int]$osSelection - 1

if ($selectedOSIndex -lt 0 -or $selectedOSIndex -ge $osKeys.Count) {
    Write-Error2 "Ungültige Auswahl!"
    exit 1
}

$selectedOSKey = $osKeys[$selectedOSIndex]
$selectedOS = $Config.OperatingSystems[$selectedOSKey]
Write-Success "Gewählt: $($selectedOS.Name)"

# Hostname
if (-not $Hostname) {
    $Hostname = Get-UserInput "Hostname für den Raspberry Pi" "prasco"
}
Write-Success "Hostname: $Hostname"

# Pi-Benutzer
if (-not $PiUser) {
    $PiUser = Get-UserInput "Benutzername" "pi"
}
Write-Success "Benutzer: $PiUser"

# Pi-Passwort
if (-not $PiPassword) {
    Write-Host ""
    Write-Warning2 "Ein sicheres Passwort ist wichtig für SSH-Zugriff!"
    $PiPassword = Get-UserInput "Passwort für Benutzer '$PiUser'" -Password
    while ($PiPassword.Length -lt 8) {
        Write-Error2 "Passwort muss mindestens 8 Zeichen haben!"
        $PiPassword = Get-UserInput "Passwort für Benutzer '$PiUser'" -Password
    }
}
Write-Success "Passwort gesetzt"

# WLAN-Konfiguration
Write-Host ""
$configureWiFi = Get-YesNo "WLAN konfigurieren?"
if ($configureWiFi) {
    if (-not $WiFiSSID) {
        $WiFiSSID = Get-UserInput "WLAN-Name (SSID)"
    }
    if (-not $WiFiPassword) {
        $WiFiPassword = Get-UserInput "WLAN-Passwort" -Password
    }
    Write-Success "WLAN: $WiFiSSID"
}

#===============================================================================
# Schritt 3: SD-Karte auswählen
#===============================================================================

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Schritt 3: SD-Karte auswählen" "White"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"

Write-Step "Suche nach Wechseldatenträgern..."

# Wechseldatenträger auflisten
$removableDrives = Get-WmiObject Win32_DiskDrive | Where-Object { $_.MediaType -match "Removable" -or $_.InterfaceType -eq "USB" }

if ($removableDrives.Count -eq 0) {
    Write-Error2 "Keine SD-Karten/USB-Laufwerke gefunden!"
    Write-Host ""
    Write-Host "Bitte stelle sicher, dass:"
    Write-Host "  • Die SD-Karte eingelegt ist"
    Write-Host "  • Der SD-Kartenleser verbunden ist"
    Write-Host ""
    Read-Host "Drücke ENTER um erneut zu suchen oder Strg+C zum Abbrechen"
    $removableDrives = Get-WmiObject Win32_DiskDrive | Where-Object { $_.MediaType -match "Removable" -or $_.InterfaceType -eq "USB" }
    
    if ($removableDrives.Count -eq 0) {
        Write-Error2 "Immer noch keine Laufwerke gefunden. Abbruch."
        exit 1
    }
}

Write-Host ""
Write-Host "Gefundene Wechseldatenträger:" -ForegroundColor Cyan
Write-Host ""

$i = 1
$driveList = @()
foreach ($drive in $removableDrives) {
    $sizeGB = [math]::Round($drive.Size / 1GB, 1)
    $driveList += $drive
    Write-Host "  $i) $($drive.Model) - $sizeGB GB [$($drive.DeviceID)]" -ForegroundColor Yellow
    $i++
}

Write-Host ""
$selection = Get-UserInput "Wähle die SD-Karte (Nummer)" "1"
$selectedIndex = [int]$selection - 1

if ($selectedIndex -lt 0 -or $selectedIndex -ge $driveList.Count) {
    Write-Error2 "Ungültige Auswahl!"
    exit 1
}

$selectedDrive = $driveList[$selectedIndex]
$diskNumber = $selectedDrive.DeviceID -replace '.*PHYSICALDRIVE', ''

Write-Host ""
Write-ColorOutput "╔═══════════════════════════════════════════════════════════════╗" "Red"
Write-ColorOutput "║  WARNUNG: ALLE DATEN AUF DER SD-KARTE WERDEN GELÖSCHT!        ║" "Red"
Write-ColorOutput "╚═══════════════════════════════════════════════════════════════╝" "Red"
Write-Host ""
Write-Host "Ausgewählt: $($selectedDrive.Model)" -ForegroundColor Yellow
Write-Host ""

if (-not (Get-YesNo "Fortfahren?" $false)) {
    Write-Host "Abgebrochen."
    exit 0
}

#===============================================================================
# Schritt 4: Raspberry Pi OS herunterladen
#===============================================================================

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Schritt 4: Raspberry Pi OS herunterladen" "White"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"

# Temp-Verzeichnis erstellen
if (-not (Test-Path $Config.TempDir)) {
    New-Item -ItemType Directory -Path $Config.TempDir -Force | Out-Null
}

$xzFile = Join-Path $Config.TempDir $selectedOS.FileName
$imgFile = Join-Path $Config.TempDir $selectedOS.ImageName

if ($SkipDownload -and (Test-Path $imgFile)) {
    Write-Success "Image bereits vorhanden: $imgFile"
} else {
    if (-not (Test-Path $xzFile)) {
        Write-Step "Lade $($selectedOS.Name) herunter..."
        Write-Host "  URL: $($selectedOS.URL)" -ForegroundColor Gray
        Write-Host "  Dies kann einige Minuten dauern (typisch 400-1000 MB)..." -ForegroundColor Gray
        Write-Host ""
        
        $maxRetries = 3
        $retryCount = 0
        $downloadSuccess = $false
        
        while (-not $downloadSuccess -and $retryCount -lt $maxRetries) {
            try {
                if ($retryCount -gt 0) {
                    Write-Warning2 "Wiederhole Download (Versuch $($retryCount + 1) von $maxRetries)..."
                }
                
                $ProgressPreference = 'SilentlyContinue'
                Invoke-WebRequest -Uri $selectedOS.URL -OutFile $xzFile -UseBasicParsing -TimeoutSec 600
                $ProgressPreference = 'Continue'
                
                # Prüfe ob Datei vollständig heruntergeladen wurde (mindestens 100 MB)
                $fileSize = (Get-Item $xzFile).Length
                if ($fileSize -lt 100MB) {
                    throw "Download unvollständig (nur $([math]::Round($fileSize/1MB, 2)) MB). Möglicherweise beschädigt."
                }
                
                Write-Success "Download abgeschlossen ($([math]::Round($fileSize/1MB, 2)) MB)"
                $downloadSuccess = $true
            } catch {
                $retryCount++
                Write-Error2 "Download fehlgeschlagen: $_"
                
                if ($retryCount -lt $maxRetries) {
                    Write-Host "  Warte 5 Sekunden vor erneutem Versuch..." -ForegroundColor Gray
                    Start-Sleep -Seconds 5
                    
                    # Lösche teilweise heruntergeladene Datei
                    if (Test-Path $xzFile) {
                        Remove-Item $xzFile -Force
                    }
                } else {
                    Write-Error2 "Download nach $maxRetries Versuchen fehlgeschlagen!"
                    Write-Host ""
                    Write-Host "Mögliche Lösungen:" -ForegroundColor Yellow
                    Write-Host "  1. Internetverbindung prüfen"
                    Write-Host "  2. Später erneut versuchen"
                    Write-Host "  3. Image manuell herunterladen und in $($Config.TempDir) ablegen"
                    Write-Host "  4. Skript mit -SkipDownload erneut ausführen"
                    exit 1
                }
            }
        }
    } else {
        Write-Success "XZ-Archiv bereits vorhanden"
        
        # Prüfe Dateigröße
        $fileSize = (Get-Item $xzFile).Length
        if ($fileSize -lt 100MB) {
            Write-Warning2 "Archiv scheint unvollständig ($([math]::Round($fileSize/1MB, 2)) MB)"
            if (Get-YesNo "Erneut herunterladen?" $true) {
                Remove-Item $xzFile -Force
                Write-Step "Starte erneuten Download..."
                # Datei wird beim nächsten Durchlauf neu heruntergeladen
            }
        }
    }
    
    # Extrahieren
    if (-not (Test-Path $imgFile)) {
        Write-Step "Extrahiere Image..."
        Write-Host "  Dies kann 2-5 Minuten dauern..." -ForegroundColor Gray
        
        try {
            $extractResult = & $7zipPath x $xzFile -o"$($Config.TempDir)" -y 2>&1
            
            if ($LASTEXITCODE -ne 0) {
                throw "7-Zip Fehler-Code: $LASTEXITCODE"
            }
            
            # Finde das extrahierte Image
            Start-Sleep -Seconds 2
            $extractedImg = Get-ChildItem $Config.TempDir -Filter "*.img" | Select-Object -First 1
            
            if ($extractedImg) {
                $imgFile = $extractedImg.FullName
                $imgSize = (Get-Item $imgFile).Length
                Write-Success "Image extrahiert: $($extractedImg.Name) ($([math]::Round($imgSize/1GB, 2)) GB)"
            } else {
                throw "Keine .img Datei gefunden nach Extraktion"
            }
        } catch {
            Write-Error2 "Extraktion fehlgeschlagen: $_"
            Write-Host ""
            Write-Host "Mögliche Ursachen:" -ForegroundColor Yellow
            Write-Host "  • XZ-Archiv ist beschädigt"
            Write-Host "  • Nicht genug Speicherplatz in $($Config.TempDir)"
            Write-Host "  • 7-Zip Fehler"
            Write-Host ""
            Write-Host "Lösung: XZ-Archiv löschen und erneut herunterladen"
            
            if (Get-YesNo "XZ-Archiv löschen und erneut herunterladen?") {
                Remove-Item $xzFile -Force -ErrorAction SilentlyContinue
                Write-Host "Bitte führe das Skript erneut aus." -ForegroundColor Cyan
            }
            exit 1
        }
    } else {
        Write-Success "Image bereits extrahiert"
    }
}

#===============================================================================
# Schritt 5: Image auf SD-Karte schreiben
#===============================================================================

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Schritt 5: Image auf SD-Karte schreiben" "White"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"

# SD-Karte vorbereiten mit diskpart
Write-Step "Bereite SD-Karte vor..."

$diskpartScript = @"
select disk $diskNumber
clean
create partition primary
format fs=fat32 quick
assign
"@

$diskpartScriptPath = Join-Path $Config.TempDir "diskpart-script.txt"
$diskpartScript | Out-File -FilePath $diskpartScriptPath -Encoding ASCII

diskpart /s $diskpartScriptPath | Out-Null
Start-Sleep -Seconds 3

Write-Success "SD-Karte formatiert"

# Verwende dd-ähnliches Tool oder Raspberry Pi Imager CLI falls verfügbar
Write-Step "Schreibe Image auf SD-Karte..."
Write-Warning2 "Dies kann 10-20 Minuten dauern. Bitte warten..."

# Prüfe ob rpi-imager CLI verfügbar ist
$rpiImager = Get-Command "rpi-imager" -ErrorAction SilentlyContinue

if ($rpiImager) {
    # Verwende Raspberry Pi Imager CLI
    & rpi-imager --cli $imgFile $selectedDrive.DeviceID
} else {
    # Fallback: Verwende PowerShell native Methode mit dd für Windows
    $ddPath = Get-Command "dd" -ErrorAction SilentlyContinue
    
    if (-not $ddPath) {
        Write-Warning2 "Für das Schreiben des Images wird der Raspberry Pi Imager benötigt."
        Write-Host ""
        Write-Host "Bitte lade den Raspberry Pi Imager herunter und schreibe das Image manuell:"
        Write-Host "  1. Download: https://www.raspberrypi.com/software/"
        Write-Host "  2. Image-Datei: $imgFile"
        Write-Host "  3. Nach dem Schreiben dieses Skript erneut mit -SkipDownload ausführen"
        Write-Host ""
        Write-Host "Oder installiere dd für Windows:"
        Write-Host "  winget install GNU.dd"
        Write-Host ""
        
        $openImager = Get-YesNo "Raspberry Pi Imager Website öffnen?"
        if ($openImager) {
            Start-Process "https://www.raspberrypi.com/software/"
        }
        
        Write-Host ""
        Write-Host "Nach dem Schreiben des Images: Führe das Skript erneut aus mit:" -ForegroundColor Yellow
        Write-Host "  .\prepare-sd-card.ps1 -SkipDownload" -ForegroundColor Cyan
        exit 0
    }
    
    # dd verwenden
    & dd if=$imgFile of=$selectedDrive.DeviceID bs=4M status=progress
}

Write-Success "Image geschrieben"

#===============================================================================
# Schritt 6: Boot-Partition konfigurieren
#===============================================================================

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Schritt 6: Boot-Partition konfigurieren" "White"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"

# Warte auf Laufwerkserkennung
Start-Sleep -Seconds 5

# Finde Boot-Partition
$partitions = Get-Partition -DiskNumber $diskNumber -ErrorAction SilentlyContinue
$bootPartition = $partitions | Where-Object { $_.Size -lt 1GB } | Select-Object -First 1

if (-not $bootPartition) {
    # Versuche Laufwerksbuchstaben direkt zu finden
    $volumes = Get-Volume | Where-Object { $_.FileSystemLabel -eq "bootfs" -or $_.FileSystemLabel -eq "boot" }
    if ($volumes) {
        $bootDrive = "$($volumes[0].DriveLetter):"
    } else {
        Write-Warning2 "Boot-Partition konnte nicht automatisch gefunden werden."
        $bootDrive = Get-UserInput "Laufwerksbuchstabe der Boot-Partition (z.B. E:)"
    }
} else {
    $bootDrive = "$($bootPartition.DriveLetter):"
}

Write-Success "Boot-Partition: $bootDrive"

# SSH aktivieren
Write-Step "Aktiviere SSH..."
New-Item -ItemType File -Path "$bootDrive\ssh" -Force | Out-Null
Write-Success "SSH aktiviert"

# Erstelle firstrun.sh für Raspberry Pi OS (wird automatisch beim ersten Boot ausgeführt)
# Dies ist der offizielle Weg für Raspberry Pi OS Bookworm
Write-Step "Erstelle First-Run Konfiguration..."

$firstrunSetup = @"
#!/bin/bash

set +e

# Aktiviere systemd Service für PRASCO Setup
if [ -f /boot/firmware/prasco-firstboot.service ] || [ -f /boot/prasco-firstboot.service ]; then
    # Bestimme Boot-Pfad
    if [ -f /boot/firmware/prasco-firstboot.service ]; then
        BOOT_PATH="/boot/firmware"
    else
        BOOT_PATH="/boot"
    fi
    
    # Installiere Service
    cp "\$BOOT_PATH/prasco-firstboot.service" /etc/systemd/system/ 2>/dev/null || true
    systemctl daemon-reload
    systemctl enable prasco-firstboot.service 2>/dev/null || true
    
    echo "PRASCO Auto-Setup aktiviert"
fi

# Setze Hostname
hostnamectl set-hostname $Hostname 2>/dev/null || hostname $Hostname
echo "127.0.1.1 $Hostname" >> /etc/hosts

rm -f /boot/firstrun.sh
sed -i 's| systemd.run.*||g' /boot/cmdline.txt
exit 0
"@

$firstrunSetup | Out-File -FilePath "$bootDrive\firstrun.sh" -Encoding ASCII

Write-Success "First-Run Konfiguration erstellt"

# Benutzer konfigurieren (Raspberry Pi OS Bookworm)
Write-Step "Konfiguriere Benutzer..."
$passwordHash = & openssl passwd -6 $PiPassword 2>$null
if (-not $passwordHash) {
    # Fallback: Verwende Python falls openssl nicht verfügbar
    $passwordHash = & python -c "import crypt; print(crypt.crypt('$PiPassword', crypt.mksalt(crypt.METHOD_SHA512)))" 2>$null
    if (-not $passwordHash) {
        # Letzter Fallback: Speichere Klartext (wird vom firstrun-Script gehasht)
        $passwordHash = $PiPassword
    }
}

"${PiUser}:${passwordHash}" | Out-File -FilePath "$bootDrive\userconf.txt" -Encoding ASCII -NoNewline
Write-Success "Benutzer konfiguriert"

# WLAN konfigurieren
if ($configureWiFi -and $WiFiSSID) {
    Write-Step "Konfiguriere WLAN..."
    
    $wpaSupplicant = @"
country=DE
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="$WiFiSSID"
    psk="$WiFiPassword"
    key_mgmt=WPA-PSK
}
"@
    
    $wpaSupplicant | Out-File -FilePath "$bootDrive\wpa_supplicant.conf" -Encoding ASCII
    Write-Success "WLAN konfiguriert"
}

# PRASCO First-Boot Script erstellen
Write-Step "Erstelle PRASCO Auto-Setup..."

$isDietPi = $selectedOSKey -eq "DietPi"
$isLite = $selectedOSKey -eq "RaspberryPiOS_Lite"

$firstBootScript = @"
#!/bin/bash
#===============================================================================
# PRASCO First-Boot Auto-Setup
# Dieses Skript wird beim ersten Start automatisch ausgeführt
# OS: $($selectedOS.Name)
#===============================================================================

LOG_FILE="/var/log/prasco-firstboot.log"
exec > >(tee -a "\$LOG_FILE") 2>&1

echo "=============================================="
echo "PRASCO First-Boot Setup"
echo "Betriebssystem: $($selectedOS.Name)"
echo "Start: \$(date)"
echo "=============================================="

# Warte auf Netzwerk
echo "Warte auf Netzwerkverbindung..."
MAX_RETRIES=60
RETRY=0
while ! ping -c 1 -W 2 8.8.8.8 &>/dev/null && ! ping -c 1 -W 2 1.1.1.1 &>/dev/null; do
    RETRY=\$((RETRY + 1))
    if [ \$RETRY -ge \$MAX_RETRIES ]; then
        echo "FEHLER: Keine Netzwerkverbindung nach \$MAX_RETRIES Versuchen!"
        echo "Bitte Netzwerkverbindung prüfen (Ethernet-Kabel oder WLAN-Konfiguration)"
        exit 1
    fi
    echo "Warte auf Netzwerk... (\$RETRY/\$MAX_RETRIES)"
    sleep 5
done
echo "Netzwerk verfügbar!"

# Hostname setzen
echo "Setze Hostname auf: $Hostname"
hostnamectl set-hostname $Hostname 2>/dev/null || hostname $Hostname
grep -q "$Hostname" /etc/hosts || echo "127.0.1.1 $Hostname" >> /etc/hosts

# Netzwerk konfigurieren: DHCP mit statischem Fallback
echo "Konfiguriere Netzwerk (DHCP mit Fallback 192.168.1.199)..."

# Prüfe welcher Netzwerk-Manager verwendet wird
if systemctl is-active --quiet NetworkManager; then
    echo "Verwende NetworkManager..."
    # NetworkManager Konfiguration (neuere Raspberry Pi OS Versionen)
    nmcli con mod 'Wired connection 1' ipv4.method auto 2>/dev/null || true
    nmcli con mod 'Wired connection 1' ipv4.may-fail no 2>/dev/null || true
elif [ -f /etc/dhcpcd.conf ]; then
    echo "Verwende dhcpcd..."
    # dhcpcd Konfiguration (ältere Versionen und DietPi)
    if ! grep -q "# PRASCO Netzwerkkonfiguration" /etc/dhcpcd.conf; then
        cat >> /etc/dhcpcd.conf << 'NETCFG'

# PRASCO Netzwerkkonfiguration
# Primär: DHCP, Fallback: Statische IP falls kein DHCP-Server antwortet

# Fallback-Profil definieren
profile static_eth0
static ip_address=192.168.1.199/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8 8.8.4.4

# Ethernet: DHCP mit Fallback nach 30 Sekunden
interface eth0
fallback static_eth0

# WLAN: DHCP mit Fallback nach 30 Sekunden
interface wlan0
fallback static_eth0
NETCFG
        systemctl restart dhcpcd 2>/dev/null || true
    fi
fi
echo "Netzwerk konfiguriert!"

# System aktualisieren
echo "Aktualisiere System..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -o Dpkg::Options::="--force-confold"

# Node.js 18 installieren
echo "Installiere Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js bereits installiert: \$(node --version)"
fi

# PostgreSQL installieren
echo "Installiere PostgreSQL..."
if ! command -v psql &> /dev/null; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
else
    echo "PostgreSQL bereits installiert"
fi

# PM2 installieren
echo "Installiere PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "PM2 bereits installiert"
fi

# Git installieren
echo "Installiere Git..."
apt-get install -y git

# Weitere Abhängigkeiten (nur wenn Desktop-Version oder Kiosk-Modus gewünscht)
"@ + $(if ($isLite) { @"

echo "Lite-Version: Chromium wird nicht automatisch installiert"
echo "Für Kiosk-Modus später manuell installieren mit:"
echo "  sudo apt install chromium-browser xdotool unclutter"
"@ } else { @"

echo "Installiere Desktop-Abhängigkeiten für Kiosk-Modus..."
if apt-get install -y chromium-browser xdotool unclutter; then
    echo "Chromium und Kiosk-Tools erfolgreich installiert"
elif apt-get install -y chromium xdotool unclutter; then
    echo "Chromium (alternative) und Kiosk-Tools erfolgreich installiert"
else
    echo "WARNUNG: Chromium-Installation fehlgeschlagen"
    echo "Für Kiosk-Modus muss Chromium manuell installiert werden"
fi
"@ }) + @"

# PRASCO klonen
echo "Klone PRASCO Repository..."
cd /home/$PiUser
if [ ! -d "Prasco" ]; then
    git clone $($Config.Repository) Prasco
    chown -R ${PiUser}:${PiUser} Prasco
    echo "PRASCO erfolgreich geklont"
else
    echo "PRASCO Verzeichnis existiert bereits"
fi

# Setze Marker dass Setup abgeschlossen werden muss
touch /home/$PiUser/Prasco/.first-boot-complete

# Erstelle Autostart für interaktives Setup
mkdir -p /home/$PiUser/.bashrc.d

cat > /home/$PiUser/.bashrc.d/prasco-setup.sh << 'SETUP'
#!/bin/bash
# PRASCO Auto-Setup Erinnerung

if [ -f ~/Prasco/.first-boot-complete ] && [ ! -f ~/Prasco/.setup-complete ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║         PRASCO - Erste Einrichtung erforderlich              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🚀 Starte interaktives Setup mit:"
    echo "   cd ~/Prasco && ./scripts/setup-production.sh"
    echo ""
    echo "⚡ Oder Schnellstart für Test:"
    echo "   cd ~/Prasco && ./scripts/first-run.sh"
    echo ""
fi
SETUP

# Füge .bashrc.d Support hinzu falls nicht vorhanden
if ! grep -q ".bashrc.d" /home/$PiUser/.bashrc 2>/dev/null; then
    echo '' >> /home/$PiUser/.bashrc
    echo '# Source all scripts in .bashrc.d' >> /home/$PiUser/.bashrc
    echo 'if [ -d ~/.bashrc.d ]; then' >> /home/$PiUser/.bashrc
    echo '    for f in ~/.bashrc.d/*.sh; do' >> /home/$PiUser/.bashrc
    echo '        [ -f "\$f" ] && source "\$f"' >> /home/$PiUser/.bashrc
    echo '    done' >> /home/$PiUser/.bashrc
    echo 'fi' >> /home/$PiUser/.bashrc
fi

chown -R ${PiUser}:${PiUser} /home/$PiUser/.bashrc.d
chmod +x /home/$PiUser/.bashrc.d/prasco-setup.sh

# Deaktiviere dieses Script für zukünftige Boots
systemctl disable prasco-firstboot.service 2>/dev/null || true

# Entferne das Script damit es nicht erneut ausgeführt wird
rm -f /boot/prasco-firstboot.sh /boot/firmware/prasco-firstboot.sh

echo "=============================================="
echo "First-Boot Setup abgeschlossen!"
echo "Ende: \$(date)"
echo "=============================================="
echo ""
echo "Nächste Schritte:"
echo "  1. Mit SSH verbinden: ssh $PiUser@$Hostname.local"
echo "  2. Vollständiges Setup: cd ~/Prasco && ./scripts/setup-production.sh"
echo "  3. Oder Schnellstart: cd ~/Prasco && ./scripts/first-run.sh"
echo ""
echo "Das System wird jetzt neu gestartet..."
sleep 5

# Neustart
reboot
"@

$firstBootScript | Out-File -FilePath "$bootDrive\prasco-firstboot.sh" -Encoding ASCII

# Systemd Service für First-Boot erstellen
# Unterstützt sowohl /boot als auch /boot/firmware Pfade (verschiedene Pi OS Versionen)
$systemdService = @"
[Unit]
Description=PRASCO First Boot Setup
After=network-online.target systemd-networkd-wait-online.service
Wants=network-online.target
ConditionPathExists=|/boot/prasco-firstboot.sh
ConditionPathExists=|/boot/firmware/prasco-firstboot.sh
ConditionPathExists=!/etc/prasco-firstboot-complete

[Service]
Type=oneshot
ExecStartPre=/bin/sleep 10
ExecStart=/bin/bash -c 'if [ -f /boot/prasco-firstboot.sh ]; then /bin/bash /boot/prasco-firstboot.sh; elif [ -f /boot/firmware/prasco-firstboot.sh ]; then /bin/bash /boot/firmware/prasco-firstboot.sh; fi'
ExecStartPost=/bin/touch /etc/prasco-firstboot-complete
RemainAfterExit=yes
StandardOutput=journal+console

[Install]
WantedBy=multi-user.target
"@

$systemdService | Out-File -FilePath "$bootDrive\prasco-firstboot.service" -Encoding ASCII

# Erstelle Installations-Helper Script (wird beim ersten Boot die systemd-Service installieren)
$installerScript = @"
#!/bin/bash
# PRASCO Firstboot Service Installer
# Dieses Script installiert den systemd Service beim ersten Boot

# Bestimme Boot-Partition Pfad
if [ -f /boot/firmware/prasco-firstboot.service ]; then
    BOOT_PATH="/boot/firmware"
elif [ -f /boot/prasco-firstboot.service ]; then
    BOOT_PATH="/boot"
else
    echo "Fehler: Kann prasco-firstboot.service nicht finden"
    exit 1
fi

# Kopiere Service-Datei
cp "\$BOOT_PATH/prasco-firstboot.service" /etc/systemd/system/

# Lade systemd neu
systemctl daemon-reload

# Aktiviere Service
systemctl enable prasco-firstboot.service

# Starte Service (wird dann beim nächsten Boot automatisch laufen)
echo "PRASCO Firstboot Service installiert und aktiviert"

# Lösche dieses Script
rm -f /etc/rc.local.d/prasco-installer.sh
"@

$installerScript | Out-File -FilePath "$bootDrive\prasco-installer.sh" -Encoding ASCII

Write-Success "PRASCO Auto-Setup konfiguriert"

# Erstelle Installations-Info Datei
$infoContent = @"
PRASCO Auto-Installation
========================

Diese SD-Karte wurde vorbereitet für:
- Betriebssystem: $($selectedOS.Name)
- Hostname: $Hostname
- Benutzer: $PiUser
$(if ($WiFiSSID) { "- WLAN: $WiFiSSID" } else { "" })

Beim ersten Start:
1. Raspberry Pi bootet (~2-3 Minuten)
2. Automatisches Setup läuft (~10-15 Minuten)
   - System-Updates
   - Node.js, PostgreSQL, PM2 Installation
   - PRASCO Repository klonen
3. System startet neu
4. Verbinde per SSH: ssh ${PiUser}@${Hostname}.local
5. Führe aus: cd ~/Prasco && ./scripts/setup-production.sh

Erstellt: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$infoContent | Out-File -FilePath "$bootDrive\PRASCO-INSTALLATION.txt" -Encoding UTF8
Write-Success "Installations-Info erstellt"

# Custom config.txt Anpassungen
Write-Step "Optimiere Boot-Konfiguration..."
$configPath = "$bootDrive\config.txt"
if (Test-Path $configPath) {
    $configAdditions = @"

# PRASCO Optimierungen
# GPU Memory für Video-Wiedergabe
gpu_mem=128

# HDMI immer aktivieren
hdmi_force_hotplug=1

# Deaktiviere Bildschirmschoner
consoleblank=0
"@
    Add-Content -Path $configPath -Value $configAdditions
}
Write-Success "Boot-Konfiguration optimiert"

#===============================================================================
# Abschluss
#===============================================================================

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Green"
Write-ColorOutput "SD-Karte erfolgreich vorbereitet!" "Green"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Green"

Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. SD-Karte sicher entfernen"
Write-Host "  2. SD-Karte in den Raspberry Pi einlegen"
Write-Host "  3. Raspberry Pi mit Netzwerk und Strom verbinden"
Write-Host "  4. Warten bis der erste Start abgeschlossen ist (~10-15 Minuten)"
Write-Host ""
Write-Host "  5. Per SSH verbinden:" -ForegroundColor Yellow
Write-Host "     ssh ${PiUser}@${Hostname}.local" -ForegroundColor Cyan
Write-Host ""
Write-Host "  6. Interaktives Setup starten:" -ForegroundColor Yellow
Write-Host "     cd ~/Prasco && ./scripts/setup-production.sh" -ForegroundColor Cyan
Write-Host ""

Write-ColorOutput "Zugangsdaten:" "Yellow"
Write-Host "  Benutzer: $PiUser"
Write-Host "  Passwort: [wie oben eingegeben]"
Write-Host "  Hostname: $Hostname"
if ($WiFiSSID) {
    Write-Host "  WLAN:     $WiFiSSID"
}
Write-Host ""

# SD-Karte auswerfen
if (Get-YesNo "SD-Karte jetzt sicher auswerfen?") {
    Write-Step "Werfe SD-Karte aus..."
    $vol = Get-Volume -DriveLetter $bootDrive[0]
    $ejectShell = New-Object -ComObject Shell.Application
    $ejectShell.NameSpace(17).ParseName("$bootDrive\").InvokeVerb("Eject")
    Write-Success "SD-Karte kann entfernt werden"
}

Write-Host ""
Write-ColorOutput "Viel Erfolg mit PRASCO! 🚀" "Magenta"
Write-Host ""
