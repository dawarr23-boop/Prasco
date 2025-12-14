# Corporate Design Implementation Plan

## PRASCO Digital Bulletin Board - Markenkonformes Design

**Ziel:** Homogenisierung des Digital Bulletin Board Designs mit der Corporate Identity von PRASCO (http://prasco.de)

---

## Phase 1: Design-Analyse & Audit

### 1.1 Aktuelle PRASCO Website-Analyse (http://prasco.de)

#### Farbpalette

```css
/* Primärfarben */
--prasco-red: #e30613; /* Hauptrot - Logo & Akzente */
--prasco-dark-red: #bc0a30; /* Dunkleres Rot für Hover */
--prasco-black: #1a1a1a; /* Primärer Text */
--prasco-white: #ffffff; /* Hintergrund & Text auf Rot */

/* Sekundärfarben */
--prasco-gray-dark: #333333; /* Dunkles Grau - Überschriften */
--prasco-gray: #666666; /* Mittleres Grau - Fließtext */
--prasco-gray-light: #999999; /* Helles Grau - Meta-Text */
--prasco-gray-bg: #f5f5f5; /* Sehr helles Grau - Hintergrund */
--prasco-border: #e0e0e0; /* Borders & Dividers */

/* Akzentfarben (falls benötigt) */
--prasco-blue: #0066cc; /* Links & Interaktionen */
--prasco-success: #28a745; /* Erfolgs-Meldungen */
--prasco-warning: #ffc107; /* Warnungen */
--prasco-error: #dc3545; /* Fehler */
```

#### Typografie

```css
/* Schriftarten */
--font-primary: 'Roboto', 'Segoe UI', sans-serif; /* Hauptschrift */
--font-secondary: 'Roboto Condensed', 'Arial Narrow', sans-serif; /* Überschriften */
--font-mono: 'Courier New', monospace; /* Code/Technisch */

/* Schriftgrößen */
--font-size-h1: 2.5rem; /* 40px */
--font-size-h2: 2rem; /* 32px */
--font-size-h3: 1.5rem; /* 24px */
--font-size-h4: 1.25rem; /* 20px */
--font-size-body: 1rem; /* 16px */
--font-size-small: 0.875rem; /* 14px */
--font-size-tiny: 0.75rem; /* 12px */

/* Schriftgewichte */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Zeilenhöhen */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.8;
```

#### Spacing & Layout

```css
/* Spacing System (8px Base) */
--space-xs: 0.25rem; /* 4px */
--space-sm: 0.5rem; /* 8px */
--space-md: 1rem; /* 16px */
--space-lg: 1.5rem; /* 24px */
--space-xl: 2rem; /* 32px */
--space-2xl: 3rem; /* 48px */
--space-3xl: 4rem; /* 64px */

/* Container */
--container-max-width: 1200px;
--container-padding: 1.5rem;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

#### UI-Komponenten Analyse

**Buttons (prasco.de Stil)**

- Primär: Roter Hintergrund (#E30613), weißer Text, 8px Radius
- Sekundär: Weißer Hintergrund, roter Border, roter Text
- Hover: Dunkleres Rot (#BC0A30), leichtes Lift (shadow)
- Padding: 12px 24px
- Font-Weight: 600

**Cards/Boxes**

- Weißer Hintergrund
- Subtiler Schatten (0 2px 8px rgba(0,0,0,0.08))
- 8px Border-Radius
- 24px Padding

**Navigation**

- Sticky Header mit weißem Hintergrund
- Roter Akzent bei aktiven Items
- Dropdown mit Schatten
- Mobile: Hamburger-Menü

**Forms**

- Inputs: 1px solid Border (#E0E0E0), 4px Radius
- Focus: Roter Border (#E30613)
- Labels: Grau (#666666), 14px, oben
- Error: Roter Text und Border

---

## Phase 2: Komponenten-Migration

### 2.1 Admin-Panel Design

#### Login-Seite Redesign

```css
/* Aktuell: Generisch */
/* NEU: PRASCO-branded */

.login-page {
  background: linear-gradient(135deg, #e30613 0%, #bc0a30 100%);
  /* Oder: background-image mit PRASCO-Pattern */
}

.login-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  padding: 48px;
}

.login-header h1 {
  color: #e30613;
  font-family: 'Roboto Condensed', sans-serif;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-header p {
  color: #666666;
  font-size: 14px;
}

/* Button */
.btn-primary {
  background: #e30613;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #bc0a30;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(227, 6, 19, 0.3);
}

/* Input Fields */
.form-group input {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 15px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #e30613;
  outline: none;
  box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.1);
}

.form-group label {
  color: #333333;
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
}
```

**TODO:**

- [ ] PRASCO Logo prominent platzieren
- [ ] Farben auf PRASCO-Palette umstellen
- [ ] Font auf Roboto umstellen
- [ ] Button-Styles anpassen
- [ ] Input-Styles harmonisieren
- [ ] Fehlermeldungen in PRASCO-Rot
- [ ] Loading-Spinner in PRASCO-Design

#### Dashboard Redesign

```css
/* Sidebar Navigation */
.sidebar {
  background: #1a1a1a; /* PRASCO Dark */
  color: white;
  border-right: 3px solid #e30613;
}

.sidebar-menu a {
  color: #cccccc;
  padding: 12px 24px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.sidebar-menu a:hover {
  background: rgba(227, 6, 19, 0.1);
  border-left-color: #e30613;
  color: white;
}

.sidebar-menu a.active {
  background: rgba(227, 6, 19, 0.2);
  border-left-color: #e30613;
  color: white;
  font-weight: 600;
}

/* Header */
.admin-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.admin-header h1 {
  color: #1a1a1a;
  font-family: 'Roboto Condensed', sans-serif;
  font-weight: 700;
}

/* Stats Cards */
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #e30613;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.stat-card h3 {
  color: #666666;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.stat-number {
  color: #e30613;
  font-size: 36px;
  font-weight: 700;
}

/* Tables */
.list-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
}

