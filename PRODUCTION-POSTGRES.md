# PRASCO Production Deployment Guide

## PostgreSQL Production Setup

PRASCO unterstützt sowohl **SQLite** (für Raspberry Pi) als auch **PostgreSQL** (für Production-Server).

## 🐘 Option 1: Docker Compose (Empfohlen)

### Voraussetzungen
- Docker & Docker Compose installiert
- Domain mit SSL-Zertifikat (Let's Encrypt empfohlen)

### Setup-Schritte

1. **Umgebungsvariablen konfigurieren**
```bash
cp .env.production.example .env.production
nano .env.production
```

Wichtige Änderungen:
- `DB_PASSWORD`: Starkes PostgreSQL-Passwort
- `JWT_SECRET` & `JWT_REFRESH_SECRET`: Min. 32 Zeichen random strings
- `ADMIN_PASSWORD`: Sicheres Admin-Passwort
- `SSL_ENABLED=true`: HTTPS aktivieren

2. **SSL-Zertifikate einrichten**
```bash
# Mit Let's Encrypt (certbot)
sudo certbot certonly --standalone -d your-domain.com

# Zertifikate nach ./ssl/ kopieren
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/server.key
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/server.crt
sudo chown $USER:$USER ssl/*
```

3. **Production starten**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. **Logs überwachen**
```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

5. **Status prüfen**
```bash
docker-compose -f docker-compose.prod.yml ps
curl https://localhost:3000/api/health
```

### Services

- **App**: Node.js Server (Port 3000)
- **PostgreSQL**: Datenbank (Port 5432, intern)
- **Redis**: Caching & Sessions (Port 6379, intern)

### Volumes

- `postgres_data`: Datenbank-Persistenz
- `redis_data`: Redis-Persistenz
- `uploads_data`: Hochgeladene Dateien
- `logs_data`: Anwendungs-Logs

## 🐘 Option 2: Separater PostgreSQL-Server

### PostgreSQL Installation (Ubuntu/Debian)

```bash
# PostgreSQL 15 installieren
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# PostgreSQL starten
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Datenbank einrichten

```bash
# Als postgres-User anmelden
sudo -u postgres psql

# Datenbank und User erstellen
CREATE DATABASE bulletin_board;
CREATE USER prasco WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bulletin_board TO prasco;
\q
```

### PostgreSQL für Netzwerk-Zugriff konfigurieren

```bash
# postgresql.conf bearbeiten
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Ändern:
```
listen_addresses = 'localhost'  # oder '*' für alle Interfaces
```

```bash
# pg_hba.conf bearbeiten
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Hinzufügen:
```
host    bulletin_board    prasco    10.0.0.0/8    md5
```

```bash
# PostgreSQL neu starten
sudo systemctl restart postgresql
```

### PRASCO konfigurieren

```bash
cp .env.production.example .env.production
nano .env.production
```

Setzen:
```env
DB_DIALECT=postgres
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=bulletin_board
DB_USER=prasco
DB_PASSWORD=your_secure_password
```

### Mit PM2 starten

```bash
# Dependencies installieren
npm ci --only=production

# Build erstellen
npm run build

# Mit PM2 starten
pm2 start dist/server.js --name prasco-prod
pm2 save
pm2 startup
```

## 🔒 Sicherheit

### 1. Firewall konfigurieren

```bash
# UFW (Ubuntu)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 80/tcp   # HTTP (für Let's Encrypt)
sudo ufw enable
```

### 2. PostgreSQL-Zugriff absichern

- Verwende starke Passwörter
- Beschränke Zugriff über `pg_hba.conf`
- Nutze SSL-Verbindungen wenn möglich

### 3. Regelmäßige Backups

```bash
# PostgreSQL Backup-Script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/prasco"
mkdir -p $BACKUP_DIR

# Datenbank-Backup
pg_dump -U prasco -h localhost bulletin_board | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Uploads-Backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/uploads

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -type f -mtime +30 -delete
```

Als Cronjob:
```bash
crontab -e
# Täglich um 2 Uhr morgens
0 2 * * * /path/to/backup-script.sh
```

## 📊 Monitoring

### Health Check

```bash
curl https://your-domain.com/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-15T00:00:00.000Z",
  "database": "connected",
  "version": "2.0.0"
}
```

### PM2 Monitoring

```bash
pm2 monit
pm2 logs prasco-prod
pm2 status
```

### PostgreSQL Performance

```bash
# Aktive Verbindungen
psql -U prasco -d bulletin_board -c "SELECT count(*) FROM pg_stat_activity;"

# Datenbank-Größe
psql -U prasco -d bulletin_board -c "SELECT pg_size_pretty(pg_database_size('bulletin_board'));"
```

## 🔄 Updates

```bash
# Code aktualisieren
cd /path/to/prasco
git pull

# Dependencies aktualisieren
npm ci --only=production

# Build erstellen
npm run build

# PM2 neu starten
pm2 restart prasco-prod

# Oder mit Docker:
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🐛 Troubleshooting

### PostgreSQL-Verbindung schlägt fehl

```bash
# PostgreSQL-Status prüfen
sudo systemctl status postgresql

# Logs prüfen
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Verbindung testen
psql -U prasco -h localhost -d bulletin_board
```

### Migration-Fehler

```bash
# Datenbank-Schema neu erstellen
npm run db:reset  # VORSICHT: Löscht alle Daten!

# Oder manuell:
psql -U prasco -d bulletin_board -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pm2 restart prasco-prod
```

## 🌐 Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass https://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 50M;
}

# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📝 Checkliste Production-Launch

- [ ] PostgreSQL installiert und konfiguriert
- [ ] Starke Passwörter für DB, JWT, Admin gesetzt
- [ ] SSL-Zertifikate eingerichtet
- [ ] Firewall konfiguriert
- [ ] Backup-Strategie implementiert
- [ ] Monitoring eingerichtet
- [ ] Reverse Proxy konfiguriert (optional)
- [ ] Domain DNS-Einträge gesetzt
- [ ] Test-Login durchgeführt
- [ ] Health-Check erfolgreich
- [ ] Logs überprüft

## 📞 Support

Bei Problemen siehe TROUBLESHOOTING.md oder GitHub Issues.
