# Task 8: API Documentation (Swagger/OpenAPI) - Abgeschlossen ✅

**Status:** Erfolgreich implementiert  
**Datum:** 23.11.2025  
**Komplexität:** Mittel

## 🎯 Ziele

Vollständige API-Dokumentation mit Swagger/OpenAPI 3.0:

- Interactive API Explorer mit Try-it-out Features
- Automatische Schema-Generierung aus JSDoc Comments
- JWT Bearer Authentication Integration
- Request/Response Examples für alle Endpoints
- Security Schema Dokumentation (Rate Limiting, Permissions)

## ✅ Implementierte Features

### 1. Swagger Configuration

**Datei:** `src/config/swagger.ts` (294 Zeilen)

**OpenAPI Spec:**

```typescript
{
  openapi: '3.0.0',
  info: {
    title: 'Prasco Digital Bulletin Board API',
    version: '2.0.0',
    description: 'REST API für das digitale schwarze Brett mit Enhanced RBAC, Media Upload und Security Features',
    contact: {
      name: 'Prasco Team',
      email: 'admin@prasco.net',
    },
  }
}
```

**Server Environments:**

- Development: `http://localhost:3000`
- Raspberry Pi: `http://192.168.1.100:3000`

### 2. API Tags & Gruppierung

| Tag            | Beschreibung                                        | Endpoints   |
| -------------- | --------------------------------------------------- | ----------- |
| Authentication | User authentication and token management            | 5 Endpoints |
| Posts          | Content management for bulletin board posts         | 5 Endpoints |
| Categories     | Category management for organizing posts            | 5 Endpoints |
| Media          | Image and video upload with thumbnail generation    | 4 Endpoints |
| Public         | Public endpoints for display without authentication | 2 Endpoints |

### 3. Security Schemas