.list-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Buttons */
.btn-primary {
  background: #e30613;
  color: white;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 600;
}

.btn-secondary {
  background: white;
  color: #e30613;
  border: 2px solid #e30613;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 600;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border-radius: 6px;
  padding: 8px 16px;
}
```

**TODO:**

- [ ] Sidebar in PRASCO-Schwarz
- [ ] Aktive Menü-Items mit rotem Akzent
- [ ] Stat-Cards mit PRASCO-Design
- [ ] Buttons auf PRASCO-Stil umstellen
- [ ] Tabellen/Listen modernisieren
- [ ] Forms mit PRASCO-Inputs
- [ ] PRASCO Logo in Sidebar Header

#### Forms & Inputs

```css
/* Post Form */
.form-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.form-group label {
  color: #333333;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 15px;
  font-family: 'Roboto', sans-serif;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #e30613;
  outline: none;
  box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.1);
}

.form-group small {
  color: #999999;
  font-size: 13px;
  margin-top: 4px;
  display: block;
}

/* File Upload */
.form-group input[type='file'] {
  border: 2px dashed #e0e0e0;
  padding: 24px;
  cursor: pointer;
  background: #f9f9f9;
}

.form-group input[type='file']:hover {
  border-color: #e30613;
  background: rgba(227, 6, 19, 0.05);
}

/* Checkbox/Radio */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  accent-color: #e30613;
}

