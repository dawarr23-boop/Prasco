// Display JavaScript - Für das öffentliche Schwarzes Brett
// Simuliert API-Aufrufe mit Beispieldaten

let posts = [];
let currentIndex = 0;
let autoRotateTimer = null;
let rainRadarCleanup = null; // Cleanup-Funktion für Radar-Animation

/**
 * Normalisiert HAFAS/DB Produkt-Strings auf CSS-kompatible Klassen-Namen.
 * Verschiedene Datenquellen (INSA, DB Timetables, db.transport.rest) liefern
 * unterschiedliche Schreibweisen — diese Funktion vereinheitlicht sie.
 */
function normalizeTransitProduct(product, lineName) {
  const name = (lineName || '').toUpperCase();
  const prod = (product || '').toLowerCase();

  // Nach Linienname normalisieren (zuverlässiger als Produkt-String)
  if (name.startsWith('RE') || name.startsWith('IRE')) return 'regional-express';
  if (name.startsWith('RB'))                            return 'regional';
  if (name.startsWith('S'))                             return 'suburban';
  if (name.startsWith('U'))                             return 'subway';
  if (name.startsWith('ICE') || name.startsWith('IC') || name.startsWith('EC') || name.startsWith('TGV')) return 'national-express';

  // Fallback: Produkt-String normalisieren
  if (prod === 'nationalexpress' || prod === 'national-express') return 'national-express';
  if (prod === 'regional-exp' || prod === 'regionalexp' || prod === 'regional-express') return 'regional-express';
  if (prod === 'regional') return 'regional';
  if (prod === 'suburban' || prod === 'sbahn') return 'suburban';
  if (prod === 'subway' || prod === 'ubahn') return 'subway';
  if (prod === 'tram' || prod === 'strassenbahn') return 'tram';
  if (prod === 'ferry' || prod === 'faehre') return 'ferry';
  if (prod === 'bus' || prod === 'stadtbus' || prod === 'nachtbus') return 'bus';

  return product || 'bus';
}

// Display-Identifikation
let currentDisplayIdentifier = null;
let currentDisplayName = null;
let currentDisplayInfo = null; // Vollständige Display-Daten inkl. showTransitData/showTrafficData

// Device-Authentifizierung
let deviceToken = null;
let deviceAuthStatus = null; // 'authorized', 'pending', 'rejected', 'revoked', null
let authStatusPollInterval = null;
let heartbeatInterval = null;

// Display-Einstellungen (werden vom Backend geladen)
let displaySettings = {
  refreshInterval: 5, // Standard: 5 Minuten
  defaultDuration: 60, // Standard: 60 Sekunden
  blendEffectsEnabled: true, // Standard: Blend-Effekte aktiviert
  transitionsExternalOnly: false, // Standard: Transitions auf allen Displays
  liveDataIntervalMinutes: 5, // Standard: Live-Daten alle 5 Minuten
  liveDataSlideDuration: 20, // Standard: 20 Sekunden pro Live-Slide
  showPostCounter: true, // Standard: Beitragsnummerierung anzeigen
};

// Prüfe ob Vorschau-Modus aktiv ist (iframe im Admin-Panel)
const isPreviewMode = new URLSearchParams(window.location.search).has('preview');

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
  weatherSettings: null,
  newsSettings: null,
  lastInsertTime: 0,
  lastTransitInsertTime: 0, // Für Rush-Hour-Priorität (16:30-20:00 alle 3 min)
  lastNewsInsertTime: 0,    // Für Nachrichten-Priorität vor 14:00 Uhr alle 3 min
  widgetTimer: null,
  isWidgetActive: false,
  nextCategoryIdx: 0, // Zeiger auf nächste Kategorie in der Rotation
};

// ============================================
// Blend-Effekt Rotation
// ============================================
const BLEND_EFFECTS = ['fade', 'slide-left', 'slide-right', 'zoom-in', 'slide-up', 'slide-down', 'zoom-out'];
let blendEffectIndex = 0;

function getNextBlendEffect() {
  const effect = BLEND_EFFECTS[blendEffectIndex % BLEND_EFFECTS.length];
  blendEffectIndex = (blendEffectIndex + 1) % BLEND_EFFECTS.length;
  return effect;
}

