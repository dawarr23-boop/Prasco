# PRASCO Rich-Text-Editor - Implementierungsplan
## Erweiterte Post-Erstellung mit Word/LibreOffice-ähnlichen Funktionen

**Version:** 1.0  
**Datum:** 2. Januar 2026  
**Ziel:** Integration eines vollwertigen Rich-Text-Editors für professionelle Post-Erstellung

---

## 🎯 Projektziel

Implementierung eines WYSIWYG-Editors mit Word/LibreOffice-ähnlichen Funktionen zur Erstellung ansprechender, formatierter Posts direkt im PRASCO Admin-Panel.

### Hauptfunktionen
- ✅ Umfangreiche Textformatierung (Fett, Kursiv, Unterstrichen, Durchgestrichen)
- ✅ Überschriften (H1-H6) mit Formatvorlagen
- ✅ Listen (geordnet, ungeordnet, verschachtelt)
- ✅ Tabellen mit Zellenformatierung
- ✅ Bilder einfügen mit Positionierung
- ✅ Links und Anker
- ✅ Farben und Hintergründe
- ✅ Schriftarten und -größen
- ✅ Text-Ausrichtung (links, zentriert, rechts, Blocksatz)
- ✅ Import von Word/LibreOffice-Dokumenten (.docx, .odt)
- ✅ Export zu PDF
- ✅ Vorlagen-System

---

## 🛠 Technologie-Auswahl

### Option 1: TinyMCE (Empfohlen) ⭐
**Vorteile:**
- Vollständig ausgestatteter WYSIWYG-Editor
- Word-Import Plugin verfügbar
- Große Plugin-Ökosystem
- Gute Dokumentation
- Free/Open Source (GPL)

**Nachteile:**
- Größere Bundle-Size (~500KB)
- Lizenzierung für kommerzielle Plugins

**Lizenz:** GPL 2.0+ oder Commercial

### Option 2: CKEditor 5
**Vorteile:**
- Modernes Framework
- Sehr anpassbar
- Gute Performance
- Export/Import Plugins

**Nachteile:**
- GPL oder Commercial License erforderlich
- Weniger Plugins als TinyMCE

### Option 3: Quill.js
**Vorteile:**
- Leichtgewichtig (~50KB)
- Moderne API
- Gute Mobile-Unterstützung

**Nachteile:**
- Weniger Features out-of-the-box
- Kein nativer Word-Import

### Option 4: EditorJS
**Vorteile:**
- Block-basiert (moderne UX)
- Sehr erweiterbar
- JSON-Output (gut für API)

**Nachteile:**
- Weniger traditionell (nicht Word-ähnlich)
- Kein direkter Word-Import

### **Empfehlung: TinyMCE 6**
Beste Balance zwischen Features, Erweiterbarkeit und Word-Kompatibilität.

---

## 📋 Feature-Spezifikation

### Phase 1: Basis-Editor (Woche 1-2)

#### 1.1 TinyMCE Integration
```javascript
// Admin-Panel Integration
import tinymce from 'tinymce/tinymce';

// Plugins
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/help';
import 'tinymce/plugins/wordcount';

tinymce.init({
  selector: '#post-content-editor',
  height: 600,
  menubar: true,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount'
  ],
  toolbar: 'undo redo | formatselect | bold italic underline strikethrough | \
            alignleft aligncenter alignright alignjustify | \
            bullist numlist outdent indent | removeformat | help',
  content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
  language: 'de',
  branding: false
});
```

#### 1.2 Toolbar-Konfiguration (Word-ähnlich)
```javascript
// Erweiterte Toolbar
toolbar: [
  'undo redo | cut copy paste pastetext | print preview',
  'formatselect fontselect fontsizeselect',
  'bold italic underline strikethrough | forecolor backcolor',
  'alignleft aligncenter alignright alignjustify | outdent indent',
  'bullist numlist | link image media table | code fullscreen'
]
```

