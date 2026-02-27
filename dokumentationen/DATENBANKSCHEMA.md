# PRASCO — Datenbankschema

> Zuletzt aktualisiert: 27. Februar 2026  
> ORM: Sequelize 6 | Datenbank: PostgreSQL 15 (Produktion) / SQLite (Raspberry Pi)

---

## ER-Diagramm (Beziehungen)

```
┌──────────────┐     1:N     ┌──────────────┐     1:N     ┌──────────────┐
│ Organization │────────────→│    User      │────────────→│    Post      │
│              │             │              │             │              │
│ id           │             │ id           │             │ id           │
│ name         │             │ email        │             │ title        │
│ slug         │             │ password     │             │ content      │
│ logoUrl      │             │ firstName    │             │ contentType  │
│ primaryColor │             │ lastName     │             │ duration     │
│ isActive     │             │ role         │             │ priority     │
│ maxUsers     │             │ organizationId│            │ isActive     │
│ maxDisplays  │             │ isActive     │             │ createdBy    │──→ users.id
└──────┬───────┘             │ ssoProvider  │             │ categoryId   │──→ categories.id
       │                     │ azureAdId    │             │ mediaId      │──→ media.id
       │                     └──────┬───────┘             │ organizationId│
       │                            │                     │ displayMode  │
       │ 1:N                        │ M:N                 │ startDate    │
       ├────────────→ Category      │ (UserPermission)    │ endDate      │
       │             │              ↓                     │ showTitle    │
       │ 1:N         │         Permission                 │ blendEffect  │
       ├────→ Media  │                                    │ backgroundMusicUrl│
       │             │                                    │ backgroundMusicVolume│
       │             │                                    │ viewCount    │
       │ 1:N         │                                    └──────┬───────┘
       └────→ Display│                                           │ M:N
                     │                                    ┌──────┴───────┐
                     │                                    │  PostDisplay │ (Verknüpfung)
                     │                                    │  postId      │──→ posts.id
                     │                                    │  displayId   │──→ displays.id
                     │                                    └──────────────┘
```

---

## Tabellen

### 1. `users`

Benutzerkonten mit rollenbasierter Zugriffskontrolle.

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `email` | VARCHAR(255) | ✗ | — | UNIQUE | E-Mail / Login |
| `password` | VARCHAR(255) | ✗ | — | | bcrypt-Hash |
| `firstName` | VARCHAR(100) | ✗ | — | | Vorname |
| `lastName` | VARCHAR(100) | ✗ | — | | Nachname |
| `role` | ENUM | ✗ | `'viewer'` | | `super_admin`, `admin`, `editor`, `viewer`, `display` |
| `organizationId` | INTEGER | ✓ | NULL | FK → organizations.id | Zugehörige Organisation |
| `isActive` | BOOLEAN | ✗ | `true` | | Konto aktiv? |
| `lastLogin` | TIMESTAMP | ✓ | NULL | | Letzter Login-Zeitpunkt |
| `sso_provider` | ENUM | ✓ | NULL | | `azure_ad`, `ldap`, `adfs`, `local` |
| `azure_ad_id` | VARCHAR(255) | ✓ | — | UNIQUE | Azure AD Objekt-ID |
| `createdAt` | TIMESTAMP | ✗ | NOW() | | |
| `updatedAt` | TIMESTAMP | ✗ | NOW() | | |

**Hooks:** Passwort wird vor `CREATE` und `UPDATE` automatisch mit bcrypt gehasht.  
**Methoden:** `comparePassword()`, `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`

---

### 2. `organizations`