// Lade Live-Daten-Einstellungen vom Backend
async function loadLiveDataDisplaySettings() {
  if (isPreviewMode) return; // Keine Live-Daten in der Vorschau
  try {
    const [transitRes, trafficRes, weatherRes, newsRes] = await Promise.all([
      fetch('/api/settings?category=transit'),
      fetch('/api/settings?category=traffic'),
      fetch('/api/settings?category=weather'),
      fetch('/api/settings?category=news'),
    ]);
    if (transitRes.ok) {
      const data = await transitRes.json();
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
    if (weatherRes.ok) {
      const data = await weatherRes.json();
      if (data && typeof data === 'object') {
        const s = {};
        Object.entries(data).forEach(([key, value]) => { s[key] = String(value); });
        liveDataState.weatherSettings = s;
      }
    }
    if (newsRes.ok) {
      const data = await newsRes.json();
      if (data && typeof data === 'object') {
        const s = {};
        Object.entries(data).forEach(([key, value]) => { s[key] = String(value); });
        liveDataState.newsSettings = s;
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
  const ws = liveDataState.weatherSettings;
  if (!ts && !tr && !ws) return false;

  // Per-Display Einstellung prüfen
  const currentDisplayId = currentDisplayInfo ? String(currentDisplayInfo.id) : null;
  let transitDisplayAllowed = false;
  let trafficDisplayAllowed = false;
  let weatherEnabled = false;
  if (currentDisplayId) {
    if (ts?.['transit.displayIds']) {
      const transitIds = ts['transit.displayIds'].split(',').map(id => id.trim()).filter(id => id);
      transitDisplayAllowed = transitIds.includes(currentDisplayId);
    }
    if (tr?.['traffic.displayIds']) {
      const trafficIds = tr['traffic.displayIds'].split(',').map(id => id.trim()).filter(id => id);
      trafficDisplayAllowed = trafficIds.includes(currentDisplayId);
    }
    // Wetter: wenn enabled und Display in der Liste
    if (ws?.['weather.enabled'] === 'true') {
      if (ws['weather.displayIds']) {
        const weatherIds = ws['weather.displayIds'].split(',').map(id => id.trim()).filter(id => id);
        weatherEnabled = weatherIds.includes(currentDisplayId);
      } else {
        weatherEnabled = true; // Wenn keine Display-Einschränkung, auf allen anzeigen
      }
    }
  } else {
    transitDisplayAllowed = currentDisplayInfo ? currentDisplayInfo.showTransitData !== false : false;
    trafficDisplayAllowed = currentDisplayInfo ? currentDisplayInfo.showTrafficData !== false : false;
    weatherEnabled = ws?.['weather.enabled'] === 'true';
  }

  const transitEnabled = ts?.['transit.enabled'] === 'true' && transitDisplayAllowed;
  const trafficEnabled = tr?.['traffic.enabled'] === 'true' && trafficDisplayAllowed;
  if (!transitEnabled && !trafficEnabled && !weatherEnabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startStr = ts?.['transit.scheduleStart'] || tr?.['traffic.scheduleStart'] || '00:00';
  const endStr = ts?.['transit.scheduleEnd'] || tr?.['traffic.scheduleEnd'] || '23:59';

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Gibt die aktiven Live-Daten-Kategorien zurück (in Rotationsreihenfolge)
function getActiveLiveCategories() {
  const cats = [];
  if (liveDataState.transitSettings?.['transit.enabled'] === 'true') cats.push('transit');
  if (liveDataState.trafficSettings?.['traffic.enabled'] === 'true') cats.push('traffic');
  if (liveDataState.weatherSettings?.['weather.enabled'] === 'true') cats.push('weather');
  if (liveDataState.newsSettings?.['news.enabled'] === 'true') cats.push('news');
  return cats;
}

// Prüft ob jetzt ÖPNV-Rush-Hour ist (16:30–20:00)
function isTransitRushHour() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= (16 * 60 + 30) && mins < (20 * 60);
}

// Prüft ob jetzt Nachrichten-Priorität gilt (vor 14:00 Uhr)
function isNewsMorning() {
  const now = new Date();
  return now.getHours() < 14;
}

// Gibt die nächste fällige Kategorie zurück, oder null wenn noch nicht Zeit
function shouldInsertLiveDataWidget() {
  const cats = getActiveLiveCategories();
  if (cats.length === 0) return null;

  // Nachrichten-Priorität: vor 14:00 → News alle 3 Minuten (unabhängig vom Zeitplan)
  if (isNewsMorning() && cats.includes('news')) {
    const newsIntervalMs = 3 * 60 * 1000; // 3 Minuten
    if (Date.now() - liveDataState.lastNewsInsertTime >= newsIntervalMs) {
      return 'news';
    }
  }

  if (!isLiveDataScheduled()) return null;

  // Rush-Hour-Priorität: 16:30–20:00 → ÖPNV alle 3 Minuten, unabhängig vom normalen Interval
  if (isTransitRushHour() && cats.includes('transit')) {
    const rushIntervalMs = 3 * 60 * 1000; // 3 Minuten
    if (Date.now() - liveDataState.lastTransitInsertTime >= rushIntervalMs) {
      return 'transit';
    }
  }

  // Normale Rotation: konfiguriertes Interval
  const intervalMs = displaySettings.liveDataIntervalMinutes * 60 * 1000;
  if (Date.now() - liveDataState.lastInsertTime >= intervalMs) {
    return cats[liveDataState.nextCategoryIdx % cats.length];
  }
  return null;
}

// Erstelle Transit-Widget HTML (Vollbild-Slide)
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
      return `<div class="transit-fullscreen"><p class="no-data">Aktuell keine Abfahrten</p></div>`;
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
      return `<div class="transit-fullscreen"><p class="no-data">Keine passenden Abfahrten</p></div>`;
    }

    const rows = filteredDeps.slice(0, maxDep).map((dep, i) => {
      const when = dep.when ? new Date(dep.when) : null;
      const planned = dep.plannedWhen ? new Date(dep.plannedWhen) : null;
      const now = new Date();
      const timeStr = when ? when.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : (planned ? planned.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '--:--');
      // Minuten bis Abfahrt
      const minUntil = when ? Math.max(0, Math.round((when - now) / 60000)) : null;
      const minStr = minUntil !== null ? (minUntil === 0 ? 'jetzt' : `${minUntil} min`) : '';
      const delayMin = dep.delay ? Math.round(dep.delay / 60) : 0;
      const delayClass = dep.cancelled ? 'cancelled' : (delayMin > 0 ? 'delayed' : 'on-time');
      const statusText = dep.cancelled ? 'Ausfall' : (delayMin > 0 ? `+${delayMin} min` : 'pünktl.');
      const lineName = dep.line?.name || '?';
      const product = normalizeTransitProduct(dep.line?.product, lineName);
      const direction = dep.direction || '';
      const platform = dep.platform || dep.plannedPlatform || '';

      return `<tr class="dep-row ${delayClass} ${dep.cancelled ? 'cancelled' : ''}">
        <td class="dep-line"><span class="line-badge line-${product}">${lineName}</span></td>
        <td class="dep-direction">${direction}</td>
        <td class="dep-time">${timeStr}</td>
        <td class="dep-countdown">${minStr}</td>
        <td class="dep-platform">${platform}</td>
        <td class="dep-status"><span class="status-badge ${delayClass}">${statusText}</span></td>
      </tr>`;
    }).join('');

    return `<div class="transit-fullscreen">
      <div class="departure-board-header">
        <span class="departure-station-name">${stationName}</span>
      </div>
      <table class="live-departure-table">
        <thead><tr><th>Linie</th><th>Richtung</th><th>Abfahrt</th><th>in</th><th>Gleis</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  } catch (e) {
    console.warn('Transit-Widget Fehler:', e);
    return '';
  }
}

// Erstelle Traffic-Widget HTML (Vollbild-Slide)
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
        allItems.push(`<div class="traffic-row clear">
          <span class="traffic-icon">✅</span>
          <span class="traffic-hw">${hw}</span>
          <span class="traffic-msg">Freie Fahrt — keine Meldungen</span>
        </div>`);
      } else {
        warnings.forEach(w => {
          const subtitle = w.subtitle ? `<span class="traffic-detail">${w.subtitle}</span>` : '';
          allItems.push(`<div class="traffic-row warning">
            <span class="traffic-icon">⚠️</span>
            <span class="traffic-hw">${hw}</span>
            <span class="traffic-msg">${w.title || 'Verkehrswarnung'}${subtitle}</span>
          </div>`);
        });
        roadworks.forEach(r => {
          const subtitle = r.subtitle ? `<span class="traffic-detail">${r.subtitle}</span>` : '';
          allItems.push(`<div class="traffic-row roadwork">
            <span class="traffic-icon">🚧</span>
            <span class="traffic-hw">${hw}</span>
            <span class="traffic-msg">${r.title || 'Baustelle'}${subtitle}</span>
          </div>`);
        });
        closures.forEach(c => {
          const subtitle = c.subtitle ? `<span class="traffic-detail">${c.subtitle}</span>` : '';
          allItems.push(`<div class="traffic-row closure">
            <span class="traffic-icon">🚫</span>
            <span class="traffic-hw">${hw}</span>
            <span class="traffic-msg">${c.title || 'Sperrung'}${subtitle}</span>
          </div>`);
        });
      }
    }

    if (allItems.length === 0) return '';

    return `<div class="traffic-fullscreen">
      <div class="live-traffic-list">${allItems.join('')}</div>
    </div>`;
  } catch (e) {
    console.warn('Traffic-Widget Fehler:', e);
    return '';
  }
}

// Erstelle Wetter-Widget HTML — 3 Screens: Heute+Stündlich, 5-Tage, Regenradar
async function renderWeatherWidget() {
  const ws = liveDataState.weatherSettings;
  if (!ws || ws['weather.enabled'] !== 'true') return [];

  const lat = ws['weather.latitude'];
  const lon = ws['weather.longitude'];
  const locationName = ws['weather.locationName'] || 'Standort';

  if (!lat || !lon) return [];

  try {
    const response = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}&name=${encodeURIComponent(locationName)}`);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.success || !data.data) return [];

    const w = data.data;
    const c = w.current;

    // Wetter-Code → Icon Mapping für stündliche Anzeige
    const codeIcons = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',56:'🌧️',57:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',66:'❄️🌧️',67:'❄️🌧️',71:'🌨️',73:'🌨️',75:'❄️',77:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'};

    // Windrichtung als Text
    const windDirs = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    const windDirText = windDirs[Math.round(c.windDirection / 45) % 8] || '';

    const todayForecast = w.forecast?.[0];
    const sunrise = todayForecast?.sunrise ? todayForecast.sunrise.split('T')[1]?.substring(0, 5) : '--:--';
    const sunset = todayForecast?.sunset ? todayForecast.sunset.split('T')[1]?.substring(0, 5) : '--:--';

    // ===== SCREEN 1: Aktuelles Wetter + Stündlicher Verlauf =====
    const hourly = (w.hourlyRain || []).slice(0, 12);
    const hourlyRowsHtml = hourly.map(h => {
      const icon = codeIcons[h.weatherCode] || '❓';
      const rainBar = h.probability > 0 ? `<div class="w-hour-rain-bar"><div class="w-hour-rain-fill" style="width:${h.probability}%;background:${h.probability > 60 ? 'rgba(100,180,255,0.9)' : h.probability > 30 ? 'rgba(100,180,255,0.6)' : 'rgba(100,180,255,0.35)'}"></div></div>` : '<div class="w-hour-rain-bar"><div class="w-hour-rain-fill" style="width:0%"></div></div>';
      return `<div class="w-hour-row">
        <span class="w-hour-time">${h.time}</span>
        <span class="w-hour-icon">${icon}</span>
        <span class="w-hour-temp">${Math.round(h.temperature)}°</span>
        <span class="w-hour-rain-wrap">${rainBar}<span class="w-hour-rain-pct">${h.probability}%</span></span>
        <span class="w-hour-wind">${h.windSpeed} km/h</span>
      </div>`;
    }).join('');

    const hourlyChipsHtml = hourly.map(h => {
      const icon = codeIcons[h.weatherCode] || '❓';
      const rainPct = h.probability || 0;
      const rainColor = rainPct > 60 ? '#3086b0' : rainPct > 30 ? '#64a4c8' : '#b0cfe0';
      return `<div class="w-hour-chip">
        <span class="w-chip-time">${h.time}</span>
        <span class="w-chip-icon">${icon}</span>
        <span class="w-chip-temp">${Math.round(h.temperature)}°</span>
        <div class="w-chip-rain-bar"><div class="w-chip-rain-fill" style="height:${rainPct}%;background:${rainColor}"></div></div>
        <span class="w-chip-rain" style="color:${rainColor}">${rainPct}%</span>
        <span class="w-chip-wind">${h.windSpeed}</span>
      </div>`;
    }).join('');

    const screen1 = `<div class="w-screen w-screen-today">
      <div class="w-today-hero">
        <div class="w-hero-main">
          <span class="w-big-icon">${c.icon}</span>
          <div class="w-hero-temp-block">
            <div class="w-big-temp">${c.temperature}<span class="w-big-unit">°C</span></div>
            <div class="w-big-desc">${c.description}</div>
            <div class="w-today-location">${locationName}</div>
          </div>
        </div>
        <div class="w-hero-stats">
          <div class="w-stat-card"><span class="w-sc-icon">🌡️</span><span class="w-sc-val">${c.feelsLike}°</span><span class="w-sc-lbl">Gefühlt</span></div>
          <div class="w-stat-card"><span class="w-sc-icon">💧</span><span class="w-sc-val">${c.humidity}%</span><span class="w-sc-lbl">Luftfeuchte</span></div>
          <div class="w-stat-card"><span class="w-sc-icon">💨</span><span class="w-sc-val">${c.windSpeed}</span><span class="w-sc-lbl">km/h ${windDirText}</span></div>
          <div class="w-stat-card"><span class="w-sc-icon">🌧️</span><span class="w-sc-val">${todayForecast ? todayForecast.precipProbability : 0}%</span><span class="w-sc-lbl">Regenrisiko</span></div>
          <div class="w-stat-card"><span class="w-sc-icon">📊</span><span class="w-sc-val">${c.pressure}</span><span class="w-sc-lbl">hPa</span></div>
          <div class="w-stat-card"><span class="w-sc-icon">👁️</span><span class="w-sc-val">${c.uvIndex !== undefined ? c.uvIndex : '—'}</span><span class="w-sc-lbl">UV-Index</span></div>
        </div>
        <div class="w-hero-right">
          ${todayForecast ? `<div class="w-hero-max">▲ ${todayForecast.tempMax}°</div><div class="w-hero-min">▼ ${todayForecast.tempMin}°</div>` : ''}
          <div class="w-hero-sun"><span>🌅 ${sunrise}</span><span>🌇 ${sunset}</span></div>
        </div>
      </div>
      <div class="w-hourly-section">
        <div class="w-section-title">Stündlicher Verlauf</div>
        <div class="w-hourly-chips">${hourlyChipsHtml}</div>
      </div>
    </div>`;

    // ===== SCREEN 2: 5-Tage-Vorhersage =====
    const forecastDays = w.forecast ? w.forecast.slice(0, 5) : [];
    const forecastCardsHtml = forecastDays.map((day, i) => {
      const isToday = i === 0;
      const dayName = isToday ? 'Heute' : day.weekday;
      const dateStr = new Date(day.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      return `<div class="w-fc-card${isToday ? ' w-fc-today' : ''}">
        <div class="w-fc-day-name">${dayName}</div>
        <div class="w-fc-date">${dateStr}</div>
        <div class="w-fc-icon">${day.icon}</div>
        <div class="w-fc-desc">${day.description}</div>
        <div class="w-fc-temps">
          <span class="w-fc-max">▲ ${day.tempMax}°</span>
          <span class="w-fc-min">▼ ${day.tempMin}°</span>
        </div>
        <div class="w-fc-details">
          <div class="w-fc-detail">🌧️ ${day.precipProbability}%</div>
          <div class="w-fc-detail">💧 ${day.precipitation > 0 ? day.precipitation + ' mm' : '—'}</div>
          <div class="w-fc-detail">💨 ${day.windMax} km/h</div>
        </div>
        <div class="w-fc-sun">☀️ ${day.sunrise ? day.sunrise.split('T')[1]?.substring(0, 5) : ''} — ${day.sunset ? day.sunset.split('T')[1]?.substring(0, 5) : ''}</div>
      </div>`;
    }).join('');

    const screen2 = `<div class="w-screen w-screen-forecast">
      <div class="w-section-title" style="text-align:center;margin-bottom:2vh;">5-Tage-Vorhersage ${locationName}</div>
      <div class="w-fc-grid">${forecastCardsHtml}</div>
    </div>`;

    // ===== SCREEN 3: Niederschlagsvorhersage — nächste 6 Stunden =====
    const next6h = (w.hourlyRain || []).slice(0, 6);
    const precipBarsHtml = next6h.map(h => {
      const pct = h.probability || 0;
      const mm  = h.precipitation || 0;
      const color = pct > 60 ? '#2e8fd4' : pct > 30 ? '#64b0d8' : '#a8d0e8';
      const icon  = codeIcons[h.weatherCode] || '🌧️';
      return `<div class="w-precip-bar-col">
        <span class="w-precip-time">${h.time}</span>
        <span class="w-precip-icon">${icon}</span>
        <div class="w-precip-bar-wrap"><div class="w-precip-bar-fill" style="height:${pct}%;background:${color}"></div></div>
        <span class="w-precip-pct" style="color:${color}">${pct}%</span>
        ${mm > 0 ? `<span class="w-precip-mm">${mm.toFixed(1)} mm</span>` : '<span class="w-precip-mm">&mdash;</span>'}
      </div>`;
    }).join('');

    const screen3 = `<div class="w-screen w-screen-radar">
      <div class="w-radar-header">
        <span class="w-section-title">Niederschlagsvorhersage — nächste 2 Stunden</span>
        <div class="w-precip-bars">${precipBarsHtml}</div>
      </div>
      <div class="w-radar-frame">
        <div id="rainradar-map" data-lat="${lat}" data-lon="${lon}" style="width:100%;height:100%;border-radius:1.5vh;"></div>
        <div class="radar-timeline">
          <div class="radar-timeline-bar"><div class="radar-timeline-progress" id="radar-progress"></div></div>
          <span class="radar-timestamp" id="radar-timestamp"></span>
        </div>
      </div>
    </div>`;

    return [screen1, screen2, ...(currentDisplayInfo?.showRainRadar === true ? [screen3] : [])];
  } catch (e) {
    console.warn('Wetter-Widget Fehler:', e);
    return [];
  }
}

/**
 * Regenradar-Animation initialisieren (RainViewer API + Leaflet)
 * Wird aufgerufen wenn der Radar-Slide sichtbar wird.
 */
function initRainRadar() {
  // Vorherige Animation aufräumen
  if (rainRadarCleanup) {
    rainRadarCleanup();
    rainRadarCleanup = null;
  }

  const mapEl = document.getElementById('rainradar-map');
  if (!mapEl || typeof L === 'undefined') return;

  // Sicherstellen dass der Container bereits Dimensionen hat
  const rect = mapEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    setTimeout(() => initRainRadar(), 200);
    return;
  }

  const lat = parseFloat(mapEl.dataset.lat) || 51.76;
  const lon = parseFloat(mapEl.dataset.lon) || 7.89;

  // Leaflet-Karte erstellen
  const map = L.map(mapEl, {
    center: [lat, lon],
    zoom: 8,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
  });

  // CartoDB Light Basis-Karte
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Standort-Marker
  L.circleMarker([lat, lon], {
    radius: 7,
    fillColor: '#009640',
    color: '#fff',
    weight: 2.5,
    fillOpacity: 1,
  }).addTo(map);

  // Karte nach Layout-Berechnung invalidieren
  setTimeout(() => map.invalidateSize(), 200);

  // RainViewer Radar-Daten laden und animieren
  let animationTimer = null;
  let radarLayers = [];
  let currentFrame = 0;

  fetch('https://api.rainviewer.com/public/weather-maps.json')
    .then(r => r.json())
    .then(data => {
      const host = data.host || 'https://tilecache.rainviewer.com';
      const past = data.radar?.past || [];
      const nowcast = data.radar?.nowcast || [];

      // Letzte 4 vergangene Frames + alle Nowcast-Frames
      const recentPast = past.slice(-4);
      const frames = [...recentPast, ...nowcast];
      if (frames.length === 0) return;
      const nowcastOffset = recentPast.length;

      // Radar-Layer für jeden Frame erstellen
      radarLayers = frames.map(frame => {
        const layer = L.tileLayer(
          `${host}${frame.path}/256/{z}/{x}/{y}/4/1_1.png`,
          { opacity: 0, maxZoom: 19, zIndex: 10 }
        );
        layer._radarTime = frame.time;
        layer._isForecast = false; // wird unten gesetzt
        layer.addTo(map);
        return layer;
      });
      // Nowcast-Frames markieren
      radarLayers.slice(nowcastOffset).forEach(l => { l._isForecast = true; });

      const progressEl = document.getElementById('radar-progress');
      const timestampEl = document.getElementById('radar-timestamp');

      function showFrame(idx) {
        radarLayers.forEach((layer, i) => {
          layer.setOpacity(i === idx ? 0.65 : 0);
        });

        if (progressEl) {
          progressEl.style.width = ((idx + 1) / radarLayers.length * 100) + '%';
        }

        if (timestampEl && radarLayers[idx]) {
          const frameMs = radarLayers[idx]._radarTime * 1000;
          const t = new Date(frameMs);
          const hh = String(t.getHours()).padStart(2, '0');
          const mm = String(t.getMinutes()).padStart(2, '0');
          const isForecast = radarLayers[idx]._isForecast;
          const diffMin = Math.round((frameMs - Date.now()) / 60000);
          if (isForecast) {
            timestampEl.textContent = `${hh}:${mm}  ⟶ +${Math.abs(diffMin)} Min.`;
          } else {
            const agoMin = Math.abs(diffMin);
            timestampEl.textContent = agoMin < 3
              ? `${hh}:${mm}  Jetzt`
              : `${hh}:${mm}  vor ${agoMin} Min.`;
          }
        }

        currentFrame = idx;
      }

      showFrame(0);

      function animate() {
        const nextIdx = (currentFrame + 1) % radarLayers.length;
        showFrame(nextIdx);
        const isLast = nextIdx === radarLayers.length - 1;
        animationTimer = setTimeout(animate, isLast ? 2500 : 650);
      }

      animationTimer = setTimeout(animate, 1200);
    })
    .catch(err => {
      console.warn('RainViewer API Fehler:', err);
      mapEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f8fb;border-radius:1.5vh;flex-direction:column;gap:1.2vh;color:#888;">
        <span style="font-size:5vh">🌧️</span>
        <span style="font-size:1.8vh;font-weight:600;">Radar-Daten momentan nicht verfügbar</span>
      </div>`;
    });

  // Cleanup-Funktion registrieren
  rainRadarCleanup = () => {
    if (animationTimer) clearTimeout(animationTimer);
    radarLayers.forEach(l => { try { map.removeLayer(l); } catch (e) {} });
    try { map.remove(); } catch (e) {}
  };
}

// ============================================
// News-Widget
// ============================================
async function renderNewsWidget() {
  const ns = liveDataState.newsSettings;
  if (!ns || ns['news.enabled'] !== 'true') return [];

  try {
    const response = await fetch('/api/news');
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.success || !data.data) return [];

    const { world, local } = data.data;
    if (!world.length && !local.length) return [];

    function formatAge(pubDate) {
      if (!pubDate) return '';
      try {
        const diff = Math.floor((Date.now() - new Date(pubDate).getTime()) / 60000);
        if (diff < 1) return 'Gerade eben';
        if (diff < 60) return `vor ${diff} Min.`;
        const h = Math.floor(diff / 60);
        if (h < 24) return `vor ${h} Std.`;
        return `vor ${Math.floor(h / 24)} Tag(en)`;
      } catch { return ''; }
    }

    // --- 4-Phasen-Rotation (localStorage) ---
    // Zyklus:
    //   Phase 0 (Vollwechsel): W-featured, W-normalA, L-normalB (alle neu)  → phase=1
    //   Phase 1: neues W-featured, A+B unverändert                          → phase=2
    //   Phase 2: neues W-featured, altes featured→normalA, B unverändert    → phase=3
    //   Phase 3: neues W-featured, altes featured→normalA, neues L-normalB  → phase=0
    function storyAt(arr, idx) {
      if (!arr || arr.length === 0) return null;
      return arr[((idx % arr.length) + arr.length) % arr.length];
    }

    let state = null;
    try { state = JSON.parse(localStorage.getItem('newsRotationState') || 'null'); } catch {}

    let featured, normalA, normalB;

    if (!state || typeof state.phase !== 'number') {
      // Erster Start → Phase 0 ausführen
      featured = storyAt(world, 0);
      normalA   = storyAt(world, 1);
      normalB   = storyAt(local, 0);
      state = { phase: 1, featured, normalA, normalB, worldPtr: 2 % (world.length || 1), localPtr: 1 % (local.length || 1) };
    } else {
      const wPtr = state.worldPtr || 0;
      const lPtr = state.localPtr || 0;
      const ph   = state.phase;

      if (ph === 1) {
        // Neues featured, A und B unverändert
        featured = storyAt(world, wPtr);
        normalA  = state.normalA;
        normalB  = state.normalB;
        state = { phase: 2, featured, normalA, normalB,
          worldPtr: (wPtr + 1) % (world.length || 1), localPtr: lPtr };

      } else if (ph === 2) {
        // Neues featured, altes featured → normalA, B unverändert
        featured = storyAt(world, wPtr);
        normalA  = state.featured;
        normalB  = state.normalB;
        state = { phase: 3, featured, normalA, normalB,
          worldPtr: (wPtr + 1) % (world.length || 1), localPtr: lPtr };

      } else if (ph === 3) {
        // Neues featured, altes featured → normalA, neues local → normalB
        featured = storyAt(world, wPtr);
        normalA  = state.featured;
        normalB  = storyAt(local, lPtr);
        state = { phase: 0, featured, normalA, normalB,
          worldPtr: (wPtr + 1) % (world.length || 1),
          localPtr: (lPtr + 1) % (local.length || 1) };

      } else {
        // Phase 0: Vollwechsel – drei neue Geschichten
        featured = storyAt(world, wPtr);
        normalA  = storyAt(world, (wPtr + 1) % (world.length || 1));
        normalB  = storyAt(local, lPtr);
        state = { phase: 1, featured, normalA, normalB,
          worldPtr: (wPtr + 2) % (world.length || 1),
          localPtr: (lPtr + 1) % (local.length || 1) };
      }
    }

    try { localStorage.setItem('newsRotationState', JSON.stringify(state)); } catch {}

    function buildCard(item, isLead) {
      if (!item) return '';
      const age = formatAge(item.pubDate);
      const sourceLabel = item.source || '';
      return `<div class="news-card${isLead ? ' news-card-lead' : ''}">
        <div class="news-card-meta">
          <span class="news-source">${sourceLabel}</span>
          ${age ? `<span class="news-age">${age}</span>` : ''}
        </div>
        <div class="news-title">${item.title || ''}</div>
        ${isLead && item.description ? `<div class="news-desc">${item.description}</div>` : ''}
      </div>`;
    }

    const slideHtml = `<div class="news-screen">
      <div class="news-screen-header">
        <span class="news-header-icon">📰</span>
        <span class="news-header-title">Nachrichten</span>
      </div>
      <div class="news-grid">
        ${buildCard(featured, true)}
        ${buildCard(normalA, false)}
        ${buildCard(normalB, false)}
      </div>
    </div>`;

    return [slideHtml];
  } catch (e) {
    console.warn('News-Widget Fehler:', e);
    return [];
  }
}
async function showLiveDataWidget(categoryFilter) {
  // Zeitstempel und Kategoriezeiger sofort vorrücken (verhindert Doppelauslösung)
  liveDataState.lastInsertTime = Date.now();
  if (categoryFilter === 'transit') {
    liveDataState.lastTransitInsertTime = Date.now(); // Rush-Hour-Timer aktualisieren
  }
  if (categoryFilter === 'news') {
    liveDataState.lastNewsInsertTime = Date.now(); // Nachrichten-Morgen-Timer aktualisieren
  }
  const cats = getActiveLiveCategories();
  if (cats.length > 0) {
    liveDataState.nextCategoryIdx = (liveDataState.nextCategoryIdx + 1) % cats.length;
  }
  liveDataState.isWidgetActive = true;

  const container = document.getElementById('current-post');
  if (!container) return;

  // Header-Kategorie auf Live-Daten setzen
  const headerCategory = document.getElementById('header-category');
  if (headerCategory) {
    headerCategory.innerHTML = `<div style="background: #009640; color: white; padding: 0.34rem 0.67rem; border-radius: 11px; font-size: 0.49rem; font-weight: 700; box-shadow: 0 2px 8px rgba(0,150,64,0.25); letter-spacing: 0.02em;">◉ Live-Daten</div>`;
  }

  container.className = 'post type-livedata';
  container.innerHTML = '<div class="live-widget-loading"><div class="spinner"></div><p>Lade Live-Daten...</p></div>';

  // Nur die benötigte Kategorie laden (spart Anfragen, reduziert Wartezeit)
  const showTransit  = !categoryFilter || categoryFilter === 'transit';
  const showTraffic  = !categoryFilter || categoryFilter === 'traffic';
  const showWeather  = !categoryFilter || categoryFilter === 'weather';
  const showNews     = !categoryFilter || categoryFilter === 'news';

  const [transitHtml, trafficHtml, weatherSlides, newsSlides] = await Promise.all([
    showTransit ? renderTransitWidget()  : Promise.resolve(''),
    showTraffic ? renderTrafficWidget()  : Promise.resolve(''),
    showWeather ? renderWeatherWidget()  : Promise.resolve([]),
    showNews    ? renderNewsWidget()     : Promise.resolve([]),
  ]);

  if (!transitHtml && !trafficHtml && (!weatherSlides || weatherSlides.length === 0) && (!newsSlides || newsSlides.length === 0)) {
    liveDataState.isWidgetActive = false;
    nextPost();
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  // Interval aus Einstellungen
  const intervalMin = displaySettings.liveDataIntervalMinutes;

  // Sammle die Slides
  const slides = [];

  if (transitHtml) {
    const stationName = liveDataState.transitSettings?.['transit.stationName'] || 'ÖPNV';
    slides.push({
      icon: '◉',
      title: `Abfahrten ${stationName}`,
      content: transitHtml,
      timeStr,
      intervalMin,
      type: 'transit',
    });
  }

  if (trafficHtml) {
    const highways = (liveDataState.trafficSettings?.['traffic.highways'] || '').split(',').filter(Boolean).join(', ');
    slides.push({
      icon: '◇',
      title: `Verkehrslage ${highways}`,
      content: trafficHtml,
      timeStr,
      intervalMin,
      type: 'traffic',
    });
  }

  // Wetter: 3 separate Slides
  if (weatherSlides && weatherSlides.length > 0) {
    const locationName = liveDataState.weatherSettings?.['weather.locationName'] || 'Wetter';
    const weatherTitles = [`Wetter Heute — ${locationName}`, `5-Tage-Vorhersage — ${locationName}`, `Regenradar — ${locationName}`];
    weatherSlides.forEach((html, i) => {
      slides.push({
        icon: '○',
        title: weatherTitles[i] || `Wetter ${locationName}`,
        content: html,
        timeStr,
        intervalMin,
        type: 'weather',
      });
    });
  }

  // Nachrichten: ein kombinierter Slide (2 Welt + 1 Lokal, rotierende Hervorhebung)
  if (newsSlides && newsSlides.length > 0) {
    newsSlides.forEach((html) => {
      slides.push({
        icon: '📰',
        title: 'Nachrichten',
        content: html,
        timeStr,
        intervalMin,
        type: 'news',
      });
    });
  }

  // Zeige Slides nacheinander
  let currentSlideIndex = 0;

  function showSlide(index) {
    const slide = slides[index];
    const slideClass = slide.type ? `slide-${slide.type}` : '';
    container.innerHTML = `
      <div class="live-data-widget ${slideClass}">
        <div class="live-widget-header">
          <div class="live-header-left">
            <span class="live-indicator">● LIVE</span>
            <span class="live-title">${slide.title}</span>
          </div>
        </div>
        <div class="live-widget-content">
          ${slide.content}
        </div>
        <div class="live-widget-footer">
          ${slides.length > 1 ? `<span class="live-footer-pages">${Array.from({length: slides.length}, (_, j) => `<span class="live-page-dot${j === index ? ' active' : ''}"></span>`).join('')}</span>` : ''}
          <span class="live-footer-info">Aktualisierung alle ${slide.intervalMin} Min.</span>
        </div>
      </div>
    `;

    // Regenradar initialisieren wenn Radar-Slide angezeigt wird
    if (document.getElementById('rainradar-map')) {
      setTimeout(() => initRainRadar(), 400);
    }

    clearTimeout(autoRotateTimer);
    autoRotateTimer = setTimeout(() => {
      // Radar-Animation aufräumen bevor nächster Slide kommt
      if (rainRadarCleanup) {
        rainRadarCleanup();
        rainRadarCleanup = null;
      }
      if (index + 1 < slides.length) {
        // Blend-Übergang zwischen Live-Slides
        applyBlendTransition(container, () => showSlide(index + 1));
      } else {
        liveDataState.isWidgetActive = false;
        nextPost(); // nextPost() übernimmt eigenen Blend-Übergang
      }
    }, displaySettings.liveDataSlideDuration * 1000);
  }

  // Erster Slide direkt zeigen (Blend wird beim Eintritt via nextPost() gemacht)
  showSlide(0);
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
      if (settings['display.liveDataIntervalMinutes'] !== undefined) {
        displaySettings.liveDataIntervalMinutes = parseInt(settings['display.liveDataIntervalMinutes']) || 5;
      }
      if (settings['display.liveDataSlideDuration'] !== undefined) {
        displaySettings.liveDataSlideDuration = parseInt(settings['display.liveDataSlideDuration']) || 20;
      }
      if (settings['display.showPostCounter'] !== undefined) {
        displaySettings.showPostCounter = (settings['display.showPostCounter'] === 'true' || settings['display.showPostCounter'] === true);
      }
      
      console.log('Display-Einstellungen geladen:', displaySettings);
      
      // Setze CSS-Klasse basierend auf Transition-Berechtigung
      updateTransitionsState();
      
      // Aktualisiere Fußzeile
      updateRefreshInfo();
      
      return true;
    } else {
      console.log('Verwende Standard-Einstellungen (Backend nicht verfügbar)');
      // Setze trotzdem Transitions und Footer-Text mit Standardwerten
      updateTransitionsState();
      updateRefreshInfo();
      return false;
    }
  } catch (error) {
    console.log('Fehler beim Laden der Display-Einstellungen:', error);
    console.log('Verwende Standard-Einstellungen');
    // Setze trotzdem Transitions und Footer-Text mit Standardwerten
    updateTransitionsState();
    updateRefreshInfo();
    return false;
  }
}

// Baut die Ticker-Texte aus statischen und Live-Daten zusammen
async function buildLiveTickerParts() {
  const sep = '     ✦     ';
  const parts = [];

  // 1. Statischer Text
  const staticText = currentDisplayInfo && currentDisplayInfo.tickerText ? currentDisplayInfo.tickerText.trim() : '';
  if (staticText) parts.push(staticText);

  // 2. ÖPNV-Abfahrten (alle nächsten Abfahrten, Verspätungen hervorgehoben)
  if (currentDisplayInfo && currentDisplayInfo.tickerTransit) {
    const ts = liveDataState.transitSettings || {};
    const stationId = ts['transit.stationId'];
    const stationName = ts['transit.stationName'] || '';
    if (stationId) {
      try {
        const res = await fetch(`/api/transit/departures/${stationId}?limit=5&duration=120`);
        if (res.ok) {
          const data = await res.json();
          const allDeps = (data.data || []).slice(0, 5);
          if (allDeps.length > 0) {
            const items = allDeps.map(dep => {
              const line = dep.line?.name || dep.line?.fahrtNr || '?';
              const dir = dep.direction ? dep.direction.substring(0, 20) : '';
              // Abfahrtszeit formatieren
              const whenStr = dep.when || dep.plannedWhen;
              let timeStr = '';
              if (whenStr) {
                const d = new Date(whenStr);
                timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
              }
              if (dep.cancelled) return `❌ ${line} ${dir} ${timeStr}: Ausfall`;
              // Verspätung prüfen
              let delayMin = dep.delay ? Math.round(dep.delay / 60) : 0;
              if (!delayMin && dep.when && dep.plannedWhen) {
                delayMin = Math.round((new Date(dep.when) - new Date(dep.plannedWhen)) / 60000);
              }
              if (delayMin > 1) return `⚠️ ${line} ${dir} ${timeStr} (+${delayMin}')`;
              return `🚏 ${line} ${dir} ${timeStr}`;
            }).filter(Boolean);
            if (items.length > 0) {
              const label = stationName ? `🚉 ${stationName}: ` : '🚉 ';
              parts.push(label + items.join(' | '));
            }
          }
        }
      } catch (e) {
        console.log('Ticker ÖPNV Fehler:', e);
      }
    }
  }

  // 3. Verkehrsmeldungen
  if (currentDisplayInfo && currentDisplayInfo.tickerTraffic) {
    const tr = liveDataState.trafficSettings || {};
    const hwStr = tr['traffic.highways'] || '';
    if (hwStr) {
      const highways = hwStr.split(',').map(h => h.trim()).filter(Boolean);
      const trafficItems = [];
      for (const hw of highways) {
        try {
          const res = await fetch(`/api/traffic/highways/${hw}`);
          if (res.ok) {
            const data = await res.json();
            const td = data.data || {};
            const warnings = td.warnings || [];
            const roadworks = td.roadworks || [];
            const closures = td.closures || [];
            const seenIds = new Set();
            for (const w of warnings.slice(0, 2)) {
              if (w.identifier) seenIds.add(w.identifier);
              trafficItems.push(`⚠️ ${hw}: ${w.title || w.subtitle || ''}`);
            }
            for (const r of roadworks.slice(0, 2)) {
              if (r.identifier && seenIds.has(r.identifier)) continue;
              trafficItems.push(`🚧 ${hw}: ${r.title || ''}`);
            }
            for (const c of closures.slice(0, 1)) {
              if (c.identifier && seenIds.has(c.identifier)) continue;
              trafficItems.push(`🚫 ${hw}: ${c.title || ''}`);
            }
            if (warnings.length === 0 && roadworks.length === 0 && closures.length === 0) {
              trafficItems.push(`✅ ${hw}: keine Meldungen`);
            }
          }
        } catch (e) {
          console.log('Ticker Verkehr Fehler:', hw, e);
        }
      }
      if (trafficItems.length > 0) parts.push(trafficItems.join('  ·  '));
    }
  }

  // 4. Nachrichten im Ticker
  if (currentDisplayInfo && currentDisplayInfo.tickerNews) {
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const allItems = [...(data.data.world || []), ...(data.data.local || [])].slice(0, 5);
          const newsItems = allItems.map(n => `📰 ${n.title || ''}`).filter(Boolean);
          if (newsItems.length > 0) parts.push(newsItems.join('  ·  '));
        }
      }
    } catch (e) {
      console.log('Ticker Nachrichten Fehler:', e);
    }
  }

  // 5. Wetter im Ticker
  if (currentDisplayInfo && currentDisplayInfo.tickerWeather) {
    const ws = liveDataState.weatherSettings || {};
    const lat = ws['weather.latitude'];
    const lon = ws['weather.longitude'];
    const locationName = ws['weather.locationName'] || 'Wetter';
    if (lat && lon) {
      try {
        const res = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}&name=${encodeURIComponent(locationName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const c = data.data.current;
            if (c) {
              const temp = c.temperature !== undefined ? `${Math.round(c.temperature)}°C` : '';
              const icon = c.icon || '🌤';
              const desc = c.description || '';
              parts.push(`${icon} ${locationName}: ${temp}${desc ? ' · ' + desc : ''}`);
            }
          }
        }
      } catch (e) {
        console.log('Ticker Wetter Fehler:', e);
      }
    } else {
      console.log('Ticker Wetter: Kein Standort konfiguriert (weather.latitude/longitude fehlen)');
    }
  }

  return parts.length > 0 ? parts.join(sep) : '';
}