#### 1.3 Backend-Anpassungen
```typescript
// src/controllers/postController.ts

// Erweiterte Validierung für HTML-Content
import sanitizeHtml from 'sanitize-html';

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { content, contentType } = req.body;
    
    // HTML-Content bereinigen (XSS-Schutz)
    if (contentType === 'html') {
      content = sanitizeHtml(content, {
        allowedTags: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'u', 's',
          'ul', 'ol', 'li',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'a', 'img', 'div', 'span',
          'blockquote', 'pre', 'code'
        ],
        allowedAttributes: {
          'a': ['href', 'title', 'target'],
          'img': ['src', 'alt', 'width', 'height', 'style'],
          'div': ['class', 'style'],
          'span': ['class', 'style'],
          'td': ['colspan', 'rowspan', 'style'],
          'th': ['colspan', 'rowspan', 'style'],
          '*': ['style']
        },
        allowedStyles: {
          '*': {
            'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
            'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
            'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
            'font-size': [/^\d+(?:px|em|%)$/],
            'font-weight': [/^bold$/, /^normal$/, /^\d{3}$/],
            'width': [/^\d+(?:px|%)$/],
            'height': [/^\d+(?:px|%)$/],
            'padding': [/^\d+(?:px|em)$/],
            'margin': [/^\d+(?:px|em)$/]
          }
        }
      });
    }
    
    // ... rest der createPost Logik
  }
};
```

### Phase 2: Word/LibreOffice Import (Woche 3-4)

#### 2.1 Mammoth.js für .docx Import
```bash
npm install mammoth
```

```javascript
// Frontend: Word-Upload-Handler
import mammoth from 'mammoth';

async function handleWordImport(file) {
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Heading 3'] => h3",
        "p[style-name='Quote'] => blockquote"
      ],
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    }
  );
  
  // HTML in TinyMCE einfügen
  tinymce.activeEditor.setContent(result.value);
  
  // Warnungen anzeigen (falls vorhanden)
  if (result.messages.length > 0) {
    console.warn('Import-Warnungen:', result.messages);
  }
}

// UI-Button
document.getElementById('import-word-btn').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.docx';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) handleWordImport(file);
  };
  input.click();
});
```

#### 2.2 LibreOffice .odt Import
```bash
npm install odt2html
```

```javascript
import { odt2html } from 'odt2html';

async function handleOdtImport(file) {
  const arrayBuffer = await file.arrayBuffer();
  const html = await odt2html({ file: arrayBuffer });
  
  tinymce.activeEditor.setContent(html);
}
```

#### 2.3 Backend: File-Upload für Dokumente
```typescript
// src/routes/posts.ts
import multer from 'multer';

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/vnd.oasis.opendocument.text') {
      cb(null, true);
    } else {
      cb(new Error('Nur .docx und .odt Dateien erlaubt'));
    }
  }
});

router.post('/import-document', 
  authenticate, 
  documentUpload.single('document'),
  importDocumentController
);
```

```typescript
// src/controllers/postController.ts
import mammoth from 'mammoth';

export const importDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = req.file;
    
    if (!file) {
      throw new AppError('Keine Datei hochgeladen', 400);
    }
    
    let html = '';
    
    if (file.mimetype.includes('wordprocessingml')) {
      // DOCX
      const result = await mammoth.convertToHtml({ buffer: file.buffer });
      html = result.value;
    } else if (file.mimetype.includes('opendocument')) {
      // ODT - Alternative Implementierung
      html = await convertOdtToHtml(file.buffer);
    }
    
    res.json({
      success: true,
      data: { html },
      message: 'Dokument erfolgreich importiert'
    });
  } catch (error) {
    next(error);
  }
};
```

### Phase 3: Erweiterte Features (Woche 5-6)

