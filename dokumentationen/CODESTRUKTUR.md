# PRASCO — Codestruktur

> Zuletzt aktualisiert: 27. Februar 2026

## Überblick

PRASCO ist ein Digital-Signage-System (Digitales Schwarzes Brett) auf Basis von Node.js, Express, TypeScript, Sequelize ORM und PostgreSQL. Es unterstützt Raspberry Pi, Docker-Container und wird über ein Web-Admin-Panel verwaltet.

---

## Verzeichnisstruktur

```
prasco/
├── src/                          # TypeScript Backend-Quellcode
│   ├── server.ts                 # Express-App – Einstiegspunkt
│   ├── config/                   # Konfiguration
│   │   ├── database.ts           # Sequelize-Verbindung (SQLite + PostgreSQL)
│   │   ├── features.ts           # Feature-Flags (Pi vs. Desktop)
│   │   ├── sso.ts                # Azure AD / LDAP SSO-Konfiguration
│   │   ├── swagger.ts            # OpenAPI 3.0 Spezifikation
│   │   └── upload.ts             # Multer Upload-Config (Pfade, MIME-Types, Limits)
│   │
│   ├── controllers/              # Request-Handler (Business-Logik)
│   │   ├── authController.ts     # Login, Register, Token-Refresh, Logout
│   │   ├── categoryController.ts # CRUD Kategorien
│   │   ├── displayController.ts  # CRUD Displays + Public-Endpoints
│   │   ├── kioskController.ts    # Kiosk/Präsentationsmodus
│   │   ├── mediaController.ts    # Upload, Thumbnail, Präsentations-Slides
│   │   ├── postController.ts     # CRUD Posts + Sortierung + Video-Download
│   │   ├── publicController.ts   # Öffentliche Endpoints (aktive Posts/Kategorien)
│   │   ├── settingsController.ts # Einstellungen lesen/schreiben
│   │   ├── ssoAdminController.ts # SSO-Konfiguration (Super-Admin)
│   │   ├── ssoController.ts      # SSO-Login/Callback/Logout
│   │   └── userController.ts     # CRUD Benutzer + Passwort-Management
│   │
│   ├── middleware/                # Express-Middleware
│   │   ├── auth.ts               # JWT-Authentifizierung + Rollen-Autorisierung
│   │   ├── errorHandler.ts       # Globaler Fehler-Handler
│   │   ├── performance.ts        # Cache-Control, ETag, Compression
│   │   ├── permissions.ts        # Berechtigungsprüfungen (RBAC)
│   │   └── validator.ts          # express-validator Ausführung
│   │
│   ├── models/                   # Sequelize Datenmodelle
│   │   ├── Category.ts           # Kategorien
│   │   ├── Display.ts            # Anzeigegeräte
│   │   ├── index.ts              # Assoziationen zwischen Modellen
│   │   ├── Media.ts              # Hochgeladene Medien
│   │   ├── Organization.ts       # Organisationen/Mandanten
│   │   ├── Permission.ts         # Berechtigungen
│   │   ├── Post.ts               # Beiträge
│   │   ├── PostDisplay.ts        # Verknüpfungstabelle Post ↔ Display
│   │   ├── RolePermission.ts     # Rollen-Berechtigungs-Zuordnung
│   │   ├── Setting.ts            # System-Einstellungen (Key-Value)
│   │   ├── User.ts               # Benutzer
│   │   └── UserPermission.ts     # Benutzer-spezifische Berechtigungen
│   │
│   ├── routes/                   # Express Router (API-Endpunkte)
│   │   ├── ai.ts                 # KI-Assistent (OpenAI GPT-4o-mini)
│   │   ├── auth.ts               # Authentifizierung
│   │   ├── categories.ts         # Kategorien
│   │   ├── displays.ts           # Displays
│   │   ├── kiosk.ts              # Kiosk-Modus
│   │   ├── media.ts              # Medien-Upload/Verwaltung
│   │   ├── posts.ts              # Beiträge
│   │   ├── public.ts             # Öffentliche API (kein Auth)
│   │   ├── settings.ts           # Einstellungen
│   │   ├── sso.ts                # SSO (Azure AD, LDAP)
│   │   ├── system.ts             # System-Modus (Normal/Hotspot)
│   │   ├── traffic.ts            # Verkehrsdaten (Autobahn-API)
│   │   ├── transit.ts            # ÖPNV (hafas-client)
│   │   ├── users.ts              # Benutzerverwaltung
│   │   ├── weather.ts            # Wetter (Open-Meteo)
│   │   └── youtube.ts            # YouTube Video-Dauer
│   │
│   ├── services/                 # Business-Services
│   │   ├── ldapService.ts        # LDAP/Active Directory Authentifizierung
│   │   ├── mediaService.ts       # Dateiverarbeitung, Thumbnails (sharp)
│   │   ├── presentationService.ts # PPTX → Bilder (LibreOffice)
│   │   ├── trafficService.ts     # Autobahn-Verkehrslage (bund.dev API)
│   │   ├── transitService.ts     # ÖPNV-Abfahrten (hafas-client/DB)
│   │   └── videoDownloadService.ts # YouTube-Download (yt-dlp)
│   │
│   ├── database/
│   │   └── seeders/              # Datenbank-Seed-Daten
│   │       ├── htmlExamples.ts   # HTML-Beispiel-Beiträge
│   │       ├── index.ts          # Seeder-Einstiegspunkt
│   │       └── permissions.ts    # Standard-Berechtigungen
│   │
│   ├── types/
│   │   ├── hafas-client.d.ts     # TypeScript-Typen für hafas-client
│   │   └── index.ts              # JWTPayload, PERMISSIONS-Konstanten
│   │
│   └── utils/
│       ├── cache.ts              # NodeCache Wrapper
│       ├── jwt.ts                # JWT-Token Erzeugung/Validierung
│       └── logger.ts             # Winston Logger (Console + Datei)
│
├── js/                           # Frontend JavaScript
│   ├── admin.js                  # Admin-Dashboard SPA-Logik
│   ├── admin-login.js            # Login-Seite
│   └── display.js                # Display-Client (Auto-Rotation, Live-Daten)
│
├── css/                          # Stylesheets
│   ├── admin.css                 # Admin-Dashboard Styles
│   └── display.css               # Display-Bildschirm Styles
│
├── views/                        # HTML-Templates
│   ├── admin/
│   │   ├── dashboard.html        # Admin-SPA Shell
│   │   ├── login.html            # Login-Seite
│   │   └── sso-callback.html     # SSO Callback Handler
│   ├── public/
│   │   └── display.html          # Öffentlicher Display-Bildschirm
│   └── test-transit-traffic.html # Test-Seite für ÖPNV/Verkehr
│
├── public/                       # Statische Dateien
│   ├── images/prasco-logo.png    # Logo
│   └── js/qrcode.min.js         # QR-Code Bibliothek
│
├── dokumentationen/              # Projektdokumentation
├── uploads/                      # Hochgeladene Dateien (Originals, Thumbnails, Präsentationen)
│
├── docker-compose.yml            # Docker Compose (Entwicklung)
├── docker-compose.prod.yml       # Docker Compose (Produktion)
├── Dockerfile                    # Multi-Stage Docker Build
├── package.json                  # NPM-Abhängigkeiten
├── tsconfig.json                 # TypeScript-Konfiguration
├── jest.config.js                # Test-Konfiguration
└── ecosystem.config.js           # PM2-Konfiguration
```