// Aktualisiere Ticker / Laufschrift basierend auf Display-Info
async function updateTicker() {
  const bar = document.getElementById('ticker-bar');
  const track = document.getElementById('ticker-track');
  if (!bar || !track) return;

  const text = await buildLiveTickerParts();
  if (!text) {
    bar.style.display = 'none';
    tickerCurrentText = null;
    return;
  }

  bar.style.display = '';

  // Kein Neuaufbau wenn Text unverändert — verhindert Sprung beim Live-Refresh
  if (text === tickerCurrentText && track.children.length > 0) return;
  tickerCurrentText = text;

  // Echte Span-Breite messen damit genug Kopien für Full-Screen-Scrolling vorhanden sind
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;white-space:nowrap;visibility:hidden;font-size:0.88rem;padding:0 5vw;font-family:var(--font-primary);letter-spacing:0.03em;';
  probe.textContent = text;
  document.body.appendChild(probe);
  const spanW = probe.getBoundingClientRect().width || (window.innerWidth * 0.9);
  document.body.removeChild(probe);

  const screenW = window.innerWidth || 1920;
  // Genug Kopien damit Track ≥ 2 × Bildschirmbreite (für -50%-Animation nahtlos)
  let copies = Math.max(2, Math.ceil((screenW * 2.2) / spanW));
  if (copies % 2 !== 0) copies++; // muss gerade Anzahl sein

  // Animation stoppen, Inhalt neu befüllen, Animation neu starten
  track.style.animation = 'none';
  track.innerHTML = '';
  for (let i = 0; i < copies; i++) {
    const s = document.createElement('span');
    s.textContent = text;
    track.appendChild(s);
  }
  track.offsetHeight; // Reflow erzwingen damit Animation neu beginnt

  // Scrollgeschwindigkeit konstant ~100 px/s (halbe Track-Breite wird animiert)
  const halfTrackW = (spanW * copies) / 2;
  const duration = Math.max(12, Math.round(halfTrackW / 100));
  track.style.animation = `ticker-scroll ${duration}s linear infinite`;
}