#### 3.1 Bild-Upload direkt im Editor
```javascript
tinymce.init({
  // ... andere Config
  
  // Automatischer Bild-Upload
  images_upload_handler: async (blobInfo, progress) => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    formData.append('type', 'image');
    
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    
    const result = await response.json();
    return result.data.url;
  },
  
  // Bild-Upload-Button
  file_picker_types: 'image',
  file_picker_callback: (callback, value, meta) => {
    if (meta.filetype === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = function() {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          callback(reader.result, { alt: file.name });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  }
});
```

#### 3.2 Tabellen-Funktionalität
```javascript
tinymce.init({
  // ... andere Config
  
  plugins: [..., 'table'],
  
  // Tabellen-Toolbar
  toolbar: [..., 'table tabledelete | tableprops tablerowprops tablecellprops | \
            tableinsertrowbefore tableinsertrowafter tabledeleterow | \
            tableinsertcolbefore tableinsertcolafter tabledeletecol'],
  
  // Tabellen-Styling
  table_default_styles: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  
  table_default_attributes: {
    border: '1'
  },
  
  // Erweiterte Tabellen-Optionen
  table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | \
                  tableinsertcolbefore tableinsertcolafter tabledeletecol',
  
  table_class_list: [
    { title: 'Standard', value: '' },
    { title: 'Gestreift', value: 'table-striped' },
    { title: 'Umrandet', value: 'table-bordered' },
    { title: 'Kompakt', value: 'table-compact' }
  ]
});
```

#### 3.3 Formatvorlagen-System
```javascript
// Vordefinierte Formatvorlagen
tinymce.init({
  // ... andere Config
  
  style_formats: [
    {
      title: 'Überschriften',
      items: [
        { title: 'Überschrift 1', format: 'h1' },
        { title: 'Überschrift 2', format: 'h2' },
        { title: 'Überschrift 3', format: 'h3' },
        { title: 'Überschrift 4', format: 'h4' }
      ]
    },
    {
      title: 'Textformatierung',
      items: [
        { title: 'Fett', icon: 'bold', format: 'bold' },
        { title: 'Kursiv', icon: 'italic', format: 'italic' },
        { title: 'Unterstrichen', icon: 'underline', format: 'underline' },
        { title: 'Durchgestrichen', icon: 'strikethrough', format: 'strikethrough' }
      ]
    },
    {
      title: 'Textblöcke',
      items: [
        { title: 'Zitat', format: 'blockquote' },
        { title: 'Code', format: 'pre' },
        { title: 'Callout', block: 'div', classes: 'callout', wrapper: true }
      ]
    },
    {
      title: 'Spezielle Formate',
      items: [
        { title: 'Highlight', inline: 'span', styles: { backgroundColor: '#ffff00' } },
        { title: 'Wichtig', inline: 'strong', styles: { color: '#ff0000' } },
        { title: 'Hinweis', block: 'div', classes: 'info-box', wrapper: true }
      ]
    }
  ],
  
  style_formats_merge: false,
  style_formats_autohide: true
});
```

#### 3.4 Vorlagen-System
```typescript
// Backend: Vorlagen-Model
// src/models/PostTemplate.ts

interface PostTemplateAttributes {
  id: number;
  name: string;
  description?: string;
  content: string;
  categoryId?: number;
  duration: number;
  thumbnail?: string;
  isPublic: boolean;
  organizationId: number;
  createdBy: number;
}

class PostTemplate extends Model<PostTemplateAttributes> {
  // ... Model Definition
}

PostTemplate.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  thumbnail: {
    type: DataTypes.STRING
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'post_templates',
  timestamps: true
});
```

