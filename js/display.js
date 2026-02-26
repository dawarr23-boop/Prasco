// Display JavaScript - Für das öffentliche Schwarze Brett
// Simuliert API-Aufrufe mit Beispieldaten

let posts = [];
let currentIndex = 0;
let autoRotateTimer = null;

// Display-Identifikation
let currentDisplayIdentifier = null;
let currentDisplayName = null;
let currentDisplayInfo = null; // Vollständige Display-Daten inkl. showTransitData/showTrafficData

// Display-Einstellungen (werden vom Backend geladen)
let displaySettings = {
  refreshInterval: 5, // Standard: 5 Minuten
  defaultDuration: 60, // Standard: 60 Sekunden
  blendEffectsEnabled: true, // Standard: Blend-Effekte aktiviert
  transitionsExternalOnly: false, // Standard: Transitions auf allen Displays
};

// Prüfe ob dieses Display extern ist (nicht localhost)
let isExternalDisplay = false;

function checkIfExternalDisplay() {
  const hostname = window.location.hostname;
  isExternalDisplay = hostname !== 'localhost' && 
                      hostname !== '127.0.0.1' && 
                      hostname !== '::1';
  console.log(`Display-Typ: ${isExternalDisplay ? 'Extern' : 'Lokal (Raspberry Pi)'}`);
  return isExternalDisplay;
}

// Prüfe ob Transitions aktiviert sein sollen
function shouldUseTransitions() {
  // Wenn Feature deaktiviert, nutze normale blendEffectsEnabled Einstellung
  if (!displaySettings.transitionsExternalOnly) {
    return displaySettings.blendEffectsEnabled;
  }
  
  // Wenn Feature aktiviert, nur auf externen Displays Transitions
  const useTransitions = isExternalDisplay && displaySettings.blendEffectsEnabled;
  console.log(`Transitions: ${useTransitions ? 'Aktiviert' : 'Deaktiviert'} (extern: ${isExternalDisplay}, Feature: ${displaySettings.transitionsExternalOnly})`);
  return useTransitions;
}

// Vortragsmodus State (manuelle Navigation)
let presentationModeState = {
  isActive: false,
  isPaused: false,
};

// PowerPoint Präsentations-State
let presentationState = {
  isActive: false,
  slides: [],
  currentSlide: 0,
  slideTimer: null,
  preloadedImages: new Map(), // Cache für vorgeladene Bilder
  domCache: { // Cache für DOM-Elemente
    slideImg: null,
    slideCounter: null,
    progressBar: null
  }
};

// Text-Pagination State (für lange Texte)
let textPaginationState = {
  isActive: false,
  pages: [],
  currentPage: 0,
  postId: null,
};

// Hintergrundmusik-State
let backgroundMusicState = {
  audio: null,
  currentPostId: null,
  fadeInterval: null,
  isGlobalMusic: false,
  userInteracted: false, // Track ob Benutzer interagiert hat (für Autoplay-Policy)
};

// Globale Musik-Einstellungen
let globalMusicSettings = {
  enabled: false,
  url: '',
  volume: 30,
  muteVideos: true,
  priority: 'global', // 'global' oder 'post'
};

// ============================================
// Live-Daten Widget (Transit/Traffic)
// ============================================
let liveDataState = {
  transitSettings: null,
  trafficSettings: null,
  lastInsertTime: 0,
  widgetTimer: null,
  isWidgetActive: false,
};

// Lade Live-Daten-Einstellungen vom Backend
async function loadLiveDataDisplaySettings() {
  try {
    const [transitRes, trafficRes] = await Promise.all([
      fetch('/api/settings?category=transit'),
      fetch('/api/settings?category=traffic'),
    ]);
    if (transitRes.ok) {
      const data = await transitRes.json();
      // API gibt flaches Objekt zurück: { "transit.enabled": "true", ... }
      if (data && typeof data === 'object') {
        const s = {};
        Object.entries(data).forEach(([key, value]) => { s[key] = String(value); });
        liveDataState.transitSettings = s;
      }
    }
    if (trafficRes.ok) {
      const data = await trafficRes.json();
      if (data && typeof data === 'object') {
        const s = {};
        Object.entries(data).forEach(([key, value]) => { s[key] = String(value); });
        liveDataState.trafficSettings = s;
      }
    }
  } catch (e) {
    console.warn('Live-Daten-Einstellungen nicht ladbar:', e);
  }
}

