#!/bin/bash
# PRASCO - yt-dlp Installation für Video-Download (Hotspot-Modus)

echo "====================================="
echo "PRASCO Video-Download Setup"
echo "====================================="

# Prüfe ob yt-dlp bereits installiert ist
if command -v yt-dlp &> /dev/null; then
    echo "✓ yt-dlp ist bereits installiert"
    yt-dlp --version
    read -p "Möchten Sie ein Update durchführen? (j/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Jj]$ ]]; then
        echo "Aktualisiere yt-dlp..."
        sudo pip3 install --upgrade yt-dlp
    fi
else
    echo "yt-dlp wird installiert..."
    
    # Installiere Python pip falls nicht vorhanden
    if ! command -v pip3 &> /dev/null; then
        echo "Installiere Python pip..."
        sudo apt-get update
        sudo apt-get install -y python3-pip
    fi
    
    # Installiere yt-dlp
    sudo pip3 install yt-dlp
    
    if command -v yt-dlp &> /dev/null; then
        echo "✓ yt-dlp erfolgreich installiert"
        yt-dlp --version
    else
        echo "✗ Installation fehlgeschlagen"
        exit 1
    fi
fi

# Erstelle Video-Upload-Verzeichnis
VIDEO_DIR="/home/pi/Prasco/uploads/videos"
if [ ! -d "$VIDEO_DIR" ]; then
    echo "Erstelle Video-Verzeichnis: $VIDEO_DIR"
    mkdir -p "$VIDEO_DIR"
    chmod 755 "$VIDEO_DIR"
    echo "✓ Verzeichnis erstellt"
else
    echo "✓ Video-Verzeichnis existiert bereits"
fi

echo ""
echo "====================================="
echo "Setup abgeschlossen!"
echo "====================================="
echo ""
echo "YouTube-Videos werden automatisch heruntergeladen"
echo "und im Verzeichnis gespeichert: $VIDEO_DIR"
echo ""
echo "Dies ermöglicht die Offline-Wiedergabe im Hotspot-Modus."
echo ""
