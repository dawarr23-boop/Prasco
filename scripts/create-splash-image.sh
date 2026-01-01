#!/bin/bash
#===============================================================================
# PRASCO - Erstellt ein grafisches Splash-Screen-Bild
# Benötigt ImageMagick
#===============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR)"
ASSETS_DIR="$PROJECT_DIR/assets"
OUTPUT_DIR="$ASSETS_DIR/splash"

# Erstelle Output-Verzeichnis
mkdir -p "$OUTPUT_DIR"

echo "🎨 Erstelle PRASCO Splash Screen Bild..."

# Prüfe ob ImageMagick installiert ist
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick ist nicht installiert!"
    echo "   Installiere mit: sudo apt-get install imagemagick"
    exit 1
fi

#===============================================================================
# Splash Screen Bild erstellen (1920x1080, Raspberry Pi Display)
#===============================================================================

# Hintergrund: Dunkles Blau/Lila Gradient
convert -size 1920x1080 \
    gradient:'#1a1a2e-#16213e' \
    "$OUTPUT_DIR/background.png"

# PRASCO Logo Text als Bild
convert -size 1200x300 xc:none \
    -font DejaVu-Sans-Bold \
    -pointsize 120 \
    -fill '#e94560' \
    -gravity center \
    -annotate +0+0 'PRASCO' \
    "$OUTPUT_DIR/logo-text.png"

# Untertitel
convert -size 1200x100 xc:none \
    -font DejaVu-Sans \
    -pointsize 40 \
    -fill '#0f3460' \
    -gravity center \
    -annotate +0+0 'Digitales Schwarzes Brett' \
    "$OUTPUT_DIR/subtitle.png"

# Ladebalken-Hintergrund
convert -size 800x40 xc:none \
    -fill '#0f3460' \
    -draw "roundrectangle 0,0 800,40 20,20" \
    "$OUTPUT_DIR/progressbar-bg.png"

# Kombiniere alles
convert "$OUTPUT_DIR/background.png" \
    "$OUTPUT_DIR/logo-text.png" -gravity center -geometry +0-150 -composite \
    "$OUTPUT_DIR/subtitle.png" -gravity center -geometry +0+50 -composite \
    "$OUTPUT_DIR/progressbar-bg.png" -gravity center -geometry +0+250 -composite \
    "$OUTPUT_DIR/prasco-splash.png"

echo "✅ Splash Screen erstellt: $OUTPUT_DIR/prasco-splash.png"

# Für PSplash konvertieren (480x272 für kleine Displays)
convert "$OUTPUT_DIR/prasco-splash.png" \
    -resize 480x272 \
    -gravity center \
    -extent 480x272 \
    "$OUTPUT_DIR/prasco-splash-small.png"

echo "✅ Kleines Splash Screen erstellt: $OUTPUT_DIR/prasco-splash-small.png"

#===============================================================================
# Alternative: ASCII-Art zu PNG
#===============================================================================

# Erstelle PNG aus ASCII-Art
convert -size 1920x1080 xc:'#0f0f1e' \
    -font Courier-Bold \
    -pointsize 24 \
    -fill '#e94560' \
    -gravity center \
    -annotate +0+0 "$(cat $ASSETS_DIR/prasco-logo.txt)" \
    "$OUTPUT_DIR/prasco-splash-ascii.png"

echo "✅ ASCII Splash Screen erstellt: $OUTPUT_DIR/prasco-splash-ascii.png"

#===============================================================================
# Installation (optional)
#===============================================================================

read -p "Splash Screen jetzt für PSplash installieren? [j/N]: " response
if [[ "$response" =~ ^[jJyY]$ ]]; then
    if [[ $EUID -ne 0 ]]; then
        echo "⚠️  Root-Rechte erforderlich für Installation"
        echo "   Verwende: sudo $0"
        exit 1
    fi
    
    echo "📦 Installiere Splash Screen..."
    
    # Für PSplash
    cp "$OUTPUT_DIR/prasco-splash-small.png" /usr/share/psplash/psplash-prasco.png
    
    echo "✅ Installation abgeschlossen!"
    echo "   Starte neu um Splash Screen zu sehen"
fi

echo ""
echo "Splash Screen Dateien:"
echo "  - Full HD (1920x1080): $OUTPUT_DIR/prasco-splash.png"
echo "  - Klein (480x272):     $OUTPUT_DIR/prasco-splash-small.png"
echo "  - ASCII-Version:       $OUTPUT_DIR/prasco-splash-ascii.png"
echo ""
