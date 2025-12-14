# Task 4: REST API Endpunkte - Implementation Guide

## Übersicht

Implementation der vollständigen CRUD-APIs für Posts, Categories und Public Display mit Controllers, Validierung und Error-Handling.

## Architektur

```
src/
├── controllers/
│   ├── postController.ts      # Post CRUD-Logic
│   ├── categoryController.ts  # Category CRUD-Logic
│   └── publicController.ts    # Public Display API
├── routes/
│   ├── posts.ts              # Post-Routes mit Auth
│   ├── categories.ts         # Category-Routes mit Auth
│   └── public.ts             # Public-Routes (kein Auth)
├── middleware/
│   └── pagination.ts         # Pagination-Middleware
└── types/
    └── index.ts              # Request/Response Types
```

## API-Endpunkte (zu implementieren)

### Posts API (`/api/posts`)

| Methode | Endpoint         | Auth | Rolle         | Beschreibung         |
| ------- | ---------------- | ---- | ------------- | -------------------- |
| GET     | `/api/posts`     | ✅   | Alle          | Liste aller Posts    |
| GET     | `/api/posts/:id` | ✅   | Alle          | Einzelner Post       |
| POST    | `/api/posts`     | ✅   | Admin, Editor | Neuen Post erstellen |
| PUT     | `/api/posts/:id` | ✅   | Admin, Editor | Post aktualisieren   |
| DELETE  | `/api/posts/:id` | ✅   | Admin         | Post löschen         |

**Query-Parameter (GET /api/posts):**

- `page` - Seitennummer (default: 1)
- `limit` - Items pro Seite (default: 10)
- `categoryId` - Filter nach Kategorie
- `isActive` - Filter nach Status (true/false)
- `search` - Volltextsuche (title, content)
- `sortBy` - Sortierung (priority, createdAt)
- `order` - Reihenfolge (ASC, DESC)

### Categories API (`/api/categories`)

| Methode | Endpoint              | Auth | Rolle | Beschreibung             |
| ------- | --------------------- | ---- | ----- | ------------------------ |
| GET     | `/api/categories`     | ✅   | Alle  | Liste aller Kategorien   |
| GET     | `/api/categories/:id` | ✅   | Alle  | Einzelne Kategorie       |
| POST    | `/api/categories`     | ✅   | Admin | Neue Kategorie erstellen |
| PUT     | `/api/categories/:id` | ✅   | Admin | Kategorie aktualisieren  |
| DELETE  | `/api/categories/:id` | ✅   | Admin | Kategorie löschen        |

### Public Display API (`/api/public`)

| Methode | Endpoint                | Auth | Beschreibung                  |
| ------- | ----------------------- | ---- | ----------------------------- |
| GET     | `/api/public/posts`     | ❌   | Aktive Posts für Display      |
| GET     | `/api/public/posts/:id` | ❌   | Einzelner Post (View-Counter) |

**Features:**

- Nur aktive Posts (isActive=true)
- Zeitfilter (startDate/endDate)
- Sortierung nach Priority
- Include Relations (Category, Media, Creator)
- View-Counter bei jedem Abruf

## Implementation Steps

### 1. Types & Interfaces erweitern

```typescript
// src/types/index.ts

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PostQuery extends PaginationQuery {
  categoryId?: number;
  isActive?: boolean;
  search?: string;
  sortBy?: 'priority' | 'createdAt' | 'viewCount';
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 2. Pagination Middleware

```typescript
// src/middleware/pagination.ts

export const parsePagination = (req, res, next) => {
  req.pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };
  next();
};
```

### 3. Post Controller

**Funktionen:**

- `getAllPosts(req, res)` - Liste mit Pagination & Filtering
- `getPostById(req, res)` - Einzelner Post mit Relations
- `createPost(req, res)` - Neuen Post erstellen
- `updatePost(req, res)` - Post aktualisieren
- `deletePost(req, res)` - Post löschen (Soft-Delete)

**Validierung:**

- Title: Required, 3-255 Zeichen
- Content: Required
- ContentType: Enum (text, image, video, html)
- Duration: Optional, 5-300 Sekunden
- Priority: Optional, 0-10

### 4. Category Controller

**Funktionen:**

- `getAllCategories(req, res)` - Alle Kategorien
- `getCategoryById(req, res)` - Einzelne Kategorie mit Post-Count
- `createCategory(req, res)` - Neue Kategorie
- `updateCategory(req, res)` - Kategorie aktualisieren
- `deleteCategory(req, res)` - Kategorie löschen

**Validierung:**

- Name: Required, Unique, 2-100 Zeichen
- Color: Optional, Hex-Code (#rrggbb)
- Icon: Optional, 1-50 Zeichen

### 5. Public Controller

**Funktionen:**

- `getActivePosts(req, res)` - Aktive Posts für Display
- `getPostById(req, res)` - Post abrufen + View-Counter++

**Filter:**

- isActive = true
- startDate <= NOW
- endDate >= NOW OR NULL

## Testing

### Unit Tests

```typescript
// tests/controllers/post.test.ts
describe('Post Controller', () => {
  test('should create post', async () => {});
  test('should get all posts with pagination', async () => {});
  test('should update post', async () => {});
  test('should delete post', async () => {});
});
```

### Integration Tests

```typescript
// tests/integration/posts.test.ts
describe('POST /api/posts', () => {
  test('should require authentication', async () => {});
  test('should create post with valid data', async () => {});
  test('should reject invalid data', async () => {});
});
```

## Response-Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* result */
  },
  "pagination": {
    /* if paginated */
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {
      /* optional */
    }
  }
}
```

## Performance-Optimierung

- Database-Indizes nutzen
- Eager Loading für Relations
- Limit für Pagination (max 100)
- Cache für häufige Queries (Redis)

## Security

- Input-Validierung mit express-validator
- SQL-Injection-Schutz (Sequelize ORM)
- XSS-Protection (sanitize HTML)
- RBAC für alle Endpunkte
- Organization-Scope-Check

## Completion Checklist

- [ ] Types/Interfaces definiert
- [ ] Pagination-Middleware
- [ ] Post-Controller komplett
- [ ] Category-Controller komplett
- [ ] Public-Controller komplett
- [ ] Routes mit Validierung
- [ ] Auth-Middleware integriert
- [ ] RBAC-Checks
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] API-Dokumentation
- [ ] Postman-Collection

## Zeitaufwand (geschätzt)

- Types & Middleware: 30 min
- Post-Controller: 2h
- Category-Controller: 1h
- Public-Controller: 1h
- Routes & Validierung: 1h
- Tests: 2h
- **Total: ~7.5h**
