#!/bin/bash
#===============================================================================
# SSL-Zertifikat Generator für PRASCO
# Erstellt selbstsignierte Zertifikate für lokale HTTPS-Nutzung
#===============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SSL_DIR="$PROJECT_ROOT/ssl"

echo "🔐 PRASCO SSL-Zertifikat Generator"
echo "=================================="
echo ""

# Erstelle SSL-Verzeichnis
mkdir -p "$SSL_DIR"
cd "$SSL_DIR"

# Hostname ermitteln
HOSTNAME="${1:-$(hostname)}"
IP_ADDRESS="${2:-$(hostname -I 2>/dev/null | awk '{print $1}' || echo '127.0.0.1')}"

echo "📋 Konfiguration:"
echo "   Hostname: $HOSTNAME"
echo "   IP-Adresse: $IP_ADDRESS"
echo ""

# OpenSSL Konfiguration erstellen
cat > openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = DE
ST = Bayern
L = Muenchen
O = PRASCO Digital Signage
OU = IT
CN = $HOSTNAME

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $HOSTNAME
DNS.2 = $HOSTNAME.local
DNS.3 = localhost
IP.1 = $IP_ADDRESS
IP.2 = 127.0.0.1
EOF

echo "🔑 Generiere privaten Schlüssel..."
openssl genrsa -out server.key 2048

echo "📜 Generiere selbstsigniertes Zertifikat (gültig 365 Tage)..."
openssl req -new -x509 -key server.key -out server.crt -days 365 -config openssl.cnf

# Berechtigungen setzen
chmod 600 server.key
chmod 644 server.crt

echo ""
echo "✅ SSL-Zertifikate erfolgreich erstellt!"
echo ""
echo "📁 Dateien:"
echo "   - $SSL_DIR/server.key (Privater Schlüssel)"
echo "   - $SSL_DIR/server.crt (Zertifikat)"
echo ""
echo "🔧 Aktivierung:"
echo "   Setze in .env: SSL_ENABLED=true"
echo ""
echo "⚠️  Browser-Warnung:"
echo "   Da dies ein selbstsigniertes Zertifikat ist, wird der Browser"
echo "   eine Sicherheitswarnung anzeigen. Klicke auf 'Erweitert' und"
echo "   dann 'Weiter zu [hostname] (unsicher)'"
echo ""