#### JWT Bearer Authentication

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: JWT Access Token (erhalten via /api/auth/login)
```

**Authorization Header:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Rate Limiting Documentation

**Auth Endpoints:**

- Login: 5 Versuche / 15 Minuten
- Register: 5 Registrierungen / 15 Minuten

**Upload Endpoints:**

- Media Upload: 10 Uploads / Stunde

**Global API:**

- 100 Requests / 15 Minuten für alle anderen Endpoints

### 4. Schema Definitions

#### User Schema

```typescript
{
  id: integer,
  email: string (email format),
  firstName: string,
  lastName: string,
  role: enum ['super_admin', 'admin', 'editor', 'viewer', 'display'],
  organizationId: integer | null,
  isActive: boolean,
  lastLogin: datetime | null,
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Post Schema

```typescript
{
  id: integer,
  title: string,
  content: string,
  contentType: enum ['text', 'image', 'video', 'html'],
  mediaUrl: string | null,
  categoryId: integer,
  authorId: integer,
  organizationId: integer,
  startDate: datetime | null,
  endDate: datetime | null,
  isActive: boolean,
  displayOrder: integer,
  duration: integer (Sekunden),
  priority: integer (0-10),
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Media Schema

```typescript
{
  id: integer,
  filename: string,
  originalName: string,
  mimeType: string,
  size: integer (bytes),
  path: string,
  thumbnailPath: string | null,
  width: integer | null,
  height: integer | null,
  uploadedById: integer,
  organizationId: integer,
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Category Schema

```typescript
{
  id: integer,
  name: string,
  description: string | null,
  color: string (hex format #RRGGBB),
  organizationId: integer,
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Permission Schema

```typescript
{
  id: integer,
  name: string (e.g., 'posts.create'),
  description: string,
  resource: string (e.g., 'posts'),
  action: string (e.g., 'create')
}
```

### 5. Common Responses

#### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errors": ["Email ist erforderlich", "Passwort zu kurz"]
}
```

#### Pagination Response

```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### 6. Dokumentierte Endpoints

#### Authentication Routes (`/api/auth`)

**POST /api/auth/register**

- Summary: Neuen Benutzer registrieren
- Security: None (Public)
- Rate Limit: 5/15min
- Request Body: email, password, firstName, lastName, organizationId?
- Response 201: User + Access Token + Refresh Token

**POST /api/auth/login**

- Summary: Benutzer einloggen
- Security: None (Public)
- Rate Limit: 5/15min (nur fehlgeschlagene Versuche)
- Request Body: email, password
- Response 200: User + Access Token (1h) + Refresh Token (7d)
- Response 401: Ungültige Credentials
- Response 403: Account deaktiviert

**POST /api/auth/refresh**

- Summary: Access Token erneuern
- Security: None (Public, aber Refresh Token erforderlich)
- Request Body: refreshToken
- Response 200: Neuer Access Token

**POST /api/auth/logout**

- Summary: Benutzer ausloggen
- Security: None (clientseitiges Token-Löschen)
- Response 200: Success Message

**GET /api/auth/me**

- Summary: Aktuellen Benutzer abrufen
- Security: Bearer Auth (Required)
- Response 200: Current User Data

#### Posts Routes (`/api/posts`)

**GET /api/posts**

- Summary: Alle Beiträge abrufen
- Security: Bearer Auth + `posts.read` Permission
- Query Params: page, limit, categoryId, isActive
- Response 200: Posts Array + Pagination

**GET /api/posts/:id**

- Summary: Einzelnen Beitrag abrufen
- Security: Bearer Auth + `posts.read` Permission
- Path Param: id (integer)
- Response 200: Post Object
- Response 404: Not Found

**POST /api/posts**

- Summary: Neuen Beitrag erstellen
- Security: Bearer Auth + `posts.create` Permission (Editor/Admin)
- Request Body: title*, content*, contentType\*, categoryId, mediaId, duration, priority, startDate, endDate, isActive
- Response 201: Created Post

**PUT /api/posts/:id**

- Summary: Beitrag aktualisieren
- Security: Bearer Auth + `posts.update` Permission (Editor/Admin)
- Request Body: Alle Felder optional
- Response 200: Updated Post

**DELETE /api/posts/:id**

- Summary: Beitrag löschen
- Security: Bearer Auth + `posts.delete` Permission (Admin/Super-Admin)
- Response 200: Success Message

#### Media Routes (`/api/media`)

**POST /api/media/upload**

- Summary: Mediendatei hochladen
- Security: Bearer Auth + `media.upload` Permission (Editor)
- Rate Limit: 10/hour
- Content-Type: multipart/form-data
- Form Field: file (binary)
- Max Size: 10MB (images), 100MB (videos)
- Supported: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, OGG
- Response 201: Media Object mit Thumbnail-Path

**GET /api/media**

- Summary: Alle Mediendateien abrufen
- Security: Bearer Auth + `media.read` Permission
- Response 200: Media Array (organization-scoped)

**GET /api/media/:id**

- Summary: Einzelne Mediendatei abrufen
- Security: Bearer Auth + `media.read` Permission
- Response 200: Media Object mit Metadaten (width, height, size)

**DELETE /api/media/:id**

- Summary: Mediendatei löschen
- Security: Bearer Auth + `media.delete` Permission (Super-Admin only)
- Response 200: Success (löscht Original + Thumbnail)

### 7. Reusable Parameters

**Pagination:**

```yaml
PageParam:
  in: query
  name: page
  schema: { type: integer, minimum: 1, default: 1 }

LimitParam:
  in: query
  name: limit
  schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
```

**Filters:**

```yaml
CategoryIdParam:
  in: query
  name: categoryId
  schema: { type: integer }

ActiveParam:
  in: query
  name: active
  schema: { type: boolean }
```

### 8. Swagger UI Integration

**Server Route:** `src/server.ts`

```typescript
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Prasco API Dokumentation',
  })
);
```

**Access URL:** `http://localhost:3000/api-docs`

**Features:**

- ✅ Interactive API Explorer
- ✅ Try-it-out für alle Endpoints
- ✅ JWT Token Authorization via UI (Authorize Button)
- ✅ Request/Response Examples
- ✅ Schema Validation
- ✅ Response Status Codes
- ✅ Download OpenAPI JSON Spec

### 9. Dependencies

**Installiert:**

