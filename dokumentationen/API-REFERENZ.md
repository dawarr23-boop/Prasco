# PRASCO — API-Referenz

> Zuletzt aktualisiert: 27. Februar 2026  
> Basis-URL: `https://<server>:3000/api`  
> Authentifizierung: JWT Bearer Token  
> Swagger-Doku: `/api/docs`

---

## Authentifizierung

### `POST /api/auth/register`
Neuen Benutzer registrieren.

**Body:** `{ email, password, firstName, lastName }`  
**Antwort:** `{ user, tokens: { accessToken, refreshToken } }`

### `POST /api/auth/login`
Login mit E-Mail und Passwort.

**Body:** `{ email, password }`  
**Antwort:** `{ user, tokens: { accessToken, refreshToken } }`

### `POST /api/auth/refresh`
Access Token erneuern.

**Body:** `{ refreshToken }`  
**Antwort:** `{ accessToken }`

### `POST /api/auth/logout`
Abmelden (Client löscht Tokens).

### `GET /api/auth/me` 🔒
Aktuellen Benutzer abrufen.

---

## SSO (Single Sign-On)

### `GET /api/auth/sso/status`
SSO-Status prüfen (Provider, aktiviert?).

### `GET /api/auth/sso/login`
SSO-Login starten (Redirect zu Azure AD).

### `POST /api/auth/sso/ldap/login`
LDAP/AD Login.

**Body:** `{ username, password }`

### `GET /api/auth/sso/callback`
OAuth-Callback von Azure AD.

### `GET /api/auth/sso/logout`
SSO-Logout (Redirect zu Azure AD Logout).

### `GET /api/auth/sso/config` 🔒 Super-Admin
SSO-Konfiguration abrufen.

### `PUT /api/auth/sso/config` 🔒 Super-Admin
SSO-Konfiguration aktualisieren.

### `POST /api/auth/sso/test` 🔒 Super-Admin
SSO-Verbindung testen.

---

## Beiträge (Posts)

### `GET /api/posts` 🔒 `posts.read`
Alle Beiträge abrufen.

**Query:** `?page=1&limit=20&category_id=5&is_active=true`

### `GET /api/posts/:id` 🔒 `posts.read`
Einzelnen Beitrag abrufen.

### `POST /api/posts` 🔒 `posts.create`
Neuen Beitrag erstellen.

**Body:**
```json
{
  "title": "Titel",
  "content": "Inhalt",
  "content_type": "text",
  "category_id": 1,
  "display_duration": 10,
  "priority": 5,
  "is_active": true,
  "show_title": true,
  "display_mode": "all",
  "display_ids": [1, 2],
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-12-31T23:59:59Z",
  "blend_effect": "fade",
  "background_music_url": null,
  "background_music_volume": 50
}
```

### `PUT /api/posts/:id` 🔒 `posts.update`
Beitrag aktualisieren (gleicher Body wie POST).

### `DELETE /api/posts/:id` 🔒 `posts.delete`
Beitrag löschen.

### `DELETE /api/posts` 🔒 `posts.delete`
Alle Beiträge löschen.

### `PUT /api/posts/reorder` 🔒 `posts.update`
Reihenfolge ändern.

**Body:** `{ orderedIds: [3, 1, 2] }`

### `PUT /api/posts/update-priorities` 🔒 `posts.update`
Prioritäten aktualisieren.

**Body:** `{ priorities: [{ id: 1, priority: 10 }, { id: 2, priority: 5 }] }`

### `POST /api/posts/:id/download-video` 🔒 `posts.update`
Video für Offline-Betrieb herunterladen.

---

## Kategorien

### `GET /api/categories` 🔒 `categories.read`
Alle Kategorien abrufen.

### `GET /api/categories/:id` 🔒 `categories.read`
Einzelne Kategorie abrufen.

### `POST /api/categories` 🔒 `categories.create`
Neue Kategorie erstellen.

**Body:** `{ name, color, icon, sortOrder }`

### `PUT /api/categories/:id` 🔒 `categories.update`
Kategorie aktualisieren.

### `DELETE /api/categories/:id` 🔒 `categories.delete`
Kategorie löschen.

### `PUT /api/categories/reorder` 🔒 `categories.update`
Kategorie-Reihenfolge ändern.

---

## Displays

### `GET /api/displays` 🔒 `displays.read`
Alle Displays abrufen.

### `GET /api/displays/:id` 🔒 `displays.read`
Display nach ID abrufen.

### `GET /api/displays/by-identifier/:identifier` 🔒 `displays.read`
Display nach Identifier abrufen.