---

## Architektur

### Backend (MVC-Pattern)

```
HTTP Request
  → Express Router (routes/*.ts)
    → Middleware: authenticate → requirePermission → validate
      → Controller (controllers/*.ts)
        → Service (services/*.ts)  [optional]
        → Model (models/*.ts)
          → Sequelize → PostgreSQL / SQLite
      ← JSON Response
```

### Frontend (SPA)

Das Admin-Dashboard ist eine Single Page Application (SPA) ohne Framework:
- **admin.js** (~6200 Zeilen) enthält die gesamte Client-Logik
- Navigation via Hash-Links (`#posts`, `#settings`, etc.)
- API-Kommunikation über `apiRequest()` Wrapper mit JWT-Authentifizierung
- Auto-Token-Refresh bei 401-Antworten

### Display-Client

- **display.js** (~3000 Zeilen) steuert den Anzeige-Bildschirm
- Lädt Posts und Live-Daten (ÖPNV, Verkehr, Wetter) automatisch
- Rotiert durch aktive Beiträge mit konfigurierbarer Dauer
- Unterstützt Übergangseffekte (Fade, Slide, Zoom)
- Responsive Skalierung: 720p bis 4K

---

## Authentifizierung & Autorisierung

### Rollen

| Rolle | Beschreibung |
|---|---|
| `super_admin` | Vollzugriff, Display-Management, SSO-Konfiguration |
| `admin` | Verwaltung von Beiträgen, Kategorien, Benutzern, Einstellungen |
| `editor` | Beiträge und Kategorien erstellen/bearbeiten |
| `viewer` | Nur Lesen |
| `display` | Öffentliche Display-Endpunkte |