// Prüfe ob Live-Daten gerade angezeigt werden sollen (Zeitplan + Display-Einstellung)
function isLiveDataScheduled() {
  const ts = liveDataState.transitSettings;
  const tr = liveDataState.trafficSettings;
  if (!ts && !tr) return false;

  // Per-Display Einstellung prüfen: Wenn das aktuelle Display Transit/Traffic deaktiviert hat
  const displayAllowsTransit = currentDisplayInfo ? currentDisplayInfo.showTransitData !== false : true;
  const displayAllowsTraffic = currentDisplayInfo ? currentDisplayInfo.showTrafficData !== false : true;

  const transitEnabled = ts?.['transit.enabled'] === 'true' && displayAllowsTransit;
  const trafficEnabled = tr?.['traffic.enabled'] === 'true' && displayAllowsTraffic;
  if (!transitEnabled && !trafficEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Lies Zeitplan aus Settings (Default: 14:00 - 23:59)
  const startStr = ts?.['transit.scheduleStart'] || tr?.['traffic.scheduleStart'] || '14:00';
  const endStr = ts?.['transit.scheduleEnd'] || tr?.['traffic.scheduleEnd'] || '20:00';

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Prüfe ob es Zeit ist, das Live-Daten-Widget einzublenden (alle X Minuten)
function shouldInsertLiveDataWidget() {
  if (!isLiveDataScheduled()) return false;

  const ts = liveDataState.transitSettings;
  const tr = liveDataState.trafficSettings;
  const intervalMin = parseInt(ts?.['transit.displayInterval'] || tr?.['traffic.displayInterval'] || '20', 10);
  const intervalMs = intervalMin * 60 * 1000;

  const now = Date.now();
  if (now - liveDataState.lastInsertTime >= intervalMs) {
    return true;
  }
  return false;
}

// Erstelle Transit-Widget HTML
async function renderTransitWidget() {
  const ts = liveDataState.transitSettings;
  if (!ts || ts['transit.enabled'] !== 'true') return '';
  // Per-Display Einstellung prüfen
  if (currentDisplayInfo && currentDisplayInfo.showTransitData === false) return '';

  const stationId = ts['transit.stationId'];
  const stationName = ts['transit.stationName'] || 'Haltestelle';
  const maxDep = parseInt(ts['transit.maxDepartures'] || '10', 10);
  const duration = parseInt(ts['transit.duration'] || '60', 10);

  if (!stationId) return '';

  try {
    const response = await fetch(`/api/transit/departures/${stationId}?results=${maxDep}&duration=${duration}`);
    if (!response.ok) return '';
    const data = await response.json();
    if (!data.success || !data.data || data.data.length === 0) {
      return `<div class="live-widget-section"><h3>🚌 ${stationName}</h3><p class="no-data">Aktuell keine Abfahrten</p></div>`;
    }

    // Filtere nach aktivierten Verkehrsmitteln
    const showBus = ts['transit.showBus'] !== 'false';
    const showRegional = ts['transit.showRegional'] !== 'false';
    const showSBahn = ts['transit.showSBahn'] !== 'false';
    const showUBahn = ts['transit.showUBahn'] !== 'false';
    const showTram = ts['transit.showTram'] !== 'false';
    const showFernzug = ts['transit.showFernzug'] !== 'false';
    const showFaehre = ts['transit.showFaehre'] !== 'false';

    const filteredDeps = data.data.filter(dep => {
      const product = dep.line?.product || '';
      if (product === 'bus' && !showBus) return false;
      if ((product === 'regional' || product === 'regional-express') && !showRegional) return false;
      if (product === 'suburban' && !showSBahn) return false;
      if (product === 'subway' && !showUBahn) return false;
      if (product === 'tram' && !showTram) return false;
      if ((product === 'national' || product === 'national-express') && !showFernzug) return false;
      if (product === 'ferry' && !showFaehre) return false;
      return true;
    });

    if (filteredDeps.length === 0) {
      return `<div class="live-widget-section"><h3>🚌 ${stationName}</h3><p class="no-data">Keine passenden Abfahrten</p></div>`;
    }

    const rows = filteredDeps.slice(0, maxDep).map(dep => {
      const when = dep.when ? new Date(dep.when) : null;
      const planned = dep.plannedWhen ? new Date(dep.plannedWhen) : null;
      const timeStr = when ? when.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--';
      const delayMin = dep.delay ? Math.round(dep.delay / 60) : 0;
      const delayClass = delayMin > 0 ? 'delayed' : (dep.cancelled ? 'cancelled' : 'on-time');
      const delayStr = dep.cancelled ? 'Fällt aus' : (delayMin > 0 ? `+${delayMin}` : '');
      const lineName = dep.line?.name || '?';
      const product = dep.line?.product || 'bus';
      const direction = dep.direction || '';
      const platform = dep.platform || '';

      return `<tr class="dep-row ${delayClass}">
        <td class="dep-line"><span class="line-badge line-${product}">${lineName}</span></td>
        <td class="dep-direction">${direction}</td>
        <td class="dep-platform">${platform}</td>
        <td class="dep-time">${timeStr}</td>
        <td class="dep-delay ${delayClass}">${delayStr}</td>
      </tr>`;
    }).join('');

    return `<div class="live-widget-section">
      <h3>🚌 Abfahrten ${stationName}</h3>
      <table class="live-departure-table">
        <thead><tr><th>Linie</th><th>Richtung</th><th>Gl.</th><th>Abfahrt</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  } catch (e) {
    console.warn('Transit-Widget Fehler:', e);
    return '';
  }
}

// Erstelle Traffic-Widget HTML
async function renderTrafficWidget() {
  const tr = liveDataState.trafficSettings;
  if (!tr || tr['traffic.enabled'] !== 'true') return '';
  // Per-Display Einstellung prüfen
  if (currentDisplayInfo && currentDisplayInfo.showTrafficData === false) return '';

  const highways = (tr['traffic.highways'] || '').split(',').filter(Boolean);
  const maxWarnings = parseInt(tr['traffic.maxWarnings'] || '5', 10);
  const showWarnings = tr['traffic.showWarnings'] !== 'false';
  const showRoadworks = tr['traffic.showRoadworks'] !== 'false';
  const showClosures = tr['traffic.showClosures'] !== 'false';

  if (highways.length === 0) return '';

  try {
    let allItems = [];
    for (const hw of highways.slice(0, 5)) {
      const response = await fetch(`/api/traffic/highways/${hw}`);
      if (!response.ok) continue;
      const data = await response.json();
      if (!data.success) continue;

      const warnings = showWarnings ? (data.data.warnings || []).slice(0, maxWarnings) : [];
      const roadworks = showRoadworks ? (data.data.roadworks || []).slice(0, maxWarnings) : [];
      const closures = showClosures ? (data.data.closures || []).slice(0, maxWarnings) : [];

      if (warnings.length === 0 && roadworks.length === 0 && closures.length === 0) {
        allItems.push(`<div class="traffic-row clear"><span class="traffic-icon">✅</span><span class="traffic-hw">${hw}</span><span class="traffic-msg">Freie Fahrt</span></div>`);
      } else {
        warnings.forEach(w => {
          allItems.push(`<div class="traffic-row warning"><span class="traffic-icon">⚠️</span><span class="traffic-hw">${hw}</span><span class="traffic-msg">${w.title || 'Verkehrswarnung'}</span></div>`);
        });
        roadworks.forEach(r => {
          allItems.push(`<div class="traffic-row roadwork"><span class="traffic-icon">🚧</span><span class="traffic-hw">${hw}</span><span class="traffic-msg">${r.title || 'Baustelle'}</span></div>`);
        });
        closures.forEach(c => {
          allItems.push(`<div class="traffic-row closure"><span class="traffic-icon">🚫</span><span class="traffic-hw">${hw}</span><span class="traffic-msg">${c.title || 'Sperrung'}</span></div>`);
        });
      }
    }

    if (allItems.length === 0) return '';

    return `<div class="live-widget-section">
      <h3>🛣️ Verkehrslage ${highways.join(', ')}</h3>
      <div class="live-traffic-list">${allItems.join('')}</div>
    </div>`;
  } catch (e) {
    console.warn('Traffic-Widget Fehler:', e);
    return '';
  }
}

// Zeige Live-Daten-Widget als virtuellen Post
async function showLiveDataWidget() {
  liveDataState.lastInsertTime = Date.now();
  liveDataState.isWidgetActive = true;

  const container = document.getElementById('current-post');
  if (!container) return;

  container.className = 'post type-livedata';
  container.innerHTML = '<div class="live-widget-loading"><div class="spinner"></div><p>Lade Live-Daten...</p></div>';

  const [transitHtml, trafficHtml] = await Promise.all([
    renderTransitWidget(),
    renderTrafficWidget(),
  ]);

  if (!transitHtml && !trafficHtml) {
    // Nichts anzuzeigen, weiter zum nächsten normalen Post
    liveDataState.isWidgetActive = false;
    nextPost();
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <div class="live-data-widget">
      <div class="live-widget-header">
        <span class="live-indicator">● LIVE</span>
        <span class="live-title">Verkehrsinformationen</span>
        <span class="live-time">Stand: ${timeStr}</span>
      </div>
      <div class="live-widget-content">
        ${transitHtml}
        ${trafficHtml}
      </div>
      <div class="live-widget-footer">
        <span>Nächste Aktualisierung in ${liveDataState.transitSettings?.['transit.displayInterval'] || '20'} Minuten</span>
      </div>
    </div>
  `;

  // Zeige Widget für 30 Sekunden, dann weiter
  clearTimeout(autoRotateTimer);
  autoRotateTimer = setTimeout(() => {
    liveDataState.isWidgetActive = false;
    nextPost();
  }, 30000);
}

// ============================================
// Display-Einstellungen laden
// ============================================

// Lade Display-Einstellungen vom Backend
async function loadDisplaySettings() {
  try {
    const response = await fetch('/api/settings?category=display');
    if (response.ok) {
      const settings = await response.json();
      
      // Aktualisiere Einstellungen mit korrekten Feldnamen
      if (settings['display.refreshInterval'] !== undefined) {
        displaySettings.refreshInterval = parseInt(settings['display.refreshInterval']) || 5;
      }
      if (settings['display.defaultDuration'] !== undefined) {
        displaySettings.defaultDuration = parseInt(settings['display.defaultDuration']) || 10;
      }
      if (settings['display.blendEffectsEnabled'] !== undefined) {
        displaySettings.blendEffectsEnabled = (settings['display.blendEffectsEnabled'] === 'true' || settings['display.blendEffectsEnabled'] === true);
      }
      if (settings['display.transitionsExternalOnly'] !== undefined) {
        displaySettings.transitionsExternalOnly = (settings['display.transitionsExternalOnly'] === 'true' || settings['display.transitionsExternalOnly'] === true);
      }
      
      console.log('Display-Einstellungen geladen:', displaySettings);
      
      // Setze CSS-Klasse basierend auf Transition-Berechtigung
      updateTransitionsState();
      
      // Aktualisiere Fußzeile
      updateRefreshInfo();
      
      return true;
    } else {
      console.log('Verwende Standard-Einstellungen (Backend nicht verfügbar)');
      // Setze trotzdem Footer-Text mit Standardwerten
      updateRefreshInfo();
      return false;
    }
  } catch (error) {
    console.log('Fehler beim Laden der Display-Einstellungen:', error);
    console.log('Verwende Standard-Einstellungen');
    // Setze trotzdem Footer-Text mit Standardwerten
    updateRefreshInfo();
    return false;
  }
}

// Aktualisiere Refresh-Info in der Fußzeile
function updateRefreshInfo() {
  const refreshElement = document.getElementById('auto-refresh-info');
  if (refreshElement) {
    let text = `Auto-Refresh: ${displaySettings.refreshInterval} Min`;
    if (currentDisplayName) {
      text += ` • 📺 ${currentDisplayName}`;
    }
    refreshElement.textContent = text;
  }
}

// Aktualisiere Transitions-State basierend auf Einstellungen
function updateTransitionsState() {
  if (shouldUseTransitions()) {
    document.body.classList.add('transitions-enabled');
    console.log('✓ Transitions aktiviert');
  } else {
    document.body.classList.remove('transitions-enabled');
    console.log('✓ Transitions deaktiviert (Ressourcenschonend)');
  }
}

// ============================================
// Display-Identifikation
// ============================================

// Hole Display-Identifier aus URL oder LocalStorage
function getDisplayIdentifier() {
  // 1. Versuche URL-Parameter ?id=
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');
  if (urlId) {
    console.log('Display-ID aus URL:', urlId);
    // Speichere in LocalStorage für nächstes Mal
    localStorage.setItem('selectedDisplayId', urlId);
    return urlId;
  }

  // 2. Versuche LocalStorage
  const storedId = localStorage.getItem('selectedDisplayId');
  if (storedId) {
    console.log('Display-ID aus LocalStorage:', storedId);
    return storedId;
  }

  // 3. Keine ID gefunden - Display-Auswahl anzeigen
  console.log('Keine Display-ID gefunden - zeige Display-Auswahl');
  return null;
}

// Lade Display-Informationen
async function loadDisplayInfo(identifier) {
  if (!identifier) return null;

  try {
    const response = await fetch(`/api/displays/by-identifier/${identifier}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        currentDisplayName = data.data.name;
        currentDisplayInfo = data.data;
        console.log('Display geladen:', data.data.name, '| Transit:', data.data.showTransitData, '| Traffic:', data.data.showTrafficData);
        updateRefreshInfo();
        return data.data;
      }
    }
  } catch (error) {
    console.warn('Display-Info konnte nicht geladen werden:', error);
  }
  return null;
}

// Zeige Display-Auswahl Overlay
async function showDisplaySelection() {
  console.log('Zeige Display-Auswahl...');

  // Erstelle Overlay
  const overlay = document.createElement('div');
  overlay.id = 'display-selection-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: Arial, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="max-width: 800px; width: 90%; text-align: center;">
      <h1 style="font-size: 2.5rem; margin-bottom: 2rem;">📺 Display auswählen</h1>
      <p style="font-size: 1.2rem; margin-bottom: 2rem; color: #ccc;">Wählen Sie ein Display aus oder zeigen Sie alle Inhalte an</p>
      <div id="display-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div style="text-align: center; color: #999;">Lade Displays...</div>
      </div>
      <button onclick="selectDisplayAndReload(null)" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 1rem 2rem;
        font-size: 1.1rem;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 1rem;
      ">Alle Inhalte anzeigen (kein spezifisches Display)</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Lade verfügbare Displays (öffentlicher Endpoint, kein Auth nötig)
  try {
    const response = await fetch('/api/public/displays');
    if (response.ok) {
      const data = await response.json();
      const displays = data.data || [];
      const activeDisplays = displays.filter(d => d.isActive);

      const displayList = document.getElementById('display-list');
      if (activeDisplays.length === 0) {
        displayList.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; color: #dc3545; font-size: 1.1rem;">
            <p>⚠️ Keine aktiven Displays verfügbar</p>
            <p style="font-size: 0.9rem; color: #999; margin-top: 1rem;">Erstellen Sie Displays im Admin-Panel</p>
          </div>
        `;
      } else {
        displayList.innerHTML = activeDisplays.map(display => `
          <div onclick="selectDisplayAndReload('${display.identifier}')" style="
            background: #1a1a1a;
            border: 2px solid #333;
            border-radius: 12px;
            padding: 2rem 1.5rem;
            cursor: pointer;
            transition: all 0.3s;
          " onmouseover="this.style.borderColor='#007bff'; this.style.transform='scale(1.05)';" onmouseout="this.style.borderColor='#333'; this.style.transform='scale(1)';">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📺</div>
            <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">${escapeHtml(display.name)}</h3>
            <p style="font-size: 0.9rem; color: #888; font-family: monospace;">${escapeHtml(display.identifier)}</p>
            ${display.description ? `<p style="font-size: 0.85rem; color: #666; margin-top: 0.75rem;">${escapeHtml(display.description)}</p>` : ''}
          </div>
        `).join('');
      }
    }
  } catch (error) {
    document.getElementById('display-list').innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #dc3545;">
        <p>Fehler beim Laden der Displays</p>
        <p style="font-size: 0.9rem; color: #999; margin-top: 0.5rem;">${error.message}</p>
      </div>
    `;
  }
}

// Wähle Display und lade Seite neu
function selectDisplayAndReload(identifier) {
  if (identifier) {
    localStorage.setItem('selectedDisplayId', identifier);
    // Setze URL-Parameter und lade neu
    window.location.href = window.location.pathname + '?id=' + identifier;
  } else {
    // Entferne Display-Auswahl
    localStorage.removeItem('selectedDisplayId');
    window.location.href = window.location.pathname;
  }
}

// Escape HTML für Sicherheit
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text ? String(text).replace(/[&<>"']/g, m => map[m]) : '';
}

// ============================================
// Hintergrundmusik Funktionen
// ============================================

// Lade globale Musik-Einstellungen aus LocalStorage
function loadGlobalMusicSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('globalMusicSettings') || '{}');
    globalMusicSettings = {
      enabled: saved.enabled || false,
      url: saved.url || '',
      volume: saved.volume || 30,
      muteVideos: saved.muteVideos !== false,
      priority: saved.priority || 'global', // 'global' oder 'post'
    };
    
    // Debug-Log
    if (globalMusicSettings.enabled || globalMusicSettings.url) {
      console.log('Globale Musik-Einstellungen geladen:', globalMusicSettings);
    }
  } catch (e) {
    console.log('Fehler beim Laden der globalen Musik-Einstellungen:', e);
  }
}

// Initialisiere Hintergrundmusik-Audio-Element
function initBackgroundMusic() {
  if (!backgroundMusicState.audio) {
    backgroundMusicState.audio = new Audio();
    backgroundMusicState.audio.loop = true;
    backgroundMusicState.audio.preload = 'auto';
  }
}

// Spiele Hintergrundmusik ab (mit Fade-In) - unterstützt globale und Post-spezifische Musik
function playBackgroundMusic(post) {
  // Kein Post vorhanden - stoppe Musik
  if (!post) {
    stopBackgroundMusic();
    return;
  }
  
  initBackgroundMusic();
  loadGlobalMusicSettings();

  const audio = backgroundMusicState.audio;

  // Priorisierung: Konfigurierbar durch globalMusicSettings.priority
  let musicUrl = null;
  let volume = 0.5;
  let isGlobal = false;

  const postMusicUrl = post.backgroundMusicUrl || post.background_music_url;
  const postVolume = (post.backgroundMusicVolume || post.background_music_volume || 50) / 100;

  // Entscheide basierend auf Prioritäts-Einstellung
  if (globalMusicSettings.priority === 'post') {
    // Post-spezifische Musik hat Vorrang
    if (postMusicUrl) {
      musicUrl = postMusicUrl;
      volume = postVolume;
      isGlobal = false;
    } else if (globalMusicSettings.enabled && globalMusicSettings.url) {
      // Fallback auf globale Musik wenn keine Post-Musik
      musicUrl = globalMusicSettings.url;
      volume = globalMusicSettings.volume / 100;
      isGlobal = true;
    }
  } else {
    // Globale Musik hat Vorrang (Standard)
    if (globalMusicSettings.enabled && globalMusicSettings.url) {
      musicUrl = globalMusicSettings.url;
      volume = globalMusicSettings.volume / 100;
      isGlobal = true;
    } else {
      // Fallback auf Post-spezifische Musik
      musicUrl = postMusicUrl;
      volume = postVolume;
      isGlobal = false;
    }
  }

  // Keine Post-Musik für Video-Content (nur wenn keine globale Musik)
  const contentType = post.contentType || post.content_type;
  if (contentType === 'video' && !musicUrl) {
    // Stoppe nur wenn es keine globale Musik gibt
    if (!backgroundMusicState.isGlobalMusic) {
      stopBackgroundMusic();
    }
    return;
  }

  // Keine Musik verfügbar
  if (!musicUrl) {
    stopBackgroundMusic();
    return;
  }

  // Gleiche Musik läuft bereits - vergleiche URLs korrekt (relativ vs. absolut)
  const currentMusicUrl = audio.src ? new URL(audio.src).pathname : '';
  const newMusicPath = musicUrl.startsWith('http') ? new URL(musicUrl).pathname : musicUrl;

  if (currentMusicUrl && currentMusicUrl === newMusicPath && !audio.paused) {
    // Musik läuft bereits, nur Lautstärke anpassen falls nötig
    if (Math.abs(audio.volume - volume) > 0.01) {
      audio.volume = volume;
    }
    backgroundMusicState.isGlobalMusic = isGlobal;
    backgroundMusicState.currentPostId = post.id;
    return;
  }

  // Stoppe aktuelle Musik mit Fade-Out, dann starte neue
  if (!audio.paused && currentMusicUrl !== newMusicPath) {
    fadeOutMusic(() => {
      startNewMusic(musicUrl, volume);
      backgroundMusicState.isGlobalMusic = isGlobal;
    });
  } else {
    startNewMusic(musicUrl, volume);
    backgroundMusicState.isGlobalMusic = isGlobal;
  }

  backgroundMusicState.currentPostId = post.id;
}

// Starte neue Musik mit Fade-In
function startNewMusic(url, targetVolume) {
  const audio = backgroundMusicState.audio;

  audio.src = url;
  audio.volume = 0;

  audio
    .play()
    .then(() => {
      backgroundMusicState.userInteracted = true;
      fadeInMusic(targetVolume);
    })
    .catch((err) => {
      // Autoplay blockiert - warte auf Benutzerinteraktion
      if (err.name === 'NotAllowedError') {
        console.log('Hintergrundmusik wartet auf Benutzerinteraktion...');
        // Versuche es später bei der ersten Interaktion erneut
      } else {
        console.log('Hintergrundmusik konnte nicht gestartet werden:', err.message);
      }
    });
}

// Fade-In Effekt
function fadeInMusic(targetVolume) {
  const audio = backgroundMusicState.audio;
  clearInterval(backgroundMusicState.fadeInterval);

  let currentVolume = 0;
  const step = targetVolume / 20; // 20 Schritte für Fade

  backgroundMusicState.fadeInterval = setInterval(() => {
    currentVolume += step;
    if (currentVolume >= targetVolume) {
      audio.volume = targetVolume;
      clearInterval(backgroundMusicState.fadeInterval);
    } else {
      audio.volume = currentVolume;
    }
  }, 50); // 50ms * 20 = 1 Sekunde Fade
}

// Fade-Out Effekt
function fadeOutMusic(callback) {
  const audio = backgroundMusicState.audio;
  clearInterval(backgroundMusicState.fadeInterval);

  if (audio.paused || audio.volume === 0) {
    if (callback) callback();
    return;
  }

  const startVolume = audio.volume;
  const step = startVolume / 20;

  backgroundMusicState.fadeInterval = setInterval(() => {
    const newVolume = audio.volume - step;
    if (newVolume <= 0) {
      audio.volume = 0;
      audio.pause();
      clearInterval(backgroundMusicState.fadeInterval);
      if (callback) callback();
    } else {
      audio.volume = newVolume;
    }
  }, 50);
}

// Stoppe Hintergrundmusik (mit Fade-Out)
function stopBackgroundMusic() {
  // Bei globaler Musik nicht stoppen
  if (backgroundMusicState.isGlobalMusic && globalMusicSettings.enabled) {
    return;
  }

  fadeOutMusic(() => {
    if (backgroundMusicState.audio) {
      backgroundMusicState.audio.src = '';
    }
    backgroundMusicState.currentPostId = null;
    backgroundMusicState.isGlobalMusic = false;
  });

  // Entferne Indikator
  removeGlobalMusicIndicator();
}

// Zeige/Aktualisiere globalen Musik-Indikator
function updateGlobalMusicIndicator() {
  loadGlobalMusicSettings();

  let indicator = document.getElementById('global-music-indicator');

  if (
    globalMusicSettings.enabled &&
    globalMusicSettings.url &&
    backgroundMusicState.isGlobalMusic
  ) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'global-music-indicator';
      indicator.className = 'global-music-indicator';
      indicator.innerHTML = '<span class="music-icon">♪</span> <span>Hintergrundmusik</span>';
      document.body.appendChild(indicator);
    }
  } else {
    removeGlobalMusicIndicator();
  }
}

// Entferne globalen Musik-Indikator
function removeGlobalMusicIndicator() {
  const indicator = document.getElementById('global-music-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// ============================================
// Video Vollbild Funktionen
// ============================================

// Versuche Video-Element in Vollbild zu setzen
function tryEnterFullscreen(element) {
  // Versuche verschiedene Vollbild-APIs
  if (element.requestFullscreen) {
    element.requestFullscreen().catch((err) => {
      console.log('Vollbild nicht möglich:', err.message);
    });
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitEnterFullscreen) {
    // iOS Safari
    element.webkitEnterFullscreen();
  }
}

// Stelle Header/Footer wieder her wenn Video endet oder Post wechselt
function restoreHeaderFooter() {
  const header = document.querySelector('.display-header');
  const footer = document.querySelector('.display-footer');
  if (header) header.classList.remove('hidden-for-video');
  if (footer) footer.classList.remove('hidden-for-video');

  // Beende Vollbild wenn aktiv
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

// ============================================
// Mock Data & Initialisierung
// ============================================

// Beispiel-Daten (werden später durch echte API ersetzt)
const mockPosts = [
  {
    id: 1,
    title: '📺 Digitaler Infoscreen',
    content: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3rem; border-radius: 20px; color: white; text-align: center;">
<div style="font-size: 3em; margin-bottom: 1rem;">👋</div>
<div style="font-size: 2em; font-weight: bold; margin-bottom: 1rem;">Willkommen!</div>
<div style="font-size: 1.4em; opacity: 0.9;">Hier erhalten Sie aktuelle Informationen,<br>Neuigkeiten und wichtige Ankündigungen</div>
<div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.2); border-radius: 10px; font-size: 1.2em;">
📍 Standort • 🕐 Echtzeit-Updates • 📊 Immer aktuell
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 8,
    priority: 10,
    is_active: true,
  },
  {
    id: 2,
    title: '🌤️ Wetter & Vorhersage',
    content: `<div style="font-size: 1.15em;">
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
  <div style="background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%); padding: 2rem; border-radius: 15px; color: white;">
    <div style="font-size: 2.5em; margin-bottom: 0.5rem;">☁️</div>
    <div style="font-size: 1.8em; font-weight: bold;">4°C</div>
    <div style="font-size: 1.1em; opacity: 0.9;">Gefühlt 1°C</div>
    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid rgba(255,255,255,0.3);">
      <strong>Heute, 20. Januar</strong><br>
      Teilweise bewölkt
    </div>
  </div>
  <div style="background: #f8f9fa; padding: 2rem; border-radius: 15px; color: #2c3e50;">
    <strong style="font-size: 1.3em; display: block; margin-bottom: 1rem;">🎯 Details</strong>
    💧 Regen: 20%<br>
    💨 Wind: 15 km/h West<br>
    📊 Luftfeuchtigkeit: 78%
  </div>
</div>
<div style="background: #fff; padding: 1.5rem; border-radius: 15px; border: 2px solid #e0e0e0;">
  <strong style="font-size: 1.3em; display: block; margin-bottom: 1rem;">📅 5-Tage Vorhersage</strong>
  <div style="display: flex; justify-content: space-around; text-align: center;">
    <div><div style="font-size: 2em;">⛅</div><strong>Mo</strong><br>6°C</div>
    <div><div style="font-size: 2em;">🌧️</div><strong>Di</strong><br>3°C</div>
    <div><div style="font-size: 2em;">☁️</div><strong>Mi</strong><br>5°C</div>
    <div><div style="font-size: 2em;">⛅</div><strong>Do</strong><br>7°C</div>
    <div><div style="font-size: 2em;">☀️</div><strong>Fr</strong><br>8°C</div>
  </div>
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 12,
    priority: 9,
    is_active: true,
  },
  {
    id: 3,
    title: '🚊 ÖPNV Live-Abfahrten',
    content: `<div style="font-size: 1.1em;">
<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1.5rem; border-radius: 15px; color: white; margin-bottom: 1.5rem; text-align: center;">
  <div style="font-size: 1.8em; font-weight: bold;">🚉 Hauptbahnhof</div>
  <div style="font-size: 1.1em; opacity: 0.9;">Nächste Abfahrten in Echtzeit</div>
</div>

<div style="display: grid; gap: 1rem;">
  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #2196F3; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #2196F3;">🚊 S1</div>
        <div style="color: #666;">→ Flughafen • Gleis 3</div>
      </div>
      <div style="text-align: right; font-size: 1.3em;">
        <strong style="color: #4CAF50;">08:15</strong> • 08:30 • 08:45 • 09:00
      </div>
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #FF9800; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #FF9800;">🚌 142</div>
        <div style="color: #666;">→ Stadtmitte • Steig B</div>
      </div>
      <div style="text-align: right; font-size: 1.3em;">
        <strong style="color: #4CAF50;">08:12</strong> • 08:22 • 08:32 • 08:42
      </div>
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #9C27B0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #9C27B0;">🚊 S3</div>
        <div style="color: #666;">→ Messegelände • Gleis 5</div>
      </div>
      <div style="text-align: right; font-size: 1.3em;">
        <strong style="color: #4CAF50;">08:18</strong> • 08:33 • 08:48
      </div>
    </div>
  </div>
</div>

<div style="background: #4CAF50; color: white; padding: 1rem; border-radius: 10px; margin-top: 1.5rem; text-align: center; font-size: 1.2em;">
  ✅ Alle Linien pünktlich
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 15,
    priority: 8,
    is_active: true,
  },
  {
    id: 4,
    title: '🚗 Verkehrslage Live',
    content: `<div style="font-size: 1.1em;">
<div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 1.5rem; border-radius: 15px; color: #333; margin-bottom: 1.5rem; text-align: center; font-weight: bold; font-size: 1.5em;">
  🛣️ Autobahn-Verkehrsinformation
</div>

<div style="display: grid; gap: 1.2rem;">
  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #4CAF50; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-size: 1.5em; font-weight: bold; color: #4CAF50; margin-bottom: 0.5rem;">
      🟢 A1 → Bremen
    </div>
    <div style="color: #666; font-size: 1.1em;">
      ✓ Fließender Verkehr, keine Behinderungen
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #FF9800; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-size: 1.5em; font-weight: bold; color: #FF9800; margin-bottom: 0.5rem;">
      🟡 A2 → Dortmund
    </div>
    <div style="color: #666; font-size: 1.1em;">
      ⚠️ Zähfließend: AS Bielefeld-Ost ↔ AS Rheda (5 km)<br>
      <strong>+10 Min Verzögerung</strong>
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #4CAF50; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-size: 1.5em; font-weight: bold; color: #4CAF50; margin-bottom: 0.5rem;">
      🟢 A3 → Frankfurt
    </div>
    <div style="color: #666; font-size: 1.1em;">
      ✓ Fließender Verkehr
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #F44336; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-size: 1.5em; font-weight: bold; color: #F44336; margin-bottom: 0.5rem;">
      🔴 A7 → Hamburg
    </div>
    <div style="color: #666; font-size: 1.1em;">
      ⛔ <strong>STAU:</strong> AS Hannover-Nord ↔ AS Mellendorf (8 km)<br>
      <strong style="color: #F44336;">+25 Min Verzögerung</strong><br>
      Grund: Unfall, rechte Spur gesperrt
    </div>
  </div>
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 15,
    priority: 7,
    is_active: true,
  },
  {
    id: 5,
    title: '👥 Schichtplan KW 4',
    content: `<div style="font-size: 1em;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 15px; color: white; margin-bottom: 1.5rem; text-align: center;">
  <div style="font-size: 1.8em; font-weight: bold;">📅 Woche 4 • 20.-26. Januar 2025</div>
</div>

<table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
<thead>
<tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
  <th style="padding: 1rem; text-align: left; font-size: 1.2em;">📆 Tag</th>
  <th style="padding: 1rem; text-align: left; font-size: 1.2em;">🌅 Frühschicht (06-14)</th>
  <th style="padding: 1rem; text-align: left; font-size: 1.2em;">🌙 Spätschicht (14-22)</th>
</tr>
</thead>
<tbody>
<tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 1rem; font-weight: bold;">Mo 20.01</td><td style="padding: 1rem;">Schmidt, Weber, Meyer</td><td style="padding: 1rem;">Müller, Fischer, Becker</td></tr>
<tr style="background: #f8f9fa; border-bottom: 1px solid #e0e0e0;"><td style="padding: 1rem; font-weight: bold;">Di 21.01</td><td style="padding: 1rem;">Müller, Becker, Wagner</td><td style="padding: 1rem;">Schmidt, Weber, Klein</td></tr>
<tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 1rem; font-weight: bold;">Mi 22.01</td><td style="padding: 1rem;">Fischer, Klein, Hoffmann</td><td style="padding: 1rem;">Meyer, Wagner, Schulz</td></tr>
<tr style="background: #f8f9fa; border-bottom: 1px solid #e0e0e0;"><td style="padding: 1rem; font-weight: bold;">Do 23.01</td><td style="padding: 1rem;">Schmidt, Meyer, Schulz</td><td style="padding: 1rem;">Weber, Hoffmann, Fischer</td></tr>
<tr style="border-bottom: 1px solid #e0e0e0;"><td style="padding: 1rem; font-weight: bold;">Fr 24.01</td><td style="padding: 1rem;">Müller, Wagner, Klein</td><td style="padding: 1rem;">Becker, Schmidt, Meyer</td></tr>
<tr style="background: #f8f9fa; border-bottom: 1px solid #e0e0e0;"><td style="padding: 1rem; font-weight: bold;">Sa 25.01</td><td style="padding: 1rem;">Weber, Fischer, Hoffmann</td><td style="padding: 1rem;">Schulz, Klein, Wagner</td></tr>
<tr style="background: #fff3cd;"><td style="padding: 1rem; font-weight: bold;">So 26.01</td><td style="padding: 1rem;">Becker, Meyer, Schmidt</td><td style="padding: 1rem;">Müller, Weber, Fischer</td></tr>
</tbody>
</table>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 18,
    priority: 8,
    is_active: true,
  },
  {
    id: 6,
    title: '🍽️ Kantinenmenü',
    content: `<div style="font-size: 1.05em;">
<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1.5rem; border-radius: 15px; color: white; margin-bottom: 1.5rem; text-align: center; font-size: 1.5em; font-weight: bold;">
  🍽️ Speiseplan diese Woche
</div>

<div style="display: grid; gap: 1rem;">
  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #4CAF50; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 0.8rem; color: #4CAF50;">Montag, 20.01</div>
    <div style="margin-left: 1rem;">
      🥘 Schnitzel mit Pommes und Salat<br>
      🌱 Vegetarisch: Gemüse-Lasagne
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #2196F3; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 0.8rem; color: #2196F3;">Dienstag, 21.01</div>
    <div style="margin-left: 1rem;">
      🍝 Spaghetti Bolognese<br>
      🌱 Vegetarisch: Käsespätzle
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #FF9800; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 0.8rem; color: #FF9800;">Mittwoch, 22.01</div>
    <div style="margin-left: 1rem;">
      🍗 Hähnchenbrust mit Reis<br>
      🌱 Vegetarisch: Thai-Gemüsepfanne
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #9C27B0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 0.8rem; color: #9C27B0;">Donnerstag, 23.01</div>
    <div style="margin-left: 1rem;">
      🥩 Gulasch mit Kartoffeln<br>
      🌱 Vegetarisch: Linsen-Dal
    </div>
  </div>

  <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #00BCD4; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 0.8rem; color: #00BCD4;">Freitag, 24.01</div>
    <div style="margin-left: 1rem;">
      🐟 Fischstäbchen mit Kartoffelpüree<br>
      🌱 Vegetarisch: Pizza Margherita
    </div>
  </div>
</div>

<div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; margin-top: 1rem; text-align: center;">
  🥗 Täglich frisches Salatbuffet verfügbar
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 16,
    priority: 6,
    is_active: true,
  },
  {
    id: 7,
    title: '🚪 Meetingraum Status',
    content: `<div style="font-size: 1.1em;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 15px; color: white; margin-bottom: 1.5rem; text-align: center;">
  <div style="font-size: 1.8em; font-weight: bold;">📍 Aktuelle Raumbelegung</div>
  <div style="font-size: 1.1em; opacity: 0.9; margin-top: 0.5rem;">Montag, 20.01 • Echtzeit</div>
</div>

<div style="display: grid; gap: 1.2rem;">
  <div style="background: #d4edda; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #28a745; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #155724;">🟢 Raum A</div>
        <div style="color: #155724;">Kapazität: 8 Personen</div>
      </div>
      <div style="background: #28a745; color: white; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; font-size: 1.2em;">
        FREI
      </div>
    </div>
  </div>

  <div style="background: #f8d7da; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #dc3545; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div>
      <div style="font-size: 1.5em; font-weight: bold; color: #721c24; margin-bottom: 0.5rem;">🔴 Raum B</div>
      <div style="color: #721c24;">Kapazität: 12 Personen</div>
      <div style="background: rgba(220,53,69,0.2); padding: 0.8rem; border-radius: 8px; margin-top: 0.8rem;">
        <strong>Belegt bis 10:30 Uhr</strong><br>
        "Projektbesprechung Marketing"
      </div>
    </div>
  </div>

  <div style="background: #d4edda; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #28a745; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #155724;">🟢 Raum C</div>
        <div style="color: #155724;">Kapazität: 6 Personen</div>
      </div>
      <div style="background: #28a745; color: white; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; font-size: 1.2em;">
        FREI
      </div>
    </div>
  </div>

  <div style="background: #fff3cd; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #ffc107; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div>
      <div style="font-size: 1.5em; font-weight: bold; color: #856404; margin-bottom: 0.5rem;">🟡 Raum D</div>
      <div style="color: #856404;">Kapazität: 20 Personen</div>
      <div style="background: rgba(255,193,7,0.3); padding: 0.8rem; border-radius: 8px; margin-top: 0.8rem;">
        <strong>Belegt 11:00-13:00 Uhr</strong><br>
        "Sales Quartalsbesprechung"
      </div>
    </div>
  </div>

  <div style="background: #d4edda; padding: 1.5rem; border-radius: 12px; border-left: 6px solid #28a745; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #155724;">🟢 Raum E</div>
        <div style="color: #155724;">Kapazität: 4 Personen</div>
      </div>
      <div style="background: #28a745; color: white; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; font-size: 1.2em;">
        FREI
      </div>
    </div>
  </div>
</div>

<div style="background: #e7f3ff; padding: 1rem; border-radius: 10px; margin-top: 1.5rem; text-align: center; color: #004085;">
  💡 Buchung über Intranet oder Rezeption
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 14,
    priority: 6,
    is_active: true,
  },
  {
    id: 8,
    title: '📢 Betriebsversammlung',
    content: `<div style="font-size: 1.15em;">
<div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 2.5rem; border-radius: 20px; text-align: center; margin-bottom: 2rem;">
  <div style="font-size: 3em; margin-bottom: 1rem;">📢</div>
  <div style="font-size: 2em; font-weight: bold; color: #333;">Wichtige Ankündigung</div>
</div>

<div style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 3px solid #f5576c;">
  <div style="text-align: center; font-size: 1.8em; font-weight: bold; color: #f5576c; margin-bottom: 2rem;">
    BETRIEBSVERSAMMLUNG
  </div>

  <div style="display: grid; grid-template-columns: auto 1fr; gap: 1.5rem; margin-bottom: 2rem; font-size: 1.2em;">
    <div style="text-align: right; font-weight: bold; color: #666;">📅 Datum:</div>
    <div><strong style="color: #f5576c;">Freitag, 24. Januar 2025</strong></div>
    
    <div style="text-align: right; font-weight: bold; color: #666;">🕐 Zeit:</div>
    <div><strong style="color: #f5576c;">14:00 - 16:00 Uhr</strong></div>
    
    <div style="text-align: right; font-weight: bold; color: #666;">📍 Ort:</div>
    <div><strong style="color: #f5576c;">Große Halle, Gebäude A</strong></div>
  </div>

  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
    <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 1rem; color: #333;">📋 Themen:</div>
    <div style="margin-left: 1rem; line-height: 2;">
      • Jahresrückblick 2024<br>
      • Ausblick und Ziele 2025<br>
      • Neue Projekte und Initiativen<br>
      • Fragen und Diskussion
    </div>
  </div>

  <div style="background: #28a745; color: white; padding: 1.2rem; border-radius: 10px; text-align: center; font-size: 1.2em; font-weight: bold; margin-bottom: 1rem;">
    ✅ Teilnahme für alle Mitarbeiter verpflichtend
  </div>

  <div style="text-align: center; color: #666; font-size: 1.1em;">
    ☕ Kaffee und Snacks werden bereitgestellt
  </div>
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 14,
    priority: 9,
    is_active: true,
  },
  {
    id: 9,
    title: '⚠️ Sicherheit im Lager',
    content: `<div style="font-size: 1.1em;">
<div style="background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); padding: 2rem; border-radius: 20px; color: white; text-align: center; margin-bottom: 2rem;">
  <div style="font-size: 3em; margin-bottom: 1rem;">⚠️</div>
  <div style="font-size: 2em; font-weight: bold;">Sicherheitshinweise</div>
  <div style="font-size: 1.3em; opacity: 0.9; margin-top: 0.5rem;">Arbeitssicherheit geht uns alle an!</div>
</div>

<div style="display: grid; gap: 1.5rem;">
  <div style="background: #fff; padding: 2rem; border-radius: 15px; border-left: 6px solid #dc3545; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="display: flex; align-items: center; gap: 1.5rem;">
      <div style="font-size: 3em;">🦺</div>
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #dc3545; margin-bottom: 0.5rem;">
          PSA tragen!
        </div>
        <div style="color: #666; font-size: 1.1em;">
          Vorgeschriebene Schutzausrüstung in Produktions- und Lagerbereichen ist Pflicht
        </div>
      </div>
    </div>
  </div>

  <div style="background: #fff; padding: 2rem; border-radius: 15px; border-left: 6px solid #ffc107; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="display: flex; align-items: center; gap: 1.5rem;">
      <div style="font-size: 3em;">🚪</div>
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #ffc107; margin-bottom: 0.5rem;">
          Notausgänge freihalten!
        </div>
        <div style="color: #666; font-size: 1.1em;">
          Keine Gegenstände in Fluchtwegen abstellen
        </div>
      </div>
    </div>
  </div>

  <div style="background: #fff; padding: 2rem; border-radius: 15px; border-left: 6px solid #ff5722; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="display: flex; align-items: center; gap: 1.5rem;">
      <div style="font-size: 3em;">🔥</div>
      <div>
        <div style="font-size: 1.5em; font-weight: bold; color: #ff5722; margin-bottom: 0.5rem;">
          Brandschutz beachten!
        </div>
        <div style="color: #666; font-size: 1.1em;">
          Feuerlöscher regelmäßig prüfen • Sammelplatz: Parkplatz Süd
        </div>
      </div>
    </div>
  </div>

  <div style="background: #dc3545; color: white; padding: 2rem; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); text-align: center;">
    <div style="font-size: 2.5em; margin-bottom: 1rem;">🚨</div>
    <div style="font-size: 1.8em; font-weight: bold; margin-bottom: 0.5rem;">
      Notfall-Hotline: 5555
    </div>
    <div style="font-size: 1.1em; opacity: 0.9;">
      Sicherheitsbeauftragte:<br>
      Herr Keller (Ext. 234) | Frau Richter (Ext. 187)
    </div>
  </div>
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 15,
    priority: 7,
    is_active: true,
  },
  {
    id: 10,
    title: '🎉 Projekterfolg',
    content: `<div style="font-size: 1.15em;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2.5rem; border-radius: 20px; color: white; text-align: center; margin-bottom: 2rem;">
  <div style="font-size: 3em; margin-bottom: 1rem;">🎉</div>
  <div style="font-size: 2em; font-weight: bold;">Unternehmensnews</div>
</div>

<div style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-top: 5px solid #28a745;">
  <div style="text-align: center; margin-bottom: 2rem;">
    <div style="font-size: 1.8em; font-weight: bold; color: #28a745; margin-bottom: 0.5rem;">
      ✅ Erfolgreicher Projektabschluss
    </div>
    <div style="font-size: 1.2em; color: #666;">
      "Digitale Transformation"
    </div>
  </div>

  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
    <div style="font-weight: bold; font-size: 1.3em; margin-bottom: 1rem; color: #333;">
      👏 Herzlichen Glückwunsch an das Team um Frau Schneider!
    </div>
  </div>

  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
      <div style="font-size: 2.5em; font-weight: bold;">30%</div>
      <div style="font-size: 0.9em; opacity: 0.9;">Effizienzsteigerung</div>
    </div>
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
      <div style="font-size: 2.5em; font-weight: bold;">5</div>
      <div style="font-size: 0.9em; opacity: 0.9;">Abteilungen optimiert</div>
    </div>
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #333; padding: 1.5rem; border-radius: 12px; text-align: center;">
      <div style="font-size: 2.5em; font-weight: bold;">120</div>
      <div style="font-size: 0.9em;">Mitarbeiter geschult</div>
    </div>
  </div>

  <div style="background: #d4edda; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #28a745; margin-bottom: 1.5rem;">
    <div style="font-size: 1.2em; font-weight: bold; color: #155724; margin-bottom: 0.5rem;">
      🏆 Projekt 2 Wochen vor Plan abgeschlossen!
    </div>
  </div>

  <div style="background: #e7f3ff; padding: 1.5rem; border-radius: 12px; border-left: 5px solid #2196F3; text-align: center;">
    <div style="font-weight: bold; color: #004085; font-size: 1.2em; margin-bottom: 0.5rem;">
      📢 Nächster Meilenstein
    </div>
    <div style="color: #004085;">
      Rollout in den Außenstellen ab Februar 2025
    </div>
  </div>
</div>
</div>`,
    content_type: 'text',
    media_url: null,
    display_duration: 14,
    priority: 5,
    is_active: true,
  },
];

// Prüfe ob Vortragsmodus aktiviert wurde (via URL-Parameter)
function checkPresentationMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  if (mode === 'presentation') {
    presentationModeState.isActive = true;
    presentationModeState.isPaused = true;
    document.body.classList.add('presentation-mode');
    createPresentationControls();
    console.log('🎤 Vortragsmodus aktiviert - Manuelle Navigation');
  }
}

// Erstelle Navigations-Controls für Vortragsmodus
function createPresentationControls() {
  const controlsHtml = `
    <div class="presentation-controls" id="presentation-controls">
      <button class="pres-btn pres-prev" data-action="prev" title="Vorheriger Beitrag (←)">
        ◀
      </button>
      <div class="pres-info">
        <span class="pres-mode-label">VORTRAGSMODUS</span>
        <span class="pres-counter" id="pres-counter">1 / 1</span>
      </div>
      <button class="pres-btn pres-next" data-action="next" title="Nächster Beitrag (→)">
        ▶
      </button>
      <button class="pres-btn pres-toggle" id="pres-toggle" data-action="toggle" title="Auto-Rotation umschalten">
        ▷
      </button>
      <button class="pres-btn pres-fullscreen" id="pres-fullscreen" data-action="fullscreen" title="Vollbild (F)">
        ⛶
      </button>
      <button class="pres-btn pres-exit" data-action="exit" title="Vortragsmodus beenden">
        ✕
      </button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', controlsHtml);
  
  // Event Listeners registrieren (nach DOM-Einfügung)
  const controls = document.getElementById('presentation-controls');
  controls.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    e.stopPropagation(); // Verhindere Propagation zum globalen Click-Handler
    
    switch (btn.dataset.action) {
      case 'prev':
        previousPost();
        break;
      case 'next':
        nextPost();
        break;
      case 'toggle':
        toggleAutoRotation();
        break;
      case 'fullscreen':
        toggleFullscreen();
        break;
      case 'exit':
        exitPresentationMode();
        break;
    }
  });
}

// Toggle Auto-Rotation im Vortragsmodus
function toggleAutoRotation() {
  const toggleBtn = document.getElementById('pres-toggle');

  if (presentationModeState.isPaused) {
    // Starte Auto-Rotation
    presentationModeState.isPaused = false;
    if (toggleBtn) {
      toggleBtn.textContent = '⏸';
      toggleBtn.title = 'Auto-Rotation pausieren';
    }
    // Starte Timer für aktuellen Post
    const post = posts[currentIndex];
    const duration = (post?.duration || displaySettings.defaultDuration) * 1000;
    autoRotateTimer = setTimeout(() => nextPost(), duration);
  } else {
    // Pausiere Auto-Rotation
    presentationModeState.isPaused = true;
    clearTimeout(autoRotateTimer);
    if (toggleBtn) {
      toggleBtn.textContent = '▷';
      toggleBtn.title = 'Auto-Rotation starten';
    }
  }
}

// Vortragsmodus beenden
function exitPresentationMode() {
  presentationModeState.isActive = false;
  presentationModeState.isPaused = false;
  document.body.classList.remove('presentation-mode');
  
  // Entferne Controls
  const controls = document.getElementById('presentation-controls');
  if (controls) {
    controls.remove();
  }
  
  // Starte normale Auto-Rotation
  clearTimeout(autoRotateTimer);
  const post = posts[currentIndex];
  const duration = (post?.duration || displaySettings.defaultDuration) * 1000;
  autoRotateTimer = setTimeout(() => nextPost(), duration);
  
  console.log('📺 Vortragsmodus deaktiviert - Auto-Rotation gestartet');
}

// Vortragsmodus aktivieren/toggeln
function activatePresentationMode() {
  if (presentationModeState.isActive) {
    // Bereits aktiv - deaktiviere
    exitPresentationMode();
  } else {
    // Aktiviere Vortragsmodus
    presentationModeState.isActive = true;
    presentationModeState.isPaused = true;
    document.body.classList.add('presentation-mode');
    
    // Stoppe Auto-Rotation
    clearTimeout(autoRotateTimer);
    
    // Erstelle Controls
    createPresentationControls();
    updatePresentationCounter();
    
    console.log('🎤 Vortragsmodus aktiviert (Umschalt+H) - Manuelle Navigation');
  }
}

// Update Vortragsmodus-Counter
function updatePresentationCounter() {
  const counter = document.getElementById('pres-counter');
  if (counter && posts.length > 0) {
    counter.textContent = `${currentIndex + 1} / ${posts.length}`;
  }
}

// Vollbild-Funktion für Präsentationsmodus
function toggleFullscreen() {
  const fullscreenBtn = document.getElementById('pres-fullscreen');
  
  if (!document.fullscreenElement) {
    // Aktiviere Vollbild
    document.documentElement.requestFullscreen().then(() => {
      document.body.classList.add('fullscreen-mode');
      if (fullscreenBtn) {
        fullscreenBtn.textContent = '⛶';
        fullscreenBtn.title = 'Vollbild verlassen (F)';
      }
      console.log('🖥️ Vollbild aktiviert');
    }).catch(err => {
      console.error('Vollbild-Fehler:', err);
    });
  } else {
    // Verlasse Vollbild
    document.exitFullscreen().then(() => {
      document.body.classList.remove('fullscreen-mode');
      if (fullscreenBtn) {
        fullscreenBtn.textContent = '⛶';
        fullscreenBtn.title = 'Vollbild (F)';
      }
      console.log('🖥️ Vollbild deaktiviert');
    }).catch(err => {
      console.error('Vollbild-Fehler:', err);
    });
  }
}

// Keyboard Shortcuts einrichten
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Umschalt+H: Toggle Vortragsmodus
    if (e.shiftKey && e.key === 'H') {
      e.preventDefault();
      activatePresentationMode();
      return;
    }
    
    // Umschalt+D: Zurück zum Display-Modus (Auto-Rotation)
    if (e.shiftKey && e.key === 'D') {
      e.preventDefault();
      if (presentationModeState.isActive) {
        exitPresentationMode();
      }
      return;
    }
    
    // Nur im Vortragsmodus:
    if (presentationModeState.isActive) {
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          previousPost();
          break;
          
        case 'ArrowRight':
        case 'PageDown':
        case ' ': // Leertaste
          e.preventDefault();
          nextPost();
          break;
          
        case 'Home':
          e.preventDefault();
          currentIndex = 0;
          displayCurrentPost();
          updatePostCounter();
          updatePresentationCounter();
          break;
          
        case 'End':
          e.preventDefault();
          currentIndex = posts.length - 1;
          displayCurrentPost();
          updatePostCounter();
          updatePresentationCounter();
          break;
          
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
          
        case 'r':
        case 'R':
          fetchPosts().then(() => { currentIndex = 0; displayCurrentPost(); });
          break;
          
        case 'p':
        case 'P':
          toggleAutoRotation();
          break;
          
        case 'd':
          showDisplaySelection();
          break;
          
        case 'Escape':
          e.preventDefault();
          if (document.fullscreenElement) {
            // Erst Vollbild verlassen
            toggleFullscreen();
          } else {
            // Dann Präsentationsmodus beenden
            exitPresentationMode();
          }
          break;
      }
      return; // Im Vortragsmodus hier stoppen
    }
    
    // Displaymodus: Basis-Navigation
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      nextPost();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      previousPost();
    } else if (e.key === 'r' || e.key === 'R') {
      fetchPosts().then(() => { currentIndex = 0; displayCurrentPost(); });
    } else if (e.key === 'd' || e.key === 'D') {
      showDisplaySelection();
    }
  });
  
  console.log('⌨️ Keyboard Shortcuts: Umschalt+H = Vortragsmodus | Umschalt+D = Display-Modus');
}