/* Progress Bar */
#upload-progress-bar {
  background: linear-gradient(90deg, #e30613 0%, #bc0a30 100%);
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}
```

**TODO:**

- [ ] Alle Inputs auf PRASCO-Stil umstellen
- [ ] Focus-States mit PRASCO-Rot
- [ ] File-Upload mit PRASCO-Branding
- [ ] Checkboxes/Radios mit Accent-Color
- [ ] Progress-Bar in PRASCO-Rot
- [ ] Error-States harmonisieren

### 2.2 Public Display Design

#### Header Redesign

```css
/* Display Header */
.display-header {
  background: white;
  border-bottom: 4px solid #e30613; /* PRASCO Red Bar */
  padding: 24px 48px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.logo-image {
  max-height: 60px; /* Größeres Logo */
  filter: none; /* Original PRASCO Logo ohne Filter */
}

.header-category {
  color: #e30613;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.clock {
  font-family: 'Roboto Condensed', monospace;
  font-size: 2.5rem;
  font-weight: 300;
  color: #333333;
}
```

**TODO:**

- [ ] Header mit PRASCO-Red Bottom-Border
- [ ] Logo vergrößern und prominent platzieren
- [ ] Kategorie in PRASCO-Rot und Roboto Condensed
- [ ] Uhr-Styling modernisieren
- [ ] Responsive-Verhalten optimieren

#### Content Area Redesign

```css
/* Main Display */
.display-main {
  background: #f5f5f5; /* Sehr helles Grau statt weiß */
  padding: 48px;
}

.post-container {
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  max-width: 1200px;
  margin: 0 auto;
}

/* Post Titel */
.post h1 {
  color: #1a1a1a;
  font-family: 'Roboto Condensed', sans-serif;
  font-weight: 700;
  font-size: 3rem;
  line-height: 1.2;
  margin-bottom: 24px;
  border-left: 6px solid #e30613;
  padding-left: 24px;
}

/* Post Content */
.post p {
  color: #333333;
  font-family: 'Roboto', sans-serif;
  font-size: 1.5rem;
  line-height: 1.8;
  margin-bottom: 16px;
}

/* Post Images */
.post img {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  height: auto;
  margin: 24px 0;
}

/* Post Videos */
.post iframe,
.post video {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin: 24px 0;
}
```

**TODO:**

- [ ] Hintergrund auf PRASCO-Grau umstellen
- [ ] Content-Box mit weißem Hintergrund und Schatten
- [ ] Titel mit PRASCO-Red Akzent-Border
- [ ] Schrift auf Roboto/Roboto Condensed
- [ ] Bilder/Videos mit Border-Radius
- [ ] Spacing harmonisieren

#### Footer Redesign

```css
/* Display Footer */
.display-footer {
  background: #1a1a1a; /* PRASCO Dark */
  color: white;
  padding: 16px 48px;
  border-top: 3px solid #e30613;
}

.footer-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
}

.footer-info .separator {
  color: #666666;
}

#post-counter {
  color: #e30613;
  font-weight: 600;
}
```

**TODO:**

- [ ] Footer in PRASCO-Schwarz
- [ ] Roter Top-Border
- [ ] Counter in PRASCO-Rot
- [ ] Typografie anpassen

### 2.3 Kategorien & Content-Types

#### Kategorie-Badges

```css
/* Kategorie in Header (bereits vorhanden) */
.header-category span {
  color: var(--category-color); /* Dynamisch aus DB */
  font-family: 'Roboto Condensed', sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Optionale Badge-Anzeige (falls gewünscht) */
.category-badge {
  display: inline-block;
  padding: 8px 16px;
  background: var(--category-color);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

**TODO:**

- [ ] Kategorie-Farben mit PRASCO-Palette abstimmen
- [ ] Icons in PRASCO-Stil (line-icons statt emojis)
- [ ] Icon-Picker im Admin hinzufügen
- [ ] Kategorie-Vorlagen (Ankündigungen, Events, News)

---

## Phase 3: Asset-Integration

### 3.1 Logo & Branding

**Benötigte Assets:**

- [ ] PRASCO Logo (SVG, transparent)
  - Vollversion (Logo + Text)
  - Icon-Version (nur Logo-Symbol)
  - Inverse Version (für dunkle Hintergründe)
- [ ] Favicon (ICO, 32x32, 16x16)
- [ ] Touch-Icons für Mobile (180x180, 192x192, 512x512)
- [ ] Social Media Preview (OG-Image, 1200x630)

**Logo-Platzierung:**

- Admin Login: Zentriert über Login-Form
- Admin Dashboard: Sidebar-Header (Icon + Text)
- Public Display: Header links, groß und prominent
- Loading-Screen: Zentriert mit Animation

**TODO:**

- [ ] Logo-Dateien von PRASCO erhalten
- [ ] Logo in verschiedenen Größen generieren
- [ ] Logo-Animation für Loading-Screen
- [ ] Favicon implementieren

### 3.2 Icons & Pictograms

**Icon-System:**

- **Primär:** Material Icons oder Feather Icons (konsistent mit prasco.de)
- **Style:** Outline/Line-Style (nicht filled)
- **Größen:** 16px, 20px, 24px, 32px
- **Farbe:** #333333 (default), #E30613 (active/hover)

**Benötigte Icons:**

- Dashboard: 📊 → chart-bar
- Beiträge: 📝 → file-text
- Kategorien: 🏷️ → tag
- Medien: 🖼️ → image
- Einstellungen: ⚙️ → settings
- Logout: 🚪 → log-out
- Plus: + → plus
- Edit: ✏️ → edit
- Delete: 🗑️ → trash
- View: 👁️ → eye
- Upload: ⬆️ → upload

**TODO:**

- [ ] Icon-Library integrieren (z.B. Feather Icons)
- [ ] Alle Emojis durch professionelle Icons ersetzen
- [ ] Icon-Sprites für Performance erstellen
- [ ] Hover/Active-States definieren

### 3.3 Bilder & Medien

**Platzhalter-Bilder:**

- No-Content-Illustration (SVG)
- Upload-Placeholder (SVG)
- User-Avatar-Placeholder (SVG)
- Error-Illustration (SVG)

**Hintergrund-Pattern:**

- Optionaler subtiler Pattern für Login-Page
- PRASCO-inspirierte Geometrie
- SVG für Skalierbarkeit

**TODO:**

- [ ] Custom Illustrations im PRASCO-Stil
- [ ] No-Content-Screen designen
- [ ] Loading-Spinner im PRASCO-Design
- [ ] Error-Pages mit PRASCO-Branding

---

## Phase 4: Responsiveness & Accessibility

### 4.1 Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 576px; /* Small devices */
--breakpoint-md: 768px; /* Tablets */
--breakpoint-lg: 992px; /* Desktops */
--breakpoint-xl: 1200px; /* Large desktops */
--breakpoint-2xl: 1400px; /* Extra large */

/* Admin Panel */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    transition: left 0.3s;
  }

  .sidebar.open {
    left: 0;
  }

  .admin-content {
    margin-left: 0;
  }
}

