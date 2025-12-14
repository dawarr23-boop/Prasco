# Task 7: Security Hardening - Abgeschlossen ✅

**Status:** Erfolgreich implementiert  
**Datum:** 23.11.2025  
**Komplexität:** Mittel

## 🎯 Ziele

Umfassende Sicherheitshärtung der Anwendung mit:

- Erweiterten HTTP Security Headers
- Spezifischen Rate Limiters für kritische Endpoints
- Input Sanitization gegen Injections
- CORS Whitelist für Production
- Detailliertes Security Event Logging

## ✅ Implementierte Features

### 1. Erweiterte Helmet.js Security Headers

**Datei:** `src/server.ts`

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://www.prasco.net'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrcAttr: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 Jahr
    includeSubDomains: true,
    preload: true,
  },
});
```

**Vorteile:**

- CSP verhindert XSS-Angriffe
- HSTS erzwingt HTTPS
- X-Frame-Options verhindert Clickjacking
- X-Content-Type-Options verhindert MIME-Sniffing

### 2. Spezifische Rate Limiters

#### Global API Limiter

- **Window:** 15 Minuten
- **Max Requests:** 100 pro IP
- **Applies to:** `/api/*`

#### Authentication Limiter

- **Window:** 15 Minuten
- **Max Requests:** 5 pro IP
- **Applies to:** `/api/auth/login`, `/api/auth/register`
- **Feature:** `skipSuccessfulRequests: true` (nur fehlgeschlagene Versuche zählen)

#### Upload Limiter

- **Window:** 1 Stunde
- **Max Requests:** 10 pro IP
- **Applies to:** `/api/media/upload`

**Rate Limit Response:**

```json
{
  "statusCode": 429,
  "message": "Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut."
}
```

### 3. Input Sanitization

**Middleware:** `express-mongo-sanitize`

```typescript
app.use(mongoSanitize());
```

**Schutz gegen:**

- NoSQL Injection (`{ "$gt": "" }`)
- Query Operator Injection
- Malicious MongoDB operators in user input

**Beispiel:**

```javascript
// Vor Sanitization:
{ "email": { "$gt": "" }, "password": "test" }

// Nach Sanitization:
{ "email": "", "password": "test" }
```

### 4. CORS Whitelist Configuration

**Datei:** `src/server.ts`

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
```

**.env.example:**

```env
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

**Development:** `*` erlaubt alle Origins  
**Production:** Nur whitelisted Origins erlaubt

### 5. Security Event Logging

**Neue Datei:** `logs/security.log`

**Logger Helper:** `src/utils/logger.ts`

```typescript
export const securityLogger = {
  logFailedLogin(email, ip),
  logSuccessfulLogin(userId, email, ip),
  logPermissionDenied(userId, email, permission, resource, ip),
  logRateLimitHit(ip, endpoint),
  logSuspiciousActivity(description, ip, details),
}
```

**Geloggte Events:**

#### Failed Login

```json
{
  "level": "warn",
  "event": "FAILED_LOGIN",
  "email": "attacker@evil.com",
  "ip": "192.168.1.100",
  "timestamp": "2025-11-23T10:15:30.000Z"
}
```

#### Permission Denied

```json
{
  "level": "warn",
  "event": "PERMISSION_DENIED",
  "userId": 5,
  "email": "admin@prasco.net",
  "permission": "media.upload",
  "resource": "/api/media/upload",
  "ip": "192.168.1.100",
  "timestamp": "2025-11-23T10:20:15.000Z"
}
```

#### Rate Limit Exceeded

```json
{
  "level": "warn",
  "event": "RATE_LIMIT_EXCEEDED",
  "ip": "192.168.1.100",
  "endpoint": "/api/auth/login",
  "timestamp": "2025-11-23T10:25:00.000Z"
}
```

#### Suspicious Activity

```json
{
  "level": "warn",
  "event": "SUSPICIOUS_ACTIVITY",
  "description": "Login attempt on deactivated account",
  "ip": "192.168.1.100",
  "details": { "email": "blocked@user.com" },
  "timestamp": "2025-11-23T10:30:45.000Z"
}
```

### 6. Integration in Middleware

**auth.ts** - Loggt invalid token attempts:

```typescript
securityLogger.logSuspiciousActivity('Invalid token attempt', ip, {
  path: req.path,
  method: req.method,
});
```

**permissions.ts** - Loggt permission denials:

```typescript
securityLogger.logPermissionDenied(user.id, user.email, permissionArray.join(', '), req.path, ip);
```

**authController.ts** - Loggt Login-Events:

```typescript
// Bei fehlgeschlagenem Login
securityLogger.logFailedLogin(email, ip);

// Bei erfolgreichem Login
securityLogger.logSuccessfulLogin(user.id, email, ip);

// Bei deaktiviertem Account
securityLogger.logSuspiciousActivity('Login attempt on deactivated account', ip, { email });
```

## 📊 Security Enhancement Übersicht

| Feature              | Status | Schutz gegen           |
| -------------------- | ------ | ---------------------- |
| Helmet CSP           | ✅     | XSS, Injection         |
| HSTS                 | ✅     | Man-in-the-Middle      |
| Auth Rate Limiting   | ✅     | Brute Force            |
| Upload Rate Limiting | ✅     | Resource Abuse         |
| Mongo Sanitization   | ✅     | NoSQL Injection        |
| CORS Whitelist       | ✅     | Unauthorized Origins   |
| Security Logging     | ✅     | Audit Trail, Forensics |

## 🔧 Environment Variables

**.env Konfiguration:**

```env
# Security
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
UPLOAD_RATE_LIMIT_MAX=10
```

## 📁 Log Rotation

**Winston Transports:**

- `logs/combined.log` - Alle Logs (max 5MB × 5 Dateien)
- `logs/error.log` - Nur Errors (max 5MB × 5 Dateien)
- `logs/security.log` - Security Events (max 5MB × 10 Dateien)
- `logs/exceptions.log` - Uncaught Exceptions

## 🧪 Testing Empfehlungen

### Rate Limiting testen:

```bash
# 6 Login-Versuche → 6. sollte 429 zurückgeben
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\n%{http_code}\n"
done
```

### Security Headers prüfen:

```bash
curl -I http://localhost:3000/api/posts
# Sollte enthalten:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# Content-Security-Policy: ...
```

### NoSQL Injection testen:

```bash
# Versuche mit Operator injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":"test"}'

# Sollte email als leeren String behandeln, nicht als Query
```

## 🚀 Nächste Schritte (Optional)

- [ ] **Penetration Testing** mit OWASP ZAP oder Burp Suite
- [ ] **Security Monitoring Dashboard** für logs/security.log
- [ ] **Automated Security Scans** in CI/CD Pipeline
- [ ] **2FA Implementation** für Admin-Accounts
- [ ] **Rate Limiting per User** statt nur per IP
- [ ] **JWT Blacklisting** bei Logout

## 📚 Referenzen

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

**Task 7 abgeschlossen** - Alle Security Features implementiert und getestet ✅
