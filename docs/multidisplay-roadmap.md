# Multi-Display Support Roadmap

## Übersicht
Implementierung von Multi-Display-Funktionalität, um verschiedene Inhalte auf unabhängigen Displays anzuzeigen.

## Ziel
- Mehrere physische Displays können unterschiedliche Inhalte anzeigen
- Posts können gezielt einem oder mehreren Displays zugewiesen werden
- Einfache Verwaltung über Admin-Panel
- Abwärtskompatibilität zu bestehenden Single-Display Setups

---

## Phase 1: Backend Foundation ⏳
**Status:** In Arbeit  
**Dauer:** 2-3 Tage

### 1.1 Database Schema ✅
- [ ] Migration: `displays` Tabelle erstellen
  - id, name, identifier, description, isActive, organizationId
- [ ] Migration: `post_displays` Junction Table (Many-to-Many)
  - postId, displayId, priorityOverride
- [ ] Migration: Posts Tabelle erweitern
  - displayMode ENUM('all', 'specific')

### 1.2 Sequelize Models ✅
- [ ] Display Model erstellen (`src/models/Display.ts`)
- [ ] PostDisplay Junction Model
- [ ] Model Relations definieren (belongsToMany)
- [ ] Model-Index aktualisieren

### 1.3 Display Controller ✅
- [ ] `src/controllers/displayController.ts` erstellen
- [ ] GET /api/displays - Liste aller Displays
- [ ] POST /api/displays - Neues Display erstellen
- [ ] GET /api/displays/:id - Display Details
- [ ] PUT /api/displays/:id - Display aktualisieren
- [ ] DELETE /api/displays/:id - Display löschen
- [ ] GET /api/displays/:id/posts - Posts für Display

### 1.4 Post Controller erweitern ✅
- [ ] createPost: displayIds Array akzeptieren
- [ ] updatePost: Display-Zuweisungen aktualisieren
- [ ] getAllPosts: Query Parameter ?displayId=X
- [ ] Öffentlicher Endpoint: GET /api/public/display/:identifier/posts

### 1.5 Routes & Middleware ✅
- [ ] Display Routes registrieren
- [ ] Permissions: Alle Rollen dürfen Displays lesen
- [ ] Permissions: Nur Admin/Superadmin dürfen erstellen/löschen
- [ ] Validation Middleware für Display-Daten

---

## Phase 2: Admin Interface 📋
**Status:** Ausstehend  
**Dauer:** 2-3 Tage

### 2.1 Display Management UI
- [ ] Neue Sektion in dashboard.html
- [ ] Display-Liste mit Karten-Layout
- [ ] "Neues Display" Button mit Modal
- [ ] Display bearbeiten/löschen Funktionen
- [ ] Display aktiv/inaktiv Toggle

### 2.2 Display-Formular
- [ ] Name (erforderlich)
- [ ] Identifier (auto-generiert, editierbar)
- [ ] Beschreibung (optional)
- [ ] Aktiv-Status
- [ ] Validierung & Fehlerbehandlung

### 2.3 Post-Formular erweitern
- [ ] Radio-Buttons: "Alle Displays" / "Bestimmte Displays"
- [ ] Checkbox-Liste aller verfügbaren Displays
- [ ] Show/Hide Logic für Display-Auswahl
- [ ] Display-Zuweisungen beim Speichern übertragen
- [ ] Display-Tags in Post-Liste anzeigen

### 2.4 Admin.js Funktionen
- [ ] loadDisplays() - Displays laden
- [ ] showDisplayForm() - Display-Formular öffnen
- [ ] saveDisplay() - Display speichern
- [ ] deleteDisplay() - Display löschen
- [ ] updatePostDisplays() - Zuweisungen aktualisieren

---

## Phase 3: Display-Seite 🖥️
**Status:** Ausstehend  
**Dauer:** 1-2 Tage

