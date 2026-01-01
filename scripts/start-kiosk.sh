#!/bin/bash
# PRASCO Digital Signage - Kiosk Mode Starter
# Wird automatisch beim Raspberry Pi Start ausgeführt

# Warte auf Netzwerk
sleep 10

# Display-Einstellungen
export DISPLAY=:0

# Bildschirmschoner deaktivieren (optional, ignoriere Fehler)
xset s off 2>/dev/null || true
xset -dpms 2>/dev/null || true
xset s noblank 2>/dev/null || true

# Mauszeiger verstecken (optional, nur wenn installiert)
command -v unclutter >/dev/null 2>&1 && unclutter -idle 0.5 -root &

# Warte auf Server (HTTPS mit self-signed certificate)
echo "Warte auf PRASCO Server..."
# Prüfe sowohl HTTP als auch HTTPS
while ! (curl -s http://localhost:3000/api/health > /dev/null 2>&1 || curl -sk https://localhost:3000/api/health > /dev/null 2>&1); do
  echo "Server nicht erreichbar, warte..."
  sleep 2
done
echo "Server erreichbar!"

# Bestimme Protokoll (HTTPS bevorzugt wenn verfügbar)
if curl -sk https://localhost:3000/api/health > /dev/null 2>&1; then
  PROTOCOL="https"
  echo "Verwende HTTPS"
else
  PROTOCOL="http"
  echo "Verwende HTTP"
fi

# Chromium im Kiosk-Modus starten mit Autoplay-Unterstützung
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --check-for-update-interval=31536000 \
  --start-fullscreen \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --ignore-certificate-errors \
<<<<<<< HEAD
  https://localhost:3000/public/display.html
=======
  --disable-web-security \
  --allow-insecure-localhost \
  ${PROTOCOL}://localhost:3000
>>>>>>> 55849d7 (feat: Complete script review and updates for TypeScript migration)
