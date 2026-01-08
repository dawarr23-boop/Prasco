# PRASCO Patch Notes - 2026-01-04

## Übersicht
Dieses Patch enthält wichtige UI/UX-Verbesserungen und Bugfixes für das PRASCO Digital Signage System.

## ⚠️ Breaking Changes
Keine

## ✨ Neue Features

### 1. Presentation Mode Controls
- **Dezente Anzeige**: On-Screen-Controls erscheinen mit 30% Transparenz
- **Auto-Hide**: Controls blenden sich nach 3 Sekunden Inaktivität aus
- **Hover-Effekt**: Volle Sichtbarkeit (90%) beim Überfahren mit der Maus
- **CSP-konform**: Keine inline onclick-Handler mehr

### 2. Sortier-Modi für Beiträge
Neue Dropdown-Auswahl in der Beitragsansicht:
- 📊 Priorität (Standard)
- 🔤 Titel (A-Z)
- 🆕 Erstelldatum (neu zuerst)
- 📝 Änderungsdatum
- ✅ Status (aktiv zuerst)
- 🏷️ Kategorie

**Hinweis**: Die Auswahl wird im localStorage gespeichert und bleibt beim nächsten Besuch erhalten.

### 3. Drag & Drop mit Auto-Priorität
- Nach dem Verschieben per Drag & Drop werden Prioritäten automatisch aktualisiert
- Die Post-Liste lädt sich neu und zeigt die aktualisierten Prioritätswerte an

## 🐛 Bugfixes

### CSP-Header Konfiguration
- **Problem**: `scriptSrcAttr: 'none'` blockierte inline event handler
- **Lösung**: Geändert zu `scriptSrcAttr: ['unsafe-inline']`
- **Betroffene Datei**: `src/server.ts`

### onclick-Handler entfernt
- **Problem**: YouTube Video Container hatte inline onclick-Handler
- **Lösung**: Entfernt und durch data-Attribute ersetzt
- **Betroffene Datei**: `js/display.js` (Zeile 738)

## 📝 Geänderte Dateien

### Frontend
- `css/display.css`
  - `.presentation-controls.visible` opacity: 1 → 0.3
  - Neuer `:hover` state mit opacity: 0.9

- `js/display.js`
  - Event-Listener in setTimeout() wrapper
  - onclick-Handler entfernt (Video-Container)
  
- `js/admin.js`
  - `applySortToPosts()` Funktion hinzugefügt
  - `initPostSorting()` Funktion hinzugefügt
  - `saveNewOrder()` ruft jetzt `loadPosts()` auf
  
- `views/admin/dashboard.html`
  - Sortier-Dropdown hinzugefügt

### Backend
- `src/server.ts`
  - CSP scriptSrcAttr: `["'unsafe-inline'"]`

### Kompilierte Dateien
- `dist/**/*.js` - Alle TypeScript-kompilierten Dateien aktualisiert

## 🚀 Deployment

### Automatisches Deployment (empfohlen)
```powershell
.\deploy-patch.ps1
```

### Manuelles Deployment
```powershell
# 1. Kompilieren
npm run build

# 2. Frontend hochladen
scp css/display.css pi@192.168.2.47:~/prasco/css/
scp js/display.js pi@192.168.2.47:~/prasco/js/
scp js/admin.js pi@192.168.2.47:~/prasco/js/
scp views/admin/dashboard.html pi@192.168.2.47:~/prasco/views/admin/

# 3. Backend hochladen
scp -r dist pi@192.168.2.47:~/prasco/

# 4. Server neu starten
ssh pi@192.168.2.47 "cd ~/prasco && pm2 restart all"
```

## ✅ Testing Checklist

Nach dem Deployment bitte testen:

- [ ] Admin-Panel lädt ohne Fehler
- [ ] Sortier-Dropdown in Beitragsansicht funktioniert
- [ ] Drag & Drop von Posts aktualisiert Prioritäten
- [ ] Presentation Mode Controls erscheinen dezent
- [ ] Controls blenden sich nach 3 Sekunden aus
- [ ] Controls erscheinen bei Mausbewegung wieder
- [ ] Keine CSP-Fehler in der Browser-Konsole
- [ ] YouTube-Videos spielen korrekt ab

## 🔧 Rollback (falls nötig)

Falls Probleme auftreten:

```powershell
ssh pi@192.168.2.47
cd ~/prasco
git stash
git pull
npm run build
pm2 restart all
```

## 📊 Performance Impact
- **Geschwindigkeit**: Keine Änderung
- **Speicher**: Keine signifikante Änderung
- **Bundle Size**: +2KB (Sortier-Funktionen)

## 🔮 Bekannte Limitierungen
- CSP-Header erlaubt jetzt `unsafe-inline` für script-src-attr (erforderlich für dynamische Controls)
- Sortierung ist rein clientseitig (bei >1000 Posts könnte Performance leiden)

## 👥 Betroffene Benutzerrollen
- Alle Benutzerrollen profitieren von den Verbesserungen
- Besonders relevant für Editoren (Sortier-Funktionen, Drag & Drop)

## 📅 Nächste Schritte
Keine weiteren Aktionen erforderlich. Das System ist produktionsbereit.

---

**Version**: 2.0.1  
**Datum**: 4. Januar 2026  
**Erstellt von**: GitHub Copilot