### 3.1 Display-Identifikation
- [ ] URL-Parameter: ?id=display-1 auslesen
- [ ] Alternative: /public/display/:identifier Route
- [ ] LocalStorage für Display-ID nutzen
- [ ] Fallback auf "default" Display

### 3.2 Display-Auswahl Interface
- [ ] Overlay bei fehlender Display-ID
- [ ] Liste aller verfügbaren Displays
- [ ] Display auswählen und ID speichern
- [ ] Admin-Link zur Display-Verwaltung

### 3.3 Display.js Änderungen
- [ ] getDisplayIdFromURL() Funktion
- [ ] loadPostsForDisplay(displayId) Funktion
- [ ] API-Call zu /api/public/display/:id/posts
- [ ] Fehlerbehandlung bei ungültiger Display-ID
- [ ] Display-Name im Footer anzeigen

### 3.4 Filtern & Anzeigen
- [ ] Nur Posts für aktuelles Display laden
- [ ] Posts mit displayMode='all' immer anzeigen
- [ ] Priorität-Logik beibehalten
- [ ] Cache-Keys display-spezifisch

---

## Phase 4: Raspberry Pi Integration 🍓
**Status:** Ausstehend  
**Dauer:** 1 Tag

### 4.1 Konfigurationssystem
- [ ] /etc/prasco/display-config.json erstellen
- [ ] Config-Schema: displayId, displayName, autoStart
- [ ] Setup-Script für initiale Konfiguration
- [ ] Config-Validation beim Start

### 4.2 Start-Script Update
- [ ] start-kiosk.sh: Config-Datei lesen
- [ ] Display-ID an URL anhängen
- [ ] Fallback bei fehlender Config
- [ ] Error-Handling & Logging

### 4.3 Settings-Panel Integration
- [ ] Display-Auswahl in System-Settings
- [ ] Dropdown mit allen Displays
- [ ] Config-Datei beim Speichern aktualisieren
- [ ] "Display neu starten" Button

### 4.4 Hardware-Tests
- [ ] Test mit 2 Raspberry Pis
- [ ] Verschiedene Posts auf jedem Display
- [ ] Netzwerk-Failover testen
- [ ] Performance-Monitoring

---

## Phase 5: Testing & Polish ✨
**Status:** Ausstehend  
**Dauer:** 2 Tage

### 5.1 Unit Tests
- [ ] Display Model Tests
- [ ] Display Controller Tests
- [ ] Post-Display Relations Tests
- [ ] Query-Filter Tests

### 5.2 Integration Tests
- [ ] Post erstellen mit Display-Zuweisung
- [ ] Post auf mehreren Displays
- [ ] Display löschen (Post-Verknüpfungen)
- [ ] API-Filter nach Display-ID

### 5.3 E2E Tests
- [ ] Zwei virtuelle Displays simulieren
- [ ] Posts verschiedenen Displays zuweisen
- [ ] Display-Seite mit verschiedenen IDs öffnen
- [ ] Überprüfen der korrekten Filterung

### 5.4 Datenmigration
- [ ] Script für bestehende Posts
- [ ] Default Display erstellen
- [ ] Alle Posts auf displayMode='all' setzen
- [ ] Migration-Rollback testen

### 5.5 Dokumentation
- [ ] Admin-Handbuch: Display-Verwaltung
- [ ] Setup-Guide: Neues Display einrichten
- [ ] API-Dokumentation aktualisieren
- [ ] Troubleshooting-Guide

---

## Phase 6: Optional Features 🚀
**Status:** Backlog  
**Dauer:** Variable

### 6.1 Display-Gruppen
- [ ] Display-Gruppen Tabelle
- [ ] Posts zu Gruppen zuweisen
- [ ] Gruppe = mehrere Displays

### 6.2 Display-Monitoring
- [ ] Heartbeat-System
- [ ] Online/Offline Status
- [ ] Last-Seen Timestamp
- [ ] Admin-Dashboard mit Status-Übersicht

### 6.3 Remote-Steuerung
- [ ] WebSocket-Integration
- [ ] Display neustarten (Remote)
- [ ] Content Refresh auslösen
- [ ] Screenshot-Funktion

