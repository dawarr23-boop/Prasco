// Display JavaScript - Für das öffentliche Schwarze Brett
// Simuliert API-Aufrufe mit Beispieldaten

let posts = [];
let currentIndex = 0;
let autoRotateTimer = null;

// Display-Einstellungen (werden vom Backend geladen)
let displaySettings = {
  refreshInterval: 5, // Standard: 5 Minuten
  defaultDuration: 10, // Standard: 10 Sekunden
  blendEffectsEnabled: true, // Standard: Blend-Effekte aktiviert
};

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
};

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
      
      console.log('Display-Einstellungen geladen:', displaySettings);
      
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
    refreshElement.textContent = `Auto-Refresh: ${displaySettings.refreshInterval} Min`;
  }
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
    };
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
  initBackgroundMusic();
  loadGlobalMusicSettings();

  const audio = backgroundMusicState.audio;

  // Priorisierung: Globale Musik > Post-spezifische Musik
  let musicUrl = null;
  let volume = 0.5;
  let isGlobal = false;

  // Globale Musik hat Vorrang wenn aktiviert
  if (globalMusicSettings.enabled && globalMusicSettings.url) {
    musicUrl = globalMusicSettings.url;
    volume = globalMusicSettings.volume / 100;
    isGlobal = true;
  } else {
    // Fallback auf Post-spezifische Musik
    musicUrl = post.backgroundMusicUrl || post.background_music_url;
    volume = (post.backgroundMusicVolume || post.background_music_volume || 50) / 100;

    // Keine Post-Musik für Video-Content (nur wenn keine globale Musik)
    const contentType = post.contentType || post.content_type;
    if (contentType === 'video' && !musicUrl) {
      // Stoppe nur wenn es keine globale Musik gibt
      if (!backgroundMusicState.isGlobalMusic) {
        stopBackgroundMusic();
      }
      return;
    }
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
    title: 'Willkommen zum digitalen Schwarzen Brett',
    content: 'Hier werden wichtige Informationen, Ankündigungen und Neuigkeiten angezeigt.',
    content_type: 'text',
    media_url: null,
    display_duration: 10,
    priority: 10,
    is_active: true,
  },
  {
    id: 2,
    title: 'Team-Meeting',
    content: 'Nächstes Team-Meeting am Montag um 10:00 Uhr im Konferenzraum A',
    content_type: 'text',
    media_url: null,
    display_duration: 8,
    priority: 5,
    is_active: true,
  },
  {
    id: 3,
    title: 'Wichtige Ankündigung',
    content: 'Die Kantine ist heute bis 14:00 Uhr geschlossen. Bitte planen Sie entsprechend.',
    content_type: 'text',
    media_url: null,
    display_duration: 12,
    priority: 8,
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
      <button class="pres-btn pres-prev" onclick="previousPost()" title="Vorheriger Beitrag (←)">
        ◀
      </button>
      <div class="pres-info">
        <span class="pres-mode-label">VORTRAGSMODUS</span>
        <span class="pres-counter" id="pres-counter">1 / 1</span>
      </div>
      <button class="pres-btn pres-next" onclick="nextPost()" title="Nächster Beitrag (→)">
        ▶
      </button>
      <button class="pres-btn pres-toggle" id="pres-toggle" onclick="toggleAutoRotation()" title="Auto-Rotation umschalten">
        ▷
      </button>
      <button class="pres-btn pres-exit" onclick="exitPresentationMode()" title="Vortragsmodus beenden">
        ✕
      </button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', controlsHtml);
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
    const duration = (post?.duration || 10) * 1000;
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
  // Entferne URL-Parameter und lade neu als normales Display
  window.location.href = '/public/display.html';
}

// Update Vortragsmodus-Counter
function updatePresentationCounter() {
  const counter = document.getElementById('pres-counter');
  if (counter && posts.length > 0) {
    counter.textContent = `${currentIndex + 1} / ${posts.length}`;
  }
}

