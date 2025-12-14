# SSO Konfiguration - Azure AD / Microsoft Entra ID

Diese Anleitung beschreibt, wie Sie Single Sign-On (SSO) mit Azure Active Directory (jetzt Microsoft Entra ID) für das PRASCO Digital Bulletin Board einrichten.

## Übersicht

Das SSO ermöglicht Ihren Mitarbeitern, sich mit ihren Microsoft-Unternehmenskonten anzumelden, ohne separate Zugangsdaten zu benötigen.

### Vorteile

- ✅ **Zentrale Benutzerverwaltung** - Alle Benutzer werden über Azure AD verwaltet
- ✅ **Erhöhte Sicherheit** - Multi-Faktor-Authentifizierung (MFA) möglich
- ✅ **Automatische Benutzeranlage** - Neue Mitarbeiter können sich sofort anmelden
- ✅ **Single Sign-On** - Keine zusätzlichen Passwörter merken
- ✅ **Conditional Access** - Unternehmensrichtlinien durchsetzen

---

## Voraussetzungen

- Azure AD Tenant (Microsoft 365 Business oder Enterprise)
- Administratorrechte im Azure Portal
- Öffentlich erreichbare Callback-URL (für Produktion)

---

## Schritt 1: App Registration in Azure erstellen

### 1.1 Azure Portal öffnen