/* Display */
@media (max-width: 768px) {
  .display-header {
    padding: 16px;
    flex-direction: column;
    gap: 12px;
  }

  .header-category {
    font-size: 1.25rem;
  }

  .clock {
    font-size: 1.75rem;
  }

  .post h1 {
    font-size: 2rem;
  }
}
```

### 4.2 Accessibility (WCAG 2.1 AA)

**Farb-Kontrast:**

- Text auf Weiß: Min. 4.5:1 (#333333)
- Text auf Rot: Weiß (#FFFFFF) - bereits 4.5:1+
- Interaktive Elemente: Min. 3:1

**Keyboard Navigation:**

- Tab-Order logisch
- Focus-Indicator sichtbar (3px solid #E30613)
- Skip-Links für Screen-Reader
- ARIA-Labels für Icons

**Screen Reader:**

- Alt-Texte für Bilder
- ARIA-Roles für UI-Komponenten
- Live-Regions für Dynamic Content
- Semantisches HTML (h1-h6, nav, main, article)

**TODO:**

- [ ] Kontrast-Tests durchführen
- [ ] Focus-States implementieren
- [ ] ARIA-Labels hinzufügen
- [ ] Screen-Reader-Tests
- [ ] Keyboard-Navigation testen

---

## Phase 5: Animation & Interaktion

### 5.1 Micro-Interactions

```css
/* Buttons */
.btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(227, 6, 19, 0.3);
}

.btn:active {
  transform: translateY(0);
}

