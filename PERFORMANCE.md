# Performance-Optimierungen für Raspberry Pi 3

Diese Anwendung wurde speziell für den Betrieb auf einem Raspberry Pi 3 (1GB RAM, Quad-Core 1.2GHz) optimiert.

## Implementierte Optimierungen

### 1. PM2 Konfiguration (`ecosystem.config.js`)
- **Einzelne Instanz (fork mode)**: Kein Cluster-Mode wegen begrenztem RAM
- **Memory Limit**: 400MB max, Auto-Restart bei Überschreitung
- **Node.js Heap**: Begrenzt auf 512MB
- **Schnelle Restarts**: Kill-Timeout von 5s

**Verwendung:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 2. In-Memory Caching (node-cache)
- **Public Posts Cache**: 60 Sekunden TTL
- **Automatische Invalidierung**: Bei Post-Änderungen
- **Memory-Limit**: Max 100 Cache-Einträge
- **Cache-Statistiken**: Alle 5 Minuten im Log

### 3. Datenbank-Optimierungen
- **Indizes**: Für häufige Queries (siehe `database/performance-indexes.sql`)
- **Partial Indizes**: Nur für active=true Posts
- **Composite Indizes**: Für komplexe WHERE-Clauses

**Installation der Indizes:**
```bash
ssh pi@192.168.2.47
sudo -u postgres psql -d prasco -f /home/pi/Prasco/database/performance-indexes.sql
```

### 4. HTTP Response-Optimierungen
- **Compression**: Level 6 (Balance CPU/Size)
- **Static File Caching**: 1 Tag Browser-Cache
- **Immutable Assets**: 1 Jahr Cache für CSS/JS/Bilder
- **ETag Support**: Conditional Requests
- **Cache-Control Headers**: Differenziert nach Ressourcentyp

### 5. Frontend-Optimierungen
- **Lazy Loading**: Bilder werden erst bei Bedarf geladen
- **Debouncing**: Bei schnellen Ereignissen (z.B. Resize)
- **Optimierte Queries**: Nur benötigte Felder laden
- **Background Musik**: Preloading für nahtlose Übergänge

### 6. Medien-Optimierungen
- **Sharp**: Automatische Bild-Optimierung beim Upload
- **PDF→PNG**: Mit pdftoppm für PowerPoint-Slides
- **Kompression**: Nur Dateien >1KB komprimieren
- **Streaming**: Große Dateien werden gestreamt

## PostgreSQL Tuning

Bearbeite `/etc/postgresql/*/main/postgresql.conf`:

```conf
# Memory für RPi3 (1GB RAM)
shared_buffers = 128MB
effective_cache_size = 512MB
maintenance_work_mem = 64MB
work_mem = 4MB

# Connection Limits
max_connections = 20

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
default_statistics_target = 100
random_page_cost = 1.1  # SD-Karte optimiert
effective_io_concurrency = 200

# WAL
min_wal_size = 1GB
max_wal_size = 2GB
```

Nach Änderungen:
```bash
sudo systemctl restart postgresql
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit           # Live-Monitoring
pm2 logs prasco     # Logs anzeigen
pm2 describe prasco # Detaillierte Info
```

### Cache-Statistiken
Werden automatisch alle 5 Minuten geloggt:
```
Cache Stats - Hits: 150, Misses: 10, Hit Rate: 93.8%, Keys: 5
```

### System-Ressourcen
```bash
# CPU/Memory
htop

# Disk I/O
iostat -x 1

# Netzwerk
iftop
```

## Wartung

### Regelmäßige Aufgaben

**Täglich: Log-Rotation**
```bash
pm2 flush  # Logs leeren
```

**Wöchentlich: Datenbank-Wartung**
```bash
sudo -u postgres psql -d prasco -c "VACUUM ANALYZE;"
```

**Monatlich: Cache-Cleanup**
```bash
# Alte Uploads löschen (>90 Tage)
find /home/pi/Prasco/uploads -type f -mtime +90 -delete
```

## Performance-Probleme beheben

### Hoher Memory-Verbrauch
```bash
# PM2 Restart
pm2 restart prasco

# Node.js Heap überprüfen
pm2 describe prasco | grep memory
```

### Langsame Queries
```bash
# PostgreSQL Slow Queries aktivieren
sudo -u postgres psql -d prasco
ALTER DATABASE prasco SET log_min_duration_statement = 100;  # Log >100ms
```

### Hohe CPU-Last
- Prüfe Upload-Verarbeitung (LibreOffice/pdftoppm)
- Reduziere Compression-Level in server.ts
- Verringere Cache-Check-Period

## Best Practices

1. **Uploads**: Begrenze Upload-Größe (aktuell 10MB)
2. **Bilder**: Nutze optimierte Formate (WebP, optimierte JPG)
3. **Videos**: Externe Hosting bevorzugen (YouTube/Vimeo)
4. **Posts**: Lösche inaktive Posts regelmäßig
5. **Backups**: Automatische DB-Backups einrichten

## Weitere Optimierungen (optional)

### Nginx Reverse Proxy
Für zusätzliches Caching und Load-Handling:
```nginx
upstream prasco {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Static File Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://prasco;
    }

    location / {
        proxy_pass http://prasco;
        proxy_cache prasco_cache;
        proxy_cache_valid 60s;
    }
}
```

### Redis (für Multi-Instance)
Falls später mehrere RPi im Cluster:
```bash
sudo apt-get install redis-server
npm install ioredis  # Bereits in package.json
```

## Troubleshooting

**Problem: Out of Memory**
- Lösung: Memory-Limit in ecosystem.config.js reduzieren
- Prüfe: `pm2 describe prasco`

**Problem: Langsame DB-Queries**
- Lösung: Indizes überprüfen (`\d+ posts` in psql)
- VACUUM ANALYZE ausführen

**Problem: Hohe Disk I/O**
- Lösung: Cache-Schreibfrequenz reduzieren
- PostgreSQL-WAL optimieren

## Support

Bei Performance-Problemen:
1. Logs prüfen: `pm2 logs prasco --lines 100`
2. System-Ressourcen: `htop`, `free -h`, `df -h`
3. Datenbank: `sudo -u postgres psql -d prasco -c "\timing on"`
