# Permissions Reference Guide

## 🎯 Übersicht

Dieses Dokument beschreibt alle 33 Permissions im System und zeigt, welche Rolle welche Berechtigungen hat.

## 📋 Permission-Naming Convention

```
<resource>.<action>
```

**Beispiele:**

- `posts.create` - Beiträge erstellen
- `users.manage` - Benutzer-Management (erweiterte Rechte)
- `system.logs` - System-Logs einsehen

## 👥 Rollen-Hierarchie

```
super_admin (ALL - 33/33) ⭐
    ↓
admin (9/33) 🔧
    ↓
editor (10/33) ✏️
    ↓
viewer (4/33) 👁️
    ↓
display (3/33) 📺
```

## 🔐 Complete Permissions Matrix

### Posts Permissions (5)

| Permission     | super_admin | admin | editor | viewer | display | Beschreibung                  |
| -------------- | :---------: | :---: | :----: | :----: | :-----: | ----------------------------- |
| `posts.create` |     ✅      |  ❌   |   ✅   |   ❌   |   ❌    | Neue Beiträge erstellen       |
| `posts.read`   |     ✅      |  ✅   |   ✅   |   ✅   |   ✅    | Beiträge anzeigen             |
| `posts.update` |     ✅      |  ✅   |   ✅   |   ❌   |   ❌    | Beiträge bearbeiten           |
| `posts.delete` |     ✅      |  ✅   |   ✅   |   ❌   |   ❌    | Beiträge löschen              |
| `posts.manage` |     ✅      |  ✅   |   ❌   |   ❌   |   ❌    | Post-Scheduling & Prioritäten |

**Use Cases:**

```typescript
// Editor kann Posts erstellen und bearbeiten
requirePermission('posts.create'); // ✅ Editor
requirePermission('posts.update'); // ✅ Editor

// Admin kann Posts verwalten aber nicht erstellen
requirePermission('posts.create'); // ❌ Admin
requirePermission('posts.manage'); // ✅ Admin
```

---

### Categories Permissions (5)

| Permission          | super_admin | admin | editor | viewer | display | Beschreibung          |
| ------------------- | :---------: | :---: | :----: | :----: | :-----: | --------------------- |
| `categories.create` |     ✅      |  ❌   |   ✅   |   ❌   |   ❌    | Kategorien erstellen  |
| `categories.read`   |     ✅      |  ✅   |   ✅   |   ✅   |   ✅    | Kategorien anzeigen   |
| `categories.update` |     ✅      |  ✅   |   ✅   |   ❌   |   ❌    | Kategorien bearbeiten |
| `categories.delete` |     ✅      |  ✅   |   ❌   |   ❌   |   ❌    | Kategorien löschen    |
| `categories.manage` |     ✅      |  ✅   |   ❌   |   ❌   |   ❌    | Kategorie-Hierarchie  |

**Use Cases:**

```typescript
// Editor kann Kategorien pflegen
requirePermission('categories.create'); // ✅ Editor
requirePermission('categories.update'); // ✅ Editor

// Admin kann Kategorien löschen
requirePermission('categories.delete'); // ✅ Admin
```

---

### Users Permissions (5)

| Permission     | super_admin | admin | editor | viewer | display | Beschreibung          |
| -------------- | :---------: | :---: | :----: | :----: | :-----: | --------------------- |
| `users.create` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Neue Benutzer anlegen |
| `users.read`   |     ✅      |  ✅   |   ✅   |   ❌   |   ❌    | Benutzer anzeigen     |
| `users.update` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Benutzer bearbeiten   |
| `users.delete` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Benutzer löschen      |
| `users.manage` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | User-Rollen verwalten |

**Security Notes:**

- Nur super_admin kann User-Rollen ändern (Sicherheit!)
- Admin kann nur User-Liste sehen, nicht bearbeiten
- Verhindert privilege escalation

---

### Organizations Permissions (5)

