# PowerPoint-Effekte Implementierungsplan
## PRASCO Digital Signage System

**Erstellt:** 8. Januar 2026  
**Version:** 1.0  
**Status:** Planning Phase

---

## 🎯 Zielsetzung

Implementierung von PowerPoint-ähnlichen Animations- und Übergangseffekten für das PRASCO Digital Signage System, um professionelle, dynamische Präsentationen zu ermöglichen.

## 📋 Inhaltsverzeichnis

1. [Feature-Übersicht](#feature-übersicht)
2. [Architektur](#architektur)
3. [Implementierungsphasen](#implementierungsphasen)
4. [Technische Spezifikation](#technische-spezifikation)
5. [Datenbank-Schema](#datenbank-schema)
6. [API-Endpunkte](#api-endpunkte)
7. [Frontend-Komponenten](#frontend-komponenten)
8. [Timeline & Ressourcen](#timeline--ressourcen)

---

## 🎨 Feature-Übersicht

### Phase 1: Slide-Übergänge (Transitions)
- **Fade** (Ein-/Ausblenden)
- **Slide** (Links, Rechts, Oben, Unten)
- **Zoom** (Hinein-/Herauszoomen)
- **Wipe** (Wischen in verschiedene Richtungen)
- **Push** (Vorheriges Slide wegdrücken)
- **Cube** (3D-Würfel-Rotation)
- **Flip** (3D-Flip-Effekt)
- **Morph** (Sanfter Übergang zwischen ähnlichen Elementen)

### Phase 2: Element-Animationen (Entrance/Exit)
- **Entrance Effects** (Erscheinen):
  - Fade In
  - Fly In (aus verschiedenen Richtungen)
  - Zoom In
  - Bounce In
  - Rotate In
  - Split (von Mitte/Seiten)
  
- **Exit Effects** (Verschwinden):
  - Fade Out
  - Fly Out
  - Zoom Out
  - Collapse
  - Split Out

- **Emphasis Effects** (Hervorhebung):
  - Pulse (Pulsieren)
  - Grow/Shrink (Größenänderung)
  - Spin (Drehen)
  - Color Change (Farbwechsel)
  - Shake (Schütteln)

### Phase 3: Motion Paths
- Vordefinierte Pfade:
  - Line (Gerade)
  - Arc (Bogen)
  - Circle (Kreis)
  - Custom Path (Benutzerdefiniert)

### Phase 4: Build-Animationen
- Element-für-Element erscheinen (z.B. Aufzählungspunkte)
- Timing-Control (gleichzeitig, nacheinander, mit Verzögerung)
- Trigger-basierte Animationen (onClick, onHover, onScroll)

---

## 🏗️ Architektur

### Systemkomponenten

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Interface                       │
│  ┌──────────────────────┐  ┌─────────────────────────┐ │
│  │  Effect Editor UI    │  │  Timeline/Sequencer     │ │
│  │  - Transition Picker │  │  - Animation Timeline   │ │
│  │  - Animation Builder │  │  - Keyframe Editor      │ │
│  │  - Preview Mode      │  │  - Duration/Delay Setup │ │
│  └──────────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Backend API                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Effect Configuration Service                    │   │
│  │  - Store effect definitions                      │   │
│  │  - Validate effect parameters                    │   │
│  │  - Serve effect presets                          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Display Engine                           │
│  ┌──────────────────────┐  ┌─────────────────────────┐ │
│  │  Effect Renderer     │  │  Animation Engine       │ │
│  │  - CSS Animations    │  │  - Timing Management    │ │
│  │  - WebGL Effects     │  │  - State Machine        │ │
│  │  - Canvas Graphics   │  │  - Event Handling       │ │
│  └──────────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Technologie-Stack

**Backend:**
- Node.js + Express (bestehend)
- PostgreSQL/SQLite (bestehend)
- Zusätzliche Packages:
  - `validate.js` - Validierung von Effect-Parametern
  - `lodash` - Deep-Clone für Effect-Presets

**Frontend:**
- Vanilla JavaScript (bestehend)
- CSS3 Animations & Transitions
- Optional: `anime.js` oder `GSAP` für komplexe Animationen
- Optional: `Three.js` für 3D-Effekte (Cube, Flip)

**Display:**
- Web Animations API
- CSS3 Transform & Transition
- RequestAnimationFrame für Performance
- Intersection Observer API für Trigger

---

## 📅 Implementierungsphasen

### Phase 1: Slide-Übergänge (2-3 Wochen)

#### Woche 1: Datenbank & Backend
**Aufgaben:**
- [ ] Datenbank-Schema erweitern (`slide_transitions` Tabelle)
- [ ] Migration erstellen und ausführen
- [ ] Backend-Models erstellen (`SlideTransition`)
- [ ] API-Endpunkte implementieren:
  - `GET /api/transitions` - Alle verfügbaren Übergänge
  - `POST /api/posts/:id/transition` - Transition für Post setzen
  - `GET /api/posts/:id/transition` - Transition für Post abrufen
- [ ] Effect-Presets definieren (JSON-Konfiguration)

#### Woche 2: Admin-Interface
**Aufgaben:**
- [ ] Transition-Picker UI erstellen
- [ ] Live-Preview-Modus implementieren
- [ ] Integration in Post-Editor
- [ ] Duration/Easing-Controls hinzufügen
- [ ] Save/Load-Funktionalität

#### Woche 3: Display-Engine
**Aufgaben:**
- [ ] CSS-basierte Transition-Renderer erstellen
- [ ] Transition-Controller in `display.js` implementieren
- [ ] State-Management für Übergänge
- [ ] Performance-Optimierung (Hardware-Beschleunigung)
- [ ] Cross-Browser-Testing
- [ ] Raspberry Pi Testing

**Deliverables:**
- ✅ 8 grundlegende Slide-Übergänge funktional
- ✅ Admin-UI zum Konfigurieren von Übergängen
- ✅ Smooth Performance auf Raspberry Pi

---

### Phase 2: Element-Animationen (3-4 Wochen)

#### Woche 1: Datenbank-Schema
**Aufgaben:**
- [ ] `element_animations` Tabelle erstellen
- [ ] Relation zu Posts (1:N) definieren
- [ ] Animation-Trigger-System planen
- [ ] Backend-Models und Services

#### Woche 2-3: Animation-Builder
**Aufgaben:**
- [ ] WYSIWYG Animation-Builder UI
- [ ] Element-Selektor (für HTML-Content)
- [ ] Animation-Type-Picker (Entrance/Exit/Emphasis)
- [ ] Timeline-Editor für Sequencing
- [ ] Keyframe-Editor für präzise Kontrolle

#### Woche 4: Display-Rendering
**Aufgaben:**
- [ ] Animation-Engine in `display.js`
- [ ] Web Animations API Integration
- [ ] CSS Keyframes Generator
- [ ] Timing-Funktionen implementieren
- [ ] Trigger-System (Auto, Click, Scroll)

**Deliverables:**
- ✅ 15+ Element-Animationen verfügbar
- ✅ Timeline-basierter Editor
- ✅ Trigger-System funktional

---

### Phase 3: Motion Paths (2 Wochen)

#### Woche 1: Path-Editor
**Aufgaben:**
- [ ] SVG-basierter Path-Editor UI
- [ ] Vordefinierte Pfade (Line, Arc, Circle)
- [ ] Benutzerdefinierte Pfade (Bézier-Kurven)
- [ ] Path-Preview im Editor

#### Woche 2: Path-Animation
**Aufgaben:**
- [ ] SVG Path Animation Renderer
- [ ] Motion along Path implementieren
- [ ] Rotation entlang Pfad (Auto-Orient)
- [ ] Easing für Path-Animation

**Deliverables:**
- ✅ Motion Path Editor
- ✅ 5+ vordefinierte Pfade
- ✅ Custom Path Support

---

### Phase 4: Build-Animationen & Polish (2 Wochen)

#### Woche 1: Build-Animationen
**Aufgaben:**
- [ ] List-Item Build-Effekte
- [ ] Paragraph-by-Paragraph erscheinen
- [ ] Sequential vs. Parallel Timing
- [ ] Smart Build für HTML-Content

#### Woche 2: Polish & Optimization
**Aufgaben:**
- [ ] Performance-Optimierung
- [ ] Mobile/Tablet-Support
- [ ] Accessibility (Reduced Motion Support)
- [ ] Documentation
- [ ] User-Testing & Feedback

**Deliverables:**
- ✅ Build-Animationen funktional
- ✅ Performance optimiert (60 FPS auf RPi)
- ✅ Dokumentation vollständig

---

## 🗄️ Datenbank-Schema

### Neue Tabelle: `slide_transitions`

```sql
CREATE TABLE slide_transitions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Transition-Typ
  transition_type VARCHAR(50) NOT NULL, -- 'fade', 'slide', 'zoom', etc.
  
  -- Transition-Parameter
  direction VARCHAR(20), -- 'left', 'right', 'up', 'down', 'in', 'out'
  duration INTEGER DEFAULT 800, -- Millisekunden
  easing VARCHAR(50) DEFAULT 'ease-in-out', -- CSS easing function
  
  -- Zusätzliche Optionen
  delay INTEGER DEFAULT 0, -- Verzögerung vor Start (ms)
  z_index INTEGER DEFAULT 1, -- Z-Index während Transition
  
  -- Metadaten
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: Ein Post hat maximal eine Transition
  UNIQUE(post_id)
);

-- Index für schnelle Abfragen
CREATE INDEX idx_slide_transitions_post_id ON slide_transitions(post_id);
```

### Neue Tabelle: `element_animations`

```sql
CREATE TABLE element_animations (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Element-Identifikation
  element_selector VARCHAR(255) NOT NULL, -- CSS Selector oder Data-ID
  element_index INTEGER, -- Optional: Index bei mehreren Elementen
  
  -- Animation-Typ
  animation_type VARCHAR(50) NOT NULL, -- 'entrance', 'exit', 'emphasis'
  effect_name VARCHAR(50) NOT NULL, -- 'fadeIn', 'flyIn', 'pulse', etc.
  
  -- Timing
  start_time INTEGER DEFAULT 0, -- Start nach X ms (relativ zu Slide-Start)
  duration INTEGER DEFAULT 500, -- Animations-Dauer (ms)
  delay INTEGER DEFAULT 0, -- Zusätzliche Verzögerung (ms)
  easing VARCHAR(50) DEFAULT 'ease-out',
  
  -- Richtung/Parameter
  direction VARCHAR(20), -- 'left', 'right', 'up', 'down', etc.
  intensity INTEGER DEFAULT 100, -- Intensität (0-100%)
  
  -- Trigger
  trigger_type VARCHAR(20) DEFAULT 'auto', -- 'auto', 'click', 'hover', 'scroll'
  trigger_target VARCHAR(255), -- Optional: Trigger-Element
  
  -- Reihenfolge
  sequence_order INTEGER DEFAULT 0, -- Order bei mehreren Animationen
  
  -- Erweiterte Optionen (JSON)
  options JSONB, -- Zusätzliche Parameter (z.B. Motion Path, Colors)
  
  -- Metadaten
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indizes
CREATE INDEX idx_element_animations_post_id ON element_animations(post_id);
CREATE INDEX idx_element_animations_sequence ON element_animations(post_id, sequence_order);
```

### Neue Tabelle: `motion_paths`

```sql
CREATE TABLE motion_paths (
  id SERIAL PRIMARY KEY,
  animation_id INTEGER NOT NULL REFERENCES element_animations(id) ON DELETE CASCADE,
  
  -- Path-Definition
  path_type VARCHAR(50) NOT NULL, -- 'line', 'arc', 'circle', 'custom'
  svg_path TEXT, -- SVG Path-String (für custom paths)
  
  -- Start/End-Position
  start_x DECIMAL(10,2),
  start_y DECIMAL(10,2),
  end_x DECIMAL(10,2),
  end_y DECIMAL(10,2),
  
  -- Zusätzliche Parameter
  auto_rotate BOOLEAN DEFAULT false, -- Element entlang Pfad rotieren
  reverse_path BOOLEAN DEFAULT false, -- Pfad rückwärts
  
  -- Metadaten
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_motion_paths_animation_id ON motion_paths(animation_id);
```

### Erweiterung der `posts` Tabelle

```sql
-- Neue Spalten für Animation-Einstellungen
ALTER TABLE posts 
ADD COLUMN auto_animate BOOLEAN DEFAULT false,
ADD COLUMN animation_loop BOOLEAN DEFAULT false,
ADD COLUMN animation_delay INTEGER DEFAULT 0,
ADD COLUMN reduced_motion_fallback BOOLEAN DEFAULT true;
```

---

## 🔌 API-Endpunkte

### Slide Transitions

#### GET `/api/transitions`
Liefert alle verfügbaren Transition-Presets.

**Response:**
```json
{
  "transitions": [
    {
      "type": "fade",
      "name": "Fade",
      "description": "Sanftes Ein-/Ausblenden",
      "previewUrl": "/assets/previews/fade.gif",
      "defaultDuration": 800,
      "supportedEasing": ["linear", "ease", "ease-in", "ease-out", "ease-in-out"],
      "options": []
    },
    {
      "type": "slide",
      "name": "Slide",
      "description": "Reinschieben von der Seite",
      "previewUrl": "/assets/previews/slide.gif",
      "defaultDuration": 600,
      "supportedEasing": ["ease", "ease-in-out"],
      "options": [
        { "name": "direction", "type": "select", "values": ["left", "right", "up", "down"] }
      ]
    }
  ]
}
```

#### POST `/api/posts/:postId/transition`
Setzt die Transition für einen Post.

**Request Body:**
```json
{
  "transitionType": "slide",
  "direction": "left",
  "duration": 600,
  "easing": "ease-in-out",
  "delay": 0
}
```

**Response:**
```json
{
  "success": true,
  "transition": {
    "id": 123,
    "postId": 456,
    "transitionType": "slide",
    "direction": "left",
    "duration": 600,
    "easing": "ease-in-out"
  }
}
```

#### GET `/api/posts/:postId/transition`
Ruft die Transition-Konfiguration ab.

#### DELETE `/api/posts/:postId/transition`
Entfernt die Transition (zurück zu Default).

---

### Element Animations

#### GET `/api/animations/effects`
Liefert alle verfügbaren Animation-Effekte.

**Response:**
```json
{
  "effects": {
    "entrance": [
      { "name": "fadeIn", "displayName": "Fade In", "defaultDuration": 500 },
      { "name": "flyIn", "displayName": "Fly In", "defaultDuration": 600, "hasDirection": true }
    ],
    "exit": [...],
    "emphasis": [...]
  }
}
```

#### POST `/api/posts/:postId/animations`
Fügt eine Element-Animation hinzu.

**Request Body:**
```json
{
  "elementSelector": ".post-title",
  "animationType": "entrance",
  "effectName": "flyIn",
  "direction": "left",
  "startTime": 500,
  "duration": 600,
  "easing": "ease-out",
  "triggerType": "auto",
  "sequenceOrder": 0
}
```

#### GET `/api/posts/:postId/animations`
Ruft alle Animationen für einen Post ab.

#### PUT `/api/animations/:animationId`
Aktualisiert eine Animation.

#### DELETE `/api/animations/:animationId`
Löscht eine Animation.

---

### Motion Paths

#### POST `/api/animations/:animationId/path`
Fügt einen Motion Path zu einer Animation hinzu.

**Request Body:**
```json
{
  "pathType": "arc",
  "startX": 0,
  "startY": 0,
  "endX": 500,
  "endY": 300,
  "autoRotate": true
}
```

#### GET `/api/animations/:animationId/path`
Ruft den Motion Path ab.

---

## 🎨 Frontend-Komponenten

### 1. Transition Picker (`components/TransitionPicker.js`)

```javascript
class TransitionPicker {
  constructor(containerId, postId) {
    this.container = document.getElementById(containerId);
    this.postId = postId;
    this.currentTransition = null;
    this.availableTransitions = [];
    this.init();
  }

  async init() {
    await this.loadTransitions();
    this.render();
    this.attachEventListeners();
  }

  async loadTransitions() {
    const response = await fetch('/api/transitions');
    const data = await response.json();
    this.availableTransitions = data.transitions;
  }

  render() {
    // Render transition gallery with previews
  }

  async saveTransition(config) {
    await fetch(`/api/posts/${this.postId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  }

  previewTransition(transitionType) {
    // Show live preview in modal
  }
}
```

### 2. Animation Builder (`components/AnimationBuilder.js`)

```javascript
class AnimationBuilder {
  constructor(postId, contentElement) {
    this.postId = postId;
    this.contentElement = contentElement;
    this.animations = [];
    this.timeline = null;
    this.selectedElement = null;
  }

  // Element-Selektor aktivieren
  enableElementSelector() {
    // Overlay mit highlightbaren Elementen
  }

  // Animation hinzufügen
  addAnimation(config) {
    this.animations.push(config);
    this.updateTimeline();
    this.saveAnimations();
  }

  // Timeline-Visualisierung
  renderTimeline() {
    // Visual timeline mit drag-drop
  }

  // Animationen abspeichern
  async saveAnimations() {
    for (const anim of this.animations) {
      await fetch(`/api/posts/${this.postId}/animations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anim)
      });
    }
  }
}
```

### 3. Effect Renderer (`display/EffectRenderer.js`)

```javascript
class EffectRenderer {
  constructor() {
    this.activeAnimations = [];
    this.transitionInProgress = false;
  }

  // Slide-Transition ausführen
  async performTransition(fromElement, toElement, transitionConfig) {
    this.transitionInProgress = true;

    switch (transitionConfig.transitionType) {
      case 'fade':
        await this.fadeTrans(fromElement, toElement, transitionConfig);
        break;
      case 'slide':
        await this.slideTrans(fromElement, toElement, transitionConfig);
        break;
      case 'zoom':
        await this.zoomTrans(fromElement, toElement, transitionConfig);
        break;
      // ... weitere Transitions
    }

    this.transitionInProgress = false;
  }

  // Fade Transition
  async fadeTrans(from, to, config) {
    return new Promise((resolve) => {
      from.style.transition = `opacity ${config.duration}ms ${config.easing}`;
      to.style.transition = `opacity ${config.duration}ms ${config.easing}`;
      
      to.style.opacity = '0';
      to.style.display = 'block';
      
      requestAnimationFrame(() => {
        from.style.opacity = '0';
        to.style.opacity = '1';
      });

      setTimeout(() => {
        from.style.display = 'none';
        resolve();
      }, config.duration);
    });
  }

  // Slide Transition
  async slideTrans(from, to, config) {
    const directions = {
      left: { fromX: '0%', toX: '-100%', newX: '100%' },
      right: { fromX: '0%', toX: '100%', newX: '-100%' },
      up: { fromY: '0%', toY: '-100%', newY: '100%' },
      down: { fromY: '0%', toY: '100%', newY: '-100%' }
    };

    const dir = directions[config.direction];
    
    return new Promise((resolve) => {
      to.style.transform = dir.newX ? `translateX(${dir.newX})` : `translateY(${dir.newY})`;
      to.style.display = 'block';

      requestAnimationFrame(() => {
        from.style.transition = `transform ${config.duration}ms ${config.easing}`;
        to.style.transition = `transform ${config.duration}ms ${config.easing}`;

        from.style.transform = dir.toX ? `translateX(${dir.toX})` : `translateY(${dir.toY})`;
        to.style.transform = 'translate(0, 0)';
      });

      setTimeout(() => {
        from.style.display = 'none';
        from.style.transform = '';
        resolve();
      }, config.duration);
    });
  }

  // Element-Animation ausführen
  async animateElement(element, animationConfig) {
    const animation = this.createAnimation(element, animationConfig);
    this.activeAnimations.push(animation);
    
    await animation.finished;
    
    this.activeAnimations = this.activeAnimations.filter(a => a !== animation);
  }

  // Web Animations API verwenden
  createAnimation(element, config) {
    const keyframes = this.getKeyframes(config.effectName, config);
    
    return element.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      fill: 'forwards'
    });
  }

  // Keyframes für verschiedene Effekte
  getKeyframes(effectName, config) {
    const keyframeMap = {
      fadeIn: [
        { opacity: 0 },
        { opacity: 1 }
      ],
      flyIn: [
        { 
          opacity: 0,
          transform: this.getDirectionTransform(config.direction, 100)
        },
        { 
          opacity: 1,
          transform: 'translate(0, 0)'
        }
      ],
      zoomIn: [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      pulse: [
        { transform: 'scale(1)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1)' }
      ]
      // ... weitere Effekte
    };

    return keyframeMap[effectName] || keyframeMap.fadeIn;
  }

  getDirectionTransform(direction, distance) {
    const transforms = {
      left: `translateX(-${distance}px)`,
      right: `translateX(${distance}px)`,
      up: `translateY(-${distance}px)`,
      down: `translateY(${distance}px)`
    };
    return transforms[direction] || 'translate(0, 0)';
  }
}
```

### 4. Animation Timeline UI (`components/AnimationTimeline.js`)

Visual timeline component für Sequencing von Animationen:

```javascript
class AnimationTimeline {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.animations = [];
    this.playhead = 0;
    this.duration = 10000; // 10 Sekunden default
    this.scale = 100; // px per second
  }

  render() {
    const html = `
      <div class="timeline">
        <div class="timeline-ruler"></div>
        <div class="timeline-tracks">
          ${this.animations.map(anim => this.renderTrack(anim)).join('')}
        </div>
        <div class="timeline-playhead" style="left: ${this.playhead * this.scale}px"></div>
      </div>
    `;
    this.container.innerHTML = html;
  }

  renderTrack(animation) {
    const left = (animation.startTime / 1000) * this.scale;
    const width = (animation.duration / 1000) * this.scale;
    
    return `
      <div class="timeline-track" data-animation-id="${animation.id}">
        <div class="timeline-block" style="left: ${left}px; width: ${width}px">
          <span>${animation.effectName}</span>
        </div>
      </div>
    `;
  }

  // Drag-Drop für Reordering
  enableDragDrop() {
    // Implementation
  }
}
```

---

## 🎭 CSS-Klassen für Transitions

### `css/transitions.css`

```css
/* ============================================
   SLIDE TRANSITIONS
   ============================================ */

/* Fade Transition */
.transition-fade-enter {
  opacity: 0;
}
.transition-fade-enter-active {
  opacity: 1;
  transition: opacity var(--duration, 800ms) var(--easing, ease-in-out);
}
.transition-fade-exit {
  opacity: 1;
}
.transition-fade-exit-active {
  opacity: 0;
  transition: opacity var(--duration, 800ms) var(--easing, ease-in-out);
}

/* Slide Transitions */
.transition-slide-left-enter {
  transform: translateX(100%);
}
.transition-slide-left-enter-active {
  transform: translateX(0);
  transition: transform var(--duration, 600ms) var(--easing, ease-in-out);
}
.transition-slide-left-exit-active {
  transform: translateX(-100%);
  transition: transform var(--duration, 600ms) var(--easing, ease-in-out);
}

.transition-slide-right-enter {
  transform: translateX(-100%);
}
.transition-slide-right-enter-active {
  transform: translateX(0);
  transition: transform var(--duration, 600ms) var(--easing, ease-in-out);
}
.transition-slide-right-exit-active {
  transform: translateX(100%);
  transition: transform var(--duration, 600ms) var(--easing, ease-in-out);
}

/* Zoom Transition */
.transition-zoom-enter {
  transform: scale(0);
  opacity: 0;
}
.transition-zoom-enter-active {
  transform: scale(1);
  opacity: 1;
  transition: all var(--duration, 800ms) var(--easing, ease-out);
}
.transition-zoom-exit-active {
  transform: scale(0);
  opacity: 0;
  transition: all var(--duration, 800ms) var(--easing, ease-in);
}

/* Cube 3D Transition (benötigt 3D-Container) */
.transition-cube {
  perspective: 1200px;
  transform-style: preserve-3d;
}
.transition-cube-enter {
  transform: rotateY(90deg);
}
.transition-cube-enter-active {
  transform: rotateY(0deg);
  transition: transform var(--duration, 1000ms) var(--easing, ease-in-out);
}
.transition-cube-exit-active {
  transform: rotateY(-90deg);
  transition: transform var(--duration, 1000ms) var(--easing, ease-in-out);
}

/* ============================================
   ELEMENT ANIMATIONS
   ============================================ */

/* Entrance: Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.anim-fadeIn {
  animation: fadeIn var(--duration, 500ms) var(--easing, ease-out) var(--delay, 0ms) forwards;
}

/* Entrance: Fly In */
@keyframes flyInLeft {
  from { 
    opacity: 0;
    transform: translateX(-100px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}
.anim-flyInLeft {
  animation: flyInLeft var(--duration, 600ms) var(--easing, ease-out) var(--delay, 0ms) forwards;
}

@keyframes flyInRight {
  from { 
    opacity: 0;
    transform: translateX(100px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}
.anim-flyInRight {
  animation: flyInRight var(--duration, 600ms) var(--easing, ease-out) var(--delay, 0ms) forwards;
}

/* Entrance: Zoom In */
@keyframes zoomIn {
  from { 
    opacity: 0;
    transform: scale(0.3);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}
.anim-zoomIn {
  animation: zoomIn var(--duration, 500ms) var(--easing, ease-out) var(--delay, 0ms) forwards;
}

/* Entrance: Bounce In */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.anim-bounceIn {
  animation: bounceIn var(--duration, 700ms) var(--easing, ease-out) var(--delay, 0ms) forwards;
}

/* Emphasis: Pulse */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.anim-pulse {
  animation: pulse var(--duration, 600ms) var(--easing, ease-in-out) var(--delay, 0ms);
}

/* Emphasis: Shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}
.anim-shake {
  animation: shake var(--duration, 500ms) var(--easing, ease-in-out) var(--delay, 0ms);
}

/* Exit: Fade Out */
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
.anim-fadeOut {
  animation: fadeOut var(--duration, 500ms) var(--easing, ease-in) var(--delay, 0ms) forwards;
}

/* ============================================
   UTILITY CLASSES
   ============================================ */

.no-animation {
  animation: none !important;
  transition: none !important;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## ⚙️ Konfigurations-Presets

### `config/effect-presets.json`

```json
{
  "transitions": {
    "fade": {
      "name": "Fade",
      "defaultDuration": 800,
      "defaultEasing": "ease-in-out",
      "cssClass": "transition-fade",
      "previewGif": "/assets/previews/fade.gif"
    },
    "slide": {
      "name": "Slide",
      "defaultDuration": 600,
      "defaultEasing": "ease-in-out",
      "directions": ["left", "right", "up", "down"],
      "cssClass": "transition-slide-{direction}",
      "previewGif": "/assets/previews/slide.gif"
    },
    "zoom": {
      "name": "Zoom",
      "defaultDuration": 800,
      "defaultEasing": "ease-out",
      "cssClass": "transition-zoom",
      "previewGif": "/assets/previews/zoom.gif"
    }
  },
  "animations": {
    "entrance": {
      "fadeIn": {
        "name": "Fade In",
        "defaultDuration": 500,
        "cssClass": "anim-fadeIn"
      },
      "flyIn": {
        "name": "Fly In",
        "defaultDuration": 600,
        "directions": ["left", "right", "up", "down"],
        "cssClass": "anim-flyIn{Direction}"
      },
      "zoomIn": {
        "name": "Zoom In",
        "defaultDuration": 500,
        "cssClass": "anim-zoomIn"
      },
      "bounceIn": {
        "name": "Bounce In",
        "defaultDuration": 700,
        "cssClass": "anim-bounceIn"
      }
    },
    "emphasis": {
      "pulse": {
        "name": "Pulse",
        "defaultDuration": 600,
        "cssClass": "anim-pulse"
      },
      "shake": {
        "name": "Shake",
        "defaultDuration": 500,
        "cssClass": "anim-shake"
      }
    },
    "exit": {
      "fadeOut": {
        "name": "Fade Out",
        "defaultDuration": 500,
        "cssClass": "anim-fadeOut"
      }
    }
  }
}
```

---

## 📊 Performance-Überlegungen

### Hardware-Beschleunigung

Für optimale Performance auf Raspberry Pi:

```css
.slide-container {
  /* GPU-beschleunigung forcieren */
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}
```

### Optimierungen für Display

```javascript
// In display.js
class PerformanceManager {
  constructor() {
    this.isLowPerformance = this.detectPerformance();
  }

  detectPerformance() {
    // Raspberry Pi detection
    const isRaspberryPi = /Raspberry/.test(navigator.userAgent);
    const isSlowDevice = navigator.hardwareConcurrency <= 4;
    return isRaspberryPi || isSlowDevice;
  }

  getOptimalEffectConfig(effectConfig) {
    if (this.isLowPerformance) {
      // Reduziere Komplexität
      return {
        ...effectConfig,
        duration: Math.min(effectConfig.duration, 500), // Max 500ms
        use3D: false, // Keine 3D-Effekte
        complexity: 'low'
      };
    }
    return effectConfig;
  }
}
```

### Lazy Loading

Nur Effekte laden, die tatsächlich verwendet werden:

```javascript
class EffectLoader {
  constructor() {
    this.loadedEffects = new Set();
  }

  async loadEffect(effectName) {
    if (this.loadedEffects.has(effectName)) return;

    // Dynamisch CSS/JS für Effekt laden
    await this.loadCSS(`/css/effects/${effectName}.css`);
    
    this.loadedEffects.add(effectName);
  }

  async loadCSS(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
}
```

---

## 🧪 Testing-Strategie

### Unit Tests

```javascript
// tests/unit/EffectRenderer.test.ts
describe('EffectRenderer', () => {
  let renderer;

  beforeEach(() => {
    renderer = new EffectRenderer();
  });

  test('should perform fade transition', async () => {
    const from = document.createElement('div');
    const to = document.createElement('div');
    const config = { transitionType: 'fade', duration: 100 };

    await renderer.performTransition(from, to, config);

    expect(from.style.display).toBe('none');
    expect(to.style.opacity).toBe('1');
  });

  test('should handle invalid transition gracefully', async () => {
    const config = { transitionType: 'invalid' };
    
    await expect(
      renderer.performTransition(null, null, config)
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```javascript
// tests/integration/animations.test.ts
describe('Animation Integration', () => {
  test('should save and load animations via API', async () => {
    const postId = 1;
    const animation = {
      elementSelector: '.title',
      effectName: 'fadeIn',
      duration: 500
    };

    // POST
    const response = await fetch(`/api/posts/${postId}/animations`, {
      method: 'POST',
      body: JSON.stringify(animation)
    });
    expect(response.status).toBe(201);

    // GET
    const getResponse = await fetch(`/api/posts/${postId}/animations`);
    const data = await getResponse.json();
    expect(data.animations).toHaveLength(1);
    expect(data.animations[0].effectName).toBe('fadeIn');
  });
});
```

### E2E Tests (Playwright)

```javascript
// tests/e2e/effects.spec.ts
import { test, expect } from '@playwright/test';

test('user can add transition to post', async ({ page }) => {
  await page.goto('/admin');
  await page.click('text=Neuer Beitrag');
  await page.fill('#post-title', 'Test Post');
  
  // Öffne Transition-Picker
  await page.click('button:has-text("Übergang hinzufügen")');
  await page.click('.transition-option[data-type="fade"]');
  
  // Speichern
  await page.click('button:has-text("Speichern")');
  
  // Verify
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

---

## 📱 Mobile & Accessibility

### Responsive Design

```css
/* Kleinere Screens: Vereinfachte Animationen */
@media (max-width: 768px) {
  .anim-flyIn,
  .anim-zoomIn {
    animation-duration: 300ms !important; /* Schneller */
  }

  /* 3D-Effekte deaktivieren */
  .transition-cube,
  .transition-flip {
    animation: fadeIn 300ms ease-out !important;
  }
}
```

### Reduced Motion Support

```javascript
// In display.js
function shouldUseAnimations() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    return false;
  }

  // Check user setting in DB
  return displaySettings.enableAnimations !== false;
}

// Bei Slide-Wechsel prüfen
if (!shouldUseAnimations()) {
  // Instant switch ohne Animation
  switchSlideInstant(nextPost);
} else {
  // Mit Animation
  transitionToSlide(nextPost, transitionConfig);
}
```

### Accessibility Labels

```html
<!-- Animation Status für Screen Reader -->
<div 
  class="slide-content" 
  role="region" 
  aria-live="polite"
  aria-label="Aktueller Beitrag"
>
  <!-- Content -->
</div>

<!-- Animation Controls -->
<button 
  aria-label="Animations-Einstellungen"
  aria-expanded="false"
>
  <span aria-hidden="true">🎬</span>
  Animationen
</button>
```

---

## 📚 Dokumentation & Training

### User Documentation

**Bereitzustellende Dokumentation:**

1. **Admin-Handbuch:**
   - `EFFECTS-ADMIN-GUIDE.md`
   - Tutorial: Erste Transition hinzufügen
   - Tutorial: Element-Animationen erstellen
   - Best Practices für professionelle Präsentationen

2. **Developer Documentation:**
   - `EFFECTS-API-REFERENCE.md`
   - Architecture Overview
   - Custom Effect Development Guide
   - Performance Tuning Guide

3. **Video Tutorials:**
   - "Erste Schritte mit Transitions"
   - "Element-Animationen für Fortgeschrittene"
   - "Timeline-Editor Masterclass"

### Code Examples

```markdown
# Beispiel: Custom Effect erstellen

## 1. CSS Keyframes definieren

```css
@keyframes myCustomEffect {
  0% { 
    opacity: 0;
    transform: rotate(0deg) scale(0);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    opacity: 1;
    transform: rotate(360deg) scale(1);
  }
}
```

## 2. Preset registrieren

```javascript
// config/effect-presets.json
{
  "animations": {
    "entrance": {
      "myCustomEffect": {
        "name": "My Custom Effect",
        "defaultDuration": 800,
        "cssClass": "anim-myCustomEffect"
      }
    }
  }
}
```

## 3. Im Admin verwenden

Der Effekt steht automatisch im Animation-Builder zur Verfügung!
```
```

---

## 📈 Timeline & Meilensteine

### Gesamte Projekt-Timeline: 9-12 Wochen

| Phase | Dauer | Start | Ende | Meilensteine |
|-------|-------|-------|------|--------------|
| **Phase 1: Transitions** | 3 Wochen | Woche 1 | Woche 3 | 8 Transitions funktional |
| **Phase 2: Element-Animations** | 4 Wochen | Woche 4 | Woche 7 | 15+ Animationen + Timeline-Editor |
| **Phase 3: Motion Paths** | 2 Wochen | Woche 8 | Woche 9 | Path-Editor + 5 Presets |
| **Phase 4: Build & Polish** | 2 Wochen | Woche 10 | Woche 11 | Build-Animationen + Performance |
| **Testing & Deployment** | 1 Woche | Woche 12 | Woche 12 | Produktion-Release |

### Sprint-Planung (2-Wochen-Sprints)

**Sprint 1-2: Transitions Foundation**
- DB-Schema & Migrations
- Backend-API
- Admin Transition-Picker
- 4 Basic Transitions (fade, slide, zoom, wipe)

**Sprint 3-4: Advanced Transitions & Element-Animations Start**
- 4 Advanced Transitions (cube, flip, push, morph)
- Element-Animations DB-Schema
- Animation-Builder UI (Basic)

**Sprint 5-6: Animation-Builder & Timeline**
- Timeline-Editor vollständig
- 15+ Animation-Effekte
- Trigger-System

**Sprint 7-8: Motion Paths & Build**
- Path-Editor
- Build-Animationen
- Integration & Testing

**Sprint 9: Polish & Deployment**
- Performance-Optimierung
- Bug-Fixes
- Dokumentation
- Deployment

---

## 💰 Ressourcen-Schätzung

### Entwickler-Aufwand

| Rolle | Aufwand | Tasks |
|-------|---------|-------|
| **Backend Developer** | 4 Wochen | DB-Schema, API-Endpunkte, Services |
| **Frontend Developer** | 6 Wochen | Admin-UI, Animation-Builder, Timeline |
| **Display-Engineer** | 5 Wochen | Effect-Renderer, Performance-Tuning |
| **UX Designer** | 2 Wochen | UI/UX für Admin-Tools, Presets |
| **QA Engineer** | 2 Wochen | Testing (Unit, Integration, E2E) |
| **Technical Writer** | 1 Woche | Dokumentation |

**Gesamt:** ~20 Entwicklerwochen

### Externe Dependencies

**NPM Packages (optional):**
- `anime.js` - Leichtgewichtige Animation-Library (~8KB gzipped)
- `gsap` - Professionelle Animation-Library (lizenziert)
- `three.js` - Für 3D-Effekte (falls benötigt)

**Assets:**
- Preview-GIFs für alle Effekte (Designer erstellen)
- Icon-Set für Animation-Typen
- Tutorial-Videos

---

## 🚀 Deployment-Strategie

### Feature-Flags

Effekte schrittweise ausrollen:

```javascript
// config/feature-flags.js
module.exports = {
  features: {
    transitions: {
      enabled: true,
      allowedTypes: ['fade', 'slide', 'zoom'] // Zunächst nur einfache
    },
    elementAnimations: {
      enabled: false, // Später aktivieren
      allowedTypes: []
    },
    motionPaths: {
      enabled: false
    }
  }
};
```

### Rollout-Plan

1. **Alpha (Woche 3):** Transitions auf Test-System
2. **Beta (Woche 7):** Element-Animations für ausgewählte Benutzer
3. **RC (Woche 11):** Alle Features, Feature-Flags konfigurierbar
4. **Production (Woche 12):** General Availability

### Migration-Strategie

```sql
-- Backwards-compatible: Alte Posts funktionieren weiter
-- Neue Spalten sind optional (NULL erlaubt)
-- Default: Keine Animationen (auto_animate = false)

-- Nach Deployment: Bestehende Posts optional migrieren
UPDATE posts 
SET auto_animate = true,
    animation_delay = 500
WHERE content_type IN ('image', 'video')
  AND created_at > '2026-01-01';
```

---

## ⚠️ Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| **Performance auf Raspberry Pi** | Hoch | Hoch | - Early Performance Testing<br>- Hardware-beschleunigte CSS<br>- Complexity-Fallbacks |
| **Browser-Kompatibilität** | Mittel | Mittel | - Feature Detection<br>- Polyfills<br>- Graceful Degradation |
| **Komplexität für Enduser** | Mittel | Hoch | - Intuitive UI mit Presets<br>- Video-Tutorials<br>- Smart Defaults |
| **Scope Creep** | Hoch | Mittel | - Klare Phasen-Abgrenzung<br>- Feature-Freeze nach Phase 4 |
| **DB-Performance bei vielen Animationen** | Niedrig | Mittel | - Indizes optimieren<br>- Caching-Strategie<br>- Lazy Loading |

---

## 📊 Success Metrics

### KPIs für Erfolg

1. **Performance:**
   - 60 FPS auf Raspberry Pi 4 bei Standard-Transitions
   - < 100ms Latenz beim Slide-Wechsel
   - < 50MB RAM-Overhead durch Animations

2. **Adoption:**
   - 70% der Posts verwenden Transitions nach 1 Monat
   - 40% der Posts verwenden Element-Animationen
   - 80% User-Zufriedenheit (Survey)

3. **Technical:**
   - 0 kritische Bugs im Production-Release
   - < 1% Error-Rate bei API-Calls
   - 90%+ Unit-Test-Coverage

---

## 🔄 Zukünftige Erweiterungen (Post-MVP)

### Phase 5+: Advanced Features

- **AI-gestützte Effect-Suggestions:**
  - Automatische Vorschläge basierend auf Content-Type
  - "Smart Animate" wie in Figma

- **PowerPoint-Import mit Effect-Erhalt:**
  - PPTX-Parser mit Animation-Mapping
  - Automatische Konvertierung zu Web-Animationen

- **Interactive Animations:**
  - Click-getriggerte Animationen
  - Hover-Effekte
  - Scroll-basierte Parallax

- **Advanced 3D Effects:**
  - Three.js-Integration
  - Particle-Systems
  - WebGL Shader-Effekte

- **Collaboration Features:**
  - Real-time Preview für Multi-User
  - Effect-Templates teilen
  - Community-Library

---

## 📞 Kontakt & Support

**Projekt-Lead:** [Name]  
**Backend-Lead:** [Name]  
**Frontend-Lead:** [Name]  

**Slack-Channel:** #prasco-animations  
**Jira-Board:** PRASCO-EFFECTS  

---

## 📄 Anhang

### A. Vollständige Effect-Liste

**Transitions (8):**
1. Fade
2. Slide (left/right/up/down)
3. Zoom
4. Wipe
5. Push
6. Cube
7. Flip
8. Morph

**Entrance Effects (12):**
1. Fade In
2. Fly In (4 directions)
3. Zoom In
4. Bounce In
5. Rotate In
6. Split (horizontal/vertical)
7. Grow
8. Unfold

**Exit Effects (6):**
1. Fade Out
2. Fly Out
3. Zoom Out
4. Collapse
5. Split Out
6. Shrink

**Emphasis Effects (8):**
1. Pulse
2. Grow/Shrink
3. Spin
4. Color Change
5. Shake
6. Wave
7. Glow
8. Highlight

---

### B. Code-Repository-Struktur

```
prasco/
├── src/
│   ├── controllers/
│   │   ├── transitionsController.ts
│   │   ├── animationsController.ts
│   │   └── motionPathsController.ts
│   ├── models/
│   │   ├── SlideTransition.ts
│   │   ├── ElementAnimation.ts
│   │   └── MotionPath.ts
│   ├── services/
│   │   ├── effectService.ts
│   │   └── animationSequencer.ts
│   └── routes/
│       ├── transitions.ts
│       └── animations.ts
├── js/
│   ├── display/
│   │   ├── EffectRenderer.js
│   │   ├── TransitionEngine.js
│   │   ├── AnimationEngine.js
│   │   └── PerformanceManager.js
│   └── admin/
│       ├── TransitionPicker.js
│       ├── AnimationBuilder.js
│       ├── AnimationTimeline.js
│       └── PathEditor.js
├── css/
│   ├── transitions.css
│   ├── animations.css
│   └── effects/
│       ├── fade.css
│       ├── slide.css
│       └── ...
├── config/
│   ├── effect-presets.json
│   └── feature-flags.js
├── migrations/
│   ├── 001_add_slide_transitions.sql
│   ├── 002_add_element_animations.sql
│   └── 003_add_motion_paths.sql
└── docs/
    ├── POWERPOINT-EFFECTS-PLAN.md (dieses Dokument)
    ├── EFFECTS-API-REFERENCE.md
    └── EFFECTS-ADMIN-GUIDE.md
```

---

### C. Browser-Support-Matrix

| Browser | Version | Transitions | Element-Animations | 3D-Effects | Motion-Paths |
|---------|---------|-------------|-------------------|------------|--------------|
| Chrome | 90+ | ✅ | ✅ | ✅ | ✅ |
| Firefox | 88+ | ✅ | ✅ | ✅ | ✅ |
| Safari | 14+ | ✅ | ✅ | ⚠️ | ✅ |
| Edge | 90+ | ✅ | ✅ | ✅ | ✅ |
| RPi Chromium | 120+ | ✅ | ✅ | ⚠️ | ✅ |

✅ Vollständig unterstützt  
⚠️ Eingeschränkt unterstützt (Performance-Fallbacks)  
❌ Nicht unterstützt

---

## ✅ Nächste Schritte

1. **Review dieses Plans** mit Team und Stakeholdern
2. **Genehmigung einholen** für Timeline & Ressourcen
3. **Sprint 1 planen** (DB-Schema & Backend-API)
4. **Entwicklungsumgebung aufsetzen**
5. **Kick-off Meeting** mit allen Beteiligten

---

**Dokument-Version:** 1.0  
**Letztes Update:** 8. Januar 2026  
**Nächstes Review:** Nach Phase 1 (Woche 3)