Mandantenfähigkeit (Multi-Tenancy).

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `name` | VARCHAR(255) | ✗ | — | | Organisationsname |
| `slug` | VARCHAR(100) | ✗ | — | UNIQUE | URL-freundlicher Name |
| `logoUrl` | VARCHAR(500) | ✓ | NULL | | Logo-URL |
| `primaryColor` | VARCHAR(7) | ✓ | `'#c41e3a'` | | Corporate Color |
| `isActive` | BOOLEAN | ✗ | `true` | | Organisation aktiv? |
| `maxUsers` | INTEGER | ✓ | NULL | | Max. Benutzer (Lizenz) |
| `maxDisplays` | INTEGER | ✓ | NULL | | Max. Displays (Lizenz) |
| `createdAt` | TIMESTAMP | ✗ | NOW() | | |
| `updatedAt` | TIMESTAMP | ✗ | NOW() | | |

---

### 3. `posts`

Beiträge/Inhalte für die Anzeige.

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `title` | VARCHAR(255) | ✗ | — | | Titel |
| `content` | TEXT | ✗ | — | | Textinhalt / URL |
| `contentType` | ENUM | ✗ | `'text'` | | `text`, `image`, `video`, `html`, `presentation`, `pdf`, `word` |
| `mediaId` | INTEGER | ✓ | NULL | FK → media.id | Verknüpfte Mediendatei |
| `categoryId` | INTEGER | ✓ | NULL | FK → categories.id | Kategorie |
| `organizationId` | INTEGER | ✓ | NULL | FK → organizations.id | Organisation |
| `createdBy` | INTEGER | ✗ | — | FK → users.id | Ersteller |
| `startDate` | TIMESTAMP | ✓ | NULL | | Veröffentlichung ab |
| `endDate` | TIMESTAMP | ✓ | NULL | | Veröffentlichung bis |
| `duration` | INTEGER | ✗ | `10` | | Anzeigedauer in Sekunden |
| `priority` | INTEGER | ✗ | `0` | | Priorität (0–100) |
| `isActive` | BOOLEAN | ✗ | `true` | | Aktiv? |
| `showTitle` | BOOLEAN | ✗ | `true` | | Titel anzeigen? |
| `displayMode` | ENUM | ✗ | `'all'` | | `all` = alle Displays, `specific` = ausgewählte |
| `viewCount` | INTEGER | ✗ | `0` | | Anzahl Aufrufe |
| `backgroundMusicUrl` | VARCHAR(500) | ✓ | NULL | | Hintergrundmusik-URL |
| `backgroundMusicVolume` | INTEGER | ✓ | `50` | | Lautstärke (0–100) |
| `blendEffect` | VARCHAR(50) | ✓ | NULL | | Übergangseffekt |
| `createdAt` | TIMESTAMP | ✗ | NOW() | | |
| `updatedAt` | TIMESTAMP | ✗ | NOW() | | |

**Indizes:**
- `[is_active, start_date, end_date]` — Schnelle Abfrage aktiver Beiträge
- `[organization_id]`
- `[category_id]`

---

### 4. `categories`

Kategorien zur Gruppierung von Beiträgen.

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `name` | VARCHAR(100) | ✗ | — | | Name |
| `color` | VARCHAR(7) | ✗ | `'#c41e3a'` | | Hex-Farbe |
| `icon` | VARCHAR(50) | ✓ | NULL | | Unicode-Symbol |
| `sortOrder` | INTEGER | ✗ | `0` | | Sortierung |
| `organizationId` | INTEGER | ✓ | NULL | FK → organizations.id | Organisation |
| `isActive` | BOOLEAN | ✗ | `true` | | Aktiv? |
| `createdAt` | TIMESTAMP | ✗ | NOW() | | |
| `updatedAt` | TIMESTAMP | ✗ | NOW() | | |

---

### 5. `displays`

