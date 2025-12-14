# Docker Development Setup

## Quick Start

```powershell
# Alle Services starten
npm run docker:up

# Status prüfen
docker-compose ps

# Logs anzeigen
npm run docker:logs

# Services stoppen
npm run docker:down
```

## Services

### PostgreSQL (Development)

- **Port:** 5432
- **User:** postgres
- **Password:** postgres
- **Database:** bulletin_board
- **URL:** postgresql://postgres:postgres@localhost:5432/bulletin_board

### PostgreSQL (Test)

- **Port:** 5433
- **User:** postgres
- **Password:** postgres
- **Database:** bulletin_board_test
- **URL:** postgresql://postgres:postgres@localhost:5433/bulletin_board_test

### Redis

- **Port:** 6379
- **URL:** redis://localhost:6379

### Adminer (Database UI)

- **Port:** 8080
- **URL:** http://localhost:8080
- **System:** PostgreSQL
- **Server:** postgres
- **Username:** postgres
- **Password:** postgres

## Nützliche Befehle

```powershell
# Alle Container neu starten
docker-compose restart

# Bestimmten Container neu starten
docker-compose restart postgres

# Container-Logs
docker-compose logs postgres
docker-compose logs redis

# In Container-Shell einsteigen
docker exec -it prasco-postgres bash
docker exec -it prasco-redis sh

# PostgreSQL CLI
docker exec -it prasco-postgres psql -U postgres -d bulletin_board

# Redis CLI
docker exec -it prasco-redis redis-cli

# Volumes löschen (ACHTUNG: Löscht alle Daten!)
docker-compose down -v

# Container neu bauen
docker-compose up -d --build
```

## Health Checks

```powershell
# PostgreSQL
docker exec prasco-postgres pg_isready -U postgres

# Redis
docker exec prasco-redis redis-cli ping
```

## Backup & Restore

### PostgreSQL Backup

```powershell
# Backup erstellen
docker exec prasco-postgres pg_dump -U postgres bulletin_board > backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sql

# Backup wiederherstellen
Get-Content backup.sql | docker exec -i prasco-postgres psql -U postgres -d bulletin_board
```

## Troubleshooting

### Port bereits belegt

```powershell
# Welcher Prozess nutzt Port 5432?
Get-NetTCPConnection -LocalPort 5432

# Port freigeben
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5432).OwningProcess
```

### Container startet nicht

```powershell
# Logs prüfen
docker-compose logs postgres

# Container neu erstellen
docker-compose down
docker-compose up -d
```

### Datenbank zurücksetzen

```powershell
# Daten löschen und neu starten
docker-compose down -v
docker-compose up -d

# Warte bis healthy
Start-Sleep -Seconds 5

# App-Server neu starten (führt Seeding aus)
npm run dev
```