// Initialisierung
async function init() {
  // Prüfe Vortragsmodus vor dem Laden
  checkPresentationMode();
  
  // Keyboard Shortcuts registrieren
  setupKeyboardShortcuts();

  await fetchPosts();
  await loadLiveDataDisplaySettings();
  startClock();
  updateDate();

  // Aktualisiere Refresh-Info nachdem DOM geladen ist
  updateRefreshInfo();

  if (posts.length > 0) {
    displayCurrentPost();
    updatePostCounter();
    updatePresentationCounter();
    
    // Im Vortragsmodus starten nur wenn ?mode=presentation in der URL
    // Ansonsten: Normaler Displaymodus mit Auto-Rotation
    if (!presentationModeState.isActive) {
      // Displaymodus: Auto-Rotation starten
      const post = posts[currentIndex];
      const duration = (post?.duration || displaySettings.defaultDuration) * 1000;
      autoRotateTimer = setTimeout(() => nextPost(), duration);
      console.log('📺 Displaymodus gestartet - Auto-Rotation aktiv (Umschalt+H = Vortragsmodus)');
    } else {
      console.log('🎤 Vortragsmodus aktiviert via URL-Parameter');
    }
  } else {
    showNoContent();
  }

  // Auto-Refresh für neue Posts aus API (alle 60 Sekunden)
  // Nur Posts-Liste aktualisieren, NICHT den aktuellen Post neu anzeigen
  setInterval(async () => {
    const oldPostIds = posts.map((p) => p.id).join(',');
    await fetchPosts();
    const newPostIds = posts.map((p) => p.id).join(',');

    // Nur wenn sich die Post-Liste geändert hat
    if (oldPostIds !== newPostIds) {
      // Stelle sicher, dass currentIndex gültig bleibt
      if (currentIndex >= posts.length) {
        currentIndex = 0;
      }
      updatePostCounter();
    }
  }, 60000); // Alle 60 Sekunden statt 10
}