| Permission             | super_admin | admin | editor | viewer | display | Beschreibung            |
| ---------------------- | :---------: | :---: | :----: | :----: | :-----: | ----------------------- |
| `organizations.create` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Neue Org erstellen      |
| `organizations.read`   |     ✅      |  ✅   |   ✅   |   ✅   |   ❌    | Org-Infos anzeigen      |
| `organizations.update` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Org-Daten bearbeiten    |
| `organizations.delete` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Organisation löschen    |
| `organizations.manage` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Multi-Tenant Management |

**Multi-Tenant Notes:**

- Nur super_admin kann organisationen erstellen/löschen
- Admin, Editor, Viewer sehen nur ihre eigene Organisation
- super_admin sieht alle Organisationen

---

### Media Permissions (4)

| Permission     | super_admin | admin | editor | viewer | display | Beschreibung            |
| -------------- | :---------: | :---: | :----: | :----: | :-----: | ----------------------- |
| `media.upload` |     ✅      |  ❌   |   ✅   |   ❌   |   ❌    | Medien hochladen        |
| `media.read`   |     ✅      |  ✅   |   ✅   |   ✅   |   ✅    | Medien anzeigen         |
| `media.delete` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Medien löschen          |
| `media.manage` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Media-Library verwalten |

**Task 6 Notes:**

- Editor kann Bilder/Videos hochladen für Posts
- Nur super_admin kann Medien löschen (Storage-Management)
- display kann Medien nur lesen (für Anzeige)

---

### Displays Permissions (5)

| Permission        | super_admin | admin | editor | viewer | display | Beschreibung                |
| ----------------- | :---------: | :---: | :----: | :----: | :-----: | --------------------------- |
| `displays.create` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Display registrieren        |
| `displays.read`   |     ✅      |  ✅   |   ✅   |   ✅   |   ❌    | Display-Liste sehen         |
| `displays.update` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Display-Config ändern       |
| `displays.delete` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Display entfernen           |
| `displays.manage` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Display-Gruppen & Zeitpläne |

**Display Management:**

- Display-Devices haben keine Admin-Rechte (Sicherheit!)
- Nur super_admin kann Displays verwalten
- Editor/Viewer können Display-Liste für Content-Targeting sehen

---

### System Permissions (2)

| Permission        | super_admin | admin | editor | viewer | display | Beschreibung         |
| ----------------- | :---------: | :---: | :----: | :----: | :-----: | -------------------- |
| `system.logs`     |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | System-Logs einsehen |
| `system.settings` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | System-Einstellungen |

**System-Level:**

- Nur für super_admin (plattform-weite Einstellungen)
- Debugging & Monitoring

---

### Permissions & Roles Management (2)

| Permission           | super_admin | admin | editor | viewer | display | Beschreibung          |
| -------------------- | :---------: | :---: | :----: | :----: | :-----: | --------------------- |
| `permissions.manage` |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Permissions verwalten |
| `roles.manage`       |     ✅      |  ❌   |   ❌   |   ❌   |   ❌    | Rollen-Zuweisungen    |

**Meta-Permissions:**

- Nur super_admin kann Permission-System ändern
- Verhindert Privilege Escalation
- Für künftige Admin-UI

---

## 🔧 Implementation

### In Routes verwenden:

```typescript
import { requirePermission } from '../middleware/permissions';

// Granular permission check
router.post('/posts', authenticate(), requirePermission('posts.create'), createPost);

// Multiple permissions (OR)
router.post(
  '/posts/:id/publish',
  authenticate(),
  async (req, res, next) => {
    const hasManage = await req.user.hasPermission('posts.manage');
    const hasPublish = await req.user.hasPermission('posts.publish');
    if (!hasManage && !hasPublish) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  publishPost
);
```

### In Controllers verwenden:

```typescript
// Check permission programmatically
async createPost(req: Request, res: Response) {
  const hasPermission = await req.user.hasPermission('posts.create');

  if (!hasPermission) {
    return res.status(403).json({ error: 'No permission to create posts' });
  }

  // ... create post logic
}
```

### User-Override erstellen:

```typescript
// Grant viewer temporary posts.create permission
const permission = await Permission.findOne({
  where: { name: 'posts.create' },
});

await UserPermission.create({
  userId: viewerUser.id,
  permissionId: permission.id,
  granted: true, // true = grant, false = revoke
});

// Jetzt kann dieser Viewer Posts erstellen ✅
```

### User-Override entziehen:

```typescript
// Revoke admin's posts.delete permission
const permission = await Permission.findOne({
  where: { name: 'posts.delete' },
});

await UserPermission.create({
  userId: adminUser.id,
  permissionId: permission.id,
  granted: false, // false = revoke
});

// Dieser Admin kann KEINE Posts mehr löschen ❌
```

---

## 🧪 Testing

### Quick Permission Check:

```sql
-- Check which permissions a role has
SELECT p.name, p.resource, p.action
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role = 'editor'
ORDER BY p.resource, p.action;

-- Check user's effective permissions (role + overrides)
SELECT DISTINCT p.name, p.resource, p.action,
  CASE
    WHEN up.granted IS NOT NULL THEN
      CASE WHEN up.granted THEN 'USER_GRANTED' ELSE 'USER_REVOKED' END
    ELSE 'ROLE_BASED'
  END as source
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
LEFT JOIN users u ON rp.role = u.role
LEFT JOIN user_permissions up ON p.id = up.permission_id AND u.id = up.user_id
WHERE u.id = 2  -- User ID
ORDER BY p.resource, p.action;
```

### REST API Test:

```bash
# 1. Login als Editor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@prasco.net","password":"editor123"}'

# 2. Extract token from response

# 3. Create Post (should work - editor has posts.create)
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test","contentType":"text"}'
# Expected: 201 Created ✅

# 4. Login als Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prasco.net","password":"admin123"}'

# 5. Try to Create Post (should fail - admin has NO posts.create)
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test","contentType":"text"}'
# Expected: 403 Forbidden ❌
```

---

## 📊 Permission Statistics

```
Total Permissions: 33
├─ Posts: 5
├─ Categories: 5
├─ Users: 5
├─ Organizations: 5
├─ Media: 4
├─ Displays: 5
├─ System: 2
└─ Permissions/Roles: 2

Role Distribution:
├─ super_admin: 33/33 (100%)
├─ admin: 9/33 (27%)
├─ editor: 10/33 (30%)
├─ viewer: 4/33 (12%)
└─ display: 3/33 (9%)
```

---

## 🎓 Best Practices

### ✅ DO:

- Use `requirePermission()` middleware in routes
- Check permissions at route-level, not in controllers
- Use descriptive permission names (`posts.create` not `create_post`)
- Grant least privilege by default
- Use user-overrides sparingly (temporary access only)
- Document new permissions when adding resources

### ❌ DON'T:

- Don't check permissions in controllers (use middleware)
- Don't hardcode role names in business logic
- Don't give editor/viewer `users.manage` (security risk!)
- Don't grant `system.*` permissions to non-super_admin
- Don't bypass permission checks with `authorize()` anymore

---

## 🔮 Future Enhancements

### Phase 2:

- [ ] Permission groups (e.g., `content_manager` = posts._ + categories._)
- [ ] Time-based permissions (expire after 7 days)
- [ ] Permission inheritance (child roles inherit parent permissions)
- [ ] Audit log for permission changes
- [ ] Admin UI for permission management

### Phase 3:

- [ ] Resource-level permissions (e.g., `posts.update.own` vs `posts.update.any`)
- [ ] Organization-scoped permissions (edit posts in own org only)
- [ ] API rate limits per role
- [ ] Permission templates for common role combinations

---

## 📞 Support

Bei Fragen zum Permission-System:

- Siehe `TASK-5-SUMMARY.md` für Implementation-Details
- Siehe `api-tests.http` für Test-Beispiele
- Check Database: `SELECT * FROM permissions;`
- Check Role Mapping: `SELECT * FROM role_permissions WHERE role = 'editor';`

**Version:** 1.0.0  
**Last Updated:** November 23, 2025  
**Status:** ✅ Production Ready