```typescript
// Frontend: Vorlagen-Auswahl
async function loadTemplates() {
  const response = await fetch('/api/post-templates', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  const result = await response.json();
  const templates = result.data;
  
  // Vorlagen in UI anzeigen
  const templateSelector = document.getElementById('template-selector');
  templateSelector.innerHTML = templates.map(t => `
    <div class="template-card" onclick="applyTemplate(${t.id})">
      <img src="${t.thumbnail || '/img/default-template.png'}" alt="${t.name}">
      <h4>${t.name}</h4>
      <p>${t.description || ''}</p>
    </div>
  `).join('');
}

async function applyTemplate(templateId) {
  const response = await fetch(`/api/post-templates/${templateId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  const result = await response.json();
  const template = result.data;
  
  // Vorlage in Editor laden
  tinymce.activeEditor.setContent(template.content);
  document.getElementById('post-title').value = template.name;
  document.getElementById('post-duration').value = template.duration;
  
  if (template.categoryId) {
    document.getElementById('post-category').value = template.categoryId;
  }
}
```

### Phase 4: PDF-Export (Woche 7)

#### 4.1 jsPDF Integration
```bash
npm install jspdf html2canvas
```

```javascript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function exportToPdf() {
  const content = tinymce.activeEditor.getContent();
  
  // HTML in temporärem Container rendern
  const container = document.createElement('div');
  container.innerHTML = content;
  container.style.width = '210mm'; // A4 Breite
  container.style.padding = '20mm';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);
  
  // Als Canvas rendern
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false
  });
  
  document.body.removeChild(container);
  
  // PDF erstellen
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const imgWidth = 210; // A4 Breite in mm
  const imgHeight = canvas.height * imgWidth / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`post-${Date.now()}.pdf`);
}

// Export-Button
document.getElementById('export-pdf-btn').addEventListener('click', exportToPdf);
```

#### 4.2 Alternative: Backend PDF-Generierung mit Puppeteer
```typescript
// src/controllers/postController.ts
import puppeteer from 'puppeteer';

export const exportPostToPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    
    if (!post) {
      throw new AppError('Post nicht gefunden', 404);
    }
    
    // HTML-Template mit Styles
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20mm;
            max-width: 170mm;
            margin: 0 auto;
          }
          h1, h2, h3 { margin-top: 1em; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #ddd; padding: 8px; }
        </style>
      </head>
      <body>
        <h1>${post.title}</h1>
        <div>${post.content}</div>
      </body>
      </html>
    `;
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=post-${id}.pdf`);
    res.send(pdf);
    
  } catch (error) {
    next(error);
  }
};
```

### Phase 5: Optimierungen & Polish (Woche 8)

#### 5.1 Auto-Save Funktionalität
```javascript
// Auto-Save alle 30 Sekunden
let autoSaveTimeout;

tinymce.init({
  // ... andere Config
  
  setup: (editor) => {
    editor.on('change', () => {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        autoSavePost();
      }, 30000); // 30 Sekunden
    });
  }
});

async function autoSavePost() {
  const content = tinymce.activeEditor.getContent();
  const title = document.getElementById('post-title').value;
  
  if (!title || !content) return;
  
  // Als Draft speichern
  try {
    await fetch('/api/posts/draft', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        content,
        contentType: 'html'
      })
    });
    
    showNotification('Draft automatisch gespeichert', 'success');
  } catch (error) {
    console.error('Auto-Save fehlgeschlagen:', error);
  }
}
```

#### 5.2 Revision History
```typescript
// Backend: Revisions-Model
interface PostRevisionAttributes {
  id: number;
  postId: number;
  content: string;
  title: string;
  createdBy: number;
  createdAt: Date;
}

class PostRevision extends Model<PostRevisionAttributes> {}

PostRevision.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'post_revisions',
  timestamps: true,
  updatedAt: false
});

// Bei jedem Update eine Revision erstellen
export const updatePost = async (...) => {
  // ... existing code
  
  // Revision erstellen
  await PostRevision.create({
    postId: post.id,
    content: post.content,
    title: post.title,
    createdBy: req.user!.id
  });
  
  // ... rest of update
};
```

#### 5.3 Responsive Editor
```javascript
tinymce.init({
  // ... andere Config
  
  // Mobile-optimiert
  mobile: {
    toolbar_mode: 'sliding',
    plugins: [
      'autosave', 'lists', 'autolink', 'image', 'link'
    ],
    toolbar: [
      'undo redo | bold italic | alignleft aligncenter alignright',
      'bullist numlist | link image'
    ]
  },
  
  // Responsive Toolbar
  toolbar_mode: 'sliding',
  
  // Touch-friendly
  toolbar_sticky: true
});
```

---

## 🏗 UI/UX Design

### Editor-Layout (Admin-Panel)

```html
<!-- views/admin/post-editor.html -->
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Post erstellen - PRASCO</title>
  <link rel="stylesheet" href="/css/admin.css">
  <link rel="stylesheet" href="/css/tinymce-custom.css">