let tickerLiveInterval = null;
let tickerCurrentText = null;

// Startet den Ticker und plant Live-Daten-Aktualisierung alle 60 s
function startTickerRefresh() {
  if (isPreviewMode) return; // Kein Ticker in der Vorschau
  if (tickerLiveInterval) {
    clearInterval(tickerLiveInterval);
    tickerLiveInterval = null;
  }
  updateTicker();
  if (currentDisplayInfo && (currentDisplayInfo.tickerTransit || currentDisplayInfo.tickerTraffic || currentDisplayInfo.tickerNews || currentDisplayInfo.tickerWeather)) {
    tickerLiveInterval = setInterval(() => updateTicker(), 60000);
    console.log('📺 Ticker Live-Daten: Aktualisierung alle 60 s gestartet');
  }
}

// Aktualisiere Refresh-Info in der Fußzeile
function updateRefreshInfo() {
  const refreshElement = document.getElementById('auto-refresh-info');
  const nameElement = document.getElementById('display-name-info');
  const nameSeparator = document.getElementById('display-name-separator');
  if (refreshElement) {
    refreshElement.textContent = `Auto-Refresh: ${displaySettings.refreshInterval} Min`;
  }
  if (nameElement && nameSeparator) {
    if (currentDisplayName) {
      nameElement.textContent = currentDisplayName;
      nameElement.style.display = '';
      nameSeparator.style.display = '';
    } else {
      nameElement.style.display = 'none';
      nameSeparator.style.display = 'none';
    }
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

// ============================================
// Device-Authentifizierung & Token-Management
// ============================================

/**
 * Generiere eine stabile Client-ID für diesen Browser.
 * Wird einmalig erzeugt und in localStorage gespeichert.
 */
function getClientId() {
  // Versuche zunächst aus nativer Bridge zu laden (überlebt App-Neustarts)
  if (window.PrascoNative && typeof window.PrascoNative.getDeviceSerial === 'function') {
    try {
      const nativeSerial = window.PrascoNative.getDeviceSerial();
      if (nativeSerial && nativeSerial.startsWith('web-')) {
        const clientId = nativeSerial.replace('web-', '');
        localStorage.setItem('deviceClientId', clientId);
        return clientId;
      }
    } catch (e) { /* ignorieren */ }
  }

  let clientId = localStorage.getItem('deviceClientId');
  if (!clientId) {
    // crypto.randomUUID() ist in allen modernen Browsern verfügbar
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      clientId = crypto.randomUUID();
    } else {
      // Fallback für ältere Browser
      clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }
    localStorage.setItem('deviceClientId', clientId);
    // Native persistieren für App-Neustarts
    if (window.PrascoNative && typeof window.PrascoNative.setDeviceSerial === 'function') {
      try { window.PrascoNative.setDeviceSerial('web-' + clientId); } catch (e) { /* ignorieren */ }
    }
    console.log('Neue Client-ID generiert:', clientId);
  }
  return clientId;
}

/**
 * Registriere dieses Gerät beim Server und erhalte einen Device-Token.
 * Falls bereits registriert, wird der bestehende Token zurückgegeben.
 * @param {string} [displayIdentifier] - Optional: Display-Identifier für gezielte Registrierung
 */
async function getOrCreateDeviceToken(displayIdentifier) {
  // 0. Prüfe ob nativer Android-Layer Token bereitstellt (WebView in nativer App)
  if (window.PrascoNative) {
    try {
      const nativeToken = window.PrascoNative.getDeviceToken();
      if (nativeToken) {
        localStorage.setItem('deviceToken', nativeToken);
        deviceToken = nativeToken;
        console.log('Device-Token von nativer App übernommen');
        return deviceToken;
      }
    } catch (e) {
      console.warn('getDeviceToken() nicht verfügbar:', e.message);
    }
  }

  // 1. Prüfe localStorage auf vorhandenen Token
  const storedToken = localStorage.getItem('deviceToken');
  if (storedToken && !displayIdentifier) {
    deviceToken = storedToken;
    console.log('Device-Token aus localStorage geladen');
    return deviceToken;
  }

  // 2. Registriere Gerät
  const clientId = getClientId();
  const serialNumber = 'web-' + clientId;

  // Geräteinformationen sammeln
  const ua = navigator.userAgent;
  let deviceModel = 'Web Browser';
  if (ua.includes('Chrome')) deviceModel = 'Chrome';
  else if (ua.includes('Firefox')) deviceModel = 'Firefox';
  else if (ua.includes('Safari')) deviceModel = 'Safari';
  else if (ua.includes('Edge')) deviceModel = 'Edge';

  try {
    const params = new URLSearchParams({
      serialNumber: serialNumber,
      clientType: 'web',
      deviceModel: deviceModel + ' (' + navigator.platform + ')',
      deviceOsVersion: navigator.platform || 'Unknown',
      appVersion: 'web-1.0',
    });
    if (displayIdentifier) {
      params.set('displayIdentifier', displayIdentifier);
    }

    console.log('Registriere Gerät:', serialNumber, displayIdentifier ? '→ Display: ' + displayIdentifier : '');
    const response = await fetch('/api/devices/register?' + params.toString());

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        deviceToken = data.data.deviceToken;
        deviceAuthStatus = data.data.authorizationStatus;
        localStorage.setItem('deviceToken', deviceToken);
        // Nativ persistieren damit der Token App-Neustarts überlebt
        if (window.PrascoNative && typeof window.PrascoNative.setDeviceToken === 'function') {
          try { window.PrascoNative.setDeviceToken(deviceToken); } catch (e) { /* ignorieren */ }
        }
        console.log('Gerät registriert, Status:', deviceAuthStatus);
        return deviceToken;
      }
    } else if (response.status === 403) {
      // Registrierung deaktiviert oder geschlossen
      const data = await response.json().catch(() => ({}));
      console.warn('Registrierung abgelehnt:', data.message || 'Unbekannter Fehler');
      // 'registration_closed' = Display belegt, Registrierung nicht offen → weiter warten
      // 'registration_disabled' = Registrierung global deaktiviert
      deviceAuthStatus = data.authorizationStatus === 'registration_closed'
        ? 'registration_disabled'
        : 'registration_disabled';
      return null;
    } else {
      console.warn('Registrierung fehlgeschlagen, Status:', response.status);
    }
  } catch (error) {
    console.warn('Registrierung fehlgeschlagen:', error);
  }

  return null;
}

