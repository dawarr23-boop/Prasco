# Document Import Feature

## Übersicht

Das Digital Bulletin Board unterstützt jetzt den Import von Word- und PDF-Dokumenten zur automatischen Konvertierung in Posts.

## Unterstützte Formate

- **Word**: `.docx` (Office Open XML)
- **PDF**: `.pdf` (Portable Document Format)

## Technische Details

### Backend-Komponenten

1. **Document Service** (`src/services/documentService.ts`)
   - Word-Parsing mit `mammoth` (→ HTML)
   - PDF-Parsing mit `pdf-parse` (→ formatierter Text)
   - Validierung: max. 10MB, nur .docx/.pdf
   - Automatische Titel-Extraktion

2. **Document Controller** (`src/controllers/documentController.ts`)
   - `POST /api/documents/parse` - Dokument hochladen und parsen
   - `GET /api/documents/formats` - Unterstützte Formate abrufen

3. **Document Routes** (`src/routes/documents.ts`)
   - Multer File-Upload Konfiguration
   - Temporäre Speicherung in `./uploads/temp`
   - UUID-basierte Dateinamen
   - Rate-Limiting: 10 Uploads pro 15 Minuten

### Frontend-Integration

**Admin-Panel** (`js/admin.js` + `views/admin/dashboard.html`)
- Button "📄 Word/PDF importieren" im Post-Formular
- Automatisches Ausfüllen von:
  - Post-Titel (aus Dokumenttitel)
  - Post-Inhalt (konvertierter Text/HTML)
  - Content-Type (html/text)
- Upload-Progress-Feedback
- Fehlerbehandlung

## Verwendung

### Im Admin-Panel

1. Klicke auf "**+ Neuer Beitrag**"
2. Klicke auf "**📄 Word/PDF importieren**"
3. Wähle eine `.docx` oder `.pdf` Datei (max. 10MB)
4. Das Formular wird automatisch gefüllt:
   - **Titel**: Aus Dokument extrahiert
   - **Inhalt**: Konvertierter Text/HTML
   - **Typ**: `html` (Word) oder `text` (PDF)
5. Optional: Passe Titel/Inhalt an
6. Klicke "**Beitrag speichern**"

### API-Nutzung

```bash
# Dokument importieren
curl -X POST https://10.0.162.110:3000/api/documents/parse \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@test.docx"

# Response
{
  "success": true,
  "data": {
    "title": "Dokumenttitel",
    "content": "<p>Konvertierter HTML-Inhalt...</p>",
    "contentType": "html",
    "metadata": {
      "originalFilename": "test.docx",
      "fileSize": 12345,
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "wordCount": 250,
      "pageCount": null
    }
  }
}
```

## Konvertierungsdetails

### Word (.docx) → HTML
- **Bibliothek**: `mammoth`
- **Output**: Sauberes HTML mit Formatierung
- **Unterstützt**: 
  - Überschriften (h1-h6)
  - Absätze mit Formatierung (fett, kursiv, unterstrichen)
  - Listen (geordnet/ungeordnet)
  - Tabellen
  - Bilder (werden als base64 eingebettet)
- **Nicht unterstützt**: Komplexe Layouts, Makros, eingebettete Objekte

### PDF → Text
- **Bibliothek**: `pdf-parse`
- **Output**: Formatierter Plain Text
- **Unterstützt**:
  - Text-Extraktion mit Zeilenumbrüchen
  - Seitenanzahl
  - Wortanzahl
- **Limitierungen**:
  - Keine Formatierung (kein HTML)
  - Bilder werden nicht extrahiert
  - Gescannte PDFs (nur Bilder) liefern keinen Text
  - Layout kann verloren gehen

## Sicherheit

- **Authentifizierung**: JWT-Token erforderlich
- **Permissions**: `posts.create` erforderlich
- **Rate-Limiting**: 10 Uploads pro 15 Minuten pro IP
- **File-Validierung**:
  - Nur `.docx` und `.pdf` erlaubt
  - Maximale Dateigröße: 10MB
  - MIME-Type Prüfung
- **Temporäre Dateien**: Werden nach Parsing automatisch gelöscht

## Dependencies

```json
{
  "mammoth": "^1.7.2",
  "pdf-parse": "^1.1.1",
  "uuid": "^10.0.0",
  "@types/uuid": "^10.0.0"
}
```

## Testing

### Test-Dokument erstellen (Word)
```bash
# Erstelle test.docx mit Inhalt
# Hochladen im Admin-Panel oder via API
```

### Test-Dokument erstellen (PDF)
```bash
# Erstelle test.pdf mit Text-Inhalt
# NICHT: Gescannte Seiten (nur Bilder)
```

## Troubleshooting

### Fehler: "Nur Word (.docx) und PDF Dokumente sind erlaubt"
- **Ursache**: Falsche Dateierweiterung
- **Lösung**: Verwende nur `.docx` (nicht `.doc`) und `.pdf`

### Fehler: "Datei zu groß (max. 10MB)"
- **Ursache**: Datei größer als 10MB
- **Lösung**: Komprimiere Dokument oder teile in mehrere Posts auf

### Fehler: "Import fehlgeschlagen"
- **Ursache**: Korruptes Dokument oder Parsing-Fehler
- **Lösung**: 
  - Prüfe Dokument in Word/PDF-Reader
  - Exportiere neu aus Originalanwendung
  - Prüfe PM2-Logs: `pm2 logs prasco`

### PDF liefert keinen Text
- **Ursache**: Gescannte PDF (nur Bilder, kein Text-Layer)
- **Lösung**: Verwende OCR-Software vorher oder erstelle PDF aus Text-Quelle

## Roadmap

Zukünftige Erweiterungen:
- [ ] PowerPoint (.pptx) Import
- [ ] Excel (.xlsx) Import → Tabellen-Posts
- [ ] Batch-Import (mehrere Dateien)
- [ ] OCR für gescannte PDFs
- [ ] Erweiterte HTML-Formatierung für PDFs
- [ ] Bildextraktion aus Word-Dokumenten in separate Medien-Files
- [ ] Vorschau vor Import
- [ ] Import-Historie/Protokoll

## Implementierungs-Status

✅ Backend Document Service (Word/PDF Parsing)  
✅ Backend Document Controller (Upload/Parse Endpoint)  
✅ Backend Document Routes (Multer Upload + Rate Limiting)  
✅ Frontend Import-Button im Post-Formular  
✅ Frontend Upload-Handler mit Fortschritt  
✅ Server-Integration (Route Registration)  
✅ Dependencies installiert auf Raspberry Pi  
✅ Upload-Verzeichnis erstellt (`./uploads/temp`)  
✅ Dokumentation erstellt  

## Deployment (Raspberry Pi)

```bash
# 1. Dependencies installieren
cd /home/pi/Prasco
npm install mammoth pdf-parse uuid

# 2. TypeScript kompilieren
npm run build

# 3. PM2 neu starten
pm2 restart prasco --update-env

# 4. Upload-Verzeichnis erstellen
mkdir -p uploads/temp

# 5. Testen
# Login im Admin-Panel → Neuer Beitrag → Word/PDF importieren
```

**Status**: ✅ Komplett implementiert und auf Raspberry Pi deployed (02.01.2026)