// Initialisierung
async function init() {
  // Prüfe Vortragsmodus vor dem Laden
  checkPresentationMode();

  await fetchPosts();
  startClock();
  updateDate();

  // Aktualisiere Refresh-Info nachdem DOM geladen ist
  updateRefreshInfo();

  if (posts.length > 0) {
    displayCurrentPost();
    updatePostCounter();
    updatePresentationCounter();
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
    // Versuche zuerst die API
    const response = await fetch('/api/public/posts');
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
            display_duration: post.duration || post.display_duration || 10,
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
function displayCurrentPost() {
  if (posts.length === 0) {
    showNoContent();
    return;
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
                <p>${escapeHtml(post.content || '')}</p>
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
      // Prüfe auf lokale heruntergeladene Kopie (für Offline-Hotspot-Modus)
      const localVideoUrl = post.backgroundMusicUrl;

      if (videoUrl) {
        // Wenn lokale Kopie verfügbar ist, verwende diese (Hotspot-Modus)
        if (localVideoUrl && localVideoUrl.startsWith('/uploads/videos/')) {
          videoHtml = `<div class="video-fullscreen-container">
            <video 
              id="fullscreen-video"
              src="${escapeHtml(localVideoUrl)}" 
              autoplay 
              loop 
              playsinline
              ${shouldMuteVideo ? 'muted' : ''}>
            </video>
            ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
            <div class="offline-mode-indicator" title="Offline-Modus: Lokale Video-Kopie">📥</div>
          </div>`;
        }
        // Prüfe ob YouTube URL - erweiterte Regex für alle Formate
        else {
          const youtubeMatch = videoUrl.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
          );

          if (youtubeMatch) {
          const videoId = youtubeMatch[1];
          // YouTube iframe - mute abhängig von globaler Musik
          videoHtml = `<div class="video-fullscreen-container" ${!shouldMuteVideo ? `onclick="this.querySelector('iframe').src = this.querySelector('iframe').src.replace('mute=1', 'mute=0');"` : ''}>
            <iframe 
              id="youtube-player"
              src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muteParam}&loop=1&playlist=${videoId}&controls=1&rel=0&playsinline=1&enablejsapi=1&modestbranding=1&iv_load_policy=3&fs=1" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; autoplay" 
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen>
            </iframe>
            ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
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
                ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
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
              ${shouldMuteVideo ? '<div class="video-muted-indicator" title="Video stumm - Hintergrundmusik aktiv">🔇</div>' : ''}
            </div>`;
          }
        }
      }
      // Video Vollbild - ohne Titel und Text
      html = videoHtml;

      // Verstecke Header für Video-Vollbild
      setTimeout(() => {
        const header = document.querySelector('.header');
        const footer = document.querySelector('.footer');
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
      html = renderPresentation(post);
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

  container.innerHTML = html;

  // Update Post Counter
  document.getElementById('post-counter').textContent = `${currentIndex + 1} / ${posts.length}`;

  // Hintergrundmusik starten/stoppen (auch bei Videos wenn globale Musik aktiv)
  playBackgroundMusic(post);

  // Zeige globale Musik-Indikator wenn aktiv
  updateGlobalMusicIndicator();

  // Animation
  container.style.animation = 'none';
  setTimeout(() => {
    container.style.animation = 'fadeIn 0.8s ease';
  }, 10);

  // Nächster Post nach Duration (nicht im Vortragsmodus wenn pausiert)
  clearTimeout(autoRotateTimer);

  if (!presentationModeState.isActive || !presentationModeState.isPaused) {
    const duration = (post.duration || 10) * 1000;
    autoRotateTimer = setTimeout(() => {
      nextPost();
    }, duration);
  }

  // Update Vortragsmodus-Counter
  updatePresentationCounter();
}

// Nächster Post
function nextPost() {
  restoreHeaderFooter(); // Stelle Header/Footer wieder her
  const currentPost = posts[currentIndex];
  currentIndex = (currentIndex + 1) % posts.length;
  displayCurrentPostWithBlend(currentPost?.blend_effect);
  updatePostCounter();
  updatePresentationCounter();
}

// Vorheriger Post
function previousPost() {
  restoreHeaderFooter(); // Stelle Header/Footer wieder her
  const currentPost = posts[currentIndex];
  currentIndex = (currentIndex - 1 + posts.length) % posts.length;
  displayCurrentPostWithBlend(currentPost?.blend_effect);
  updatePostCounter();
  updatePresentationCounter();
}

// ============================================
// Blend Effects - Übergangseffekte
// ============================================

// Wende Blend-Effekt an beim Wechsel zum nächsten Post
function displayCurrentPostWithBlend(blendEffect) {
  const container = document.getElementById('current-post');
  
  // Prüfe ob Blend-Effekte global aktiviert sind und ein Effekt definiert ist
  if (!displaySettings.blendEffectsEnabled || !blendEffect || blendEffect === '') {
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
    
    // Lade neuen Post-Inhalt
    displayCurrentPost();
    
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
  container.innerHTML = `
        <div class="loading">
            <h1>Keine Inhalte verfügbar</h1>
            <p>Bitte fügen Sie Beiträge im Admin-Bereich hinzu.</p>
        </div>
    `;
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
function renderPresentation(post) {
  const presentation = post.presentation;

  // Wenn Slides generiert wurden, zeige diese als Slideshow
  if (presentation?.slides && presentation.slides.length > 0) {
    // Initialisiere Presentation State
    presentationState.isActive = true;
    presentationState.slides = presentation.slides;
    presentationState.currentSlide = 0;

    // Starte Slide-Rotation
    startSlideRotation(post.duration || 10);

    return renderSlideshow(post, presentation.slides, 0);
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
      <div class="slide-container" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative;">
        <img src="${slide.imageUrl}" alt="Slide ${currentSlideIndex + 1}" 
             style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);"
             onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'text-align:center; color:#fff;\\'>❌ Slide konnte nicht geladen werden</div>';">
      </div>
      <div class="slide-progress" style="height: 4px; background: rgba(255,255,255,0.2);">
        <div style="height: 100%; width: ${((currentSlideIndex + 1) / totalSlides) * 100}%; background: linear-gradient(90deg, #c41e3a, #ff6b6b); transition: width 0.3s ease;"></div>
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
      // Gehe zum nächsten Post
      nextPost();
      return;
    }

    // Aktualisiere nur den Slide-Content
    const container = document.getElementById('current-post');
    if (container && posts[currentIndex]) {
      container.innerHTML = renderSlideshow(
        posts[currentIndex],
        presentationState.slides,
        presentationState.currentSlide
      );
    }
  }, timePerSlide);
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
  const mediaUrl = post.media?.fileUrl || post.content;
  
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
  const mediaUrl = post.media?.fileUrl || post.content;
  
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

// HTML-Escape für Sicherheit
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text ? String(text).replace(/[&<>"']/g, (m) => map[m]) : '';
}

// Tastatur-Navigation (optional)
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    nextPost();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    previousPost();
  } else if (e.key === 'r' || e.key === 'R') {
    fetchPosts().then(() => {
      currentIndex = 0;
      displayCurrentPost();
    });
  } else if (e.key === 'Escape' && presentationModeState.isActive) {
    exitPresentationMode();
  } else if (e.key === 'p' || e.key === 'P') {
    // Toggle Pause im Vortragsmodus
    if (presentationModeState.isActive) {
      toggleAutoRotation();
    }
  }
});

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
  
  // 1. Lade Einstellungen vom Backend
  await loadDisplaySettings();
  
  // 2. Initialisiere Display
  init();
  
  // 3. Starte Auto-Refresh mit konfigurierten Intervall
  startAutoRefresh();
  
  console.log('Display-Modus gestartet 🚀');
})();