### 6.4 Statistiken
- [ ] Post Views pro Display
- [ ] Display Uptime
- [ ] Content-Rotation Analytics
- [ ] Performance-Metrics

### 6.5 Advanced Features
- [ ] Display-spezifische Prioritäten
- [ ] Zeit-basierte Display-Zuweisungen
- [ ] Playlist-Modus pro Display
- [ ] QR-Code für Display-Setup

---

## Technische Entscheidungen

### Datenbankdesign
**Gewählt:** Junction Table (post_displays)  
**Begründung:** 
- Flexible Many-to-Many Beziehung
- Ermöglicht Display-spezifische Overrides
- Einfache Abfragen mit JOIN
- Skalierbar für zusätzliche Metadaten

### Display-Identifier
**Format:** `display-{number}` oder custom string  
**Constraints:** 
- Unique
- URL-safe (keine Leerzeichen)
- Alphanumerisch + Bindestrich

### Backwards Compatibility
**Strategie:**
- displayMode='all' als Default
- Bestehende Posts zeigen auf allen Displays
- Leerer Display-Filter = alle Posts
- Display-Seite ohne ID = "default" Display

### Permission-Strategie
- **Lesen:** Alle angemeldeten Benutzer
- **Erstellen/Bearbeiten:** Admin, Superadmin
- **Löschen:** Nur Superadmin
- **Öffentlicher API-Zugriff:** Nur /public/display/:id/posts

---

## Risiken & Mitigation

### Risiko 1: Performance mit vielen Displays
**Mitigation:** 
- Caching pro Display
- Effiziente DB-Queries mit Eager Loading
- Index auf post_displays(displayId)

### Risiko 2: Display-ID Verwechslung
**Mitigation:**
- Klare Namensgebung erzwingen
- Visual Identifier im Admin-Panel
- Setup-Modus beim ersten Start

### Risiko 3: Orphaned Posts
**Mitigation:**
- displayMode='all' als Fallback
- Cascade Delete mit Warnung
- Migration-Script für Datenbereinigung

### Risiko 4: Netzwerk-Split
**Mitigation:**
- Lokale Config-Datei als Source of Truth
- Display-ID im LocalStorage cachen
- Offline-Fallback auf letzte Posts

---

## Success Metrics

- ✅ Zwei Displays zeigen unterschiedliche Inhalte
- ✅ Posts können gezielt zugewiesen werden
- ✅ Admin kann Displays einfach verwalten
- ✅ Keine Regression bei Single-Display Setup
- ✅ Setup neuer Displays < 5 Minuten
- ✅ API Response Time < 200ms mit Display-Filter
- ✅ Zero Downtime bei Display-Wechsel

---

## Timeline

| Phase | Start | Ende | Status |
|-------|-------|------|--------|
| Phase 1: Backend | Tag 1 | Tag 3 | ⏳ In Arbeit |
| Phase 2: Admin UI | Tag 4 | Tag 6 | 📋 Ausstehend |
| Phase 3: Display-Seite | Tag 7 | Tag 8 | 🖥️ Ausstehend |
| Phase 4: Pi Integration | Tag 9 | Tag 9 | 🍓 Ausstehend |
| Phase 5: Testing | Tag 10 | Tag 11 | ✨ Ausstehend |
| Phase 6: Optional | Tag 12+ | - | 🚀 Backlog |

**Geschätzter Gesamtaufwand:** 11 Arbeitstage  
**Start:** 2026-02-08  
**Geplantes Ende:** 2026-02-22

---

## Nächste Schritte

1. ✅ Roadmap finalisieren
2. ⏳ Migration für `displays` Tabelle erstellen
3. ⏳ Migration für `post_displays` Tabelle erstellen
4. ⏳ Display Model implementieren
5. ⏳ Display Controller implementieren

---

**Letzte Aktualisierung:** 2026-02-08  
**Version:** 1.0  
**Autor:** Development Team