Anzeigegeräte (Bildschirme / Raspberry Pi).

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `name` | VARCHAR(100) | ✗ | — | | Anzeigename |
| `identifier` | VARCHAR(50) | ✗ | — | UNIQUE | Eindeutiger Identifier |
| `description` | TEXT | ✓ | NULL | | Beschreibung |
| `isActive` | BOOLEAN | ✗ | `true` | | Aktiv? |
| `show_transit_data` | BOOLEAN | ✗ | `true` | | ÖPNV anzeigen? |
| `show_traffic_data` | BOOLEAN | ✗ | `true` | | Verkehr anzeigen? |
| `organizationId` | INTEGER | ✓ | NULL | FK → organizations.id | Organisation |
| `createdAt` | TIMESTAMP | ✗ | NOW() | | |
| `updatedAt` | TIMESTAMP | ✗ | NOW() | | |

**Lizenz-Limit:** Maximal 2 Displays (in `displayController.createDisplay` geprüft, nur `super_admin`).

---

### 6. `media`

Hochgeladene Dateien (Bilder, Videos, Dokumente).

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `filename` | VARCHAR(255) | ✗ | — | | Gespeicherter Dateiname |
| `originalName` | VARCHAR(255) | ✗ | — | | Originaler Dateiname |
| `mimeType` | VARCHAR(100) | ✗ | — | | MIME-Typ |
| `size` | INTEGER | ✗ | — | | Dateigröße in Bytes |
| `url` | VARCHAR(500) | ✗ | — | | Zugriffs-URL |
| `thumbnailUrl` | VARCHAR(500) | ✓ | NULL | | Thumbnail-URL |
| `width` | INTEGER | ✓ | NULL | | Bildbreite in Pixel |
| `height` | INTEGER | ✓ | NULL | | Bildhöhe in Pixel |
| `uploadedBy` | INTEGER | ✗ | — | FK → users.id | Hochgeladen von |
| `organizationId` | INTEGER | ✓ | NULL | FK → organizations.id | Organisation |
| `createdAt` | TIMESTAMP | ✗ | NOW() | | |
| `updatedAt` | TIMESTAMP | ✗ | NOW() | | |

---

### 7. `post_displays` (Verknüpfungstabelle)

M:N-Beziehung zwischen Posts und Displays.

| Spalte | Typ | Nullable | Constraints | Beschreibung |
|---|---|---|---|---|
| `postId` | INTEGER | ✗ | PK, FK → posts.id (CASCADE) | |
| `displayId` | INTEGER | ✗ | PK, FK → displays.id (CASCADE) | |
| `priorityOverride` | INTEGER | ✓ | | Display-spezifische Priorität |
| `createdAt` | TIMESTAMP | ✗ | | Nur createdAt, kein updatedAt |

**Primärschlüssel:** Zusammengesetzt aus `(postId, displayId)`

---

### 8. `permissions`

Definierte Berechtigungen im System.

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `name` | VARCHAR(100) | ✗ | — | UNIQUE | z.B. `posts.read` |
| `resource` | VARCHAR(50) | ✗ | — | | Ressource: `posts`, `users`, etc. |
| `action` | VARCHAR(50) | ✗ | — | | Aktion: `read`, `create`, `update`, `delete` |
| `description` | VARCHAR(255) | ✓ | NULL | | Beschreibung |
| `created_at` | TIMESTAMP | ✗ | NOW() | | |
| `updated_at` | TIMESTAMP | ✗ | NOW() | | |

---

### 9. `role_permissions`

Standard-Berechtigungen pro Rolle.

| Spalte | Typ | Nullable | Constraints | Beschreibung |
|---|---|---|---|---|
| `id` | INTEGER | ✗ | PRIMARY KEY | |
| `role` | VARCHAR | ✗ | | `super_admin`, `admin`, `editor`, `viewer`, `display` |
| `permission_id` | INTEGER | ✗ | FK → permissions.id (CASCADE) | |
| `created_at` | TIMESTAMP | ✗ | | |
| `updated_at` | TIMESTAMP | ✗ | | |

**Index:** UNIQUE auf `(role, permission_id)`

---

### 10. `user_permissions`

