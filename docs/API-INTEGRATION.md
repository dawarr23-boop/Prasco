# PRASCO API Integration

## Übersicht

Die PRASCO TV App kommuniziert mit dem PRASCO Server über eine REST API.
Alle öffentlichen Endpunkte sind ohne Authentifizierung zugänglich.

## Basis-Konfiguration

- **Standard URL:** `http://<server-ip>:3000`
- **Konfigurierbar** über Setup Wizard oder Einstellungen
- **Content-Type:** `application/json`

## Endpunkte

### Health Check

```
GET /health
```

Prüft die Erreichbarkeit des Servers.

**Response:**

```json
{
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 86400,
    "version": "2.0.0"
}
```

### Posts abrufen (öffentlich)

```
GET /api/public/posts
```

Gibt alle aktiven, sichtbaren Posts zurück.

**Response:**

```json
[
    {
        "id": 1,
        "title": "Willkommen",
        "content": "<h1>Willkommen bei PRASCO</h1>",
        "type": "html",
        "duration": 10000,
        "sortOrder": 1,
        "isActive": true,
        "isVisible": true,
        "categories": [{ "id": 1, "name": "Allgemein", "color": "#4CAF50" }],
        "mediaUrl": null,
        "thumbnailUrl": null,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
    }
]
```

### Posts nach Display

```
GET /api/public/posts?display={identifier}
```

Gibt Posts für ein bestimmtes Display zurück.

### Einzelnen Post abrufen

```
GET /api/public/posts/{id}
```

### Kategorien abrufen

```
GET /api/public/categories
```

**Response:**

```json
[
    {
        "id": 1,
        "name": "Allgemein",
        "color": "#4CAF50",
        "icon": "info",
        "sortOrder": 1
    }
]
```

### Server-Einstellungen

```
GET /api/settings
```

**Response:**

```json
[
    {
        "key": "displayDuration",
        "value": "10000",
        "type": "number"
    },
    {
        "key": "transition",
        "value": "fade",
        "type": "string"
    }
]
```

### Einzelne Einstellung

```
GET /api/settings/{key}
```

### Abfahrten (ÖPNV-Modul)

```
GET /api/public/departures?stop={stopId}&limit={limit}
```

**Response:**

```json
{
    "stopName": "Hauptbahnhof",
    "departures": [
        {
            "line": "U1",
            "direction": "Hauptbahnhof",
            "departure": "2024-01-15T10:35:00.000Z",
            "delay": 2,
            "platform": "1"
        }
    ]
}
```

### Präsentations-Slides

```
GET /api/public/posts/{postId}/slides
```

**Response:**

```json
[
    {
        "id": 1,
        "slideNumber": 1,
        "imageUrl": "/uploads/slides/slide-1.jpg",
        "duration": 5000
    }
]
```

## Content-Typen

| Typ          | Beschreibung       | Anzeige               |
| ------------ | ------------------ | --------------------- |
| `text`       | Reiner Text        | HTML-formatiert       |
| `html`       | HTML-Inhalt        | Direkt im WebView     |
| `image`      | Bild (JPG/PNG/GIF) | Vollbild mit mediaUrl |
| `video`      | Video (MP4/WebM)   | HTML5 Video Player    |
| `powerpoint` | Präsentation       | Slides-Rotation       |

## WebView Display-Seite

Die Hauptanzeige wird über die Server-Display-Seite gesteuert:

```
GET /display.html
```

Der PRASCO Server liefert die komplette Display-Logik (HTML/CSS/JS).
Die App lädt diese Seite im WebView und stellt über die JavaScript Bridge
native Funktionen bereit.

## JavaScript Bridge

Die App stellt unter `window.PrascoNative` folgende Methoden bereit:

| Methode                  | Rückgabe    | Beschreibung                 |
| ------------------------ | ----------- | ---------------------------- |
| `getAppVersion()`        | String      | App-Version                  |
| `getDeviceInfo()`        | JSON String | Geräteinformationen          |
| `getDisplayIdentifier()` | String      | Display-Kennung              |
| `isOnline()`             | Boolean     | Netzwerkstatus               |
| `getCacheStatus()`       | JSON String | Cache-Statistiken            |
| `openSettings()`         | void        | Öffnet Settings-Activity     |
| `restartApp()`           | void        | Startet App neu              |
| `displayReady()`         | void        | Signalisiert fertige Anzeige |
| `log(msg)`               | void        | Loggt Nachricht              |
| `logError(msg)`          | void        | Loggt Fehler                 |
| `logDebug(msg)`          | void        | Loggt Debug-Nachricht        |

## Fehlerbehandlung

- **Kein Netzwerk:** Offline-Cache oder Fallback-HTML
- **Server nicht erreichbar:** Auto-Reconnect mit exponentieller Backoff
- **API-Fehler (4xx/5xx):** Logging, letzten Cache verwenden
- **Timeout:** 10s Connect, 30s Read, danach Retry

## OkHttp-Konfiguration

```kotlin
OkHttpClient.Builder()
    .connectTimeout(10, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .addInterceptor(loggingInterceptor)
    .addInterceptor { chain ->
        // User-Agent Header
        val request = chain.request().newBuilder()
            .header("User-Agent", "PrascoTV/${BuildConfig.VERSION_NAME}")
            .build()
        chain.proceed(request)
    }
    .build()
```
