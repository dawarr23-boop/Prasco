# Datenbank-Schema & Models - Dokumentation

## Übersicht

Das Datenbank-Schema ist vollständig mit Sequelize ORM in TypeScript implementiert.

## Datenbank-Models

### 1. Organization (Multi-Tenancy)
**Tabelle:** `organizations`

Repräsentiert verschiedene Organisationen/Firmen im System (Multi-Tenant-Architektur).

**Felder:**
- `id` (PK, Auto-Increment)
- `name` - Firmenname
- `slug` - URL-freundlicher Identifier (unique)
- `logoUrl` - Logo-URL
- `primaryColor` - Primärfarbe (Default: #c41e3a)
- `isActive` - Aktiv-Status
- `maxUsers` - Maximum Anzahl User
- `maxDisplays` - Maximum Anzahl Displays
- `createdAt`, `updatedAt`

**Beziehungen:**
- 1:N zu Users
- 1:N zu Categories
- 1:N zu Posts
- 1:N zu Media

### 2. User
**Tabelle:** `users`

Benutzer-Accounts mit Rollen (RBAC).

**Felder:**
- `id` (PK, Auto-Increment)
- `email` - E-Mail (unique, validated)
- `password` - Gehashtes Passwort (bcrypt)
- `firstName`, `lastName` - Name
- `role` - ENUM('admin', 'editor', 'viewer')
- `organizationId` (FK → organizations)
- `isActive` - Account-Status
- `lastLogin` - Letzter Login
- `createdAt`, `updatedAt`

**Hooks:**
- `beforeCreate`: Passwort-Hashing mit bcrypt
- `beforeUpdate`: Re-Hash bei Passwort-Änderung

**Methoden:**
- `comparePassword(password)` - Passwort-Vergleich
- `fullName` (Getter) - Voller Name

### 3. Category
**Tabelle:** `categories`

Kategorien für Posts (z.B. "Ankündigungen", "Events").

**Felder:**
- `id` (PK, Auto-Increment)
- `name` - Kategorie-Name
- `color` - Farb-Code (Default: #c41e3a)
- `icon` - Icon/Emoji
- `organizationId` (FK → organizations)
- `isActive` - Aktiv-Status
- `createdAt`, `updatedAt`

### 4. Media
**Tabelle:** `media`

Media-Dateien (Bilder, Videos).

**Felder:**
- `id` (PK, Auto-Increment)
- `filename` - Dateiname auf Server
- `originalName` - Original-Dateiname
- `mimeType` - MIME-Type
- `size` - Dateigröße in Bytes
- `url` - Zugriffs-URL
- `thumbnailUrl` - Thumbnail-URL (optional)
- `uploadedBy` (FK → users)
- `organizationId` (FK → organizations)
- `createdAt`, `updatedAt`

### 5. Post
**Tabelle:** `posts`

Schwarzes-Brett-Posts.

**Felder:**
- `id` (PK, Auto-Increment)
- `title` - Post-Titel
- `content` - Post-Inhalt (Text/HTML)
- `contentType` - ENUM('text', 'image', 'video', 'html')
- `mediaId` (FK → media, optional)
- `categoryId` (FK → categories, optional)
- `organizationId` (FK → organizations)
- `createdBy` (FK → users)
- `startDate`, `endDate` - Zeitplan (optional)
- `duration` - Anzeigedauer in Sekunden (Default: 10)
- `priority` - Priorität für Rotation (0-10)
- `isActive` - Aktiv-Status
- `viewCount` - Anzahl Aufrufe
- `createdAt`, `updatedAt`

**Indizes:**
- Composite-Index: (isActive, startDate, endDate)
- Index: organizationId
- Index: categoryId

**Methoden:**
- `isCurrentlyActive` (Getter) - Prüft ob Post aktuell aktiv ist (Zeit + Status)

## ER-Diagramm

```
Organizations
    ↓ 1:N
    ├── Users
    ├── Categories
    ├── Posts
    └── Media

Users
    ↓ 1:N
    ├── Posts (createdBy)
    └── Media (uploadedBy)

Categories
    ↓ 1:N
    └── Posts

Media
    ↓ 1:N
    └── Posts
```

## Seed-Daten

Die Datei `src/database/seeders/index.ts` erstellt automatisch:

**PRASCO Organization:**
- Name: PRASCO GmbH
- Slug: prasco
- Logo: https://www.prasco.net/content/files/images/Prasco/logo-small.png
- Farbe: #c41e3a

**Test-Users:**
1. **Admin**
   - Email: admin@prasco.net
   - Password: admin123
   - Role: admin

2. **Editor**
   - Email: editor@prasco.net
   - Password: editor123
   - Role: editor

**Kategorien:**
- Ankündigungen (🔴 #c41e3a, 📢)
- Veranstaltungen (🔵 #1e90ff, 📅)
- Wichtige Infos (🔴 #ff6b6b, ⚠️)
- Erfolge (🟢 #4caf50, 🏆)

**Sample-Posts:**
- "Willkommen bei PRASCO!"
- "Team-Meeting nächste Woche" (mit Zeitplan)
- "Neue Projekte starten!"

## PostgreSQL Setup

### Lokale Installation

**Windows (mit Docker):**
```bash
docker run --name prasco-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bulletin_board \
  -p 5432:5432 \
  -d postgres:15
```

**Datenbank manuell erstellen:**
```sql
CREATE DATABASE bulletin_board;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE bulletin_board TO postgres;
```

### Verbindung testen
```bash
psql -h localhost -U postgres -d bulletin_board
```

## Verwendung

### Models importieren
```typescript
import { User, Organization, Post, Category, Media } from './models';
```

### Beispiel: User erstellen
```typescript
const user = await User.create({
  email: 'test@prasco.net',
  password: 'test123',
  firstName: 'Test',
  lastName: 'User',
  role: 'editor',
  organizationId: 1,
});
```

### Beispiel: Posts mit Relationen abfragen
```typescript
const posts = await Post.findAll({
  where: { isActive: true },
  include: [
    { model: User, as: 'creator' },
    { model: Category, as: 'category' },
    { model: Media, as: 'media' },
  ],
  order: [['priority', 'DESC'], ['createdAt', 'DESC']],
});
```

### Beispiel: Aktive Posts mit Zeitplan
```typescript
const activePosts = await Post.findAll({
  where: {
    isActive: true,
    startDate: { [Op.lte]: new Date() },
    [Op.or]: [
      { endDate: null },
      { endDate: { [Op.gte]: new Date() } },
    ],
  },
});
```

## Nächste Schritte

✅ Models erstellt
✅ Assoziationen definiert
✅ Seed-Daten vorbereitet

**TODO (Task 3-8):**
- [ ] JWT-Authentifizierung implementieren
- [ ] API-Controllers erstellen
- [ ] RBAC-Middleware
- [ ] Media-Upload
- [ ] API-Validierung
- [ ] Swagger-Docs