/**
 * Authentifizierter Fetch-Wrapper.
 * Fügt Device-Token als Bearer-Header hinzu (wenn vorhanden).
 * Behandelt 401/403 Antworten für den Secure-Mode.
 */
async function authenticatedFetch(url, options = {}) {
  const fetchOptions = { ...options };

  const activeToken = isPreviewMode
    ? (localStorage.getItem('accessToken') || deviceToken)
    : deviceToken;

  if (activeToken) {
    fetchOptions.headers = {
      ...(fetchOptions.headers || {}),
      'Authorization': 'Bearer ' + activeToken,
    };
  }

  // Append ?preview so the backend middleware allows admin JWT in preview mode
  let fetchUrl = url;
  if (isPreviewMode && url.startsWith('/api/')) {
    fetchUrl = url + (url.includes('?') ? '&' : '?') + 'preview=1';
  }

  const response = await fetch(fetchUrl, fetchOptions);

  // Behandle Auth-Fehler im Secure-Mode
  if (response.status === 401) {
    if (isPreviewMode) {
      // In preview mode never show auth screen or create device tokens
      throw new Error('PREVIEW_NO_AUTH');
    }
    const data = await response.clone().json().catch(() => ({}));
    if (data.requiresAuth) {
      console.warn('Secure-Mode aktiv — Authentifizierung erforderlich');
      // Token ungültig oder fehlt — alten Token löschen und neu registrieren
      localStorage.removeItem('deviceToken');
      deviceToken = null;
      const token = await getOrCreateDeviceToken(currentDisplayIdentifier);
      if (token) {
        // Retry mit neuem Token
        return authenticatedFetch(url, options);
      }
      // deviceAuthStatus wurde von getOrCreateDeviceToken gesetzt (z.B. 'registration_disabled')
      // Zeige passenden Status statt generischem 'no_token'
      showAuthStatusScreen(deviceAuthStatus || 'no_token');
      throw new Error('AUTH_REQUIRED');
    }
  }

  if (response.status === 403) {
    const data = await response.clone().json().catch(() => ({}));
    if (data.authorizationStatus) {
      deviceAuthStatus = data.authorizationStatus;
      console.warn('Gerät nicht autorisiert, Status:', deviceAuthStatus);
      showAuthStatusScreen(deviceAuthStatus);
      throw new Error('NOT_AUTHORIZED');
    }
  }

  return response;
}

/**
 * Zeige Vollbild-Statusbildschirm wenn Gerät nicht autorisiert ist
 */