### `GET /api/displays/:id/posts` 🔒 `displays.read`
Posts eines Displays abrufen.

### `POST /api/displays` 🔒 Super-Admin
Display erstellen (max. 2 Lizenz-Limit).

**Body:** `{ name, identifier, description }`

### `PUT /api/displays/:id` 🔒 `displays.update`
Display aktualisieren.

### `DELETE /api/displays/:id` 🔒 `displays.delete`
Display löschen.

---

## Medien

### `POST /api/media/upload` 🔒 `media.upload`
Datei hochladen.

**Body:** `multipart/form-data` — Feld `file`  
**Unterstützt:** Bilder (JPEG/PNG/GIF/WebP), Videos (MP4/WebM), PDFs, PPTX, DOCX, Audio (MP3/WAV/OGG)

### `GET /api/media` 🔒 `media.read`
Alle Medien auflisten.

### `GET /api/media/:id` 🔒 `media.read`
Einzelne Mediendatei abrufen.

### `DELETE /api/media/:id` 🔒 `media.delete`
Mediendatei löschen (Datei + Thumbnail + DB-Eintrag).

### `GET /api/media/presentations/:id/slides` 🔒 `media.read`
Slide-Bilder einer Präsentation abrufen.

### `POST /api/media/download-external` 🔒 `media.upload`
Externe Videos herunterladen.

---

## Benutzer

### `GET /api/users` 🔒 `users.read`
Alle Benutzer auflisten.

**Query:** `?page=1&limit=20&search=name&role=admin&is_active=true`

### `GET /api/users/:id` 🔒 `users.read`
Benutzer nach ID.

### `POST /api/users` 🔒 `users.create`
Neuen Benutzer anlegen.

**Body:** `{ email, password, firstName, lastName, role }`

### `PUT /api/users/:id` 🔒 `users.update`
Benutzer aktualisieren.

### `DELETE /api/users/:id` 🔒 `users.delete`
Benutzer löschen.

### `PATCH /api/users/:id/toggle-active` 🔒 `users.update`
Benutzer aktivieren/deaktivieren.

### `PATCH /api/users/:id/reset-password` 🔒 `users.update`
Passwort zurücksetzen (Admin).

### `PATCH /api/users/change-password` 🔒
Eigenes Passwort ändern.

**Body:** `{ currentPassword, newPassword }`

### `GET /api/users/roles` 🔒 `users.read`
Verfügbare Rollen auflisten.

---

## Einstellungen

### `GET /api/settings`
Alle Einstellungen lesen (öffentlich).

**Query:** `?category=display`

### `GET /api/settings/:key`
Einzelne Einstellung lesen (öffentlich).

### `PUT /api/settings` 🔒 `settings.write`
Einstellung erstellen/aktualisieren.

**Body:** `{ key, value, type, category, description }`

### `POST /api/settings/bulk` 🔒 `settings.write`
Mehrere Einstellungen setzen.

**Body:** `{ settings: { key1: value1, key2: value2 } }`

### `DELETE /api/settings/:key` 🔒 `settings.write`
Einstellung löschen.

---

## KI-Assistent

### `POST /api/ai/generate` 🔒
Text mit KI generieren/bearbeiten.

**Body:**
```json
{
  "action": "generate",
  "text": "Stichworte oder bestehender Text",
  "targetLanguage": "Englisch"
}
```

| Action | Beschreibung |
|---|---|
| `generate` | Text aus Stichworten erstellen |
| `improve` | Text verbessern/umformulieren |
| `shorten` | Text kürzen |
| `translate` | Text übersetzen (benötigt `targetLanguage`) |

**Antwort:** `{ success: true, result: "...", action: "generate", tokensUsed: 150 }`

### `GET /api/ai/status` 🔒
Prüft ob KI konfiguriert ist.

**Antwort:** `{ configured: true, provider: "OpenAI", model: "gpt-4o-mini" }`

---

## ÖPNV (Transit)

### `GET /api/transit/stations/search`
Haltestellen suchen.

**Query:** `?q=Hauptbahnhof&limit=10`

### `GET /api/transit/stations/nearby`
Haltestellen in der Nähe.

**Query:** `?lat=51.77&lon=7.89&radius=2000&limit=10`

### `GET /api/transit/departures/:stationId`
Abfahrten einer Haltestelle.

**Query:** `?limit=20&duration=60`

### `POST /api/transit/cache/clear`
ÖPNV-Cache leeren.

### `GET /api/transit/cache/stats`
Cache-Statistiken.

---

## Verkehr (Traffic)

### `GET /api/traffic/highways`
Status mehrerer Autobahnen.

**Query:** `?roads=A1,A2,A44`

