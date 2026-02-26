#!/bin/bash

# PRASCO Boot Logo Creator
# Erstellt ein einfaches PRASCO-Logo für den Boot-Splash

# Installiere ImageMagick falls nicht vorhanden
if ! command -v convert &> /dev/null; then
    echo "Installiere ImageMagick..."
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

# Erstelle PRASCO-Logo (1920x1080, schwarz mit grünem PRASCO-Text)
convert -size 1920x1080 xc:black \
    -font DejaVu-Sans-Bold \
    -pointsize 120 \
    -fill '#009640' \
    -gravity center \
    -annotate +0-100 'PRASCO' \
    -pointsize 40 \
    -fill '#58585a' \
    -annotate +0+50 'Display System' \
    -pointsize 24 \
    -fill '#ffffff' \
    -annotate +0+850 'wird gestartet...' \
    /tmp/prasco-boot-logo.png

echo "Logo erstellt: /tmp/prasco-boot-logo.png"
