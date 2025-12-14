# PRASCO Digital Bulletin Board - Quick Reference

## 🚀 Quick Start

```powershell
# Setup (einmalig)
.\setup.ps1

# Development starten
npm run dev

# Mit Docker
npm run docker:up
npm run dev
```

## 📡 URLs

| Service | URL                              | Credentials                 |
| ------- | -------------------------------- | --------------------------- |
| Display | http://localhost:3000            | -                           |
| Admin   | http://localhost:3000/admin      | admin@prasco.net / admin123 |
| API     | http://localhost:3000/api        | JWT Token                   |
| Health  | http://localhost:3000/api/health | -                           |
| Adminer | http://localhost:8080            | postgres / postgres         |

## 🛠️ Wichtige Befehle

### Development

```powershell
npm run dev              # Server mit Auto-Reload
npm run dev:debug        # Server mit Debugger
npm run build            # TypeScript kompilieren
npm run build:watch      # Auto-Compile bei Änderungen
```

### Testing

```powershell
npm test                 # Alle Tests
npm run test:watch       # Tests mit Watch-Mode
npm run test:coverage    # Tests mit Coverage
```

### Code-Qualität

```powershell
npm run lint             # ESLint prüfen
npm run lint:fix         # ESLint Auto-Fix
npm run format           # Prettier formatieren
npm run typecheck        # TypeScript-Typen prüfen
```

### Docker

```powershell
npm run docker:up        # Container starten
npm run docker:down      # Container stoppen
npm run docker:logs      # Logs anzeigen
```

### Datenbank

```powershell
npm run db:seed          # Seed-Daten einfügen
docker exec -it prasco-postgres psql -U postgres -d bulletin_board
```

## 📝 API-Endpunkte (Phase 1)

### Auth

- `POST /api/auth/register` - User registrieren
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Token erneuern
- `GET /api/auth/me` - User-Profil (Auth required)

### System

- `GET /api/health` - Health-Check

## 🔑 Test-Credentials

```json
{
  "admin": {
    "email": "admin@prasco.net",
    "password": "admin123",
    "role": "admin"
  },
  "editor": {
    "email": "editor@prasco.net",
    "password": "editor123",
    "role": "editor"
  }
}
```

## 📂 Wichtige Dateien

```
.env                    # Environment-Variablen
api-tests.http          # API-Tests (REST Client)
docker-compose.yml      # Docker-Services
DEV-SETUP.md           # Vollständige Dev-Doku
TASK-4-GUIDE.md        # Nächste Implementierung
```

## 🐛 Debugging

### VS Code

1. Drücke `F5`
2. Wähle "Debug Server (Dev)"
3. Setze Breakpoints

### Logs

```powershell
# Live-Logs
Get-Content -Path logs/combined.log -Wait -Tail 50

# Fehler-Logs
Get-Content -Path logs/error.log
```

## 🔧 Troubleshooting

### Port belegt

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### PostgreSQL nicht erreichbar

```powershell
docker restart prasco-postgres
docker logs prasco-postgres
```

### Dependencies-Probleme

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### TypeScript-Fehler

```powershell
Remove-Item -Recurse -Force dist
npm run build
```

## 📚 Dokumentation

- `README.md` - Projekt-Übersicht
- `DEV-SETUP.md` - Entwicklungsumgebung
- `DOCKER.md` - Docker-Setup
- `DATABASE-SCHEMA.md` - Datenbank-Schema
- `TYPESCRIPT-MIGRATION.md` - TypeScript-Migration
- `PHASE-1-COMPLETE.md` - Phase 1 Status
- `TASK-4-GUIDE.md` - REST API Guide
- `ENTERPRISE-ROADMAP.md` - Langzeit-Plan

## 🎯 Nächste Steps (Task 4-8)

- [ ] REST API für Posts & Categories
- [ ] RBAC erweitern
- [ ] Media-Upload (Multer + Sharp)
- [ ] Security-Hardening
- [ ] Swagger-Dokumentation

## 💡 Tipps

- Verwende `api-tests.http` für API-Tests
- Docker für saubere Datenbank-Umgebung
- ESLint & Prettier automatisch bei Save
- Logs regelmäßig prüfen
- Tests vor jedem Commit

## 🆘 Support

Bei Problemen:

1. Logs prüfen (`logs/error.log`)
2. Docker-Status prüfen (`docker-compose ps`)
3. DEV-SETUP.md konsultieren
4. GitHub Issues durchsuchen

---

**Happy Coding! 🚀**