### `GET /api/traffic/highways/:roadId`
Status einer Autobahn (z.B. `A1`).

### `GET /api/traffic/warnings/:roadId`
Warnmeldungen.

### `GET /api/traffic/roadworks/:roadId`
Baustellen.

### `GET /api/traffic/roads`
Verfügbare Autobahnen auflisten.

### `POST /api/traffic/cache/clear`
Verkehr-Cache leeren.

### `GET /api/traffic/cache/stats`
Cache-Statistiken.

---

## Wetter

### `GET /api/weather/current`
Aktuelles Wetter + 7-Tage-Vorhersage.

**Query:** `?lat=51.77&lon=7.89&name=Ahlen`

**Antwort (Auszug):**
```json
{
  "location": { "name": "Ahlen", "lat": 51.77, "lon": 7.89 },
  "current": {
    "temperature": 12.5,
    "weatherCode": 2,
    "description": "Teilweise bewölkt",
    "icon": "⛅",
    "windSpeed": 15,
    "humidity": 65
  },
  "forecast": [
    { "date": "2026-02-27", "tempMax": 14, "tempMin": 5, "weatherCode": 0 }
  ]
}
```

### `POST /api/weather/cache/clear`
Wetter-Cache leeren.

### `GET /api/weather/geocode`
Ortssuche für Koordinaten (Geocoding).

**Query:** `?q=Ahlen` (min. 2 Zeichen)  
**Antwort:** `{ success: true, data: [{ name, country, admin1, latitude, longitude }] }`

### `GET /api/weather/cache/stats`
Cache-Statistiken.

---

## YouTube

### `POST /api/youtube/duration` 🔒 `posts.create`
Video-Dauer abrufen.

**Body:** `{ url: "https://youtube.com/watch?v=..." }`  
**Antwort:** `{ duration: 120 }` (Sekunden)

---

## Kiosk-Modus

### `POST /api/kiosk/presentation` 🔒 `settings.manage`
Präsentationsmodus starten.

### `POST /api/kiosk/display` 🔒 `settings.manage`
Display-Modus starten.

### `POST /api/kiosk/stop` 🔒 `settings.manage`
Kiosk-Modus beenden.

---

## System

### `GET /api/system/mode` 🔒 `settings.read`
Aktuellen System-Modus abrufen (normal/hotspot).

### `POST /api/system/mode` 🔒 `settings.write`
System-Modus wechseln.

**Body:** `{ mode: "hotspot" }` oder `{ mode: "normal" }`

---

## Öffentliche API (kein Token nötig)

### `GET /api/public/info`
App-Informationen (Version, Entwickler).

### `GET /api/public/posts`
Aktive Beiträge für Display.

### `GET /api/public/posts/:id`
Einzelner aktiver Beitrag.

### `GET /api/public/categories`
Aktive Kategorien.

### `GET /api/public/displays`
Alle aktiven Displays.

### `GET /api/public/display/:identifier`
Display nach Identifier.

### `GET /api/public/display/:identifier/posts`
Posts eines bestimmten Displays.

---

## Health Check

### `GET /api/health`
```json
{ "status": "ok", "timestamp": "2026-02-27T...", "uptime": 86400 }
```

---

## Fehler-Formate

```json
{
  "error": "Beschreibung des Fehlers",
  "statusCode": 400
}
```

| Code | Bedeutung |
|---|---|
| 400 | Ungültige Anfrage / Validierungsfehler |
| 401 | Nicht authentifiziert (Token fehlt/ungültig) |
| 403 | Keine Berechtigung |
| 404 | Ressource nicht gefunden |
| 429 | Rate Limit überschritten |
| 500 | Server-Fehler |

---

## Rate Limits

| Endpunkt | Limit |
|---|---|
| `/api/auth/*` | 100 Anfragen / 5 Min |
| `/api/media/upload` | 100 Anfragen / 60 Min |
| `/api/public/*` | 10.000 Anfragen / 15 Min |
| `/api/*` (allgemein) | 5.000 Anfragen / 15 Min |

---

## Weitere Endpunkte

### `GET /health`
Basis-Health-Check (kein `/api`-Prefix).

**Antwort:** `{ status: "ok", timestamp: "..." }`

### `GET /api/health`
Erweiterter Health-Check mit Uptime.

**Antwort:** `{ status: "ok", timestamp: "...", uptime: 12345.67 }`

---

## Legende

- 🔒 = Authentifizierung erforderlich (JWT Bearer Token)
- `permission.name` = Benötigte Berechtigung
- Super-Admin = Nur für Benutzer mit Rolle `super_admin`