```json
{
  "swagger-ui-express": "^5.0.1",
  "swagger-jsdoc": "^6.2.8",
  "@types/swagger-ui-express": "^4.1.6",
  "@types/swagger-jsdoc": "^6.0.4"
}
```

## 📊 Dokumentations-Statistik

| Metrik                       | Anzahl |
| ---------------------------- | ------ |
| Dokumentierte Endpoints      | 19     |
| API Tags                     | 5      |
| Schema Definitions           | 7      |
| Reusable Parameters          | 4      |
| Common Responses             | 5      |
| JSDoc Comment Blocks         | 19     |
| Total Lines of Documentation | ~800   |

## 🧪 Testing der Dokumentation

### 1. Swagger UI öffnen

```
http://localhost:3000/api-docs
```

### 2. Login testen via UI

1. Expand **Authentication** → **POST /api/auth/login**
2. Click **Try it out**
3. Request Body:
   ```json
   {
     "email": "admin@prasco.net",
     "password": "admin123"
   }
   ```
4. Click **Execute**
5. Copy `accessToken` aus Response

### 3. Authorization konfigurieren

1. Click **Authorize** Button (rechts oben)
2. Bearer Token eingeben: `<accessToken>`
3. Click **Authorize**
4. Click **Close**

### 4. Protected Endpoint testen

1. Expand **Posts** → **GET /api/posts**
2. Click **Try it out**
3. Set Parameters: `page=1`, `limit=10`
4. Click **Execute**
5. Verify 200 Response mit Posts Array

### 5. Permission Denied testen

1. Login als Admin (hat keine `media.upload` Permission)
2. Expand **Media** → **POST /api/media/upload**
3. Try to upload
4. Verify 403 Response: "Keine Berechtigung für diese Aktion"

## 📚 OpenAPI Spec Export

**JSON Download:**

```
http://localhost:3000/api-docs/swagger.json
```

**YAML Conversion:**

```bash
# Install converter
npm install -g swagger2openapi

# Convert to YAML
swagger2openapi http://localhost:3000/api-docs/swagger.json -o openapi.yaml
```

## 🔗 Externe Integration

### Postman Import

1. Postman öffnen
2. Import → Link
3. URL: `http://localhost:3000/api-docs/swagger.json`
4. Import as Postman Collection

### Insomnia Import

1. Insomnia öffnen
2. Application → Preferences → Data → Import Data
3. From URL: `http://localhost:3000/api-docs/swagger.json`

### VS Code REST Client

```http
### Variables
@baseUrl = http://localhost:3000
@token = {{login.response.body.data.accessToken}}

### Login
# @name login
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@prasco.net",
  "password": "admin123"
}

### Get Posts (with auto token)
GET {{baseUrl}}/api/posts
Authorization: Bearer {{token}}
```

## 🎨 UI Customization

**Custom CSS:**

```css
.swagger-ui .topbar {
  display: none;
} /* Versteckt Swagger Topbar */
```

**Custom Site Title:**

```
Prasco API Dokumentation
```

## 📈 Nächste Schritte (Optional)

- [ ] **Redoc Integration** als alternative UI (schöner für Print)
- [ ] **Code Generation** Client SDKs (TypeScript, Python, Java)
- [ ] **API Versioning** (v1, v2 URL Prefixes)
- [ ] **Webhook Documentation** für Event-basierte Integrationen
- [ ] **GraphQL Schema** als Alternative zu REST
- [ ] **API Analytics** Request/Response Tracking

## 🌟 Best Practices befolgt

- ✅ OpenAPI 3.0.0 Standard
- ✅ Semantic Versioning (v2.0.0)
- ✅ RESTful URL Design
- ✅ Consistent Error Responses
- ✅ Security Scheme Documentation
- ✅ Request/Response Examples
- ✅ Rate Limiting Documentation
- ✅ Permission Requirements Clear
- ✅ MIME Types Specified
- ✅ HTTP Status Codes Documented

---

**Task 8 abgeschlossen** - Vollständige API-Dokumentation mit Swagger UI ✅

**Access:** http://localhost:3000/api-docs
