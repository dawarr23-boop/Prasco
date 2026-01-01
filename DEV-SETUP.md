# Development Setup Guide

## Voraussetzungen

### 1. Node.js & npm

```bash
# Prüfe Installation
node --version  # v18+ empfohlen
npm --version   # v9+
```

### 2. Datenbank

**Option A: SQLite (Empfohlen für lokale Entwicklung) ⭐**

Keine Installation nötig! SQLite wird automatisch mit der Anwendung gestartet.

```powershell
# .env Datei erstellen
copy .env.example .env

# Stelle sicher, dass DB_DIALECT auf sqlite gesetzt ist
# DB_DIALECT=sqlite
# DB_STORAGE=./database.sqlite
```

**Option B: PostgreSQL (für Produktion oder erweiterte Entwicklung)**

```powershell
# PostgreSQL mit Docker starten
docker run --name prasco-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=bulletin_board `
  -p 5432:5432 `
  -d postgres:15

# Test-Datenbank erstellen
docker exec -it prasco-postgres psql -U postgres -c "CREATE DATABASE bulletin_board_test;"

# Status prüfen
docker ps

# In .env konfigurieren:
# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=bulletin_board
# DB_USER=postgres
# DB_PASSWORD=postgres
```

**Option C: Lokale PostgreSQL Installation**

```powershell
# Mit Chocolatey
choco install postgresql

# Datenbanken erstellen
psql -U postgres
CREATE DATABASE bulletin_board;
CREATE DATABASE bulletin_board_test;
\q
```

### 3. Redis (Optional - für Caching)

```powershell
# Docker
docker run --name prasco-redis `
  -p 6379:6379 `
  -d redis:7-alpine

# Status prüfen
docker exec -it prasco-redis redis-cli ping
# Sollte "PONG" zurückgeben
```

## Installation

### 1. Dependencies installieren

```powershell
npm install
```

### 2. Environment konfigurieren

```powershell
# .env Datei erstellen (SQLite wird standardmäßig verwendet)
copy .env.example .env

# Optional: Anpassen für PostgreSQL
notepad .env
```

### 3. Development-Server starten

```powershell
# Server mit Auto-Reload starten (erstellt SQLite-DB automatisch)
npm run dev
```

Die Datenbank wird beim ersten Start automatisch erstellt und mit Beispieldaten gefüllt.

**Standard-Login:**
- Email: `admin@prasco.net`
- Passwort: `admin123`

## Entwicklungsworkflow

### Server starten

```powershell
# Development mit Auto-Reload
npm run dev

# Production-Build
npm run build
npm start
```

### Code-Qualität

```powershell
# Linting
npm run lint

# Linting mit Auto-Fix
npm run lint -- --fix

# Code formatieren
npm run format
```

### Tests

```powershell
# Alle Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage

# Tests im Watch-Mode
npm run test:watch

# Spezifische Test-Datei
npm test -- auth.test.ts
```

## VS Code Setup

### Empfohlene Extensions

Installiere diese Extensions für optimale Entwicklererfahrung:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "streetsidesoftware.code-spell-checker",
    "prisma.prisma",
    "ckolkman.vscode-postgres",
    "rangav.vscode-thunder-client",
    "humao.rest-client"
  ]
}
```

### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Debugging

### VS Code Launch Configuration

Erstelle `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/server.ts"],
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true,
      "cwd": "${workspaceFolder}",
      "protocol": "inspector"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## API Testing

### Mit cURL

```powershell
# Health Check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@prasco.net\",\"password\":\"test123\",\"firstName\":\"Test\",\"lastName\":\"User\"}'

# Login
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@prasco.net\",\"password\":\"admin123\"}'
```

### Mit REST Client (VS Code Extension)

Erstelle `api-tests.http`:

```http
### Health Check
GET http://localhost:3000/api/health

### Register
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@prasco.net",
  "password": "test123",
  "firstName": "Test",
  "lastName": "User"
}

### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@prasco.net",
  "password": "admin123"
}

### Get Profile
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{accessToken}}
```

## Datenbank-Management

### Verbindung prüfen

```powershell
# Mit psql
psql -h localhost -U postgres -d bulletin_board

# Tabellen anzeigen
\dt

# Schema anzeigen
\d+ users

# Query ausführen
SELECT * FROM users;
```

### Datenbank zurücksetzen

```powershell
# Im Development-Mode werden Tabellen automatisch synchronisiert
# Für kompletten Reset:
psql -U postgres -c "DROP DATABASE bulletin_board;"
psql -U postgres -c "CREATE DATABASE bulletin_board;"

# Server neu starten (führt Sync + Seeding aus)
npm run dev
```

## Logs

### Log-Dateien

```
logs/
├── combined.log     # Alle Logs
├── error.log        # Nur Fehler
└── exceptions.log   # Uncaught Exceptions
```

### Logs anzeigen

```powershell
# Live-Logs
Get-Content -Path logs/combined.log -Wait -Tail 50

# Fehler-Logs
Get-Content -Path logs/error.log

# Logs löschen
Remove-Item logs/*.log
```

## Troubleshooting

### Port bereits belegt

```powershell
# Port 3000 freigeben
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Oder anderen Port verwenden
$env:PORT=3001; npm run dev
```

### PostgreSQL-Verbindungsfehler

```powershell
# Docker-Container-Status prüfen
docker ps -a

# Container neu starten
docker restart prasco-postgres

# Logs prüfen
docker logs prasco-postgres
```

### TypeScript-Fehler

```powershell
# node_modules löschen und neu installieren
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# TypeScript-Cache löschen
Remove-Item -Recurse -Force dist
npm run build
```

### Datenbank-Schema-Probleme

```powershell
# Datenbank-Schema zurücksetzen
# ACHTUNG: Löscht alle Daten!
psql -U postgres -d bulletin_board -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Server neu starten (führt Sync aus)
npm run dev
```

## Nützliche Befehle

```powershell
# Alle Docker-Container stoppen
docker stop $(docker ps -aq)

# Alle Docker-Container löschen
docker rm $(docker ps -aq)

# npm-Cache löschen
npm cache clean --force

# Projekt-Größe prüfen
Get-ChildItem -Recurse | Measure-Object -Property Length -Sum

# TypeScript-Version prüfen
npx tsc --version

# Dependencies auf Updates prüfen
npm outdated

# Dependencies aktualisieren
npm update
```

## Git Workflow

```powershell
# Feature-Branch erstellen
git checkout -b feature/new-feature

# Änderungen committen
git add .
git commit -m "feat: Add new feature"

# Branch pushen
git push origin feature/new-feature

# Merge in main
git checkout main
git merge feature/new-feature
git push origin main
```

## Performance-Monitoring

### Winston-Logs analysieren

```powershell
# Fehlerrate
Select-String -Path logs/combined.log -Pattern "ERROR" | Measure-Object

# Request-Duration
Select-String -Path logs/combined.log -Pattern "ms" | Select-Object -Last 20
```

### PostgreSQL-Performance

```sql
-- Langsamste Queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Tabellengrößen
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;
```

## Backup & Restore

### Datenbank-Backup

```powershell
# Backup erstellen
docker exec prasco-postgres pg_dump -U postgres bulletin_board > backup.sql

# Backup wiederherstellen
Get-Content backup.sql | docker exec -i prasco-postgres psql -U postgres -d bulletin_board
```

## Support

Bei Problemen:

1. Logs prüfen (`logs/error.log`)
2. README.md und Dokumentation lesen
3. GitHub Issues durchsuchen
4. Team-Chat

---

**Viel Erfolg beim Entwickeln! 🚀**