</head>
<body>
  <div class="editor-container">
    <!-- Toolbar oben -->
    <div class="editor-header">
      <button onclick="history.back()" class="btn-secondary">
        <i class="icon-arrow-left"></i> Zurück
      </button>
      
      <div class="editor-actions">
        <button onclick="saveAsDraft()" class="btn-outline">
          <i class="icon-save"></i> Als Entwurf speichern
        </button>
        
        <button onclick="showPreview()" class="btn-outline">
          <i class="icon-eye"></i> Vorschau
        </button>
        
        <button onclick="savePost()" class="btn-primary">
          <i class="icon-check"></i> Veröffentlichen
        </button>
      </div>
    </div>
    
    <!-- Haupt-Editor-Bereich -->
    <div class="editor-main">
      <!-- Linke Sidebar: Optionen -->
      <aside class="editor-sidebar">
        <div class="sidebar-section">
          <h3>Post-Einstellungen</h3>
          
          <div class="form-group">
            <label>Titel</label>
            <input type="text" id="post-title" class="form-control" 
                   placeholder="Post-Titel eingeben..." required>
          </div>
          
          <div class="form-group">
            <label>Kategorie</label>
            <select id="post-category" class="form-control">
              <option value="">Keine Kategorie</option>
              <!-- Dynamisch geladen -->
            </select>
          </div>
          
          <div class="form-group">
            <label>Anzeigedauer (Sekunden)</label>
            <input type="number" id="post-duration" class="form-control" 
                   value="10" min="5" max="300">
          </div>
          
          <div class="form-group">
            <label>Priorität</label>
            <select id="post-priority" class="form-control">
              <option value="0">Niedrig</option>
              <option value="5" selected>Normal</option>
              <option value="10">Hoch</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Zeitplan</label>
            <input type="datetime-local" id="post-start-date" class="form-control">
            <small>Start-Datum (optional)</small>
            
            <input type="datetime-local" id="post-end-date" class="form-control" style="margin-top: 0.5rem;">
            <small>End-Datum (Standard: +7 Tage)</small>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="post-active" checked>
              Post sofort aktivieren
            </label>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>Vorlagen</h3>
          <div id="template-selector" class="template-list">
            <!-- Dynamisch geladen -->
          </div>
          <button onclick="saveAsTemplate()" class="btn-outline btn-sm">
            Als Vorlage speichern
          </button>
        </div>
        
        <div class="sidebar-section">
          <h3>Import/Export</h3>
          <button onclick="importWord()" class="btn-outline btn-sm btn-block">
            <i class="icon-upload"></i> Word importieren (.docx)
          </button>
          <button onclick="importOdt()" class="btn-outline btn-sm btn-block">
            <i class="icon-upload"></i> LibreOffice importieren (.odt)
          </button>
          <button onclick="exportToPdf()" class="btn-outline btn-sm btn-block">
            <i class="icon-download"></i> Als PDF exportieren
          </button>
        </div>
      </aside>
      
      <!-- Editor (Mitte) -->
      <div class="editor-content">
        <textarea id="post-content-editor"></textarea>
      </div>
      
      <!-- Rechte Sidebar: Revisions & Hilfe -->
      <aside class="editor-sidebar-right">
        <div class="sidebar-section">
          <h3>Revisionen</h3>
          <div id="revision-list" class="revision-list">
            <!-- Dynamisch geladen -->
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>Schnellhilfe</h3>
          <ul class="help-list">
            <li><strong>Strg+B</strong> - Fett</li>
            <li><strong>Strg+I</strong> - Kursiv</li>
            <li><strong>Strg+U</strong> - Unterstrichen</li>
            <li><strong>Strg+Z</strong> - Rückgängig</li>
            <li><strong>Strg+Y</strong> - Wiederholen</li>
            <li><strong>Strg+S</strong> - Speichern</li>
          </ul>
        </div>
      </aside>
    </div>
    
    <!-- Status-Bar unten -->
    <div class="editor-footer">
      <div class="status-info">
        <span id="word-count">0 Wörter</span>
        <span id="char-count">0 Zeichen</span>
        <span id="last-saved">Nicht gespeichert</span>
      </div>
      <div class="editor-mode">
        <button onclick="toggleFullscreen()" class="btn-icon">
          <i class="icon-fullscreen"></i>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Preview Modal -->
  <div id="preview-modal" class="modal" style="display: none;">
    <div class="modal-content modal-lg">
      <div class="modal-header">
        <h2>Vorschau</h2>
        <button onclick="closePreview()" class="close">&times;</button>
      </div>
      <div class="modal-body">
        <div id="preview-content" class="preview-container"></div>
      </div>
    </div>
  </div>
  
  <script src="/js/tinymce/tinymce.min.js"></script>
  <script src="/js/post-editor.js"></script>