function showAuthStatusScreen(status) {
  // Never show auth screen in preview mode — admin is viewing content directly
  if (isPreviewMode) return;

  // Entferne vorhandenes Overlay falls vorhanden
  const existing = document.getElementById('auth-status-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'auth-status-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: 'Segoe UI', Arial, sans-serif;
  `;

  const clientId = localStorage.getItem('deviceClientId') || 'Unbekannt';
  const serialDisplay = 'web-' + clientId.substring(0, 8) + '...';

  let icon, title, message, statusColor;
  
  switch (status) {
    case 'pending':
      icon = '⏳';
      title = 'Warte auf Autorisierung';
      message = 'Dieses Gerät wurde registriert und wartet auf die Freigabe durch den Administrator.';
      statusColor = '#ffaa00';
      break;
    case 'rejected':
      icon = '🚫';
      title = 'Zugriff verweigert';
      message = 'Dieses Gerät wurde vom Administrator abgelehnt.';
      statusColor = '#dc3545';
      break;
    case 'revoked':
      icon = '🔒';
      title = 'Autorisierung widerrufen';
      message = 'Die Berechtigung für dieses Gerät wurde widerrufen.';
      statusColor = '#ff8800';
      break;
    case 'registration_disabled':
      icon = '🔐';
      title = 'Registrierung geschlossen';
      message = 'Die Geräte-Registrierung ist derzeit deaktiviert. Bitte den Administrator kontaktieren.';
      statusColor = '#6c757d';
      break;
    case 'no_token':
      icon = '🔑';
      title = 'Authentifizierung erforderlich';
      message = 'Dieses Display erfordert eine Geräte-Authentifizierung.';
      statusColor = '#ffaa00';
      break;
    default:
      icon = '❓';
      title = 'Unbekannter Status';
      message = 'Bitte den Administrator kontaktieren.';
      statusColor = '#6c757d';
  }

  overlay.innerHTML = `
    <div style="text-align: center; max-width: 600px; padding: 2rem;">
      <div style="font-size: 5rem; margin-bottom: 1.5rem;">${icon}</div>
      <h1 style="font-size: 2.2rem; margin-bottom: 1rem; font-weight: 300;">${title}</h1>
      <p style="font-size: 1.2rem; color: #ccc; margin-bottom: 2rem; line-height: 1.6;">${message}</p>
      <div style="
        background: rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid rgba(255,255,255,0.1);
      ">
        <p style="font-size: 0.9rem; color: #aaa; margin: 0;">
          Geräte-ID: <code style="color: #fff; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${serialDisplay}</code>
        </p>
        <p style="font-size: 0.9rem; color: #aaa; margin: 0.5rem 0 0;">
          Status: <span style="color: ${statusColor}; font-weight: 600;">${title}</span>
        </p>
      </div>
      ${status === 'pending' || status === 'no_token' || status === 'registration_disabled' ? `
        <div id="auth-status-spinner" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: #888;">
          <div style="width: 20px; height: 20px; border: 2px solid #444; border-top-color: ${statusColor}; border-radius: 50%; animation: authSpin 1s linear infinite;"></div>
          <span style="font-size: 0.9rem;">Prüfe Status alle 10 Sekunden...</span>
        </div>
        <style>@keyframes authSpin { to { transform: rotate(360deg); } }</style>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  // Starte Status-Polling
  startAuthStatusPolling();
}

/**
 * Polling: Prüfe alle 10 Sekunden den Geräte-Status.
 * Bei Wechsel zu 'authorized' → Seite neu laden.
 */
function startAuthStatusPolling() {
  if (authStatusPollInterval) clearInterval(authStatusPollInterval);

  async function checkStatus() {
    if (!deviceToken) {
      // Versuche erneut zu registrieren — mit Display-Identifier damit registrationOpen greift
      const token = await getOrCreateDeviceToken(currentDisplayIdentifier);
      if (token) {
        // Token erhalten, prüfe Status
        deviceToken = token;
      } else {
        return; // Immer noch kein Token
      }
    }

    try {
      const response = await fetch('/api/devices/status', {
        headers: { 'Authorization': 'Bearer ' + deviceToken },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const newStatus = data.data.authorizationStatus;
          console.log('Geräte-Status:', newStatus);

          if (newStatus === 'authorized') {
            // Autorisiert! Seite neu laden.
            console.log('Gerät autorisiert — lade Seite neu');
            clearInterval(authStatusPollInterval);
            authStatusPollInterval = null;
            window.location.reload();
            return;
          }

          // Status hat sich geändert aber nicht zu authorized — UI aktualisieren
          if (newStatus !== deviceAuthStatus) {
            deviceAuthStatus = newStatus;
            showAuthStatusScreen(newStatus);
          }
        }
      }
    } catch (error) {
      console.warn('Status-Abfrage fehlgeschlagen:', error);
    }
  }

  // Sofort prüfen, dann alle 10 Sekunden
  checkStatus();
  authStatusPollInterval = setInterval(checkStatus, 10000);
}

/**
 * Heartbeat: Aktualisiert lastSeenAt auf dem Server alle 60 Sekunden.
 * Prüft gleichzeitig den Auth-Status — bei Widerruf wird sofort reagiert.
 */
function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (!deviceToken) return;

  async function sendHeartbeat() {
    try {
      const response = await fetch('/api/devices/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + deviceToken,
        },
        body: JSON.stringify({ appVersion: 'web-1.0' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const newStatus = data.data.authorizationStatus;

          // Prüfe ob Autorisierung widerrufen wurde
          if (newStatus !== 'authorized' && deviceAuthStatus === 'authorized') {
            console.warn('Autorisierung widerrufen! Status:', newStatus);
            deviceAuthStatus = newStatus;
            showAuthStatusScreen(newStatus);
          }
        }
      }
    } catch (error) {
      console.warn('Heartbeat fehlgeschlagen:', error);
    }
  }

  // Erster Heartbeat nach 30s, dann alle 60s
  setTimeout(() => {
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 60000);
  }, 30000);
}

// Lade Display-Informationen
async function loadDisplayInfo(identifier) {
  if (!identifier) return null;

  try {
    const response = await authenticatedFetch(`/api/public/display/${identifier}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        currentDisplayName = data.data.name;
        currentDisplayInfo = data.data;
        console.log('Display geladen:', data.data.name, '| Transit:', data.data.showTransitData, '| Traffic:', data.data.showTrafficData);

        // Prüfe ob Registrierung offen ist (vom Admin gestartet) — nicht im Preview-Modus
        if (data.data.registrationOpen && !isPreviewMode) {
          console.log('Registrierung offen für Display', identifier, '— registriere automatisch...');
          // Alten Token löschen, damit eine frische Registrierung stattfindet
          localStorage.removeItem('deviceToken');
          deviceToken = null;
          const token = await getOrCreateDeviceToken(identifier);
          if (token) {
            console.log('Erfolgreich mit Display verknüpft! Lade Seite neu...');
            // Kurze Verzögerung, damit der Server die Daten verarbeiten kann
            setTimeout(() => window.location.reload(), 500);
            return data.data;
          }
        }

        updateTicker();
        updateRefreshInfo();
        return data.data;
      }
    }
  } catch (error) {
    if (error.message === 'AUTH_REQUIRED' || error.message === 'NOT_AUTHORIZED' || error.message === 'PREVIEW_NO_AUTH') {
      return null; // Auth-Screen wird bereits angezeigt
    }
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
      <h1 style="font-size: 2.5rem; margin-bottom: 2rem;">▢ Display auswählen</h1>
      <p style="font-size: 1.2rem; margin-bottom: 2rem; color: #ccc;">Wählen Sie ein Display aus oder bestätigen Sie mit OK</p>
      <div id="display-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div style="text-align: center; color: #999;">Lade Displays...</div>
      </div>
      <button id="btn-show-all" tabindex="0" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 1rem 2rem;
        font-size: 1.1rem;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 1rem;
        outline: none;
      ">Alle Inhalte anzeigen (kein spezifisches Display)</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event-Listener für "Alle anzeigen" Button (CSP-konform, kein inline onclick)
  const btnShowAll = document.getElementById('btn-show-all');
  btnShowAll.addEventListener('click', function() {
    selectDisplayAndReload(null);
  });
  btnShowAll.addEventListener('focus', function() {
    this.style.background = '#009640';
    this.style.transform = 'scale(1.05)';
    this.style.boxShadow = '0 0 20px rgba(0, 150, 64, 0.4)';
  });
  btnShowAll.addEventListener('blur', function() {
    this.style.background = '#007bff';
    this.style.transform = 'scale(1)';
    this.style.boxShadow = 'none';
  });

  // D-Pad / Fernbedienungs-Navigation für Display-Auswahl
  setupDisplaySelectionNavigation(overlay);

  // Lade verfügbare Displays (mit Auth falls Secure-Mode aktiv)
  try {
    const response = await authenticatedFetch('/api/public/displays');
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
        displayList.innerHTML = activeDisplays.map((display, idx) => `
          <div class="display-select-card" data-identifier="${escapeHtml(display.identifier)}" tabindex="0" style="
            background: #1a1a1a;
            border: 2px solid #333;
            border-radius: 12px;
            padding: 2rem 1.5rem;
            cursor: pointer;
            transition: all 0.3s;
            outline: none;
          ">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">▢</div>
            <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">${escapeHtml(display.name)}</h3>
            <p style="font-size: 0.9rem; color: #888; font-family: monospace;">${escapeHtml(display.identifier)}</p>
            ${display.description ? `<p style="font-size: 0.85rem; color: #666; margin-top: 0.75rem;">${escapeHtml(display.description)}</p>` : ''}
          </div>
        `).join('');

        // Event-Listener für Display-Karten (CSP-konform)
        displayList.querySelectorAll('.display-select-card').forEach(card => {
          card.addEventListener('click', function() {
            selectDisplayAndReload(this.dataset.identifier);
          });
          card.addEventListener('focus', function() {
            this.style.borderColor = '#009640';
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 0 20px rgba(0, 150, 64, 0.4)';
          });
          card.addEventListener('blur', function() {
            this.style.borderColor = '#333';
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
          });
          card.addEventListener('mouseover', function() {
            this.style.borderColor = '#009640';
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 0 20px rgba(0, 150, 64, 0.4)';
          });
          card.addEventListener('mouseout', function() {
            if (document.activeElement !== this) {
              this.style.borderColor = '#333';
              this.style.transform = 'scale(1)';
              this.style.boxShadow = 'none';
            }
          });
        });

        // Erstes Display fokussieren (für D-Pad Navigation)
        const firstCard = displayList.querySelector('.display-select-card');
        if (firstCard) {
          setTimeout(() => firstCard.focus(), 100);
        }
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

// D-Pad / Fernbedienungs-Navigation für Display-Auswahl
function setupDisplaySelectionNavigation(overlay) {
  // Keyboard/D-Pad Handler (Enter = Auswahl, Pfeiltasten = Navigation)
  document.addEventListener('keydown', function displayNavHandler(e) {
    // Nur aktiv wenn Overlay sichtbar
    if (!document.getElementById('display-selection-overlay')) {
      document.removeEventListener('keydown', displayNavHandler);
      return;
    }

    const cards = Array.from(overlay.querySelectorAll('.display-select-card'));
    const btnAll = document.getElementById('btn-show-all');
    // Alle navigierbaren Elemente: Karten + "Alle anzeigen" Button
    const allItems = [...cards, btnAll];
    const focused = document.activeElement;
    const currentIdx = allItems.indexOf(focused);

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (focused && focused.classList.contains('display-select-card')) {
          selectDisplayAndReload(focused.dataset.identifier);
        } else if (focused === btnAll) {
          selectDisplayAndReload(null);
        } else if (cards.length > 0) {
          // Nichts fokussiert → erstes Element auswählen
          cards[0].focus();
        }
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (currentIdx >= 0 && currentIdx < allItems.length - 1) {
          allItems[currentIdx + 1].focus();
        } else if (currentIdx === -1 && allItems.length > 0) {
          allItems[0].focus();
        }
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        if (currentIdx > 0) {
          allItems[currentIdx - 1].focus();
        } else if (currentIdx === -1 && allItems.length > 0) {
          allItems[allItems.length - 1].focus();
        }
        break;
    }
  });
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

// Baut inline-style Attribut für benutzerdefinierten Titelstil
function buildTitleStyle(post) {
  const parts = [];
  if (post.titleFontSize) parts.push(`font-size:${post.titleFontSize}`);
  if (post.titleFontFamily) parts.push(`font-family:${post.titleFontFamily}`);
  return parts.length ? ` style="${parts.join(';')}"` : '';
}

// ============================================
// Composite Layer Renderer
// ============================================

/**
 * Rendert einen einzelnen Layer innerhalb einer composite-Komposition.
 * Koordinaten in % (0–100), skaliert auf jede Displaygröße.
 */
function renderCompositeLayer(layer) {
  const x = layer.x != null ? layer.x : 0;
  const y = layer.y != null ? layer.y : 0;
  const w = layer.w != null ? layer.w : 100;
  const h = layer.h != null ? layer.h : 100;
  const z = layer.zIndex || 0;
  const posStyle = `left:${x}%;top:${y}%;width:${w}%;height:${h}%;z-index:${z};`;

  // Zusätzliche Inline-Styles aus layer.style-Objekt
  const extraParts = layer.style ? Object.entries(layer.style).map(([k, v]) => `${k}:${v}`) : [];
  const extraStyle = extraParts.join(';');
  const fullStyle = posStyle + (extraStyle ? extraStyle + ';' : '');

  // Zeitliche Attribute (delay/duration/transition) – für startCompositeLayerAnimations
  const delay = parseFloat(layer.delay || 0);
  const duration = parseFloat(layer.duration || 0);
  const transition = layer.transition || 'none';
  const needsAnim = delay > 0 || transition !== 'none';
  const dataAttrs = ` data-lb-delay="${delay}" data-lb-duration="${duration}" data-lb-transition="${transition}"${needsAnim ? ' style="opacity:0"' : ''}`;

  let html;
  switch (layer.type) {
    case 'text': {
      const isHtml = (layer.content || '').trimStart().startsWith('<');
      const body = isHtml
        ? layer.content
        : escapeHtml(layer.content || '').replace(/\n/g, '<br>');
      html = `<div class="composite-layer composite-layer-text" style="${fullStyle}">${body}</div>`;
      break;
    }
    case 'image':
      html = `<div class="composite-layer" style="${posStyle}"><img src="${escapeHtml(layer.src || '')}" style="width:100%;height:100%;object-fit:${layer.fit || 'cover'}" alt=""></div>`;
      break;
    case 'ticker': {
      const rawItems = Array.isArray(layer.items)
        ? layer.items
        : (layer.content || '').split('\n').filter(Boolean);
      const tickerContent = rawItems.map(i => `<span class="composite-ticker-item">${escapeHtml(i)}</span>`).join('');
      const bg = (layer.style && layer.style['background-color']) || '#009640';
      const col = (layer.style && layer.style.color) || '#fff';
      html = `<div class="composite-layer composite-layer-ticker" style="${posStyle}background:${bg};color:${col};"><div class="composite-ticker-inner">${tickerContent}${tickerContent}</div></div>`;
      break;
    }
    case 'html':
      html = `<div class="composite-layer" style="${fullStyle}">${layer.content || ''}</div>`;
      break;
    default:
      return '';
  }
  // Data-Attribute in das äußere <div> injizieren
  return html.replace(/^<div /, `<div${dataAttrs} `);
}

/**
 * Startet zeitgesteuerte Ein-/Ausblend-Animationen für Layer im Composite-Canvas.
 * Liest data-lb-delay (s), data-lb-duration (s), data-lb-transition aus dem DOM.
 */
function startCompositeLayerAnimations(canvas) {
  canvas.querySelectorAll('.composite-layer').forEach(el => {
    const delay      = parseFloat(el.dataset.lbDelay      || 0) * 1000;
    const duration   = parseFloat(el.dataset.lbDuration   || 0) * 1000;
    const transition = el.dataset.lbTransition || 'none';
    const animInClass  = transition !== 'none' ? `lb-anim-${transition}` : null;
    const animOutClass = transition === 'zoom'  ? 'lb-anim-zoom-out' : 'lb-anim-fadeout';

    const showEl = () => {
      el.style.opacity = '';
      el.style.pointerEvents = '';
      if (animInClass) {
        el.classList.remove(animInClass); // reset falls bereits vorhanden
        void el.offsetWidth;             // reflow
        el.classList.add(animInClass);
      }
    };

    const hideEl = () => {
      el.style.pointerEvents = 'none';
      if (animInClass) el.classList.remove(animInClass);
      el.classList.add(animOutClass);
    };

    if (delay > 0) {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      setTimeout(showEl, delay);
    } else if (animInClass) {
      // Direkt beim Start einblenden (nächster Frame für CSS-Transition)
      el.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(showEl));
    }

    if (duration > 0) {
      setTimeout(hideEl, delay + duration);
    }
  });
}

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
    title: '▢ Digitaler Infoscreen',
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
    title: '○ Wetter & Vorhersage',
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
    title: '◉ ÖPNV Live-Abfahrten',
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
    title: '◇ Verkehrslage Live',
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
  startTickerRefresh();
  startClock();
  updateDate();

  // Aktualisiere Refresh-Info nachdem DOM geladen ist
  updateRefreshInfo();

  if (posts.length > 0) {
    // Prüfe ob sofort eine Live-Daten-Kategorie angezeigt werden soll
    const startCategory = shouldInsertLiveDataWidget();
    if (startCategory) {
      showLiveDataWidget(startCategory);
    } else {
      displayCurrentPost();
    }
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

    // Versuche zuerst die API (mit Auth falls Secure-Mode)
    const response = await authenticatedFetch(apiUrl);
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
            blend_effect: post.blendEffect || post.blend_effect || 'fade',
            category_id: post.category?.id || post.categoryId || post.category_id,
            is_active: post.isActive !== false && post.is_active !== false,
          };
        });
        posts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return;
      }
    }
  } catch (apiError) {
    // Auth-Fehler — Status-Screen wird bereits angezeigt
    if (apiError.message === 'AUTH_REQUIRED' || apiError.message === 'NOT_AUTHORIZED' || apiError.message === 'PREVIEW_NO_AUTH') {
      return;
    }
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

  // Thema (hell/dunkel) anwenden
  container.classList.add(post.bgTheme === 'dark' ? 'theme-dark' : 'theme-light');

  // Füge Content-Type Klasse hinzu
  container.classList.add(`type-${post.content_type}`);

  // Render basierend auf Content-Type
  let html = '';

  switch (post.content_type) {
    case 'text': {
      // RTE-Inhalt ist HTML; einfacher Text hat kein < → Fallback auf br-replace
      const isHtml = (post.content || '').trimStart().startsWith('<');
      const textBody = isHtml
        ? (post.content || '')
        : (post.content || '').replace(/\n/g, '<br>');
      html = `
                ${post.showTitle === true ? `<h1${buildTitleStyle(post)}>${escapeHtml(post.title)}</h1>` : ''}
                <div>${textBody}</div>
            `;
      break;
    }

    case 'image':
      // Wenn kein media_url vorhanden ist, verwende content als Bild-URL (für Presentation Slides)
      const imageUrl = post.media_url || (post.content && post.content.startsWith('/uploads/') ? post.content : null);
      // Zeige content nur an, wenn es kein Pfad ist
      const imageContent = post.content && !post.content.startsWith('/uploads/') ? post.content : '';
      
      html = `
                ${post.showTitle === true ? `<h1${buildTitleStyle(post)}>${escapeHtml(post.title)}</h1>` : ''}
                ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(post.title)}">` : ''}
                ${imageContent ? `<p>${escapeHtml(imageContent)}</p>` : ''}
            `;
      break;

    case 'video':
      let videoHtml = '';

      // Prüfe ob Video stumm geschaltet werden soll (globale Musik aktiv)
      loadGlobalMusicSettings();
      const shouldMuteVideo =
        post.soundEnabled === false ||
        (globalMusicSettings.enabled && globalMusicSettings.muteVideos && globalMusicSettings.url);
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
              preload="auto"
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
              preload="auto"
              ${shouldMuteVideo ? 'muted' : ''}>
            </video>
          </div>`;
        }
      }
      // Video Vollbild - ohne Titel und Text
      html = videoHtml;

      // Nur Header/Footer verstecken wenn tatsächlich ein Video vorhanden ist
      if (videoHtml) {
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
      } else {
        // Kein Video vorhanden → Fehlermeldung anzeigen statt schwarzem Bild
        html = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary);">
            <div style="font-size:4rem; margin-bottom:1rem;">🎬</div>
            <h2 style="color:var(--prasco-black);">${escapeHtml(post.title)}</h2>
            <p style="margin-top:0.5rem;">Kein Video hinterlegt</p>
          </div>
        `;
      }
      break;

    case 'html':
      html = `
                ${post.showTitle === true ? `<h1${buildTitleStyle(post)}>${escapeHtml(post.title)}</h1>` : ''}
                <div>${post.content || ''}</div>
            `;
      break;

    case 'presentation':
      // PowerPoint Präsentation anzeigen
      html = await renderPresentation(post);
      break;

    case 'pdf':
      // Dokument anzeigen (PDF, Word, Excel, ODF)
      html = renderDocument(post);
      break;

    case 'word':
      // Word Dokument anzeigen
      html = renderWordDocument(post);
      break;

    case 'composite': {
      // Multi-Layer-Komposition
      let compositeData;
      try {
        compositeData = JSON.parse(post.content || '{}');
      } catch (e) {
        compositeData = { bg: '#ffffff', layers: [] };
      }
      const bgColor = compositeData.bg || '#ffffff';
      const layers = Array.isArray(compositeData.layers) ? compositeData.layers : [];
      const sortedLayers = layers
        .slice()
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const layersHtml = sortedLayers.map(renderCompositeLayer).join('');
      html = `<div class="composite-canvas" style="background:${escapeHtml(bgColor)}">${layersHtml}</div>`;
      // Composite-Canvas füllt den Post-Bereich (position:absolute relativ zu .post.type-composite)
      // Animationen werden nach DOM-Insertion gestartet (siehe unten)
      break;
    }

    default:
      html = `
                ${post.showTitle === true ? `<h1${buildTitleStyle(post)}>${escapeHtml(post.title)}</h1>` : ''}
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

  // Composite Layer Animationen starten (Delay, Dauer, Übergang)
  const compositeCanvas = container.querySelector('.composite-canvas');
  if (compositeCanvas) startCompositeLayerAnimations(compositeCanvas);

  // PDF.js Viewer starten falls PDF-Post
  initPdfViewer(container);

  // Update Post Counter
  updatePostCounter();

  // Hintergrundmusik starten/stoppen (auch bei Videos wenn globale Musik aktiv)
  playBackgroundMusic(post);

  // Zeige globale Musik-Indikator wenn aktiv
  updateGlobalMusicIndicator();

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

  // Prüfe ob eine Live-Daten-Kategorie fällig ist
  const liveCategory = shouldInsertLiveDataWidget();
  if (liveCategory) {
    // Blend-Übergang zum Live-Daten-Widget
    const liveContainer = document.getElementById('current-post');
    applyBlendTransition(liveContainer, () => showLiveDataWidget(liveCategory));
    return;
  }
  
  restoreHeaderFooter(); // Stelle Header/Footer wieder her
  const currentPost = posts[currentIndex];
  currentIndex = (currentIndex + 1) % posts.length;
  // Verwende Standard-Blendeffekt "fade" wenn keiner definiert ist
  // API liefert camelCase (blendEffect), Fallback auf snake_case für Kompatibilität
  const blendEffect = currentPost?.blendEffect || currentPost?.blend_effect || '';
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
  // API liefert camelCase (blendEffect), Fallback auf snake_case für Kompatibilität
  const blendEffect = currentPost?.blendEffect || currentPost?.blend_effect || '';
  displayCurrentPostWithBlend(blendEffect);
  updatePostCounter();
  updatePresentationCounter();
}