// Posts von API abrufen
async function fetchPosts() {
  try {
    // Bestimme den richtigen API-Endpoint basierend auf Display-ID
    let apiUrl = '/api/public/posts';
    if (currentDisplayIdentifier) {
      apiUrl = `/api/public/display/${currentDisplayIdentifier}/posts`;
      console.log('Lade Posts für Display:', currentDisplayIdentifier);
    } else {
      console.log('Lade alle Posts (kein spezifisches Display)');
    }

    // Versuche zuerst die API
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        // Normalisiere API-Daten (camelCase -> snake_case für Kompatibilität)
        posts = data.data.map((post) => {
          // Medien-URL aus verschiedenen Quellen ermitteln
          let mediaUrl = post.media?.url || post.media_url || null;

          // Bei Video/Bild-Posts: Falls keine Media-URL, prüfe ob content eine URL ist
          if (!mediaUrl && ['video', 'image'].includes(post.contentType || post.content_type)) {
            const content = post.content || '';
            // Prüfe ob Content eine URL ist oder eine YouTube/Vimeo-URL enthält
            if (content.startsWith('http') || content.startsWith('/uploads/')) {
              mediaUrl = content;
            } else {
              // Suche nach YouTube/Vimeo-URLs im Content
              const urlMatch = content.match(
                /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com)[^\s]+)/i
              );
              if (urlMatch) {
                mediaUrl = urlMatch[1];
              }
            }
          }

          return {
            ...post,
            content_type: post.contentType || post.content_type,
            display_duration: post.duration || post.display_duration || displaySettings.defaultDuration,
            media_url: mediaUrl,
            category_id: post.category?.id || post.categoryId || post.category_id,
            is_active: post.isActive !== false && post.is_active !== false,
          };
        });
        posts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return;
      }
    }
  } catch (apiError) {
    // API nicht erreichbar, versuche LocalStorage
  }

  try {
    // Fallback: Lade Posts aus LocalStorage (von Admin-Panel)
    const storedPosts = localStorage.getItem('posts');
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts);
        posts = parsedPosts.filter((post) => post.is_active);
        posts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return;
      } catch (e) {
        console.error('Fehler beim Parsen der Posts aus LocalStorage:', e);
      }
    }

    // Fallback: Verwende Mock-Daten wenn kein LocalStorage
    posts = mockPosts.filter((post) => post.is_active);
    posts.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error('Fehler beim Laden der Posts:', error);
    posts = mockPosts;
  }
}