Individuelle Berechtigungs-Überschreibungen pro Benutzer.

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `user_id` | INTEGER | ✗ | — | FK → users.id (CASCADE) | |
| `permission_id` | INTEGER | ✗ | — | FK → permissions.id (CASCADE) | |
| `granted` | BOOLEAN | ✗ | `true` | | `true` = gewährt, `false` = entzogen |
| `created_at` | TIMESTAMP | ✗ | NOW() | | |
| `updated_at` | TIMESTAMP | ✗ | NOW() | | |

**Index:** UNIQUE auf `(user_id, permission_id)`

---

### 11. `settings`

Key-Value Einstellungsspeicher.

| Spalte | Typ | Nullable | Default | Constraints | Beschreibung |
|---|---|---|---|---|---|
| `id` | INTEGER | ✗ | auto_increment | PRIMARY KEY | |
| `key` | VARCHAR | ✗ | — | UNIQUE | Einstellungsschlüssel |
| `value` | TEXT | ✗ | — | | Wert (als String gespeichert) |
| `type` | ENUM | ✓ | `'string'` | | `string`, `number`, `boolean`, `json` |
| `category` | VARCHAR | ✓ | NULL | | Kategorie: `display`, `transit`, `traffic`, `weather`, `ai`, `music` |
| `description` | TEXT | ✓ | NULL | | Beschreibung |
| `createdAt` | TIMESTAMP | ✗ | NOW() | | |
| `updatedAt` | TIMESTAMP | ✗ | NOW() | | |

**Bekannte Schlüssel (Auszug):**

| Key | Typ | Kategorie | Beschreibung |
|---|---|---|---|
| `refresh_interval` | number | display | Auto-Refresh in Minuten |
| `default_duration` | number | display | Standard-Anzeigedauer (Sek.) |
| `blend_effects_enabled` | boolean | display | Übergangseffekte aktiv |
| `transitions_external_only` | boolean | display | Effekte nur auf ext. Displays |
| `transit_enabled` | boolean | transit | ÖPNV aktiviert |
| `transit_station_id` | string | transit | Haltestellenid |
| `transit_station_name` | string | transit | Haltestellenname |
| `traffic_enabled` | boolean | traffic | Verkehr aktiviert |
| `traffic_highways` | json | traffic | Liste der Autobahnen |
| `weather_enabled` | boolean | weather | Wetter aktiviert |
| `weather_latitude` | string | weather | Breitengrad |
| `weather_longitude` | string | weather | Längengrad |
| `weather_location_name` | string | weather | Ortsname |
| `weather_forecast_days` | number | weather | Vorhersage-Tage |
| `ai_enabled` | boolean | ai | KI-Assistent aktiv |
| `ai_openai_api_key` | string | ai | OpenAI API-Schlüssel |
| `global_music_enabled` | boolean | music | Globale Musik aktiv |
| `global_music_url` | string | music | Musik-URL |
| `global_music_volume` | number | music | Lautstärke (0–100) |

---

## Beziehungsübersicht

```
Organization ──1:N──→ User
Organization ──1:N──→ Category
Organization ──1:N──→ Post
Organization ──1:N──→ Media
Organization ──1:N──→ Display

User ──1:N──→ Post           (createdBy)
User ──1:N──→ Media          (uploadedBy)
User ──M:N──→ Permission     (durch user_permissions)

Category ──1:N──→ Post       (categoryId)
Media ──1:N──→ Post          (mediaId)

Post ──M:N──→ Display        (durch post_displays)

Permission ──1:N──→ RolePermission
Permission ──1:N──→ UserPermission
```

---

## Datenbank-Verbindung

- **Produktion (Docker):** PostgreSQL 15 — `DATABASE_URL=postgres://prasco:password@postgres:5432/bulletin_board`
- **Raspberry Pi:** SQLite — `db/database.sqlite`
- **Synchronisation:** `sequelize.sync({ alter: true })` — erstellt/aktualisiert Tabellen automatisch