// ============================================
// Blend Effects - Übergangseffekte
// ============================================

/**
 * Generischer Blend-Übergang für beliebige Container.
 * Führt OUT-Animation → renderFn() → IN-Animation aus.
 * Wenn transitions deaktiviert: direkt renderFn() aufrufen.
 * @param {HTMLElement} container  - DOM-Element das animiert wird
 * @param {Function}    renderFn   - Funktion die den neuen Inhalt rendert (sync oder async start)
 * @param {string}      [blendEffect] - Effektname (z.B. 'fade'). Fallback: getNextBlendEffect()
 */
async function applyBlendTransition(container, renderFn, blendEffect) {
  if (!container) { renderFn(); return; }

  // Wenn Blend-Effekte komplett deaktiviert: direkt rendern
  if (!displaySettings.blendEffectsEnabled) {
    renderFn();
    return;
  }

  // Effekt aus Rotation wenn kein spezifischer angegeben
  const effect = (blendEffect && blendEffect !== '') ? blendEffect : getNextBlendEffect();

  // Direkt aus CSS bekannte Dauer (sync mit display.css)
  const OUT_MS = 450;
  const IN_MS  = 550;

  // Inline-Stil und alte Blend-Klassen bereinigen (inkl. blend-done)
  container.style.animation = '';
  container.className = container.className.split(' ').filter(c => !c.startsWith('blend-')).join(' ');

  const outClass = `blend-${effect}-out`;
  const inClass  = `blend-${effect}-in`;

  // Gemeinsame IN-Phase: nach OUT sofort opacity:0 sichern → renderFn → IN-Animation
  async function startIn() {
    // Inline opacity:0 hält den Container unsichtbar zwischen OUT-Ende und IN-Start,
    // damit kein Frame-Flash des neuen Inhalts sichtbar ist.
    container.style.opacity = '0';
    container.classList.remove('blend-transition-out', outClass);

    // Await renderFn so async content (presentations) is ready before IN starts
    await renderFn();

    // Direkt nach renderFn (synchron, kein Render-Frame dazwischen) blend-in-progress
    // setzen damit das CSS-fadeIn nicht durch container.className='post' ausgelöst wird.
    // Das verhindert den transform:translateY-Konflikt der den Ruck verursacht.
    container.classList.add('blend-in-progress');

    // Zwei rAF sicherstellen dass Browser Layout + Paint abgeschlossen hat
    requestAnimationFrame(() => requestAnimationFrame(() => {
      container.style.opacity = '';   // CSS-Animation übernimmt ab jetzt
      container.classList.remove('blend-in-progress');
      container.classList.add('blend-transition-in', inClass);

      let inDone = false;
      const inTimer = setTimeout(() => {
        if (inDone) return;
        inDone = true;
        container.classList.remove('blend-transition-in', inClass);
        // blend-done verhindert erneutes fadeIn-Trigger nach Blend-Ende
        container.classList.add('blend-done');
      }, IN_MS);

      container.addEventListener('animationend', function onInEnd() {
        if (inDone) return;
        inDone = true;
        clearTimeout(inTimer);
        container.removeEventListener('animationend', onInEnd);
        container.classList.remove('blend-transition-in', inClass);
        // blend-done verhindert erneutes fadeIn-Trigger nach Blend-Ende
        container.classList.add('blend-done');
      }, { once: true });
    }));
  }

  // OUT-Phase
  requestAnimationFrame(() => {
    container.classList.add('blend-transition-out', outClass);

    let outDone = false;
    const outTimer = setTimeout(() => {
      if (outDone) return;
      outDone = true;
      startIn();
    }, OUT_MS);

    container.addEventListener('animationend', function onOutEnd() {
      if (outDone) return;
      outDone = true;
      clearTimeout(outTimer);
      container.removeEventListener('animationend', onOutEnd);
      startIn();
    }, { once: true });
  });
}