// Aktuellen Post anzeigen
async function displayCurrentPost() {
  if (posts.length === 0) {
    console.warn('displayCurrentPost: Keine Posts verfügbar');
    showNoContent();
    return;
  }

  // Stelle sicher dass currentIndex gültig ist
  if (currentIndex >= posts.length || currentIndex < 0) {
    console.warn(`Ungültiger Index ${currentIndex}, setze auf 0`);
    currentIndex = 0;
  }

  // Stoppe laufende Präsentations-Slideshow
  if (presentationState.slideTimer) {
    clearInterval(presentationState.slideTimer);
    presentationState.slideTimer = null;
  }
  presentationState.isActive = false;
  presentationState.currentSlide = 0;

  const post = posts[currentIndex];
  const container = document.getElementById('current-post');
  
  if (!container) {
    console.error('Post-Container nicht gefunden');
    return;
  }
  
  if (!post) {
    console.error(`Post an Index ${currentIndex} nicht gefunden`);
    showNoContent();
    return;
  }

  // Update Header-Kategorie
  updateHeaderCategory(post.category_id);

  // Entferne alte Klassen
  container.className = 'post';

  // Füge Content-Type Klasse hinzu
  container.classList.add(`type-${post.content_type}`);

  // Render basierend auf Content-Type
  let html = '';

  switch (post.content_type) {
    case 'text':
      html = `
                ${post.showTitle === true ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
                <div>${post.content || ''}</div>
            `;
      break;

    case 'image':
      // Wenn kein media_url vorhanden ist, verwende content als Bild-URL (für Presentation Slides)
      const imageUrl = post.media_url || (post.content && post.content.startsWith('/uploads/') ? post.content : null);
      // Zeige content nur an, wenn es kein Pfad ist
      const imageContent = post.content && !post.content.startsWith('/uploads/') ? post.content : '';
      
      html = `
                ${post.showTitle === true ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
                ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(post.title)}">` : ''}
                ${imageContent ? `<p>${escapeHtml(imageContent)}</p>` : ''}
            `;
      break;

    case 'video':
      let videoHtml = '';

      // Prüfe ob Video stumm geschaltet werden soll (globale Musik aktiv)
      loadGlobalMusicSettings();
      const shouldMuteVideo =
        globalMusicSettings.enabled && globalMusicSettings.muteVideos && globalMusicSettings.url;
      const muteParam = shouldMuteVideo ? '1' : '0';

      // Video-URL aus verschiedenen Quellen
      const videoUrl = post.media_url || post.content;
      
      // Debug: Video-Quellen loggen
      console.log('🎬 Video-Post:', JSON.stringify({ videoUrl, mediaUrl: post.media_url, content: post.content }));

      if (videoUrl) {
        // YouTube-Video-ID extrahieren
        const youtubeMatch = videoUrl.match(
          /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
        );
        
        // Lokale Video-Datei: Nur verwenden wenn media_url auf eine lokale Datei zeigt
        // (z.B. wenn der Video-Download-Service das Video heruntergeladen hat)
        if (!youtubeMatch && videoUrl.startsWith('/uploads/')) {
          console.log('🎬 Verwende lokale Video-Datei:', videoUrl);
          videoHtml = `<div class="video-fullscreen-container">
            <video 
              id="fullscreen-video"
              src="${escapeHtml(videoUrl)}" 
              autoplay 
              loop 
              playsinline
              ${shouldMuteVideo ? 'muted' : ''}>
            </video>
            ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
          </div>`;
        }
        // YouTube: Immer iframe verwenden (lokale Kopie kommt über media_url wenn heruntergeladen)
        else if (youtubeMatch) {
          const videoId = youtubeMatch[1];
          const uniqueId = `youtube-player-${Date.now()}`;
          videoHtml = `<div class="video-fullscreen-container" id="video-fs-container">
            <iframe 
              id="${uniqueId}"
              src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${muteParam}&loop=1&playlist=${videoId}&controls=0&rel=0&playsinline=1&enablejsapi=1&modestbranding=1&iv_load_policy=3&fs=1&disablekb=1&showinfo=0" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
              style="width:100%; height:100%; border:none; position:absolute; top:0; left:0;">
            </iframe>
            <div class="video-error-fallback" style="display:none;">
              <p>Video kann nicht eingebettet werden.</p>
              <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">Auf YouTube ansehen</a>
            </div>
          </div>`;
        }
        // Prüfe ob Vimeo URL
        else if (videoUrl.includes('vimeo.com')) {
          const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
          if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            videoHtml = `<div class="video-fullscreen-container">
              <iframe 
                src="https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=${muteParam}&controls=1" 
                frameborder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen>
              </iframe>
            </div>`;
          }
        }
        // Ansonsten normales HTML5 Video
        else {
          videoHtml = `<div class="video-fullscreen-container">
            <video 
              id="fullscreen-video"
              src="${escapeHtml(videoUrl)}" 
              autoplay 
              loop 
              playsinline
              ${shouldMuteVideo ? 'muted' : ''}>
            </video>
          </div>`;
        }
      }
      // Video Vollbild - ohne Titel und Text
      html = videoHtml;

      // Verstecke Header für Video-Vollbild
      setTimeout(() => {
        const header = document.querySelector('.display-header');
        const footer = document.querySelector('.display-footer');
        if (header) header.classList.add('hidden-for-video');
        if (footer) footer.classList.add('hidden-for-video');

        // HTML5 Video: Versuche nativen Vollbildmodus
        const video = document.getElementById('fullscreen-video');
        if (video) {
          video.addEventListener('loadeddata', () => {
            tryEnterFullscreen(video);
          });
          // Falls Video schon geladen
          if (video.readyState >= 2) {
            tryEnterFullscreen(video);
          }
        }

        // YouTube/Vimeo iframe: Versuche Vollbild auf dem Container
        const fsContainer = document.getElementById('video-fs-container');
        if (fsContainer && !video) {
          // Kurz warten bis iframe geladen
          setTimeout(() => {
            tryEnterFullscreen(fsContainer);
          }, 500);
        }
      }, 100);
      break;

    case 'html':
      html = `
                ${post.showTitle === true ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
                <div>${post.content || ''}</div>
            `;
      break;

    case 'presentation':
      // PowerPoint Präsentation anzeigen
      html = await renderPresentation(post);
      break;

    case 'pdf':
      // PDF Dokument anzeigen
      html = renderPDF(post);
      break;

    case 'word':
      // Word Dokument anzeigen
      html = renderWordDocument(post);
      break;

    default:
      html = `
                ${post.showTitle === true ? `<h1>${escapeHtml(post.title)}</h1>` : ''}
                <p>${escapeHtml(post.content || '')}</p>
            `;
  }

  // Smooth Content-Update ohne weißen Blitz
  // Erstelle temporären Container für neuen Inhalt
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  tempDiv.style.opacity = '1';
  
  // Ersetze Inhalt direkt ohne Leerphase
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  while (tempDiv.firstChild) {
    container.appendChild(tempDiv.firstChild);
  }

  // Update Post Counter
  document.getElementById('post-counter').textContent = `${currentIndex + 1} / ${posts.length}`;

  // Hintergrundmusik starten/stoppen (auch bei Videos wenn globale Musik aktiv)
  playBackgroundMusic(post);

  // Zeige globale Musik-Indikator wenn aktiv
  updateGlobalMusicIndicator();

  // Keine Animation - direkter Wechsel für bessere Performance
  container.style.animation = 'none';

  // Nächster Post nach Duration (nicht im Vortragsmodus wenn pausiert)
  clearTimeout(autoRotateTimer);

  if (!presentationModeState.isActive || !presentationModeState.isPaused) {
    const duration = (post.duration || displaySettings.defaultDuration) * 1000;
    autoRotateTimer = setTimeout(() => {
      nextPost();
    }, duration);
  }

  // Update Vortragsmodus-Counter
  updatePresentationCounter();
}

// Nächster Post
function nextPost() {
  // Sicherheitsprüfung
  if (posts.length === 0) {
    console.warn('Keine Posts zum Anzeigen');
    showNoContent();
    return;
  }

  // Prüfe ob Live-Daten-Widget eingeblendet werden soll (ab 14:00 bis 20:00, alle 20 Min)
  if (shouldInsertLiveDataWidget()) {
    showLiveDataWidget();
    return;
  }
  
  restoreHeaderFooter(); // Stelle Header/Footer wieder her
  const currentPost = posts[currentIndex];
  currentIndex = (currentIndex + 1) % posts.length;
  // Verwende Standard-Blendeffekt "fade" wenn keiner definiert ist
  const blendEffect = currentPost?.blend_effect || 'fade';
  displayCurrentPostWithBlend(blendEffect);
  updatePostCounter();
  updatePresentationCounter();
}

// Vorheriger Post
function previousPost() {
  restoreHeaderFooter(); // Stelle Header/Footer wieder her
  const currentPost = posts[currentIndex];
  currentIndex = (currentIndex - 1 + posts.length) % posts.length;
  // Verwende Standard-Blendeffekt "fade" wenn keiner definiert ist
  const blendEffect = currentPost?.blend_effect || 'fade';
  displayCurrentPostWithBlend(blendEffect);
  updatePostCounter();
  updatePresentationCounter();
}

// ============================================
// Blend Effects - Übergangseffekte
// ============================================

// Wende Blend-Effekt an beim Wechsel zum nächsten Post
function displayCurrentPostWithBlend(blendEffect) {
  const container = document.getElementById('current-post');
  
  // Sicherheitsprüfung
  if (!container) {
    console.error('Post-Container nicht gefunden');
    return;
  }
  
  // Prüfe ob Transitions erlaubt sind (berücksichtigt externe Display-Logik)
  if (!shouldUseTransitions() || !blendEffect || blendEffect === '') {
    // Keine Transition - direkter Wechsel
    displayCurrentPost();
    return;
  }

  // Out-Animation des alten Posts
  const effectClass = blendEffect.replace(/-/g, '-'); // z.B. "fade" oder "slide-left"
  const outClass = `blend-${effectClass}-out`;
  const inClass = `blend-${effectClass}-in`;
  
  // Füge out-Animation hinzu
  container.classList.add('blend-transition-out', outClass);
  
  // Nach Animation: Neuen Post laden und in-Animation starten
  setTimeout(() => {
    // Entferne out-Animation
    container.classList.remove('blend-transition-out', outClass);
    
    // Lade neuen Post-Inhalt (mit Fehlerbehandlung)
    try {
      displayCurrentPost();
    } catch (error) {
      console.error('Fehler beim Anzeigen des Posts:', error);
      showNoContent();
      return;
    }
    
    // Füge in-Animation hinzu
    container.classList.add('blend-transition-in', inClass);
    
    // Nach in-Animation: Entferne alle Blend-Klassen
    setTimeout(() => {
      container.classList.remove('blend-transition-in', inClass);
    }, 600); // Dauer muss mit CSS animation-duration übereinstimmen
  }, 600); // Dauer muss mit CSS animation-duration übereinstimmen
}

// Post-Counter aktualisieren
function updatePostCounter() {
  const counterElement = document.getElementById('post-counter');
  if (counterElement && posts.length > 0) {
    counterElement.textContent = `${currentIndex + 1} / ${posts.length}`;
  }
}

// Keine Inhalte verfügbar
function showNoContent() {
  const container = document.getElementById('current-post');
  
  // Prüfe ob Hotspot-Modus aktiv ist (über Hostname oder spezielle Markierung)
  const isHotspotMode = window.location.hostname === '192.168.4.1' || 
                        window.location.hostname === 'prasco.local';
  
  if (isHotspotMode) {
    // WLAN-Zugangsdaten für QR-Code
    const ssid = 'PRASCO-Display';
    const password = 'prasco123';
    const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
    
    container.innerHTML = `
      <div class="hotspot-welcome" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 80vh;
        background: linear-gradient(135deg, #009640 0%, #006830 100%);
        color: white;
        padding: 3rem;
        text-align: center;
        border-radius: 20px;
      ">
        <div style="font-size: 80px; margin-bottom: 2rem;">📶</div>
        <h1 style="font-size: 3.5rem; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
          Willkommen zum PRASCO Display
        </h1>
        <p style="font-size: 1.8rem; margin-bottom: 3rem; opacity: 0.95;">
          Verbinden Sie sich mit dem WLAN-Hotspot
        </p>
        
        <div id="qr-code" style="
          background: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          margin-bottom: 2rem;
        "></div>
        
        <div style="
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          padding: 2rem 3rem;
          border-radius: 15px;
          margin-top: 2rem;
        ">
          <p style="font-size: 1.6rem; margin-bottom: 1rem; font-weight: 600;">
            📱 WLAN-Zugangsdaten:
          </p>
          <p style="font-size: 1.8rem; margin: 0.5rem 0;">
            <strong>Netzwerk:</strong> ${ssid}
          </p>
          <p style="font-size: 1.8rem; margin: 0.5rem 0;">
            <strong>Passwort:</strong> ${password}
          </p>
        </div>
        
        <p style="font-size: 1.3rem; margin-top: 2rem; opacity: 0.85;">
          Admin-Portal: <strong>https://192.168.4.1:8443</strong>
        </p>
      </div>
    `;
    
    // QR-Code generieren
    generateQRCode(wifiString);
  } else {
    // Normale "Keine Inhalte" Meldung
    container.innerHTML = `
      <div class="loading">
        <h1>Keine Inhalte verfügbar</h1>
        <p>Bitte fügen Sie Beiträge im Admin-Bereich hinzu.</p>
      </div>
    `;
  }
}

// QR-Code Generator (inline, ohne externe Library)
function generateQRCode(text) {
  const qrContainer = document.getElementById('qr-code');
  if (!qrContainer) return;
  
  // Einfacher QR-Code als SVG mit QR-Code Library (falls vorhanden)
  // Fallback: Zeige Text-basierte Anleitung
  const size = 300;
  
  // Verwende eine simple SVG-Darstellung als Platzhalter
  qrContainer.innerHTML = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 8px solid #009640;
      border-radius: 10px;
      font-size: 1.2rem;
      color: #333;
      text-align: center;
      padding: 2rem;
      line-height: 1.6;
    ">
      <div>
        <div style="font-size: 60px; margin-bottom: 1rem;">📱</div>
        <p style="margin: 0;">Scannen Sie mit Ihrer<br/>Kamera-App, um sich<br/>automatisch zu verbinden</p>
        <div style="
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f0f0f0;
          border-radius: 8px;
          font-size: 0.9rem;
        ">
          <strong>PRASCO-Display</strong><br/>
          Passwort: prasco123
        </div>
      </div>
    </div>
  `;
  
  // Versuche qrcodejs Library zu laden (falls verfügbar)
  if (typeof QRCode !== 'undefined') {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: text,
      width: size,
      height: size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}


// Uhr aktualisieren
function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const clockElement = document.getElementById('clock');
  if (clockElement) {
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
  }
}

// Datum aktualisieren
function updateDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  // Sprache aus localStorage oder Standard 'de-DE'
  const savedLang = localStorage.getItem('appLanguage') || 'de';
  const localeMap = {
    de: 'de-DE',
    en: 'en-US',
    it: 'it-IT',
  };
  const locale = localeMap[savedLang] || 'de-DE';

  const dateElement = document.getElementById('date');
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString(locale, options);
  }
}