1. Gehe zu [https://portal.azure.com](https://portal.azure.com)
2. Melde dich mit einem Azure AD Administrator-Konto an
3. Suche nach **"App registrations"** (oder "App-Registrierungen")

### 1.2 Neue App registrieren

1. Klicke auf **"+ New registration"** (Neue Registrierung)
2. Fülle die Felder aus:
   - **Name**: `PRASCO Digital Bulletin Board`
   - **Supported account types**: `Accounts in this organizational directory only` (Nur Konten in diesem Organisationsverzeichnis)
   - **Redirect URI**:
     - Platform: `Web`
     - URL: `https://ihr-server.de/api/auth/sso/callback` (Entwicklung: `http://localhost:3000/api/auth/sso/callback`)
3. Klicke auf **"Register"**

### 1.3 Wichtige Werte notieren

Nach der Registrierung siehst du die Übersichtsseite. Notiere diese Werte:

| Feld                    | Umgebungsvariable    |
| ----------------------- | -------------------- |
| Application (client) ID | `AZURE_AD_CLIENT_ID` |
| Directory (tenant) ID   | `AZURE_AD_TENANT_ID` |

---

## Schritt 2: Client Secret erstellen

1. Gehe zu **"Certificates & secrets"** (Zertifikate & Geheimnisse)
2. Unter "Client secrets" klicke auf **"+ New client secret"**
3. Fülle aus:
   - **Description**: `PRASCO SSO Secret`
   - **Expires**: Wähle einen passenden Zeitraum (empfohlen: 24 Monate)
4. Klicke auf **"Add"**
5. **WICHTIG**: Kopiere den **Value** (Wert) sofort! Er wird nur einmal angezeigt.
   - Speichere als `AZURE_AD_CLIENT_SECRET`

---

## Schritt 3: API Permissions konfigurieren

1. Gehe zu **"API permissions"**
2. Klicke auf **"+ Add a permission"**
3. Wähle **"Microsoft Graph"**
4. Wähle **"Delegated permissions"**
5. Suche und aktiviere:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
6. Klicke auf **"Add permissions"**
7. Klicke auf **"Grant admin consent for [Ihr Tenant]"**

---

## Schritt 4: Umgebungsvariablen konfigurieren

Aktualisiere die `.env` Datei mit den Azure AD Werten:

```env
# SSO aktivieren
SSO_ENABLED=true
SSO_PROVIDER=azure_ad

# Automatisch neue Benutzer erstellen
SSO_AUTO_CREATE_USERS=true

# Standard-Rolle für neue SSO-Benutzer
SSO_DEFAULT_ROLE=editor

# Erlaubte E-Mail-Domains (optional, kommagetrennt)
SSO_ALLOWED_DOMAINS=prasco.net,prasco.de

# Azure AD Konfiguration
AZURE_AD_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_AD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_AD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redirect URIs
AZURE_AD_REDIRECT_URI=https://ihr-server.de/api/auth/sso/callback
AZURE_AD_POST_LOGOUT_URI=https://ihr-server.de/admin
```

---

## Schritt 5: Server neu starten

```bash
# TypeScript kompilieren
npm run build

# Server starten
npm start
```

---

## SSO testen

1. Öffne die Admin-Seite: `https://ihr-server.de/admin`
2. Du solltest jetzt einen **"Mit Microsoft anmelden"** Button sehen
3. Klicke darauf und melde dich mit deinem Microsoft-Konto an
4. Nach erfolgreicher Anmeldung wirst du zum Dashboard weitergeleitet

---

## Konfigurationsoptionen

### Automatische Benutzeranlage

```env
# Aktiviert: Neue Benutzer werden automatisch erstellt
SSO_AUTO_CREATE_USERS=true

# Deaktiviert: Nur vorhandene Benutzer können sich anmelden
SSO_AUTO_CREATE_USERS=false
```

### Domain-Einschränkung

```env
# Nur bestimmte Domains erlauben
SSO_ALLOWED_DOMAINS=prasco.net,prasco.de

# Alle Domains erlauben (leer lassen)
SSO_ALLOWED_DOMAINS=
```

### Standard-Rolle

```env
# Verfügbare Rollen: super_admin, admin, editor, viewer, display
SSO_DEFAULT_ROLE=editor
```

---

## Rollen-Mapping (optional erweitert)

Für fortgeschrittene Konfiguration können Azure AD Gruppen auf PRASCO-Rollen gemappt werden. Kontaktieren Sie den Support für diese Funktion.

---

## Fehlerbehebung

### "SSO ist nicht korrekt konfiguriert"

- Überprüfen Sie, ob alle `AZURE_AD_*` Umgebungsvariablen gesetzt sind
- Starten Sie den Server nach Änderungen neu

### "Ihre E-Mail-Domain ist nicht zugelassen"

- Fügen Sie die Domain zu `SSO_ALLOWED_DOMAINS` hinzu
- Oder entfernen Sie die Einschränkung (leerer Wert)

### "Kein Benutzerkonto gefunden"

- Aktivieren Sie `SSO_AUTO_CREATE_USERS=true`
- Oder erstellen Sie den Benutzer manuell mit derselben E-Mail-Adresse

### "AADSTS50011: The reply URL does not match"

- Die Redirect URI in Azure stimmt nicht mit `AZURE_AD_REDIRECT_URI` überein
- Korrigieren Sie die URL in der Azure App Registration

### "AADSTS700016: Application not found"

- Die Client ID ist falsch
- Überprüfen Sie `AZURE_AD_CLIENT_ID`

### "AADSTS7000215: Invalid client secret"

- Das Client Secret ist ungültig oder abgelaufen
- Erstellen Sie ein neues Secret in Azure

---

## Sicherheitsempfehlungen

1. **Regelmäßige Secret-Rotation**: Erneuern Sie das Client Secret alle 12-24 Monate
2. **Conditional Access**: Konfigurieren Sie in Azure AD Richtlinien für:
   - Multi-Faktor-Authentifizierung (MFA)
   - Gerätekonformität
   - IP-basierte Einschränkungen
3. **Audit Logs**: Aktivieren Sie Azure AD Sign-in Logs für Compliance
4. **Least Privilege**: Beschränken Sie Berechtigungen auf das Minimum

---

## API Endpoints

| Endpoint                     | Beschreibung                                |
| ---------------------------- | ------------------------------------------- |
| `GET /api/auth/sso/status`   | SSO-Status und Konfiguration prüfen         |
| `GET /api/auth/sso/login`    | SSO-Login initiieren (Redirect zu Azure AD) |
| `GET /api/auth/sso/callback` | Callback von Azure AD verarbeiten           |
| `GET /api/auth/sso/logout`   | SSO-Logout (Redirect zu Azure AD Logout)    |

---

## Support

Bei Fragen oder Problemen wenden Sie sich an:

- IT-Support: it@prasco.net
- Dokumentation: [README.md](./README.md)
