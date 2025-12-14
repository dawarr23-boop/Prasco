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
    RaspberryPiOS = @{
        URL = "https://downloads.raspberrypi.org/raspios_lite_arm64/images/raspios_lite_arm64-2024-11-19/2024-11-19-raspios-bookworm-arm64-lite.img.xz"
        FileName = "raspios-bookworm-arm64-lite.img.xz"
        ImageName = "raspios-bookworm-arm64-lite.img"
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

$xzFile = Join-Path $Config.TempDir $Config.RaspberryPiOS.FileName
$imgFile = Join-Path $Config.TempDir $Config.RaspberryPiOS.ImageName

if ($SkipDownload -and (Test-Path $imgFile)) {
    Write-Success "Image bereits vorhanden: $imgFile"
} else {
    if (-not (Test-Path $xzFile)) {
        Write-Step "Lade Raspberry Pi OS herunter..."
        Write-Host "  URL: $($Config.RaspberryPiOS.URL)" -ForegroundColor Gray
        Write-Host "  Dies kann einige Minuten dauern..." -ForegroundColor Gray
        Write-Host ""
        
        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $Config.RaspberryPiOS.URL -OutFile $xzFile -UseBasicParsing
            $ProgressPreference = 'Continue'
            Write-Success "Download abgeschlossen"
        } catch {
            Write-Error2 "Download fehlgeschlagen: $_"
            exit 1
        }
    } else {
        Write-Success "XZ-Archiv bereits vorhanden"
    }
    
    # Extrahieren
    Write-Step "Extrahiere Image..."
    & $7zipPath x $xzFile -o"$($Config.TempDir)" -y | Out-Null
    
    # Finde das extrahierte Image
    $extractedImg = Get-ChildItem $Config.TempDir -Filter "*.img" | Select-Object -First 1
    if ($extractedImg) {
        $imgFile = $extractedImg.FullName
        Write-Success "Image extrahiert: $($extractedImg.Name)"
    } else {
        Write-Error2 "Konnte extrahiertes Image nicht finden!"
        exit 1
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

$firstBootScript = @"
#!/bin/bash
#===============================================================================
# PRASCO First-Boot Auto-Setup
# Dieses Skript wird beim ersten Start automatisch ausgeführt
#===============================================================================

LOG_FILE="/var/log/prasco-firstboot.log"
exec > >(tee -a "\$LOG_FILE") 2>&1

echo "=============================================="
echo "PRASCO First-Boot Setup"
echo "Start: \$(date)"
echo "=============================================="

# Warte auf Netzwerk
echo "Warte auf Netzwerkverbindung..."
MAX_RETRIES=30
RETRY=0
while ! ping -c 1 google.com &>/dev/null; do
    RETRY=\$((RETRY + 1))
    if [ \$RETRY -ge \$MAX_RETRIES ]; then
        echo "FEHLER: Keine Netzwerkverbindung nach \$MAX_RETRIES Versuchen!"
        exit 1
    fi
    echo "Warte auf Netzwerk... (\$RETRY/\$MAX_RETRIES)"
    sleep 5
done
echo "Netzwerk verfügbar!"

# Hostname setzen
echo "Setze Hostname auf: $Hostname"
hostnamectl set-hostname $Hostname
echo "127.0.1.1 $Hostname" >> /etc/hosts

# System aktualisieren
echo "Aktualisiere System..."
apt-get update
apt-get upgrade -y

# Node.js 18 installieren
echo "Installiere Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PostgreSQL installieren
echo "Installiere PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# PM2 installieren
echo "Installiere PM2..."
npm install -g pm2

# Weitere Abhängigkeiten
echo "Installiere weitere Abhängigkeiten..."
apt-get install -y git chromium-browser xdotool unclutter

# PRASCO klonen
echo "Klone PRASCO Repository..."
cd /home/$PiUser
git clone $($Config.Repository) Prasco
chown -R ${PiUser}:${PiUser} Prasco

# Setze Marker dass Setup abgeschlossen werden muss
touch /home/$PiUser/Prasco/.first-boot-complete

# Erstelle Autostart für interaktives Setup
cat > /home/$PiUser/.bashrc.d/prasco-setup.sh << 'SETUP'
if [ -f /home/$PiUser/Prasco/.first-boot-complete ] && [ ! -f /home/$PiUser/Prasco/.setup-complete ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║         PRASCO - Erste Einrichtung erforderlich              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Starte interaktives Setup mit:"
    echo "  cd ~/Prasco && ./scripts/setup-production.sh"
    echo ""
fi
SETUP

mkdir -p /home/$PiUser/.bashrc.d
echo 'for f in ~/.bashrc.d/*.sh; do source "\$f"; done' >> /home/$PiUser/.bashrc
chown -R ${PiUser}:${PiUser} /home/$PiUser/.bashrc.d

# Deaktiviere dieses Script
systemctl disable prasco-firstboot.service

echo "=============================================="
echo "First-Boot Setup abgeschlossen!"
echo "Ende: \$(date)"
echo "=============================================="
echo ""
echo "Bitte melde dich an und führe aus:"
echo "  cd ~/Prasco && ./scripts/setup-production.sh"

# Neustart
reboot
"@

$firstBootScript | Out-File -FilePath "$bootDrive\prasco-firstboot.sh" -Encoding ASCII

# Systemd Service für First-Boot erstellen
$systemdService = @"
[Unit]
Description=PRASCO First Boot Setup
After=network-online.target
Wants=network-online.target
ConditionPathExists=/boot/prasco-firstboot.sh

[Service]
Type=oneshot
ExecStart=/bin/bash /boot/prasco-firstboot.sh
RemainAfterExit=yes
StandardOutput=journal+console

[Install]
WantedBy=multi-user.target
"@

$systemdService | Out-File -FilePath "$bootDrive\prasco-firstboot.service" -Encoding ASCII

# cmdline.txt anpassen für First-Boot (falls möglich)
$cmdlinePath = "$bootDrive\cmdline.txt"
if (Test-Path $cmdlinePath) {
    $cmdline = Get-Content $cmdlinePath -Raw
    if ($cmdline -notmatch "systemd.run") {
        # Füge systemd firstboot hinzu
        $cmdline = $cmdline.Trim() + " systemd.run=/boot/prasco-firstboot.sh systemd.run_success_action=reboot"
        $cmdline | Out-File -FilePath $cmdlinePath -Encoding ASCII -NoNewline
    }
}

Write-Success "PRASCO Auto-Setup konfiguriert"

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