// Automatisches Refresh (dynamisch basierend auf Einstellungen)
function startAutoRefresh() {
  const refreshMs = displaySettings.refreshInterval * 60 * 1000;
  console.log(`Auto-Refresh gestartet: alle ${displaySettings.refreshInterval} Minuten`);
  
  setInterval(
    async () => {
      console.log('Auto-Refresh: Posts werden neu geladen...');
      const oldLength = posts.length;
      await fetchPosts();

      if (posts.length !== oldLength || currentIndex >= posts.length) {
        currentIndex = 0;
        displayCurrentPost();
      }
    },
    refreshMs
  );
}

// PowerPoint Präsentation rendern
async function renderPresentation(post) {
  const presentation = post.presentation;

  // Wenn Slides generiert wurden, zeige diese als Slideshow
  if (presentation?.slides && presentation.slides.length > 0) {
    // Initialisiere Presentation State
    presentationState.isActive = true;
    presentationState.slides = presentation.slides;
    presentationState.currentSlide = 0;

    // Zeige ersten Slide sofort (ohne auf Preload zu warten)
    const initialHtml = renderSlideshow(post, presentation.slides, 0);
    
    // Preload ALLE Slides im Hintergrund - warte darauf!
    await preloadPresentationSlides(presentation.slides);

    // Erst NACH erfolgreichem Preload: Starte Slide-Rotation
    startSlideRotation(post.duration || displaySettings.defaultDuration);

    return initialHtml;
  }

  // Wenn wir eine PPTX-Datei haben aber keine Slides (LibreOffice nicht verfügbar)
  if (presentation?.presentationId) {
    return `
      <div style="height: 100%; display: flex; flex-direction: column;">
        <h1 style="text-align: center; padding: 20px; margin: 0;">${escapeHtml(post.title)}</h1>
        <div style="flex: 1; position: relative; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; overflow: hidden; margin: 20px;">
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 40px; text-align: center; color: #fff;">
            <div style="font-size: 100px; margin-bottom: 30px;">📊</div>
            <h2 style="font-size: 48px; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">PowerPoint Präsentation</h2>
            <p style="font-size: 28px; opacity: 0.9; margin-bottom: 30px;">${escapeHtml(presentation?.originalName || 'Präsentation')}</p>
            <div style="background: rgba(255,255,255,0.15); padding: 25px 40px; border-radius: 15px; backdrop-filter: blur(10px);">
              <p style="font-size: 20px; margin: 0; line-height: 1.6;">
                ⚠️ Slides werden generiert...<br/>
                LibreOffice wird für die automatische Konvertierung benötigt.
              </p>
            </div>
            ${post.content ? `<p style="font-size: 22px; margin-top: 30px; opacity: 0.9;">${escapeHtml(post.content)}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Fallback wenn keine Präsentation
  return `
    <div style="text-align: center; padding: 60px;">
      <div style="font-size: 100px; margin-bottom: 30px;">📊</div>
      <h1>${escapeHtml(post.title)}</h1>
      <p style="font-size: 24px; color: #666;">PowerPoint Präsentation</p>
      ${post.content ? `<p style="margin-top: 30px;">${escapeHtml(post.content)}</p>` : ''}
    </div>
  `;
}

// Rendert die Slideshow-Ansicht
function renderSlideshow(post, slides, currentSlideIndex) {
  const slide = slides[currentSlideIndex];
  const totalSlides = slides.length;

  return `
    <div class="presentation-slideshow" style="height: 100%; display: flex; flex-direction: column; background: #1a1a2e;">
      ${post.showTitle === true ? `<div class="slide-header" style="padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3);">
        <h2 style="margin: 0; color: #fff; font-size: 24px;">${escapeHtml(post.title)}</h2>
        <div style="color: #fff; font-size: 18px; opacity: 0.8;">
          Folie ${currentSlideIndex + 1} / ${totalSlides}
        </div>
      </div>` : `<div class="slide-header" style="padding: 15px 30px; display: flex; justify-content: flex-end; align-items: center; background: rgba(0,0,0,0.3);">
        <div style="color: #fff; font-size: 18px; opacity: 0.8;">
          Folie ${currentSlideIndex + 1} / ${totalSlides}
        </div>
      </div>`}
      <div class="slide-container" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 5px; position: relative; background: #1a1a2e;">
        <img src="${slide.imageUrl}" 
             alt="Slide ${currentSlideIndex + 1}" 
             loading="eager"
             decoding="sync"
             style="width: 99%; height: 99%; object-fit: contain; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: block; will-change: auto;"
             onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'text-align:center; color:#fff;\\'>❌ Slide konnte nicht geladen werden</div>';">
      </div>
      <div class="slide-progress" style="height: 4px; background: rgba(255,255,255,0.2); overflow: hidden;">
        <div class="progress-fill" style="height: 100%; background: linear-gradient(90deg, #c41e3a, #ff6b6b); transform: translateX(-${100 - ((currentSlideIndex + 1) / totalSlides) * 100}%); will-change: transform; transition: transform 0.3s ease;"></div>
      </div>
    </div>
  `;
}

// Startet die automatische Slide-Rotation
function startSlideRotation(totalDuration) {
  // Stoppe vorherige Timer
  if (presentationState.slideTimer) {
    clearInterval(presentationState.slideTimer);
  }

  // Berechne Zeit pro Slide (mindestens 3 Sekunden)
  const slideCount = presentationState.slides.length;
  const timePerSlide = Math.max(3000, (totalDuration * 1000) / slideCount);

  presentationState.slideTimer = setInterval(() => {
    if (!presentationState.isActive) {
      clearInterval(presentationState.slideTimer);
      return;
    }

    presentationState.currentSlide++;

    // Wenn alle Slides gezeigt wurden, gehe zum nächsten Post
    if (presentationState.currentSlide >= presentationState.slides.length) {
      clearInterval(presentationState.slideTimer);
      presentationState.isActive = false;
      presentationState.currentSlide = 0;
      // Cleane DOM-Cache
      presentationState.domCache = { slideImg: null, slideCounter: null, progressBar: null };
      
      // Sicherheitsprüfung: Stelle sicher dass Posts verfügbar sind
      if (posts.length === 0) {
        console.warn('Keine Posts verfügbar nach Präsentation');
        showNoContent();
        return;
      }
      
      // Gehe zum nächsten Post
      nextPost();
      return;
    }

    // Aktualisiere nur das Slide-Bild und Progress, nicht das komplette HTML
    updateSlideContent(presentationState.currentSlide);
  }, timePerSlide);
}

// Aktualisiert nur Slide-Bild und Progress-Bar ohne komplettes Re-Rendering
function updateSlideContent(slideIndex) {
  const slide = presentationState.slides[slideIndex];
  const totalSlides = presentationState.slides.length;
  
  if (!slide) {
    console.error(`Slide ${slideIndex} nicht gefunden`);
    return;
  }
  
  // Cache DOM-Referenzen beim ersten Aufruf
  if (!presentationState.domCache.slideImg) {
    presentationState.domCache.slideImg = document.querySelector('.slide-container img');
    presentationState.domCache.slideCounter = document.querySelector('.slide-header > div:last-child');
    presentationState.domCache.progressBar = document.querySelector('.progress-fill');
  }
  
  const { slideImg, slideCounter, progressBar } = presentationState.domCache;
  
  // Update Bild - NUR wenn vorgeladen
  if (slideImg) {
    const preloadedImg = presentationState.preloadedImages.get(slide.imageUrl);
    
    // Prüfe ob Bild vollständig geladen ist
    if (preloadedImg && preloadedImg.complete && preloadedImg.naturalWidth > 0) {
      // Verwende requestAnimationFrame für smooth Update
      requestAnimationFrame(() => {
        slideImg.src = slide.imageUrl;
        slideImg.alt = `Slide ${slideIndex + 1}`;
      });
    } else {
      console.warn(`⚠️ Slide ${slideIndex + 1} nicht vorgeladen - warte...`);
      // Warte auf Bildladung
      const waitImg = new Image();
      waitImg.onload = () => {
        requestAnimationFrame(() => {
          slideImg.src = slide.imageUrl;
          slideImg.alt = `Slide ${slideIndex + 1}`;
        });
      };
      waitImg.src = slide.imageUrl;
    }
  }
  
  // Update Slide-Counter
  if (slideCounter) {
    slideCounter.textContent = `Folie ${slideIndex + 1} / ${totalSlides}`;
  }
  
  // Update Progress-Bar mit GPU-beschleunigtem Transform
  if (progressBar) {
    const progress = ((slideIndex + 1) / totalSlides) * 100;
    requestAnimationFrame(() => {
      progressBar.style.transform = `translateX(-${100 - progress}%)`;
    });
  }
}

// Preload alle Presentation Slides für schnelleres Umschalten
async function preloadPresentationSlides(slides) {
  // Leere alten Cache
  presentationState.preloadedImages.clear();
  
  console.log(`Starte Preload für ${slides.length} Slides...`);
  
  // Erstelle Promises für alle Bilder
  const loadPromises = slides.map((slide, index) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = slide.imageUrl;
      
      // Speichere Bild-Objekt im Cache
      presentationState.preloadedImages.set(slide.imageUrl, img);
      
      img.onload = () => {
        console.log(`✓ Slide ${index + 1}/${slides.length} vorgeladen`);
        resolve();
      };
      
      img.onerror = () => {
        console.error(`✗ Slide ${index + 1}/${slides.length} Ladefehler: ${slide.imageUrl}`);
        // Reject nicht, damit andere Slides trotzdem laden können
        resolve();
      };
      
      // Timeout nach 5 Sekunden
      setTimeout(() => {
        if (!img.complete) {
          console.warn(`⏱ Slide ${index + 1}/${slides.length} Timeout (5s)`);
          resolve();
        }
      }, 5000);
    });
  });
  
  // Warte auf alle Bilder
  await Promise.all(loadPromises);
  console.log(`✓ Alle ${slides.length} Slides vorgeladen!`);
}