// Wende Blend-Effekt an beim Wechsel zum nächsten Post
// blendEffect kann leer sein – dann wird automatisch rotiert
function displayCurrentPostWithBlend(blendEffect) {
  const container = document.getElementById('current-post');
  if (!container) {
    console.error('Post-Container nicht gefunden');
    return;
  }
  applyBlendTransition(container, () => {
    try {
      displayCurrentPost();
    } catch (error) {
      console.error('Fehler beim Anzeigen des Posts:', error);
      showNoContent();
    }
  }, blendEffect);
}

// Post-Counter aktualisieren
function updatePostCounter() {
  const counterElement = document.getElementById('post-counter');
  if (!counterElement) return;
  const indicator = counterElement.parentElement;
  if (!displaySettings.showPostCounter) {
    if (indicator) indicator.style.display = 'none';
    return;
  }
  if (indicator) indicator.style.display = '';
  if (posts.length > 0) {
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
let analogClockInitialized = false;

function initAnalogClockTicks() {
  const tickGroup = document.getElementById('clock-ticks');
  if (!tickGroup || tickGroup.children.length > 0) return;
  for (let i = 0; i < 60; i++) {
    const angle = i * 6; // 360/60
    const isHour = i % 5 === 0;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const r1 = isHour ? 38 : 43;
    const r2 = 47;
    const rad = (angle - 90) * Math.PI / 180;
    line.setAttribute('x1', String(50 + r1 * Math.cos(rad)));
    line.setAttribute('y1', String(50 + r1 * Math.sin(rad)));
    line.setAttribute('x2', String(50 + r2 * Math.cos(rad)));
    line.setAttribute('y2', String(50 + r2 * Math.sin(rad)));
    line.setAttribute('stroke', '#111');
    line.setAttribute('stroke-width', isHour ? '3' : '1');
    line.setAttribute('stroke-linecap', 'round');
    tickGroup.appendChild(line);
  }
  analogClockInitialized = true;
}

function setHandAngle(id, angleDeg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('transform', `rotate(${angleDeg}, 50, 50)`);
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const useAnalog = currentDisplayInfo?.clockStyle === 'analog';

  const clockElement = document.getElementById('clock');
  const analogElement = document.getElementById('clock-analog');

  if (useAnalog) {
    if (clockElement) clockElement.style.display = 'none';
    if (analogElement) {
      analogElement.style.display = '';
      if (!analogClockInitialized) initAnalogClockTicks();
      const h = now.getHours() % 12;
      const m = now.getMinutes();
      const s = now.getSeconds();
      // Stunden: 30° pro Stunde + 0.5° pro Minute
      setHandAngle('hand-hour', h * 30 + m * 0.5);
      // Minuten: 6° pro Minute + 0.1° pro Sekunde
      setHandAngle('hand-minute', m * 6 + s * 0.1);
      // Sekunden: 6° pro Sekunde, DB-Stil: gestoppt bei 59° für ~1s (vereinfacht: linear)
      setHandAngle('hand-second', s * 6);
      setHandAngle('hand-second-bob', s * 6);
    }
  } else {
    if (clockElement) {
      clockElement.style.display = '';
      clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
    if (analogElement) analogElement.style.display = 'none';
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
      // Display-Config mitaktualisieren (damit Einstellungsänderungen wie showRainRadar wirksam werden)
      if (currentDisplayIdentifier) {
        await loadDisplayInfo(currentDisplayIdentifier);
      }
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

  headerCategory.innerHTML = `<div style="background: #58585a; color: white; padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1.1rem; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">◆ ${escapeHtml(category.name)}</div>`;
}

// PDF.js Worker konfigurieren
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Gibt die Viewer-URL für ein nicht-PDF Dokument zurück.
// Office-Formate: Microsoft Office Online; sonstige (ODF, …): Google Docs Viewer.
function getDocumentViewerUrl(mediaUrl, mimeType) {
  const absoluteUrl = mediaUrl.startsWith('http')
    ? mediaUrl
    : window.location.origin + mediaUrl;
  const encoded = encodeURIComponent(absoluteUrl);
  const officeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (officeTypes.includes(mimeType)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
  }
  return `https://docs.google.com/viewer?embedded=true&url=${encoded}`;
}

// Dokument rendern (PDF via PDF.js, Office/ODF via externen Viewer)
function renderDocument(post) {
  const mediaUrl = post.media?.url || post.content;
  const mimeType = post.media?.mimeType || '';
  const isPdf = mimeType === 'application/pdf' ||
    (!mimeType && (mediaUrl || '').toLowerCase().endsWith('.pdf'));

  if (!mediaUrl) {
    return `
      <div style="text-align: center; padding: 60px;">
        <div style="font-size: 100px; margin-bottom: 30px;">📄</div>
        <h1>${escapeHtml(post.title)}</h1>
        <p style="font-size: 24px; color: #666;">Dokument</p>
        <p style="color: #999; margin-top: 20px;">Keine Datei verfügbar</p>
      </div>
    `;
  }

  if (isPdf) {
    return `
      <div style="height: 100%; display: flex; flex-direction: column; background: #525659;">
        ${post.showTitle === true ? `<div style="padding: 15px 30px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="margin: 0; color: #333; font-size: 24px;">📄 ${escapeHtml(post.title)}</h2>
        </div>` : ''}
        <div class="pdf-canvas-container" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding: 20px; gap: 12px;" data-pdf-url="${escapeHtml(mediaUrl)}">
          <p style="color: #ccc; font-size: 18px; margin-top: 40px;">⏳ Dokument wird geladen…</p>
        </div>
      </div>
    `;
  }

  // Office / ODF → externer Viewer (iframe)
  const viewerUrl = getDocumentViewerUrl(mediaUrl, mimeType);
  return `
    <div style="height: 100%; display: flex; flex-direction: column; background: #f5f5f5;">
      ${post.showTitle === true ? `<div style="padding: 15px 30px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="margin: 0; color: #333; font-size: 24px;">📄 ${escapeHtml(post.title)}</h2>
      </div>` : ''}
      <iframe src="${escapeHtml(viewerUrl)}"
        style="flex: 1; width: 100%; border: none; background: white;"
        title="${escapeHtml(post.title)}">
      </iframe>
    </div>
  `;
}

function initPdfViewer(container) {
  const pdfContainer = container.querySelector('.pdf-canvas-container');
  if (!pdfContainer) return;
  const url = pdfContainer.dataset.pdfUrl;
  if (!url || typeof pdfjsLib === 'undefined') return;

  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(pdfDoc => {
    pdfContainer.innerHTML = '';
    const numPages = pdfDoc.numPages;

    const renderPage = (pageNum) => pdfDoc.getPage(pageNum).then(page => {
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.cssText = 'max-width:100%;height:auto;box-shadow:0 4px 16px rgba(0,0,0,0.5);border-radius:4px;';
      pdfContainer.appendChild(canvas);
      return page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    });

    let chain = Promise.resolve();
    for (let i = 1; i <= numPages; i++) {
      chain = chain.then(() => renderPage(i));
    }
    return chain;
  }).catch(err => {
    pdfContainer.innerHTML = `<p style="color:#f88;font-size:18px;padding:40px">PDF konnte nicht geladen werden: ${escapeHtml(err.message)}</p>`;
  });
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
  
  // 0. Device-Token aus localStorage laden (noch NICHT registrieren - das passiert ggf. in loadDisplayInfo)
  if (!isPreviewMode) {
    const storedToken = localStorage.getItem('deviceToken');
    if (storedToken) {
      deviceToken = storedToken;
      console.log('Device-Token aus localStorage geladen');
    }
  }
  
  // 1. Lade Display-Identifier
  currentDisplayIdentifier = getDisplayIdentifier();
  
  // 2. Falls kein Identifier und kein Query-Parameter "skip": Zeige Display-Auswahl
  const urlParams = new URLSearchParams(window.location.search);
  const skipSelection = urlParams.get('skip');
  
  if (!currentDisplayIdentifier && !skipSelection) {
    // Prüfe ob Displays existieren
    try {
      const response = await authenticatedFetch('/api/public/displays');
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
      if (error.message === 'AUTH_REQUIRED' || error.message === 'NOT_AUTHORIZED' || error.message === 'PREVIEW_NO_AUTH') {
        return; // Auth-Screen wird bereits angezeigt
      }
      console.warn('Konnte Displays nicht laden:', error);
    }
  }
  
  // 3. Lade Display-Info falls vorhanden (inkl. Preview-Modus für korrekte Einstellungen wie clockStyle)
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
  
  // 8. Starte Heartbeat (für Online-Status und Widerrufs-Erkennung)
  if (!isPreviewMode) {
    startHeartbeat();
  }
  
  console.log('Display-Modus gestartet 🚀');
})();