</body>
</html>
```

### Custom CSS
```css
/* css/tinymce-custom.css */

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #fff;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar,
.editor-sidebar-right {
  width: 300px;
  background: #fff;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 1.5rem;
}

.editor-sidebar-right {
  border-left: 1px solid #ddd;
  border-right: none;
}

.editor-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: #fff;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.sidebar-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 1rem;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.template-card {
  cursor: pointer;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 0.5rem;
  text-align: center;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.template-card img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.template-card h4 {
  font-size: 0.875rem;
  margin: 0;
}

.revision-list {
  max-height: 300px;
  overflow-y: auto;
}

.revision-item {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.revision-item:hover {
  background: #f5f5f5;
}

.revision-item .time {
  font-size: 0.75rem;
  color: #666;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.875rem;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  background: #fff;
  border-top: 1px solid #ddd;
  font-size: 0.875rem;
  color: #666;
}

.status-info {
  display: flex;
  gap: 2rem;
}

.preview-container {
  padding: 2rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  min-height: 400px;
}

/* TinyMCE Toolbar Customization */
.tox .tox-toolbar {
  background: #f5f5f5 !important;
}

.tox .tox-tbtn {
  border-radius: 4px;
}

.tox .tox-tbtn--enabled {
  background: #1976d2 !important;
  color: #fff !important;
}

/* Responsive */
@media (max-width: 1200px) {
  .editor-sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .editor-sidebar {
    position: fixed;
    left: -300px;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s;
  }
  
  .editor-sidebar.open {
    left: 0;
  }
}
```

---

## 📦 Package Dependencies

```json
{
  "dependencies": {
    "tinymce": "^6.8.0",
    "mammoth": "^1.6.0",
    "sanitize-html": "^2.11.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "puppeteer": "^21.6.1"
  },
  "devDependencies": {
    "@types/sanitize-html": "^2.9.5"
  }
}
```

---

## 📅 Implementierungs-Zeitplan

### Sprint 1 (Woche 1-2): Basis-Editor
- [x] TinyMCE Integration
- [x] Basis-Toolbar konfigurieren
- [x] Backend HTML-Validierung
- [x] Basic Post-Erstellung mit Editor
- [x] Speichern & Laden

**Deliverable:** Funktionierender Rich-Text-Editor im Admin-Panel

### Sprint 2 (Woche 3-4): Import-Funktionalität
- [x] Word (.docx) Import mit Mammoth.js
- [x] LibreOffice (.odt) Import
- [x] Backend Document-Upload Endpoint
- [x] Bild-Handling beim Import
- [x] Formatierungs-Mapping

**Deliverable:** Word/ODT-Dateien können importiert werden

### Sprint 3 (Woche 5-6): Erweiterte Features
- [x] Tabellen-Funktionalität
- [x] Bilder direkt hochladen
- [x] Formatvorlagen-System
- [x] Vorlagen-Verwaltung (Template CRUD)
- [x] Link-Manager

**Deliverable:** Vollständige Editor-Features

### Sprint 4 (Woche 7): Export & Zusatzfeatures
- [x] PDF-Export (Client-seitig)
- [x] PDF-Export (Server-seitig mit Puppeteer)
- [x] Auto-Save Funktionalität
- [x] Revision History
- [x] Shortcut-Support

**Deliverable:** Export-Funktionen und Auto-Save

### Sprint 5 (Woche 8): Polish & Testing
- [x] Responsive Editor
- [x] Performance-Optimierung
- [x] Cross-Browser Testing
- [x] Dokumentation
- [x] User Testing & Bug Fixes

**Deliverable:** Production-ready Editor

---

## 🧪 Testing-Checkliste

### Funktionale Tests
- [ ] Text formatieren (Fett, Kursiv, Unterstrichen)
- [ ] Überschriften (H1-H6) einfügen
- [ ] Listen (geordnet, ungeordnet) erstellen
- [ ] Tabellen erstellen und bearbeiten
- [ ] Bilder hochladen und positionieren
- [ ] Links einfügen und bearbeiten
- [ ] Word-Dokument importieren
- [ ] LibreOffice-Dokument importieren
- [ ] PDF exportieren
- [ ] Vorlage anwenden
- [ ] Als Vorlage speichern
- [ ] Auto-Save funktioniert
- [ ] Revisionen anzeigen und wiederherstellen

### Browser-Kompatibilität
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Performance-Tests
- [ ] Editor lädt < 3 Sekunden
- [ ] Große Dokumente (>100KB HTML) laden flüssig
- [ ] Bild-Upload < 5 Sekunden
- [ ] Auto-Save ohne Verzögerung
- [ ] Keine Memory Leaks bei langer Nutzung

### Sicherheits-Tests
- [ ] XSS-Schutz (sanitizeHtml funktioniert)
- [ ] SQL-Injection verhindern
- [ ] File-Upload Validierung
- [ ] Authentifizierung erforderlich
- [ ] CSRF-Schutz

---

## 🔧 Troubleshooting

### Häufige Probleme

#### Problem: TinyMCE lädt nicht
```javascript
// Lösung: Korrekte Pfade setzen
tinymce.init({
  base_url: '/js/tinymce',
  suffix: '.min'
});
```

#### Problem: Bilder werden nicht hochgeladen
```javascript
// Lösung: CORS & Authorization prüfen
images_upload_handler: async (blobInfo, progress) => {
  // Token korrekt setzen
  const token = localStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('file', blobInfo.blob());
  
  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Upload fehlgeschlagen');
  }
  
  const result = await response.json();
  return result.data.url;
}
```

#### Problem: Word-Import bricht ab
```javascript
// Lösung: Error-Handling verbessern
async function handleWordImport(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('Import-Warnungen:', result.messages);
      showNotification('Dokument importiert mit Warnungen', 'warning');
    }
    
    tinymce.activeEditor.setContent(result.value);
    showNotification('Dokument erfolgreich importiert', 'success');
    
  } catch (error) {
    console.error('Import-Fehler:', error);
    showNotification('Import fehlgeschlagen: ' + error.message, 'error');
  }
}
```

---

## 💰 Kosten-Nutzen-Analyse

### Entwicklungskosten

| Position | Zeitaufwand | Kosten (€80/h) |
|----------|-------------|----------------|
| TinyMCE Integration | 16h | €1.280 |
| Word/ODT Import | 24h | €1.920 |
| Erweiterte Features | 32h | €2.560 |
| PDF-Export | 16h | €1.280 |
| UI/UX Design | 16h | €1.280 |
| Testing & Bug Fixes | 16h | €1.280 |
| **Gesamt** | **120h** | **€9.600** |

### Laufende Kosten
- TinyMCE License (Optional): €0 (GPL) oder €49/Monat (Cloud)
- Puppeteer Server-Ressourcen: ~€10/Monat
- **Gesamt:** €0-59/Monat

### Nutzen
- ✅ Professionellere Posts mit reichem Inhalt
- ✅ Zeitersparnis durch Vorlagen
- ✅ Bestehende Word-Dokumente wiederverwenden
- ✅ Keine externe Software notwendig
- ✅ Höhere Akzeptanz bei Nutzern
- ✅ Wettbewerbsvorteil gegenüber einfachen Text-Editoren

**ROI:** Positiv nach ~6 Monaten durch erhöhte Nutzung und Zeitersparnis

---

## 🚀 Deployment-Schritte

### 1. Dependencies installieren
```bash
cd /home/pi/Prasco
npm install tinymce mammoth sanitize-html jspdf html2canvas puppeteer
```

### 2. TinyMCE Dateien kopieren
```bash
cp -r node_modules/tinymce public/js/
```

### 3. Backend kompilieren
```bash
npm run build
```

### 4. Datenbank migrieren
```bash
# Neue Tabellen: post_templates, post_revisions
NODE_ENV=production node scripts/migrate-editor-tables.js
```

### 5. Server neu starten
```bash
pm2 restart prasco
```

### 6. Testen
```
https://10.0.162.110:3000/admin/posts/create
```

---

## 📚 Dokumentation & Schulung

### Benutzer-Dokumentation
1. **Schnellstart-Guide** (PDF)
   - Editor-Oberfläche erklärt
   - Grundlegende Formatierung
   - Bilder einfügen
   - Vorlagen verwenden

2. **Video-Tutorials** (5-10 Min.)
   - "Ersten Post mit Editor erstellen"
   - "Word-Dokument importieren"
   - "Tabellen und Listen nutzen"
   - "Vorlagen erstellen und verwalten"

3. **FAQ-Sektion**
   - Häufige Fehler und Lösungen
   - Best Practices
   - Keyboard Shortcuts

### Developer-Dokumentation
- API-Endpoints Dokumentation
- TinyMCE Plugin Development Guide
- Custom Template Format
- Extending the Editor

---

## ✅ Erfolgskriterien

### Technische KPIs
- [ ] Editor lädt in < 3 Sekunden
- [ ] 99% Success-Rate bei Speicherungen
- [ ] Word-Import funktioniert für 95%+ der Dokumente
- [ ] Keine kritischen XSS-Sicherheitslücken

### User KPIs
- [ ] 80%+ der Posts werden mit Editor erstellt (nicht plain text)
- [ ] Durchschnittliche Nutzungsdauer > 5 Minuten
- [ ] < 5% Support-Tickets wegen Editor-Problemen
- [ ] User-Zufriedenheit > 4.5/5

### Business KPIs
- [ ] ROI positiv nach 6 Monaten
- [ ] 50% Zeitersparnis bei Post-Erstellung
- [ ] Höhere Content-Qualität (subjektiv)

---

## 🔮 Zukunfts-Features (Post-Launch)

### Version 2.0
- [ ] Kollaboratives Bearbeiten (Echtzeit)
- [ ] Kommentar-System im Editor
- [ ] Versions-Vergleich (Diff-View)
- [ ] KI-gestützte Textvorschläge
- [ ] Grammatik- und Rechtschreibprüfung
- [ ] Mehr Vorlagen (100+ professionelle Templates)

### Version 2.1
- [ ] Voice-to-Text Diktierfunktion
- [ ] Automatische Bild-Optimierung
- [ ] Smart-Cropping für Bilder
- [ ] Barrierefreiheit (WCAG 2.1 AA)

---

**Version:** 1.0  
**Erstellt:** 2. Januar 2026  
**Autor:** PRASCO Development Team  
**Status:** Bereit zur Implementierung