// Update Header Category
function updateHeaderCategory(categoryId) {
  const headerCategory = document.getElementById('header-category');
  if (!headerCategory) return;

  if (!categoryId) {
    headerCategory.innerHTML = '';
    return;
  }

  const categories = JSON.parse(localStorage.getItem('categories') || '[]');
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    headerCategory.innerHTML = '';
    return;
  }

  headerCategory.innerHTML = `<div style="background: ${category.color}; color: white; padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1.1rem; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.15);\">${category.icon || '🏷️'} ${escapeHtml(category.name)}</div>`;
}

// PDF Dokument rendern
function renderPDF(post) {
  const mediaUrl = post.media?.url || post.content;
  
  if (!mediaUrl) {
    return `
      <div style="text-align: center; padding: 60px;">
        <div style="font-size: 100px; margin-bottom: 30px;">📄</div>
        <h1>${escapeHtml(post.title)}</h1>
        <p style="font-size: 24px; color: #666;">PDF Dokument</p>
        <p style="color: #999; margin-top: 20px;">Keine PDF-Datei verfügbar</p>
      </div>
    `;
  }

  return `
    <div style="height: 100%; display: flex; flex-direction: column; background: #f5f5f5;">
      ${post.showTitle === true ? `<div style="padding: 15px 30px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="margin: 0; color: #333; font-size: 24px;">📄 ${escapeHtml(post.title)}</h2>
      </div>` : ''}
      <div style="flex: 1; position: relative; overflow: hidden;">
        <iframe 
          src="${escapeHtml(mediaUrl)}#view=FitH&toolbar=0&navpanes=0" 
          style="width: 100%; height: 100%; border: none; background: white;"
          title="${escapeHtml(post.title)}">
        </iframe>
      </div>
    </div>
  `;
}