### Berechtigungssystem (RBAC)

Berechtigungen folgen dem Schema `{resource}.{action}`:
- `posts.read`, `posts.create`, `posts.update`, `posts.delete`
- `categories.read`, `categories.create`, `categories.update`, `categories.delete`
- `users.read`, `users.create`, `users.update`, `users.delete`
- `media.read`, `media.upload`, `media.delete`
- `displays.read`, `displays.update`, `displays.delete`
- `settings.read`, `settings.write`, `settings.manage`

Berechtigungen werden über drei Tabellen gesteuert:
1. **permissions** — definiert alle verfügbaren Berechtigungen
2. **role_permissions** — Standardberechtigungen pro Rolle
3. **user_permissions** — individuelle Überschreibungen (grant/revoke)

---

## Externe APIs & Dienste

| Dienst | API | Einsatz |
|---|---|---|
| Open-Meteo | `api.open-meteo.com` | Wetter + Vorhersage (kostenlos, kein Key) |
| Deutsche Bahn (hafas) | `hafas-client` (v6) | ÖPNV-Abfahrten |
| Autobahn-API | `verkehr.autobahn.de` | Staus, Baustellen, Warnungen |
| OpenAI | `api.openai.com` | KI-Assistent (GPT-4o-mini) |
| Azure AD / MSAL | Microsoft Entra ID | SSO-Login |
| LDAP | kundenspezifisch | Active Directory Login |

---

## Docker-Architektur (Produktion)

```
┌─────────────────────────────────────────────┐
│  Docker Network: prasco-network             │
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │  PRASCO App          │  │
│  │  15-alpine   │  │  node:20-alpine      │  │
│  │  Port: 5432  │──│  + LibreOffice       │  │
│  └─────────────┘  │  + poppler-utils      │  │
│                    │  Port: 3000           │  │
│  ┌─────────────┐  │                       │  │
│  │  Redis       │──│  User: nodejs (1001) │  │
│  │  7-alpine    │  └──────────────────────┘  │
│  │  Port: 6379  │                           │
│  └─────────────┘                            │
└─────────────────────────────────────────────┘
```

Volumes: `postgres_data`, `redis_data`, `uploads_data`, `logs_data`

---

## Abhängigkeiten

### Produktion (Auszug)

| Paket | Version | Zweck |
|---|---|---|
| express | ^4.18.2 | Web-Framework |
| sequelize | ^6.35.2 | ORM |
| pg | ^8.11.3 | PostgreSQL-Treiber |
| sqlite3 | ^5.1.7 | SQLite-Treiber (Raspberry Pi) |
| jsonwebtoken | ^9.0.2 | JWT-Authentifizierung |
| bcryptjs | ^2.4.3 | Passwort-Hashing |
| multer | ^1.4.5-lts.1 | Datei-Upload |
| sharp | ^0.34.5 | Bildverarbeitung/Thumbnails |
| axios | ^1.6.7 | HTTP-Client (OpenAI, ext. APIs) |
| hafas-client | ^6.3.1 | ÖPNV-Daten |
| ioredis | ^5.3.2 | Redis-Client |
| winston | ^3.11.0 | Logging |
| helmet | ^7.2.0 | Security-Headers |
| @azure/msal-node | ^3.8.4 | Azure AD SSO |
| ldapts | ^8.0.19 | LDAP/Active Directory |

### Entwicklung

| Paket | Version | Zweck |
|---|---|---|
| typescript | ^5.3.3 | TypeScript-Compiler |
| nodemon | ^3.0.1 | Hot-Reload |
| jest | ^29.7.0 | Tests |
| eslint | ^8.56.0 | Code-Qualität |
| prettier | ^3.1.1 | Formatierung |