/* Cards */
.stat-card,
.list-item {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover,
.list-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Inputs */
.form-group input,
.form-group select {
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

/* Loading Spinner */
@keyframes prasco-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #e30613;
  border-radius: 50%;
  animation: prasco-spin 1s linear infinite;
}
```

### 5.2 Page Transitions

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.page-enter {
  animation: fadeIn 0.3s ease-in;
}

/* Slide In */
@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.list-item {
  animation: slideInRight 0.3s ease-out;
  animation-fill-mode: backwards;
}

.list-item:nth-child(1) {
  animation-delay: 0s;
}
.list-item:nth-child(2) {
  animation-delay: 0.1s;
}
.list-item:nth-child(3) {
  animation-delay: 0.2s;
}
```

### 5.3 Display Transitions

```css
/* Post Rotation Animation */
.post {
  animation: slideInUp 0.5s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Category Change Animation */
.header-category {
  transition:
    color 0.3s,
    transform 0.3s;
}

.header-category.updating {
  transform: scale(1.05);
}
```

**TODO:**

- [ ] Hover-Effekte harmonisieren
- [ ] Loading-States animieren
- [ ] Page-Transitions implementieren
- [ ] Display-Rotation smooth gestalten
- [ ] Toast-Notifications mit Animation

---

## Phase 6: Dark Mode (Optional)

### 6.1 Dark Mode Palette

```css
/* Dark Mode Colors */
:root[data-theme='dark'] {
  --prasco-bg: #121212;
  --prasco-surface: #1e1e1e;
  --prasco-surface-hover: #2a2a2a;
  --prasco-text: #e0e0e0;
  --prasco-text-secondary: #b0b0b0;
  --prasco-border: #333333;

  /* PRASCO Red bleibt gleich */
  --prasco-red: #e30613;
  --prasco-red-hover: #ff1726;
}

/* Dark Mode Styles */
[data-theme='dark'] .admin-layout {
  background: var(--prasco-bg);
  color: var(--prasco-text);
}

[data-theme='dark'] .stat-card,
[data-theme='dark'] .list-item {
  background: var(--prasco-surface);
  border-color: var(--prasco-border);
}

[data-theme='dark'] .form-group input {
  background: var(--prasco-surface);
  border-color: var(--prasco-border);
  color: var(--prasco-text);
}
```

### 6.2 Theme Toggle

```html
<!-- In Header -->
<button id="theme-toggle" class="theme-toggle">
  <span class="icon-sun">☀️</span>
  <span class="icon-moon">🌙</span>
</button>
```

```javascript
// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

document.documentElement.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.getAttribute('data-theme');
  const newTheme = theme === 'light' ? 'dark' : 'light';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});
```

**TODO:**

- [ ] Dark Mode Palette definieren
- [ ] Theme Toggle implementieren
- [ ] Alle Komponenten Dark-Mode-ready
- [ ] System-Preference Detection (prefers-color-scheme)
- [ ] Smooth Theme Transitions

---

## Phase 7: Implementation Timeline

### Woche 1: Foundation

**Ziel:** Design-System aufbauen

- [ ] CSS-Variablen für PRASCO-Farben erstellen
- [ ] Roboto Schriftart einbinden
- [ ] Spacing/Typography-System definieren
- [ ] Basis-Komponenten-Styles

**Deliverables:**

- `prasco-design-system.css` mit allen Variablen
- Style-Guide Dokumentation

### Woche 2: Admin-Panel (Teil 1)

**Ziel:** Login & Dashboard

- [ ] Login-Seite komplett neu designen
- [ ] Dashboard-Header & Sidebar
- [ ] Stat-Cards redesignen
- [ ] Navigation-Menü

**Deliverables:**

- Login-Page im neuen Design
- Dashboard-Shell mit PRASCO-Branding

### Woche 3: Admin-Panel (Teil 2)

**Ziel:** Forms & Content-Management

- [ ] Post-Formular redesignen
- [ ] Kategorie-Verwaltung
- [ ] File-Upload UI
- [ ] Lists & Tables

**Deliverables:**

- Vollständiges Admin-Panel im PRASCO-Design

### Woche 4: Public Display

**Ziel:** Display-Interface

- [ ] Header mit PRASCO-Branding
- [ ] Content-Area Styling
- [ ] Footer Redesign
- [ ] Post-Transitions

**Deliverables:**

- Public Display im PRASCO-Design
- Smooth Post-Rotation

### Woche 5: Assets & Icons

**Ziel:** Visuelle Assets

- [ ] Logo-Integration
- [ ] Icon-System implementieren
- [ ] Placeholder-Grafiken
- [ ] Loading-Animationen

**Deliverables:**

- Alle Icons ersetzt
- PRASCO-Logo überall sichtbar
- Custom Illustrations

### Woche 6: Polish & Refinement

**Ziel:** Details & Feinschliff

- [ ] Animationen optimieren
- [ ] Responsive-Testing
- [ ] Accessibility-Audit
- [ ] Browser-Testing

**Deliverables:**

- Production-Ready Design
- Dokumentation

---

## Phase 8: Quality Assurance

### 8.1 Design Review Checklist

**Farben:**

- [ ] Alle Primärfarben sind PRASCO-konform
- [ ] Kontrast-Ratios erfüllen WCAG AA
- [ ] Hover/Active-States konsistent
- [ ] Error/Success-States harmonisch

**Typografie:**

- [ ] Roboto/Roboto Condensed verwendet
- [ ] Font-Sizes konsistent
- [ ] Line-Heights optimiert
- [ ] Letter-Spacing wo nötig

**Spacing:**

- [ ] 8px-Grid eingehalten
- [ ] Paddings konsistent
- [ ] Margins harmonisch
- [ ] Whitespace ausreichend

**Komponenten:**

- [ ] Buttons im PRASCO-Stil
- [ ] Inputs mit PRASCO-Focus
- [ ] Cards mit Schatten
- [ ] Navigation konsistent

**Logo & Branding:**

- [ ] PRASCO-Logo prominent
- [ ] Logo korrekt skaliert
- [ ] Favicon implementiert
- [ ] Brand-Guidelines befolgt

### 8.2 Browser-Testing

**Desktop:**

- [ ] Chrome 120+ (Windows/Mac)
- [ ] Firefox 120+ (Windows/Mac)
- [ ] Safari 17+ (Mac)
- [ ] Edge 120+ (Windows)

**Mobile:**

- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet

**Display-Devices:**

- [ ] 1920x1080 (Full HD)
- [ ] 1366x768 (Standard)
- [ ] 3840x2160 (4K)
- [ ] Raspberry Pi Browser (Chromium)

### 8.3 Performance Metrics

**Target:**

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3s

**Optimizations:**

- [ ] CSS minifiziert
- [ ] Unused CSS entfernt
- [ ] Fonts preloaded
- [ ] Images optimiert (WebP)
- [ ] Critical CSS inline

---

## Phase 9: Documentation

### 9.1 Style Guide

**Inhalt:**

- Farbpalette mit Hex-Codes
- Typografie-Hierarchie
- Spacing-System
- Komponenten-Showcase
- Do's & Don'ts
- Code-Snippets

**Format:** HTML-basiertes Living Style Guide

### 9.2 Brand Guidelines Integration

**Dokument:** PRASCO Corporate Design Manual Zusammenfassung

- Logo-Usage Rules
- Color Specifications
- Typography Guidelines
- Tone of Voice
- Example Applications

### 9.3 Developer Documentation

**README-Update:**

```markdown
## Design System

Dieses Projekt verwendet das PRASCO Corporate Design System.

### Farben

- Primär: `--prasco-red` (#E30613)
- Text: `--prasco-black` (#1A1A1A)
- Hintergrund: `--prasco-white` (#FFFFFF)

### Schriften

- Headings: Roboto Condensed
- Body: Roboto

### Komponenten

Siehe `/docs/components.html` für Details.
```

---

## Phase 10: Rollout & Maintenance

### 10.1 Staged Rollout

1. **Alpha:** Internal Testing (Team)
2. **Beta:** Selected Users (PRASCO Staff)
3. **GA:** Public Release

### 10.2 Feedback Loop

- User-Testing Sessions
- Design-Feedback-Formulare
- Analytics (Heatmaps, Click-Tracking)
- Iteration basierend auf Daten

### 10.3 Maintenance Plan

- Quarterly Design Reviews
- Annual Brand Audit
- Continuous Improvement
- Stay up-to-date mit PRASCO Website

---

## Success Metrics

### Quantitative

- ✅ 100% PRASCO Brand Compliance
- ✅ WCAG 2.1 AA Conformance
- ✅ < 3s Page Load Time
- ✅ 90+ Lighthouse Score

### Qualitative

- ✅ User-Feedback: "Looks Professional"
- ✅ Brand Recognition: "Clearly PRASCO"
- ✅ Usability: "Intuitive & Easy"

---

## Budget & Resources

**Design:**

- UI/UX Designer: 2 Wochen (€4,000)
- Brand Consultant: 1 Tag (€500)

**Development:**

- Frontend Developer: 4 Wochen (€8,000)
- QA Engineer: 1 Woche (€1,500)

**Assets:**

- Illustrations: €500
- Icons: €0 (Open Source)
- Fonts: €0 (Google Fonts)

**Gesamt:** ~€14,500

---

## Next Steps (Sofort)

1. **Prasco.de Website-Audit:**
   - Screenshots aller relevanten Seiten
   - CSS extrahieren (DevTools)
   - Font-Files identifizieren
   - Logo-Assets sammeln

2. **Stakeholder-Meeting:**
   - Design-Präsentation
   - Feedback einholen
   - Prioritäten abstimmen
   - Timeline finalisieren

3. **Quick Wins (Diese Woche):**
   - PRASCO-Farben in CSS-Variablen
   - Roboto Font einbinden
   - Primäre Buttons rot färben
   - PRASCO Logo in Login/Dashboard

4. **Prototype:**
   - Figma/Sketch Mockups
   - Interactive Prototype
   - User-Testing vorbereiten

---

**Erstellt:** 2025-11-23  
**Version:** 1.0  
**Status:** Ready for Implementation  
**Designer:** GitHub Copilot + PRASCO Team