// Word Dokument rendern
function renderWordDocument(post) {
  const mediaUrl = post.media?.url || post.content;
  
  if (!mediaUrl) {
    return `
      <div style="text-align: center; padding: 60px;">
        <div style="font-size: 100px; margin-bottom: 30px;">📃</div>
        <h1>${escapeHtml(post.title)}</h1>
        <p style="font-size: 24px; color: #666;">Word Dokument</p>
        <p style="color: #999; margin-top: 20px;">Keine Word-Datei verfügbar</p>
      </div>
    `;
  }

  // Word-Dokumente via Microsoft Office Online Viewer
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(mediaUrl)}`;

  return `
    <div style="height: 100%; display: flex; flex-direction: column; background: #f5f5f5;">
      ${post.showTitle === true ? `<div style="padding: 15px 30px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="margin: 0; color: #333; font-size: 24px;">📃 ${escapeHtml(post.title)}</h2>
      </div>` : ''}
      <div style="flex: 1; position: relative; overflow: hidden;">
        <iframe 
          src="${viewerUrl}" 
          style="width: 100%; height: 100%; border: none; background: white;"
          title="${escapeHtml(post.title)}">
        </iframe>
      </div>
    </div>
  `;
}

// Duplikat von escapeHtml entfernt (definiert weiter oben)
// Duplikat von Keyboard-Handler entfernt (setupKeyboardShortcuts() übernimmt alles)

// Klick-Navigation im Vortragsmodus
document.addEventListener('click', (e) => {
  if (!presentationModeState.isActive) return;

  // Ignoriere Klicks auf Controls
  if (e.target.closest('.presentation-controls')) return;
  if (e.target.closest('.pres-btn')) return;

  const screenWidth = window.innerWidth;
  const clickX = e.clientX;

  // Linke 30% = zurück, rechte 30% = vorwärts, Mitte = toggle pause
  if (clickX < screenWidth * 0.3) {
    previousPost();
  } else if (clickX > screenWidth * 0.7) {
    nextPost();
  } else {
    // Mitte geklickt - Toggle Pause (optional)
    toggleAutoRotation();
  }
});

// Initialisierung
(async function() {
  console.log('Display-Modus wird initialisiert...');
  
  // 1. Lade Display-Identifier
  currentDisplayIdentifier = getDisplayIdentifier();
  
  // 2. Falls kein Identifier und kein Query-Parameter "skip": Zeige Display-Auswahl
  const urlParams = new URLSearchParams(window.location.search);
  const skipSelection = urlParams.get('skip');
  
  if (!currentDisplayIdentifier && !skipSelection) {
    // Prüfe ob Displays existieren
    try {
      const response = await fetch('/api/public/displays');
      if (response.ok) {
        const data = await response.json();
        const activeDisplays = data.data?.filter(d => d.isActive) || [];
        
        // Zeige Auswahl nur wenn aktive Displays existieren
        if (activeDisplays.length > 0) {
          await showDisplaySelection();
          return; // Stoppe hier, Seite wird nach Auswahl neu geladen
        }
      }
    } catch (error) {
      console.warn('Konnte Displays nicht laden:', error);
    }
  }
  
  // 3. Lade Display-Info falls vorhanden
  if (currentDisplayIdentifier) {
    await loadDisplayInfo(currentDisplayIdentifier);
  }
  
  // 4. Prüfe ob dieses Display extern ist (für Transition-Optimierung)
  checkIfExternalDisplay();
  
  // 5. Lade Display-Einstellungen vom Backend
  await loadDisplaySettings();
  
  // 6. Initialisiere Display
  init();
  
  // 7. Starte Auto-Refresh mit konfigurierten Intervall
  startAutoRefresh();
  
  console.log('Display-Modus gestartet 🚀');
})();
