// Admin Dashboard JavaScript
// Kommuniziert mit der Backend-API

// ============================================
// Internationalization (i18n)
// ============================================
const translations = {
  de: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.posts': 'Beiträge',
    'nav.media': 'Medien',
    'nav.categories': 'Kategorien',
    'nav.users': 'Benutzer',
    'nav.settings': 'Einstellungen',
    'nav.logout': 'Abmelden',

    // Dashboard
    'dashboard.activePosts': 'Aktive Beiträge',
    'dashboard.scheduledPosts': 'Geplante Beiträge',
    'dashboard.categories': 'Kategorien',
    'dashboard.media': 'Medien',
    'dashboard.quickActions': 'Schnellaktionen',
    'dashboard.newPost': 'Neuer Beitrag',
    'dashboard.openDisplay': 'Display öffnen',
    'dashboard.presentationMode': 'Vortragsmodus',

    // Common
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.create': 'Erstellen',
    'common.search': 'Suchen',
    'common.loading': 'Laden...',
    'common.noData': 'Keine Daten vorhanden',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.actions': 'Aktionen',
    'common.status': 'Status',
    'common.active': 'Aktiv',
    'common.inactive': 'Inaktiv',

    // Posts
    'posts.title': 'Beiträge',
    'posts.newPost': 'Neuer Beitrag',
    'posts.editPost': 'Beitrag bearbeiten',
    'posts.titleField': 'Titel',
    'posts.content': 'Inhalt',
    'posts.category': 'Kategorie',
    'posts.duration': 'Anzeigedauer (Sekunden)',
    'posts.priority': 'Priorität',
    'posts.startDate': 'Startdatum',
    'posts.endDate': 'Enddatum',
    'posts.immediately': 'Sofort',
    'posts.unlimited': 'Unbegrenzt',
    'posts.confirmDelete': 'Beitrag wirklich löschen?',
    'posts.backgroundMusic': 'Hintergrundmusik (optional)',
    'posts.backgroundMusicHint':
      'Nur für Text, Bild und HTML-Inhalte. Bei Videos wird der Original-Ton verwendet.',
    'posts.musicFile': 'Musik-Datei',
    'posts.musicVolume': 'Lautstärke',
    'posts.currentMusic': 'Aktuelle Musik',
    'posts.removeMusic': 'Entfernen',
    'posts.previewMusic': 'Vorschau',

    // Media
    'media.title': 'Medien',
    'media.upload': 'Hochladen',
    'media.dragDrop': 'Dateien hierher ziehen oder klicken',
    'media.uploading': 'Wird hochgeladen...',
    'media.confirmDelete': 'Medium wirklich löschen?',

    // Categories
    'categories.title': 'Kategorien',
    'categories.newCategory': 'Neue Kategorie',
    'categories.editCategory': 'Kategorie bearbeiten',
    'categories.name': 'Name',
    'categories.color': 'Farbe',
    'categories.icon': 'Icon',
    'categories.confirmDelete': 'Kategorie wirklich löschen?',

    // Users
    'users.title': 'Benutzer',
    'users.newUser': 'Neuer Benutzer',
    'users.editUser': 'Benutzer bearbeiten',
    'users.email': 'E-Mail',
    'users.firstName': 'Vorname',
    'users.lastName': 'Nachname',
    'users.role': 'Rolle',
    'users.password': 'Passwort',
    'users.confirmDelete': 'Benutzer wirklich löschen?',

    // Roles
    'role.super_admin': 'Super Admin',
    'role.admin': 'Administrator',
    'role.editor': 'Redakteur',
    'role.viewer': 'Betrachter',
    'role.display': 'Display',

    // Settings
    'settings.title': 'Einstellungen',
    'settings.display': 'Display-Einstellungen',
    'settings.refreshInterval': 'Auto-Refresh Intervall (Minuten)',
    'settings.defaultDuration': 'Standard Anzeigedauer (Sekunden)',
    'settings.saveSettings': 'Einstellungen speichern',
    'settings.language': 'Spracheinstellungen',
    'settings.languageLabel': 'Sprache / Language / Lingua',
    'settings.languageHint': 'Die Sprache wird für die gesamte Benutzeroberfläche verwendet.',
    'settings.globalMusic': 'Globale Hintergrundmusik',
    'settings.globalMusicDescription':
      'Musik die über alle Beiträge hinweg abgespielt wird. Videos werden automatisch stumm geschaltet.',
    'settings.globalMusicEnable': 'Globale Hintergrundmusik aktivieren',
    'settings.globalMusicUrl': 'Musik-URL',
    'settings.globalMusicUpload': 'Oder Musik-Datei hochladen',
    'settings.globalMusicVolume': 'Lautstärke',
    'settings.globalMusicMuteVideos': 'Videos automatisch stumm schalten',
    'settings.globalMusicSave': 'Musik-Einstellungen speichern',
    'settings.globalMusicTest': 'Test',
    'settings.sso': 'Single Sign-On (SSO) Konfiguration',
    'settings.about': 'Über diese Anwendung',

    // App Info
    'appInfo.title': 'Digitales Schwarzes Brett für Unternehmen und Organisationen',
    'appInfo.version': 'Version',
    'appInfo.developer': 'Entwickler',
    'appInfo.license': 'Lizenz',
    'appInfo.build': 'Build',
    'appInfo.techStack': 'Technologie-Stack',
    'appInfo.links': 'Links',
    'appInfo.openDisplay': 'Display öffnen',
    'appInfo.apiDocs': 'API-Dokumentation',

    // SSO
    'sso.title': 'Single Sign-On (SSO) Konfiguration',
    'sso.enabled': 'SSO aktiviert',
    'sso.provider': 'Provider',
    'sso.tenantId': 'Tenant ID',
    'sso.clientId': 'Client ID',
    'sso.clientSecret': 'Client Secret',
    'sso.redirectUri': 'Redirect URI',
    'sso.testConnection': 'Verbindung testen',
    'sso.saveConfig': 'SSO-Konfiguration speichern',
    'sso.connectionSuccess': 'Verbindung erfolgreich!',
    'sso.connectionFailed': 'Verbindung fehlgeschlagen',

    // LDAP
    'ldap.title': 'LDAP / Active Directory Konfiguration',
    'ldap.subtitle': 'Für Windows Server 2016/2019/2022 mit Active Directory',
    'ldap.url': 'LDAP Server URL',
    'ldap.urlHint': 'Für SSL: ldaps://dc.firma.local:636',
    'ldap.baseDN': 'Base DN',
    'ldap.bindDN': 'Bind DN (Service-Account)',
    'ldap.bindPassword': 'Bind Passwort',
    'ldap.userSearchBase': 'Benutzer-Suchbasis',
    'ldap.userSearchFilter': 'Benutzer-Suchfilter',
    'ldap.groupRoles': 'Gruppen-basierte Rollenzuweisung',
    'ldap.adminGroup': 'Admin-Gruppe',
    'ldap.editorGroup': 'Editor-Gruppe',
    'ldap.tlsReject': 'Selbstsignierte Zertifikate ablehnen',

    // System Mode
    'systemMode.title': 'System-Modus',
    'systemMode.description': 'Wechseln Sie zwischen Normal-Modus (Netzwerk-Verbindung) und Hotspot-Modus (Offline-Betrieb).',
    'systemMode.loading': 'Status wird geladen...',
    'systemMode.switch': 'Modus wechseln',
    'systemMode.normal.title': 'Normal-Modus',
    'systemMode.normal.feature1': 'Verbindung zum vorhandenen Netzwerk',
    'systemMode.normal.feature2': 'Internet-Zugang erforderlich',
    'systemMode.normal.feature3': 'Externe Server-URL verwendbar',
    'systemMode.hotspot.title': 'Hotspot-Modus',
    'systemMode.hotspot.feature1': 'Raspberry Pi erstellt WiFi Hotspot',
    'systemMode.hotspot.ssid': 'SSID',
    'systemMode.hotspot.password': 'Passwort',
    'systemMode.hotspot.ip': 'IP',

    // Hints
    'hint.dragDropPosts':
      '→ Tipp: Ziehe die Beiträge per Drag & Drop um die Anzeigereihenfolge zu ändern',
    'hint.dragDropCategories':
      '→ Tipp: Ziehe die Kategorien per Drag & Drop um die Reihenfolge zu ändern',

    // Messages
    'msg.success': 'Erfolgreich gespeichert',
    'msg.error': 'Ein Fehler ist aufgetreten',
    'msg.confirmAction': 'Aktion bestätigen',
    'msg.unsavedChanges': 'Ungespeicherte Änderungen vorhanden',

    // Validation
    'validation.required': 'ist erforderlich',
    'validation.invalidEmail': 'Ungültige E-Mail-Adresse',
    'validation.minLength': 'muss mindestens {min} Zeichen haben',
    'validation.maxLength': 'darf maximal {max} Zeichen haben',
    'validation.invalidNumber': 'muss eine Zahl sein',
    'validation.positiveNumber': 'muss eine positive Zahl sein',
    'validation.invalidDate': 'Ungültiges Datum',

    // Form Labels (Dashboard)
    'form.title': 'Titel *',
    'form.type': 'Typ *',
    'form.category': 'Kategorie',
    'form.noCategory': '-- Keine Kategorie --',
    'form.content': 'Inhalt',
    'form.uploadContent': 'Inhalte hochladen',
    'form.importDocument': 'Word/PDF importieren',
    'form.importDocumentHint': 'Importieren Sie .docx oder .pdf Dateien (max. 10MB)',
    'form.uploadFile': 'Datei hochladen',
    'form.uploadFileHint': 'Bilder, Videos, Audio, PDFs, Word, PowerPoint (max. 100MB)',
    'form.uploading': 'Uploading...',
    'form.mediaUrl': 'Medien-URL (oder Datei hochladen)',
    'form.mediaUrlPlaceholder': 'https://... oder /uploads/originals/...',
    'form.mediaUrlHint': 'YouTube/Vimeo URLs werden automatisch als Video eingebettet',
    'form.offlineDownload': 'Video offline verfügbar machen',
    'form.offlineDownloadHint': 'Lädt das Video automatisch herunter für bessere Performance und Offline-Nutzung',
    'form.displayDuration': 'Anzeigedauer (Sek.)',
    'form.priority': 'Priorität (0-100)',
    'form.blendEffect': 'Übergangseffekt',
    'form.blendEffectNone': 'Kein Effekt',
    'form.blendEffectFade': 'Fade (Überblenden)',
    'form.blendEffectSlideLeft': 'Slide Left (Nach links)',
    'form.blendEffectSlideRight': 'Slide Right (Nach rechts)',
    'form.blendEffectSlideUp': 'Slide Up (Nach oben)',
    'form.blendEffectSlideDown': 'Slide Down (Nach unten)',
    'form.blendEffectZoomIn': 'Zoom In (Hineinzoomen)',
    'form.blendEffectZoomOut': 'Zoom Out (Herauszoomen)',
    'form.blendEffectHint': 'Wählen Sie einen Übergangseffekt zum nächsten Beitrag',
    'form.startDate': 'Start-Datum',
    'form.endDate': 'End-Datum',
    'form.backgroundMusicSection': 'Hintergrundmusik (optional)',
    'form.backgroundMusicHint': 'Nur für Text, Bild und HTML-Inhalte. Bei Videos wird der Original-Ton verwendet.',
    'form.musicFile': 'Musik-Datei',
    'form.musicVolume': 'Lautstärke',
    'form.currentMusic': 'Aktuelle Musik',
    'form.removeMusic': 'Entfernen',
    'form.previewMusic': 'Vorschau',

    // Content Types
    'type.text': '📝 Text',
    'type.image': '🖼️ Bild',
    'type.video': '🎥 Video',
    'type.html': '🌐 HTML',
    'type.presentation': '📊 PowerPoint Präsentation',
    'type.pdf': '📄 PDF Dokument',
    'type.word': '📃 Word Dokument',

    // Buttons
    'btn.save': 'Speichern',
    'btn.cancel': 'Abbrechen',
    'btn.newPost': '+ Neuer Beitrag',
    'btn.deleteAll': '🗑️ Alle löschen',
    'btn.savePost': 'Beitrag speichern',
    'btn.saveCategory': 'Kategorie erstellen',
    'btn.saveUser': 'Benutzer speichern',
    'btn.changePassword': 'Passwort ändern',
    'btn.newCategory': '+ Neue Kategorie',
    'btn.newUser': '+ Neuer Benutzer',

    // Category Form
    'category.name': 'Name *',
    'category.color': 'Farbe',
    'category.icon': 'Icon',
    'category.description': 'Beschreibung',
    'category.descriptionPlaceholder': 'Optionale Beschreibung...',
  },

  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.posts': 'Posts',
    'nav.media': 'Media',
    'nav.categories': 'Categories',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.activePosts': 'Active Posts',
    'dashboard.scheduledPosts': 'Scheduled Posts',
    'dashboard.categories': 'Categories',
    'dashboard.media': 'Media',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.newPost': 'New Post',
    'dashboard.openDisplay': 'Open Display',
    'dashboard.presentationMode': 'Presentation Mode',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',

    // Posts
    'posts.title': 'Posts',
    'posts.newPost': 'New Post',
    'posts.editPost': 'Edit Post',
    'posts.titleField': 'Title',
    'posts.content': 'Content',
    'posts.category': 'Category',
    'posts.duration': 'Display Duration (seconds)',
    'posts.priority': 'Priority',
    'posts.startDate': 'Start Date',
    'posts.endDate': 'End Date',
    'posts.immediately': 'Immediately',
    'posts.unlimited': 'Unlimited',
    'posts.confirmDelete': 'Really delete this post?',
    'posts.backgroundMusic': 'Background Music (optional)',
    'posts.backgroundMusicHint':
      'Only for text, image and HTML content. Videos use their original audio.',
    'posts.musicFile': 'Music File',
    'posts.musicVolume': 'Volume',
    'posts.currentMusic': 'Current Music',
    'posts.removeMusic': 'Remove',
    'posts.previewMusic': 'Preview',

    // Media
    'media.title': 'Media',
    'media.upload': 'Upload',
    'media.dragDrop': 'Drag files here or click',
    'media.uploading': 'Uploading...',
    'media.confirmDelete': 'Really delete this media?',

    // Categories
    'categories.title': 'Categories',
    'categories.newCategory': 'New Category',
    'categories.editCategory': 'Edit Category',
    'categories.name': 'Name',
    'categories.color': 'Color',
    'categories.icon': 'Icon',
    'categories.confirmDelete': 'Really delete this category?',

    // Users
    'users.title': 'Users',
    'users.newUser': 'New User',
    'users.editUser': 'Edit User',
    'users.email': 'Email',
    'users.firstName': 'First Name',
    'users.lastName': 'Last Name',
    'users.role': 'Role',
    'users.password': 'Password',
    'users.confirmDelete': 'Really delete this user?',

    // Roles
    'role.super_admin': 'Super Admin',
    'role.admin': 'Administrator',
    'role.editor': 'Editor',
    'role.viewer': 'Viewer',
    'role.display': 'Display',

    // Settings
    'settings.title': 'Settings',
    'settings.display': 'Display Settings',
    'settings.refreshInterval': 'Auto-Refresh Interval (minutes)',
    'settings.defaultDuration': 'Default Display Duration (seconds)',
    'settings.saveSettings': 'Save Settings',
    'settings.language': 'Language Settings',
    'settings.languageLabel': 'Language / Sprache / Lingua',
    'settings.languageHint': 'The language is used for the entire user interface.',
    'settings.globalMusic': 'Global Background Music',
    'settings.globalMusicDescription':
      'Music that plays across all posts. Videos are automatically muted.',
    'settings.globalMusicEnable': 'Enable global background music',
    'settings.globalMusicUrl': 'Music URL',
    'settings.globalMusicUpload': 'Or upload music file',
    'settings.globalMusicVolume': 'Volume',
    'settings.globalMusicMuteVideos': 'Automatically mute videos',
    'settings.globalMusicSave': 'Save music settings',
    'settings.globalMusicTest': 'Test',
    'settings.sso': 'Single Sign-On (SSO) Configuration',
    'settings.about': 'About this Application',

    // App Info
    'appInfo.title': 'Digital Bulletin Board for Companies and Organizations',
    'appInfo.version': 'Version',
    'appInfo.developer': 'Developer',
    'appInfo.license': 'License',
    'appInfo.build': 'Build',
    'appInfo.techStack': 'Technology Stack',
    'appInfo.links': 'Links',
    'appInfo.openDisplay': 'Open Display',
    'appInfo.apiDocs': 'API Documentation',

    // SSO
    'sso.title': 'Single Sign-On (SSO) Configuration',
    'sso.enabled': 'SSO enabled',
    'sso.provider': 'Provider',
    'sso.tenantId': 'Tenant ID',
    'sso.clientId': 'Client ID',
    'sso.clientSecret': 'Client Secret',
    'sso.redirectUri': 'Redirect URI',
    'sso.testConnection': 'Test Connection',
    'sso.saveConfig': 'Save SSO Configuration',
    'sso.connectionSuccess': 'Connection successful!',
    'sso.connectionFailed': 'Connection failed',

    // LDAP
    'ldap.title': 'LDAP / Active Directory Configuration',
    'ldap.subtitle': 'For Windows Server 2016/2019/2022 with Active Directory',
    'ldap.url': 'LDAP Server URL',
    'ldap.urlHint': 'For SSL: ldaps://dc.company.local:636',
    'ldap.baseDN': 'Base DN',
    'ldap.bindDN': 'Bind DN (Service Account)',
    'ldap.bindPassword': 'Bind Password',
    'ldap.userSearchBase': 'User Search Base',
    'ldap.userSearchFilter': 'User Search Filter',
    'ldap.groupRoles': 'Group-based Role Assignment',
    'ldap.adminGroup': 'Admin Group',
    'ldap.editorGroup': 'Editor Group',
    'ldap.tlsReject': 'Reject self-signed certificates',

    // System Mode
    'systemMode.title': 'System Mode',
    'systemMode.description': 'Switch between Normal Mode (network connection) and Hotspot Mode (offline operation).',
    'systemMode.loading': 'Loading status...',
    'systemMode.switch': 'Switch Mode',
    'systemMode.normal.title': 'Normal Mode',
    'systemMode.normal.feature1': 'Connect to existing network',
    'systemMode.normal.feature2': 'Internet access required',
    'systemMode.normal.feature3': 'External server URL usable',
    'systemMode.hotspot.title': 'Hotspot Mode',
    'systemMode.hotspot.feature1': 'Raspberry Pi creates WiFi hotspot',
    'systemMode.hotspot.ssid': 'SSID',
    'systemMode.hotspot.password': 'Password',
    'systemMode.hotspot.ip': 'IP',

    // Hints
    'hint.dragDropPosts': '→ Tip: Drag and drop posts to change the display order',
    'hint.dragDropCategories': '→ Tip: Drag and drop categories to change the order',

    // Messages
    'msg.success': 'Successfully saved',
    'msg.error': 'An error occurred',
    'msg.confirmAction': 'Confirm action',
    'msg.unsavedChanges': 'Unsaved changes present',

    // Validation
    'validation.required': 'is required',
    'validation.invalidEmail': 'Invalid email address',
    'validation.minLength': 'must have at least {min} characters',
    'validation.maxLength': 'must have at most {max} characters',
    'validation.invalidNumber': 'must be a number',
    'validation.positiveNumber': 'must be a positive number',
    'validation.invalidDate': 'Invalid date',

    // Form Labels (Dashboard)
    'form.title': 'Title *',
    'form.type': 'Type *',
    'form.category': 'Category',
    'form.noCategory': '-- No Category --',
    'form.content': 'Content',
    'form.uploadContent': 'Upload Content',
    'form.importDocument': 'Import Word/PDF',
    'form.importDocumentHint': 'Import .docx or .pdf files (max. 10MB)',
    'form.uploadFile': 'Upload File',
    'form.uploadFileHint': 'Images, Videos, Audio, PDFs, Word, PowerPoint (max. 100MB)',
    'form.uploading': 'Uploading...',
    'form.mediaUrl': 'Media URL (or upload file)',
    'form.mediaUrlPlaceholder': 'https://... or /uploads/originals/...',
    'form.mediaUrlHint': 'YouTube/Vimeo URLs are automatically embedded as video',
    'form.offlineDownload': 'Make video available offline',
    'form.offlineDownloadHint': 'Automatically downloads the video for better performance and offline use',
    'form.displayDuration': 'Display Duration (Sec.)',
    'form.priority': 'Priority (0-100)',
    'form.blendEffect': 'Transition Effect',
    'form.blendEffectNone': 'No Effect',
    'form.blendEffectFade': 'Fade',
    'form.blendEffectSlideLeft': 'Slide Left',
    'form.blendEffectSlideRight': 'Slide Right',
    'form.blendEffectSlideUp': 'Slide Up',
    'form.blendEffectSlideDown': 'Slide Down',
    'form.blendEffectZoomIn': 'Zoom In',
    'form.blendEffectZoomOut': 'Zoom Out',
    'form.blendEffectHint': 'Choose a transition effect to the next post',
    'form.startDate': 'Start Date',
    'form.endDate': 'End Date',
    'form.backgroundMusicSection': 'Background Music (optional)',
    'form.backgroundMusicHint': 'Only for text, image and HTML content. Videos use their original audio.',
    'form.musicFile': 'Music File',
    'form.musicVolume': 'Volume',
    'form.currentMusic': 'Current Music',
    'form.removeMusic': 'Remove',
    'form.previewMusic': 'Preview',

    // Content Types
    'type.text': '📝 Text',
    'type.image': '🖼️ Image',
    'type.video': '🎥 Video',
    'type.html': '🌐 HTML',
    'type.presentation': '📊 PowerPoint Presentation',
    'type.pdf': '📄 PDF Document',
    'type.word': '📃 Word Document',

    // Buttons
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.newPost': '+ New Post',
    'btn.deleteAll': '🗑️ Delete All',
    'btn.savePost': 'Save Post',
    'btn.saveCategory': 'Create Category',
    'btn.saveUser': 'Save User',
    'btn.changePassword': 'Change Password',
    'btn.newCategory': '+ New Category',
    'btn.newUser': '+ New User',

    // Category Form
    'category.name': 'Name *',
    'category.color': 'Color',
    'category.icon': 'Icon',
    'category.description': 'Description',
    'category.descriptionPlaceholder': 'Optional description...',
  },

  it: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.posts': 'Articoli',
    'nav.media': 'Media',
    'nav.categories': 'Categorie',
    'nav.users': 'Utenti',
    'nav.settings': 'Impostazioni',
    'nav.logout': 'Esci',

    // Dashboard
    'dashboard.activePosts': 'Articoli Attivi',
    'dashboard.scheduledPosts': 'Articoli Programmati',
    'dashboard.categories': 'Categorie',
    'dashboard.media': 'Media',
    'dashboard.quickActions': 'Azioni Rapide',
    'dashboard.newPost': 'Nuovo Articolo',
    'dashboard.openDisplay': 'Apri Display',
    'dashboard.presentationMode': 'Modalità Presentazione',

    // Common
    'common.save': 'Salva',
    'common.cancel': 'Annulla',
    'common.delete': 'Elimina',
    'common.edit': 'Modifica',
    'common.create': 'Crea',
    'common.search': 'Cerca',
    'common.loading': 'Caricamento...',
    'common.noData': 'Nessun dato disponibile',
    'common.yes': 'Sì',
    'common.no': 'No',
    'common.actions': 'Azioni',
    'common.status': 'Stato',
    'common.active': 'Attivo',
    'common.inactive': 'Inattivo',

    // Posts
    'posts.title': 'Articoli',
    'posts.newPost': 'Nuovo Articolo',
    'posts.editPost': 'Modifica Articolo',
    'posts.titleField': 'Titolo',
    'posts.content': 'Contenuto',
    'posts.category': 'Categoria',
    'posts.duration': 'Durata visualizzazione (secondi)',
    'posts.priority': 'Priorità',
    'posts.startDate': 'Data inizio',
    'posts.endDate': 'Data fine',
    'posts.immediately': 'Immediatamente',
    'posts.unlimited': 'Illimitato',
    'posts.confirmDelete': 'Eliminare davvero questo articolo?',
    'posts.backgroundMusic': 'Musica di sottofondo (opzionale)',
    'posts.backgroundMusicHint':
      'Solo per testo, immagini e contenuto HTML. I video usano il loro audio originale.',
    'posts.musicFile': 'File Musicale',
    'posts.musicVolume': 'Volume',
    'posts.currentMusic': 'Musica Corrente',
    'posts.removeMusic': 'Rimuovi',
    'posts.previewMusic': 'Anteprima',

    // Media
    'media.title': 'Media',
    'media.upload': 'Carica',
    'media.dragDrop': 'Trascina i file qui o clicca',
    'media.uploading': 'Caricamento in corso...',
    'media.confirmDelete': 'Eliminare davvero questo media?',

    // Categories
    'categories.title': 'Categorie',
    'categories.newCategory': 'Nuova Categoria',
    'categories.editCategory': 'Modifica Categoria',
    'categories.name': 'Nome',
    'categories.color': 'Colore',
    'categories.icon': 'Icona',
    'categories.confirmDelete': 'Eliminare davvero questa categoria?',

    // Users
    'users.title': 'Utenti',
    'users.newUser': 'Nuovo Utente',
    'users.editUser': 'Modifica Utente',
    'users.email': 'Email',
    'users.firstName': 'Nome',
    'users.lastName': 'Cognome',
    'users.role': 'Ruolo',
    'users.password': 'Password',
    'users.confirmDelete': 'Eliminare davvero questo utente?',

    // Roles
    'role.super_admin': 'Super Admin',
    'role.admin': 'Amministratore',
    'role.editor': 'Redattore',
    'role.viewer': 'Visualizzatore',
    'role.display': 'Display',

    // Settings
    'settings.title': 'Impostazioni',
    'settings.display': 'Impostazioni Display',
    'settings.refreshInterval': 'Intervallo Auto-Refresh (minuti)',
    'settings.defaultDuration': 'Durata visualizzazione predefinita (secondi)',
    'settings.saveSettings': 'Salva Impostazioni',
    'settings.language': 'Impostazioni Lingua',
    'settings.languageLabel': 'Lingua / Language / Sprache',
    'settings.languageHint': "La lingua viene utilizzata per l'intera interfaccia utente.",
    'settings.globalMusic': 'Musica di sottofondo globale',
    'settings.globalMusicDescription':
      'Musica che viene riprodotta su tutti i post. I video vengono automaticamente silenziati.',
    'settings.globalMusicEnable': 'Abilita musica di sottofondo globale',
    'settings.globalMusicUrl': 'URL musica',
    'settings.globalMusicUpload': 'Oppure carica file musicale',
    'settings.globalMusicVolume': 'Volume',
    'settings.globalMusicMuteVideos': 'Silenzia automaticamente i video',
    'settings.globalMusicSave': 'Salva impostazioni musica',
    'settings.globalMusicTest': 'Test',
    'settings.sso': 'Configurazione Single Sign-On (SSO)',
    'settings.about': "Informazioni sull'applicazione",

    // App Info
    'appInfo.title': 'Bacheca Digitale per Aziende e Organizzazioni',
    'appInfo.version': 'Versione',
    'appInfo.developer': 'Sviluppatore',
    'appInfo.license': 'Licenza',
    'appInfo.build': 'Build',
    'appInfo.techStack': 'Stack Tecnologico',
    'appInfo.links': 'Collegamenti',
    'appInfo.openDisplay': 'Apri Display',
    'appInfo.apiDocs': 'Documentazione API',

    // SSO
    'sso.title': 'Configurazione Single Sign-On (SSO)',
    'sso.enabled': 'SSO abilitato',
    'sso.provider': 'Provider',
    'sso.tenantId': 'Tenant ID',
    'sso.clientId': 'Client ID',
    'sso.clientSecret': 'Client Secret',
    'sso.redirectUri': 'URI di Reindirizzamento',
    'sso.testConnection': 'Testa Connessione',
    'sso.saveConfig': 'Salva Configurazione SSO',
    'sso.connectionSuccess': 'Connessione riuscita!',
    'sso.connectionFailed': 'Connessione fallita',

    // LDAP
    'ldap.title': 'Configurazione LDAP / Active Directory',
    'ldap.subtitle': 'Per Windows Server 2016/2019/2022 con Active Directory',
    'ldap.url': 'URL Server LDAP',
    'ldap.urlHint': 'Per SSL: ldaps://dc.azienda.local:636',
    'ldap.baseDN': 'Base DN',
    'ldap.bindDN': 'Bind DN (Account di Servizio)',
    'ldap.bindPassword': 'Password di Bind',
    'ldap.userSearchBase': 'Base Ricerca Utenti',
    'ldap.userSearchFilter': 'Filtro Ricerca Utenti',
    'ldap.groupRoles': 'Assegnazione Ruoli basata su Gruppi',
    'ldap.adminGroup': 'Gruppo Admin',
    'ldap.editorGroup': 'Gruppo Editor',
    'ldap.tlsReject': 'Rifiuta certificati autofirmati',

    // System Mode
    'systemMode.title': 'Modalità Sistema',
    'systemMode.description': 'Passa tra Modalità Normale (connessione di rete) e Modalità Hotspot (funzionamento offline).',
    'systemMode.loading': 'Caricamento stato...',
    'systemMode.switch': 'Cambia Modalità',
    'systemMode.normal.title': 'Modalità Normale',
    'systemMode.normal.feature1': 'Connessione alla rete esistente',
    'systemMode.normal.feature2': 'Accesso Internet richiesto',
    'systemMode.normal.feature3': 'URL server esterno utilizzabile',
    'systemMode.hotspot.title': 'Modalità Hotspot',
    'systemMode.hotspot.feature1': 'Raspberry Pi crea hotspot WiFi',
    'systemMode.hotspot.ssid': 'SSID',
    'systemMode.hotspot.password': 'Password',
    'systemMode.hotspot.ip': 'IP',

    // Hints
    'hint.dragDropPosts':
      "→ Suggerimento: Trascina e rilascia gli articoli per modificare l'ordine di visualizzazione",
    'hint.dragDropCategories':
      "→ Suggerimento: Trascina e rilascia le categorie per modificare l'ordine",

    // Messages
    'msg.success': 'Salvato con successo',
    'msg.error': 'Si è verificato un errore',
    'msg.confirmAction': 'Conferma azione',
    'msg.unsavedChanges': 'Modifiche non salvate presenti',

    // Validation
    'validation.required': 'è obbligatorio',
    'validation.invalidEmail': 'Indirizzo email non valido',
    'validation.minLength': 'deve avere almeno {min} caratteri',
    'validation.maxLength': 'deve avere al massimo {max} caratteri',
    'validation.invalidNumber': 'deve essere un numero',
    'validation.positiveNumber': 'deve essere un numero positivo',
    'validation.invalidDate': 'Data non valida',

    // Form Labels (Dashboard)
    'form.title': 'Titolo *',
    'form.type': 'Tipo *',
    'form.category': 'Categoria',
    'form.noCategory': '-- Nessuna Categoria --',
    'form.content': 'Contenuto',
    'form.uploadContent': 'Carica Contenuto',
    'form.importDocument': 'Importa Word/PDF',
    'form.importDocumentHint': 'Importa file .docx o .pdf (max. 10MB)',
    'form.uploadFile': 'Carica File',
    'form.uploadFileHint': 'Immagini, Video, Audio, PDF, Word, PowerPoint (max. 100MB)',
    'form.uploading': 'Caricamento in corso...',
    'form.mediaUrl': 'URL Media (o carica file)',
    'form.mediaUrlPlaceholder': 'https://... o /uploads/originals/...',
    'form.mediaUrlHint': 'Gli URL di YouTube/Vimeo vengono incorporati automaticamente come video',
    'form.offlineDownload': 'Rendi video disponibile offline',
    'form.offlineDownloadHint': 'Scarica automaticamente il video per migliori prestazioni e uso offline',
    'form.displayDuration': 'Durata Visualizzazione (Sec.)',
    'form.priority': 'Priorità (0-100)',
    'form.blendEffect': 'Effetto di Transizione',
    'form.blendEffectNone': 'Nessun Effetto',
    'form.blendEffectFade': 'Dissolvenza',
    'form.blendEffectSlideLeft': 'Scorri a Sinistra',
    'form.blendEffectSlideRight': 'Scorri a Destra',
    'form.blendEffectSlideUp': 'Scorri in Alto',
    'form.blendEffectSlideDown': 'Scorri in Basso',
    'form.blendEffectZoomIn': 'Zoom Avanti',
    'form.blendEffectZoomOut': 'Zoom Indietro',
    'form.blendEffectHint': 'Scegli un effetto di transizione al prossimo articolo',
    'form.startDate': 'Data Inizio',
    'form.endDate': 'Data Fine',
    'form.backgroundMusicSection': 'Musica di Sottofondo (opzionale)',
    'form.backgroundMusicHint': 'Solo per testo, immagini e contenuto HTML. I video usano il loro audio originale.',
    'form.musicFile': 'File Musicale',
    'form.musicVolume': 'Volume',
    'form.currentMusic': 'Musica Corrente',
    'form.removeMusic': 'Rimuovi',
    'form.previewMusic': 'Anteprima',

    // Content Types
    'type.text': '📝 Testo',
    'type.image': '🖼️ Immagine',
    'type.video': '🎥 Video',
    'type.html': '🌐 HTML',
    'type.presentation': '📊 Presentazione PowerPoint',
    'type.pdf': '📄 Documento PDF',
    'type.word': '📃 Documento Word',

    // Buttons
    'btn.save': 'Salva',
    'btn.cancel': 'Annulla',
    'btn.newPost': '+ Nuovo Articolo',
    'btn.deleteAll': '🗑️ Elimina Tutti',
    'btn.savePost': 'Salva Articolo',
    'btn.saveCategory': 'Crea Categoria',
    'btn.saveUser': 'Salva Utente',
    'btn.changePassword': 'Cambia Password',
    'btn.newCategory': '+ Nuova Categoria',
    'btn.newUser': '+ Nuovo Utente',

    // Category Form
    'category.name': 'Nome *',
    'category.color': 'Colore',
    'category.icon': 'Icona',
    'category.description': 'Descrizione',
    'category.descriptionPlaceholder': 'Descrizione opzionale...',
  },
};

// Current language
let currentLanguage = localStorage.getItem('appLanguage') || 'de';

// Get translation
function t(key, params = {}) {
  const lang = translations[currentLanguage] || translations.de;
  let text = lang[key] || translations.de[key] || key;

  // Replace parameters like {min}, {max}
  Object.keys(params).forEach((param) => {
    text = text.replace(`{${param}}`, params[param]);
  });

  return text;
}

// Translate all elements with data-translate attribute
function translatePage() {
  // Translate text content
  document.querySelectorAll('[data-translate]').forEach((el) => {
    const key = el.getAttribute('data-translate');
    const translated = t(key);
    if (translated !== key) {
      el.textContent = translated;
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-translate-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-translate-placeholder');
    const translated = t(key);
    if (translated !== key) {
      el.placeholder = translated;
    }
  });

  // Translate options with data-translate-value
  document.querySelectorAll('option[data-translate]').forEach((el) => {
    const key = el.getAttribute('data-translate');
    const translated = t(key);
    if (translated !== key) {
      el.textContent = translated;
    }
  });
}

// Change language
function changeLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    translatePage();
    applyTranslations();
    showNotification(getLanguageChangedMessage(lang), 'success');
  }
}

// Get language changed message in the new language
function getLanguageChangedMessage(lang) {
  const messages = {
    de: 'Sprache wurde auf Deutsch geändert',
    en: 'Language changed to English',
    it: 'Lingua cambiata in Italiano',
  };
  return messages[lang] || messages.de;
}

// Apply translations to the DOM
function applyTranslations() {
  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // Update titles
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });

  // Update navigation - korrigierte Selektoren mit dezenten Unicode-Symbolen
  const navLinks = {
    dashboard: { key: 'nav.dashboard', icon: '◉' },
    posts: { key: 'nav.posts', icon: '▤' },
    categories: { key: 'nav.categories', icon: '◈' },
    users: { key: 'nav.users', icon: '◎' },
    settings: { key: 'nav.settings', icon: '⚙' },
  };

  document.querySelectorAll('.sidebar-menu a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href !== '#') {
      const section = href.replace('#', '');
      if (navLinks[section]) {
        link.innerHTML = `<span class="icon">${navLinks[section].icon}</span> ${t(navLinks[section].key)}`;
      }
    }
  });

  // Update logout button
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.innerHTML = `<span class="icon">⏻</span> ${t('nav.logout')}`;
  }

  // Update section titles
  const sectionTitles = {
    'dashboard-section': 'nav.dashboard',
    'posts-section': 'posts.title',
    'categories-section': 'categories.title',
    'users-section': 'users.title',
    'settings-section': 'settings.title',
  };

  Object.entries(sectionTitles).forEach(([sectionId, key]) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const h2 = section.querySelector('h2');
      if (h2) h2.textContent = t(key);
    }
  });

  // Update page title
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    const currentSection = document.querySelector('.sidebar-menu a.active');
    if (currentSection) {
      const href = currentSection.getAttribute('href');
      if (href) {
        const section = href.replace('#', '');
        if (navLinks[section]) {
          pageTitle.textContent = t(navLinks[section].key);
        }
      }
    }
  }

  // Update settings card titles
  const settingsCards = document.querySelectorAll('.settings-card h3');
  settingsCards.forEach((h3) => {
    const text = h3.textContent;
    if (text.includes('Display')) {
      h3.innerHTML = `<span class="settings-icon">⚙</span> ${t('settings.display')}`;
    } else if (text.includes('Sprach') || text.includes('Language') || text.includes('Lingua')) {
      h3.innerHTML = `<span class="settings-icon">◉</span> ${t('settings.language')}`;
    } else if (text.includes('SSO') || text.includes('Sign-On')) {
      h3.innerHTML = `<span class="settings-icon">◈</span> ${t('settings.sso')}`;
    } else if (text.includes('Über') || text.includes('About') || text.includes('Informazioni')) {
      h3.innerHTML = `<span class="settings-icon">ℹ</span> ${t('settings.about')}`;
    }
  });

  // Update form labels in settings
  const refreshLabel = document.querySelector('label[for="refresh-interval"]');
  if (refreshLabel) refreshLabel.textContent = t('settings.refreshInterval');

  const durationLabel = document.querySelector('label[for="default-duration"]');
  if (durationLabel) durationLabel.textContent = t('settings.defaultDuration');

  const langLabel = document.querySelector('label[for="app-language"]');
  if (langLabel) langLabel.textContent = t('settings.languageLabel');

  // Update buttons
  document.querySelectorAll('.settings-card .btn-primary').forEach((btn) => {
    if (
      btn.textContent.includes('speichern') ||
      btn.textContent.includes('Save') ||
      btn.textContent.includes('Salva')
    ) {
      btn.textContent = t('settings.saveSettings');
    }
  });

  // Update "New Post" buttons
  const showPostFormBtn = document.getElementById('showPostFormBtn');
  if (showPostFormBtn) {
    showPostFormBtn.innerHTML = `<span class="btn-icon">+</span> ${t('posts.newPost')}`;
  }

  // Update "New Category" button
  const showCategoryFormBtn = document.getElementById('showCategoryFormBtn');
  if (showCategoryFormBtn) {
    showCategoryFormBtn.innerHTML = `<span class="btn-icon">+</span> ${t('categories.newCategory')}`;
  }

  // Update "New User" button
  const showUserFormBtn = document.getElementById('showUserFormBtn');
  if (showUserFormBtn) {
    showUserFormBtn.innerHTML = `<span class="btn-icon">+</span> ${t('users.newUser')}`;
  }

  // Update language selector
  const langSelect = document.getElementById('app-language');
  if (langSelect) {
    langSelect.value = currentLanguage;
  }

  // Update language hint
  const langHint = document.getElementById('language-hint');
  if (langHint) {
    langHint.textContent = t('settings.languageHint');
  }

  // Update App Info section
  const appInfoSection = document.querySelector('.app-info-section');
  if (appInfoSection) {
    // Update description
    const appDescription = appInfoSection.querySelector('.app-description');
    if (appDescription) {
      appDescription.textContent = t('appInfo.title');
    }

    // Update labels in app-info-grid
    const infoLabels = appInfoSection.querySelectorAll('.app-info-item .info-label');
    infoLabels.forEach((label) => {
      const text = label.textContent.trim();
      if (text === 'Version' || text === 'Versione') {
        label.textContent = t('appInfo.version');
      } else if (text === 'Entwickler' || text === 'Developer' || text === 'Sviluppatore') {
        label.textContent = t('appInfo.developer');
      } else if (text === 'Lizenz' || text === 'License' || text === 'Licenza') {
        label.textContent = t('appInfo.license');
      } else if (text === 'Build') {
        label.textContent = t('appInfo.build');
      }
    });

    // Update links
    const appLinks = appInfoSection.querySelectorAll('.app-link');
    appLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.includes('docs')) {
        link.innerHTML = `→ ${t('appInfo.apiDocs')}`;
      }
    });
  }

  // Update SSO section
  const ssoTestBtn = document.getElementById('sso-test-btn');
  if (ssoTestBtn) {
    ssoTestBtn.innerHTML = `<span class="btn-icon">↻</span> ${t('sso.testConnection')}`;
  }

  const ssoSaveBtn = document.getElementById('sso-save-btn');
  if (ssoSaveBtn) {
    ssoSaveBtn.innerHTML = `<span class="btn-icon">✓</span> ${t('sso.saveConfig')}`;
  }

  // Update SSO labels
  const ssoLabels = document.querySelectorAll('.sso-config label');
  ssoLabels.forEach((label) => {
    const forAttr = label.getAttribute('for');
    if (forAttr === 'sso-enabled') {
      label.childNodes[0].textContent = t('sso.enabled') + ' ';
    } else if (forAttr === 'sso-provider') {
      label.textContent = t('sso.provider');
    } else if (forAttr === 'sso-tenant-id') {
      label.textContent = t('sso.tenantId');
    } else if (forAttr === 'sso-client-id') {
      label.textContent = t('sso.clientId');
    } else if (forAttr === 'sso-client-secret') {
      label.textContent = t('sso.clientSecret');
    } else if (forAttr === 'sso-redirect-uri') {
      label.textContent = t('sso.redirectUri');
    }
  });

  // Reload lists to apply translations to dynamic content
  if (typeof renderPosts === 'function' && postsCache && postsCache.length > 0) {
    renderPosts();
  }
  if (typeof renderCategories === 'function' && categoriesCache && categoriesCache.length > 0) {
    renderCategories();
  }
  if (typeof renderUsers === 'function' && usersCache && usersCache.length > 0) {
    renderUsers();
  }

  // Update date formats based on language
  updateDateFormats();

  console.log('Translations applied for language:', currentLanguage);
}

// Update date formats based on current language
function updateDateFormats() {
  const localeMap = {
    de: 'de-DE',
    en: 'en-US',
    it: 'it-IT',
  };
  window.currentLocale = localeMap[currentLanguage] || 'de-DE';
}

// Get current locale for date formatting
function getCurrentLocale() {
  const localeMap = {
    de: 'de-DE',
    en: 'en-US',
    it: 'it-IT',
  };
  return localeMap[currentLanguage] || 'de-DE';
}

// Initialize language on page load
function initLanguage() {
  const savedLang = localStorage.getItem('appLanguage');
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  }

  // Set language selector value
  const langSelect = document.getElementById('app-language');
  if (langSelect) {
    langSelect.value = currentLanguage;
  }

  // Apply translations
  applyTranslations();
}

// ============================================
// Form Validation Helpers
// ============================================
const Validator = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? null : 'Ungültige E-Mail-Adresse';
  },

  required: (value, fieldName = 'Feld') => {
    return value && value.trim() ? null : `${fieldName} ist erforderlich`;
  },

  minLength: (value, min, fieldName = 'Feld') => {
    return value && value.length >= min
      ? null
      : `${fieldName} muss mindestens ${min} Zeichen haben`;
  },

  maxLength: (value, max, fieldName = 'Feld') => {
    return !value || value.length <= max ? null : `${fieldName} darf maximal ${max} Zeichen haben`;
  },

  number: (value, fieldName = 'Feld') => {
    return !isNaN(Number(value)) ? null : `${fieldName} muss eine Zahl sein`;
  },

  positiveNumber: (value, fieldName = 'Feld') => {
    const num = Number(value);
    return !isNaN(num) && num > 0 ? null : `${fieldName} muss eine positive Zahl sein`;
  },

  date: (value) => {
    if (!value) return null; // Optional
    const date = new Date(value);
    return !isNaN(date.getTime()) ? null : 'Ungültiges Datum';
  },

  // Validiere ein Formular und zeige Fehler an
  validateForm: (rules) => {
    const errors = [];
    for (const [field, validations] of Object.entries(rules)) {
      for (const validation of validations) {
        const error = validation();
        if (error) {
          errors.push({ field, error });
          break; // Nur ersten Fehler pro Feld
        }
      }
    }
    return errors;
  },

  // Zeige Fehler im Formular an
  showFieldError: (fieldId, message) => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.add('input-error');

    // Entferne alte Fehlermeldung
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) existingError.remove();

    // Füge neue Fehlermeldung hinzu
    const errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';
    errorSpan.textContent = message;
    field.parentElement.appendChild(errorSpan);
  },

  // Entferne alle Fehler aus Formular
  clearErrors: (formId) => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
    form.querySelectorAll('.field-error').forEach((el) => el.remove());
  },
};

// ============================================
// API Service Layer
// ============================================
const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Entferne Content-Type für FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Token abgelaufen - versuche Refresh
      if (response.status === 401 && endpoint !== '/auth/refresh') {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await refreshToken();
        if (refreshed) {
          // Wiederhole Request mit neuem Token
          console.log('✅ Token refreshed successfully, retrying request...');
          return apiRequest(endpoint, options);
        } else {
          // Refresh fehlgeschlagen - Logout
          console.error('❌ Token refresh failed, logging out...');
          logout();
          return null;
        }
      }
      throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    console.warn('⚠️ No refresh token available');
    return false;
  }

  try {
    console.log('🔄 Attempting to refresh access token...');
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.error('❌ Token refresh failed:', response.status);
      return false;
    }

    const data = await response.json();
    if (data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      console.log('✅ Access token refreshed successfully');
      return true;
    }
    console.warn('⚠️ Token refresh response missing accessToken');
    return false;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    return false;
  }
}

// ============================================
// Authentication
// ============================================
function checkAuth() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    window.location.href = '/admin';
    return false;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = user.firstName ? `${user.firstName} ${user.lastName}` : user.email || 'Admin';
  const usernameElement = document.getElementById('username');
  if (usernameElement) {
    usernameElement.textContent = displayName;
  }

  // Rolle anzeigen
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge && user.role) {
    const roleLabels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      editor: 'Editor',
      viewer: 'Betrachter',
      display: 'Display',
    };
    roleBadge.textContent = roleLabels[user.role] || user.role;
    roleBadge.className = `user-role-badge role-${user.role}`;
  }

  // UI basierend auf Rolle anpassen
  setupRoleBasedUI(user);

  return true;
}

/**
 * Konfiguriert UI-Elemente basierend auf Benutzerrolle
 */
function setupRoleBasedUI(user) {
  const showUserFormBtn = document.getElementById('showUserFormBtn');

  // Editors können keine Benutzer erstellen
  if (showUserFormBtn && !['super_admin', 'admin'].includes(user.role)) {
    showUserFormBtn.style.display = 'none';
  }

  // Benutzer-Menüpunkt ausblenden für Viewer/Display
  const usersNavItem = document.querySelector('a[href="#users"]');
  if (usersNavItem && ['viewer', 'display'].includes(user.role)) {
    usersNavItem.parentElement.style.display = 'none';
  }
}

function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  window.location.href = '/admin';
}

// ============================================
// Navigation
// ============================================
function navigateTo(section) {
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  const navLinks = document.querySelectorAll('.sidebar-menu a:not(#logout)');
  navLinks.forEach((link) => link.classList.remove('active'));

  const targetSection = document.getElementById(`${section}-section`);
  if (targetSection) {
    targetSection.classList.add('active');
    const activeLink = document.querySelector(`.sidebar-menu a[href="#${section}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    const titles = {
      dashboard: 'Dashboard',
      posts: 'Beiträge',
      categories: 'Kategorien',
      users: 'Benutzer',
      media: 'Medien',
      livedata: 'Live-Daten',
      settings: 'Einstellungen',
    };
    document.getElementById('page-title').textContent = titles[section] || section;

    // Daten laden bei Navigation
    if (section === 'posts') loadPosts();
    if (section === 'categories') loadCategories();
    if (section === 'displays') loadDisplays();
    if (section === 'users') loadUsers();
    if (section === 'dashboard') updateDashboardStats();
    if (section === 'livedata') loadLiveDataSettings();
    if (section === 'settings') {
      if (!ssoConfigLoaded) loadSSOConfiguration();
      loadSystemMode(); // Lade System-Modus Einstellungen
    }
  }
}

// ============================================
// Dashboard Statistics (API)
// ============================================
async function updateDashboardStats() {
  try {
    // Verwende bereits geladene Daten aus dem Cache statt erneut zu laden
    const posts = postsCache || [];
    const categories = categoriesCache || [];
    const displays = displaysCache || [];

    const activePosts = posts.filter((p) => p.isActive !== false).length;
    const scheduledPosts = posts.filter(
      (p) => p.startDate && new Date(p.startDate) > new Date()
    ).length;

    document.getElementById('active-posts').textContent = activePosts;
    document.getElementById('scheduled-posts').textContent = scheduledPosts;
    document.getElementById('total-categories').textContent = categories.length;
    document.getElementById('total-displays').textContent = displays.length;
    document.getElementById('total-media').textContent = '0'; // TODO: Media API
  } catch (error) {
    console.error('Dashboard Stats Fehler:', error);
    // Fallback auf 0
    document.getElementById('active-posts').textContent = '0';
    document.getElementById('scheduled-posts').textContent = '0';
    document.getElementById('total-categories').textContent = '0';
    document.getElementById('total-displays').textContent = '0';
    document.getElementById('total-media').textContent = '0';
  }
}

// ============================================
// Posts Management (API)
// ============================================
let currentPostId = null;
let postsCache = [];
let draggedItem = null;
let currentBackgroundMusicUrl = null; // Aktuelle Hintergrundmusik-URL für Bearbeitung

async function loadPosts() {
  const postsList = document.getElementById('posts-list');
  postsList.innerHTML = '<p style="text-align:center; color: #6c757d;">Lade Beiträge...</p>';

  try {
    // Sortierung wie im Display: priority DESC, createdAt DESC
    const response = await apiRequest('/posts?limit=100&sort=priority&order=DESC');
    postsCache = response?.data || [];

    if (postsCache.length === 0) {
      postsList.innerHTML =
        '<p style="text-align:center; color: #6c757d;">Noch keine Beiträge vorhanden</p>';
      return;
    }

    postsList.innerHTML =
      `<div class="drag-drop-hint">${t('hint.dragDropPosts')}</div>` +
      postsCache
        .map((post, index) => {
          // Zeitraum formatieren mit aktueller Sprache
          const locale = getCurrentLocale();
          const startDate = post.startDate
            ? new Date(post.startDate).toLocaleDateString(locale)
            : t('posts.immediately');
          const endDate = post.endDate
            ? new Date(post.endDate).toLocaleDateString(locale)
            : t('posts.unlimited');
          const zeitraum = `${startDate} - ${endDate}`;

          return `
        <div class="list-item draggable-post" draggable="true" data-post-id="${post.id}" data-index="${index}">
            <div class="drag-handle" title="Ziehen zum Sortieren">⋮⋮</div>
            <div class="list-item-content clickable" data-action="edit" data-post-id="${post.id}" title="Klicken zum Bearbeiten">
                <h3>${escapeHtml(post.title)}</h3>
                <p>Typ: ${post.contentType} | Dauer: ${post.duration || 10}s | Priorität: ${post.priority || 0} | Status: ${post.isActive !== false ? t('common.active') : t('common.inactive')}</p>
                <p style="font-size: 12px; color: #666;">▸ Zeitraum: ${zeitraum}</p>
                <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  ${post.category ? `<span style="background: ${post.category.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${post.category.icon || ''} ${post.category.name}</span>` : ''}
                  ${post.displayMode === 'all' 
                    ? '<span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">📺 Alle Displays</span>' 
                    : post.displays && post.displays.length > 0
                      ? post.displays.map(d => `<span style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">📺 ${escapeHtml(d.name)}</span>`).join('')
                      : '<span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">⚠ Keine Displays</span>'
                  }
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-secondary" data-action="edit" data-post-id="${post.id}">${t('common.edit')}</button>
                <button class="btn btn-danger" data-action="delete" data-post-id="${post.id}">${t('common.delete')}</button>
            </div>
        </div>
      `;
        })
        .join('');

    // Drag & Drop Event Listeners initialisieren
    initDragAndDrop();
  } catch (error) {
    postsList.innerHTML = `<p style="text-align:center; color: #dc3545;">Fehler beim Laden: ${error.message}</p>`;
  }
}

// ============================================
// Drag & Drop Funktionalität
// ============================================
function initDragAndDrop() {
  const postsList = document.getElementById('posts-list');
  const draggableItems = postsList.querySelectorAll('.draggable-post');

  draggableItems.forEach((item) => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.postId);

  // Leichte Verzögerung für visuelles Feedback
  setTimeout(() => {
    this.style.opacity = '0.5';
  }, 0);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  this.style.opacity = '1';

  // Entferne alle drag-over Klassen
  document.querySelectorAll('.draggable-post').forEach((item) => {
    item.classList.remove('drag-over');
  });

  draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (this !== draggedItem) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

async function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  if (this === draggedItem) return;

  const postsList = document.getElementById('posts-list');
  const items = Array.from(postsList.querySelectorAll('.draggable-post'));
  const draggedIndex = items.indexOf(draggedItem);
  const dropIndex = items.indexOf(this);

  // DOM neu anordnen
  if (draggedIndex < dropIndex) {
    this.parentNode.insertBefore(draggedItem, this.nextSibling);
  } else {
    this.parentNode.insertBefore(draggedItem, this);
  }

  // Neue Reihenfolge an Backend senden
  await saveNewOrder();
}

async function saveNewOrder() {
  const postsList = document.getElementById('posts-list');
  const items = postsList.querySelectorAll('.draggable-post');
  
  // Erstelle Array mit IDs und neuen Prioritäten (höchste Priorität = Position 1)
  const updates = Array.from(items).map((item, index) => ({
    id: parseInt(item.dataset.postId),
    priority: items.length - index // Position 1 = höchste Zahl
  }));

  try {
    // Sende alle Prioritäts-Updates
    await apiRequest('/posts/update-priorities', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });

    showNotification('Reihenfolge und Prioritäten gespeichert!', 'success');
    
    // Liste neu laden um aktualisierte Prioritäten vom Server zu holen
    // loadPosts() sortiert automatisch nach priority DESC
    await loadPosts();
  } catch (error) {
    showNotification('Fehler beim Speichern der Reihenfolge: ' + error.message, 'error');
    // Bei Fehler: Posts neu laden um konsistenten State zu haben
    await loadPosts();
  }
}

async function showPostForm() {
  document.getElementById('post-form').style.display = 'block';
  currentPostId = null;
  document.getElementById('postForm').reset();

  // Standard-Checkboxen setzen (nur für NEUE Posts!)
  const isActiveCheckbox = document.getElementById('is-active');
  const showTitleCheckbox = document.getElementById('show-title');
  if (isActiveCheckbox) isActiveCheckbox.checked = true;
  if (showTitleCheckbox) showTitleCheckbox.checked = true;

  // Standard-Startdatum auf jetzt setzen
  const now = new Date();
  const localDateTime = now.toISOString().slice(0, 16);
  document.getElementById('start-date').value = localDateTime;
  
  // Enddatum auf Startdatum + 7 Tage setzen
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7);
  const endDateTime = endDate.toISOString().slice(0, 16);
  document.getElementById('end-date').value = endDateTime;

  // Display-Auswahl auf "alle" zurücksetzen
  document.getElementById('display-mode-all').checked = true;
  document.getElementById('display-selection-container').style.display = 'none';

  await loadCategoryDropdown();
  await loadDisplayCheckboxes();
}

async function loadCategoryDropdown() {
  const categorySelect = document.getElementById('post-category');
  if (!categorySelect) return;

  categorySelect.innerHTML = '<option value="">-- Lade Kategorien... --</option>';

  try {
    const response = await apiRequest('/categories');
    const categories = response?.data || [];

    categorySelect.innerHTML = '<option value="">-- Keine Kategorie --</option>';
    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon || ''} ${cat.name}`;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    categorySelect.innerHTML = '<option value="">-- Fehler beim Laden --</option>';
  }
}

async function loadDisplayCheckboxes(selectedDisplayIds = []) {
  const container = document.getElementById('displays-checkboxes');
  if (!container) return;

  container.innerHTML = '<p style="color: #6c757d; text-align: center;">Lade Displays...</p>';

  try {
    // Verwende Cache falls vorhanden, sonst lade neu
    let displays = displaysCache;
    if (!displays || displays.length === 0) {
      const response = await apiRequest('/displays');
      displays = response?.data || [];
      displaysCache = displays;
    }

    if (displays.length === 0) {
      container.innerHTML = '<p style="color: #dc3545; text-align: center; font-size: 0.9em;">Keine Displays verfügbar. Erstellen Sie zuerst Displays in der Display-Verwaltung.</p>';
      return;
    }

    container.innerHTML = `
      <style>
        .display-checkbox-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          transition: all 0.2s ease;
        }
        
        .display-checkbox-card:hover:not(.disabled) {
          border-color: #007bff;
          background: #f8f9ff;
          box-shadow: 0 2px 6px rgba(0,123,255,0.1);
          transform: translateY(-1px);
        }
        
        .display-checkbox-card.checked {
          border-color: #28a745;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          box-shadow: 0 2px 8px rgba(40,167,69,0.15);
        }
        
        .display-checkbox-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f5f5f5;
        }
        
        .display-checkbox-card input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #28a745;
          flex-shrink: 0;
        }
        
        .display-checkbox-card.disabled input[type="checkbox"] {
          cursor: not-allowed;
        }
        
        .display-checkbox-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .display-status-icon {
          font-size: 0.75rem;
          flex-shrink: 0;
        }
        
        .display-name {
          font-weight: 500;
          color: #333;
        }
        
        .display-checkbox-card.disabled .display-name {
          color: #6c757d;
        }
        
        .display-status-badge {
          margin-left: auto;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
          flex-shrink: 0;
        }
        
        .status-active {
          background: #d4edda;
          color: #155724;
        }
        
        .status-inactive {
          background: #f8d7da;
          color: #721c24;
        }
      </style>
    ` + displays
      .map(
        (display) => `
        <label class="display-checkbox-card ${!display.isActive ? 'disabled' : ''} ${selectedDisplayIds.includes(display.id) ? 'checked' : ''}" 
               data-display-id="${display.id}">
          <input type="checkbox" 
                 name="display_ids" 
                 value="${display.id}" 
                 ${selectedDisplayIds.includes(display.id) ? 'checked' : ''}
                 ${!display.isActive ? 'disabled' : ''}
                 onchange="this.closest('.display-checkbox-card').classList.toggle('checked', this.checked)" />
          <div class="display-checkbox-info">
            <span class="display-status-icon">${display.isActive ? '🟢' : '🔴'}</span>
            <span class="display-name">${escapeHtml(display.name)}</span>
            <span class="display-status-badge ${display.isActive ? 'status-active' : 'status-inactive'}">
              ${display.isActive ? '● Aktiv' : '○ Inaktiv'}
            </span>
          </div>
        </label>
      `
      )
      .join('');
  } catch (error) {
    container.innerHTML = `<p style="color: #dc3545; text-align: center;">Fehler beim Laden: ${error.message}</p>`;
  }
}

function hidePostForm() {
  document.getElementById('post-form').style.display = 'none';
  document.getElementById('postForm').reset();
  const fileInput = document.getElementById('media-file');
  if (fileInput) fileInput.value = '';
  const musicFileInput = document.getElementById('background-music-file');
  if (musicFileInput) musicFileInput.value = '';
  currentPostId = null;
  currentBackgroundMusicUrl = null;

  // Hintergrundmusik-Info zurücksetzen
  const musicInfo = document.getElementById('current-music-info');
  if (musicInfo) musicInfo.style.display = 'none';

  // Musik-Vorschau stoppen
  const musicPreview = document.getElementById('music-preview');
  if (musicPreview) {
    musicPreview.pause();
    musicPreview.src = '';
  }
}

async function editPost(id) {
  // Finde Post im Cache oder lade neu
  let post = postsCache.find((p) => p.id === id);

  if (!post) {
    try {
      const response = await apiRequest(`/posts/${id}`);
      post = response?.data;
    } catch (error) {
      alert('Fehler beim Laden des Beitrags: ' + error.message);
      return;
    }
  }

  if (!post) return;

  currentPostId = id;
  document.getElementById('post-form').style.display = 'block';
  await loadCategoryDropdown();

  document.getElementById('post-title').value = post.title || '';
  document.getElementById('post-type').value = post.contentType || 'text';
  document.getElementById('post-content').value = post.content || '';

  // Display-Auswahl laden und setzen
  const displayMode = post.displayMode || 'all';
  document.getElementById(`display-mode-${displayMode}`).checked = true;
  
  // Display-Auswahl-Container ein/ausblenden
  const displayContainer = document.getElementById('display-selection-container');
  if (displayContainer) {
    displayContainer.style.display = displayMode === 'specific' ? 'block' : 'none';
  }

  // Lade Display-Checkboxen mit zugewiesenen Displays
  const assignedDisplayIds = post.displays?.map(d => d.id) || [];
  await loadDisplayCheckboxes(assignedDisplayIds);

  // Medien-URL: Prüfe verschiedene Quellen (Media-Objekt, content bei Video/Bild-URLs)
  let mediaUrl = '';
  if (post.media?.url) {
    mediaUrl = post.media.url;
  } else if (['video', 'image'].includes(post.contentType) && post.content) {
    // Bei Video/Bild-Posts kann die URL im content stehen (z.B. YouTube, Vimeo, externe Bilder)
    if (post.content.startsWith('http') || post.content.startsWith('/uploads/')) {
      mediaUrl = post.content;
    }
  }
  document.getElementById('media-url').value = mediaUrl;

  document.getElementById('display-duration').value = post.duration || 10;
  document.getElementById('priority').value = post.priority || 0;

  // Blend-Effekt setzen
  const blendEffectSelect = document.getElementById('blend-effect');
  if (blendEffectSelect) {
    blendEffectSelect.value = post.blendEffect || '';
  }

  // Datum/Zeit korrekt formatieren für datetime-local Input (YYYY-MM-DDTHH:MM)
  if (post.startDate) {
    const startDate = new Date(post.startDate);
    document.getElementById('start-date').value = formatDateTimeLocal(startDate);
  } else {
    document.getElementById('start-date').value = '';
  }

  if (post.endDate) {
    const endDate = new Date(post.endDate);
    document.getElementById('end-date').value = formatDateTimeLocal(endDate);
  } else {
    document.getElementById('end-date').value = '';
  }

  document.querySelector('input[name="is_active"]').checked = post.isActive !== false;
  
  const showTitleCheckbox = document.querySelector('input[name="show_title"]');
  if (showTitleCheckbox) {
    showTitleCheckbox.checked = post.showTitle === true;
  }

  const categorySelect = document.getElementById('post-category');
  if (categorySelect && post.category) {
    categorySelect.value = post.category.id || post.categoryId;
  }

  // Hintergrundmusik laden
  currentBackgroundMusicUrl = post.backgroundMusicUrl || null;
  const musicInfo = document.getElementById('current-music-info');
  const musicNameSpan = document.getElementById('current-music-name');
  const volumeSlider = document.getElementById('background-music-volume');
  const volumeDisplay = document.getElementById('volume-display');

  if (currentBackgroundMusicUrl && musicInfo && musicNameSpan) {
    // Dateiname aus URL extrahieren
    const musicFilename = currentBackgroundMusicUrl.split('/').pop() || 'Musik';
    musicNameSpan.textContent = decodeURIComponent(musicFilename);
    musicInfo.style.display = 'block';
  } else if (musicInfo) {
    musicInfo.style.display = 'none';
  }

  // Lautstärke setzen
  if (volumeSlider) {
    const volume = post.backgroundMusicVolume || 50;
    volumeSlider.value = volume;
    if (volumeDisplay) volumeDisplay.textContent = volume + '%';
    volumeSlider.style.setProperty('--volume-percent', volume + '%');
  }

  // Hintergrundmusik-Sektion je nach Content-Type ein/ausblenden
  updateBackgroundMusicVisibility(post.contentType);
}

// Helper: Datum für datetime-local Input formatieren
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Hintergrundmusik-Sektion je nach Content-Type ein/ausblenden
function updateBackgroundMusicVisibility(contentType) {
  const musicSection = document.getElementById('background-music-section');
  if (musicSection) {
    // Nur für Video ausblenden (hat eigenen Ton)
    musicSection.style.display = contentType === 'video' ? 'none' : 'block';
  }
}

// Hintergrundmusik entfernen
function removeBackgroundMusic() {
  currentBackgroundMusicUrl = null;
  const musicInfo = document.getElementById('current-music-info');
  if (musicInfo) musicInfo.style.display = 'none';
  const musicFileInput = document.getElementById('background-music-file');
  if (musicFileInput) musicFileInput.value = '';

  // Vorschau stoppen
  const musicPreview = document.getElementById('music-preview');
  if (musicPreview) {
    musicPreview.pause();
    musicPreview.src = '';
  }
}

// Musik-Vorschau abspielen/stoppen
function toggleMusicPreview() {
  const musicPreview = document.getElementById('music-preview');
  const previewBtn = document.getElementById('preview-music-btn');

  if (!musicPreview || !currentBackgroundMusicUrl) return;

  if (musicPreview.paused || musicPreview.src !== currentBackgroundMusicUrl) {
    musicPreview.src = currentBackgroundMusicUrl;
    const volume = parseInt(document.getElementById('background-music-volume')?.value || 50) / 100;
    musicPreview.volume = volume;
    musicPreview.play();
    if (previewBtn) previewBtn.textContent = '◼ Stopp';
  } else {
    musicPreview.pause();
    if (previewBtn) previewBtn.textContent = '▶ Vorschau';
  }
}

// Globale Musik-Einstellungen initialisieren
function initGlobalMusicSettings() {
  const enabledCheckbox = document.getElementById('global-music-enabled');
  const configDiv = document.getElementById('global-music-config');
  const volumeSlider = document.getElementById('global-music-volume');
  const volumeValue = document.getElementById('global-volume-value');
  const saveBtn = document.getElementById('saveGlobalMusicSettings');
  const testBtn = document.getElementById('testGlobalMusic');
  const musicFileInput = document.getElementById('global-music-file');

  // Lade gespeicherte Einstellungen
  const savedSettings = JSON.parse(localStorage.getItem('globalMusicSettings') || '{}');

  if (enabledCheckbox) {
    enabledCheckbox.checked = savedSettings.enabled || false;
    if (configDiv) {
      configDiv.style.display = savedSettings.enabled ? 'block' : 'none';
    }

    enabledCheckbox.addEventListener('change', (e) => {
      if (configDiv) {
        configDiv.style.display = e.target.checked ? 'block' : 'none';
      }
    });
  }

  const urlInput = document.getElementById('global-music-url');
  if (urlInput && savedSettings.url) {
    urlInput.value = savedSettings.url;
  }

  if (volumeSlider && volumeValue) {
    const volume = savedSettings.volume || 30;
    volumeSlider.value = volume;
    volumeValue.textContent = volume;

    volumeSlider.addEventListener('input', (e) => {
      volumeValue.textContent = e.target.value;
    });
  }

  const muteVideosCheckbox = document.getElementById('global-music-mute-videos');
  if (muteVideosCheckbox) {
    muteVideosCheckbox.checked = savedSettings.muteVideos !== false; // Default true
  }

  const prioritySelect = document.getElementById('global-music-priority');
  if (prioritySelect) {
    prioritySelect.value = savedSettings.priority || 'global'; // Default: global hat Vorrang
  }

  // Musik-Datei Upload
  let uploadedMusicUrl = null;
  if (musicFileInput) {
    musicFileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        try {
          const result = await uploadFile(e.target.files[0]);
          uploadedMusicUrl = result.url;
          showNotification('Musik-Datei hochgeladen!', 'success');
        } catch (error) {
          showNotification('Upload fehlgeschlagen: ' + error.message, 'error');
        }
      }
    });
  }

  // Speichern mit automatischem Upload, falls Datei ausgewählt
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      // Prüfen, ob eine neue Datei ausgewählt wurde und noch nicht hochgeladen ist
      if (musicFileInput && musicFileInput.files.length > 0 && !uploadedMusicUrl) {
        try {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Hochladen...';
          const result = await uploadFile(musicFileInput.files[0]);
          uploadedMusicUrl = result.url;
          showNotification('Musik-Datei hochgeladen!', 'success');
        } catch (error) {
          showNotification('Upload fehlgeschlagen: ' + error.message, 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = 'Speichern';
          return;
        }
      }
      const settings = {
        enabled: enabledCheckbox?.checked || false,
        url: uploadedMusicUrl || urlInput?.value || '',
        volume: parseInt(volumeSlider?.value) || 30,
        muteVideos: muteVideosCheckbox?.checked !== false,
        priority: prioritySelect?.value || 'global',
      };
      localStorage.setItem('globalMusicSettings', JSON.stringify(settings));
      showNotification('Globale Musik-Einstellungen gespeichert!', 'success');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Speichern';
    });
  }

  // Test-Button
  let testAudio = null;
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      const musicUrl = uploadedMusicUrl || urlInput?.value;

      if (!musicUrl) {
        showNotification('Bitte zuerst eine Musik-URL eingeben oder Datei hochladen.', 'warning');
        return;
      }

      if (testAudio && !testAudio.paused) {
        testAudio.pause();
        testBtn.textContent = 'Test ▷';
        return;
      }

      testAudio = new Audio(musicUrl);
      testAudio.volume = (volumeSlider?.value || 30) / 100;
      testAudio
        .play()
        .then(() => {
          testBtn.textContent = 'Stop ◼';
        })
        .catch((err) => {
          showNotification('Musik konnte nicht abgespielt werden: ' + err.message, 'error');
        });

      testAudio.addEventListener('ended', () => {
        testBtn.textContent = 'Test ▷';
      });
    });
  }
}

// Upload-Section Sichtbarkeit basierend auf Content-Type steuern
function updateUploadSectionVisibility(contentType) {
  const uploadSection = document.getElementById('upload-section');
  const wordPdfImport = document.getElementById('word-pdf-import');
  const fileUploadSection = document.getElementById('file-upload-section');
  const mediaUrlSection = document.getElementById('media-url-section');

  if (!uploadSection) return;

  // Generell Upload-Section anzeigen
  uploadSection.style.display = 'block';

  // Bei text/html: Nur Word/PDF Import anzeigen
  if (contentType === 'text' || contentType === 'html') {
    if (wordPdfImport) wordPdfImport.style.display = 'block';
    if (fileUploadSection) fileUploadSection.style.display = 'none';
    if (mediaUrlSection) mediaUrlSection.style.display = 'none';
  }
  // Bei anderen Typen: File Upload und URL anzeigen
  else {
    if (wordPdfImport) wordPdfImport.style.display = 'none';
    if (fileUploadSection) fileUploadSection.style.display = 'block';
    if (mediaUrlSection) mediaUrlSection.style.display = 'block';
  }
  
  // Bei Video-Typ: Offline-Download-Option initial verstecken
  updateOfflineDownloadVisibility();
}

// Zeige/Verstecke Offline-Download-Option basierend auf URL
function updateOfflineDownloadVisibility() {
  const mediaUrlInput = document.getElementById('media-url');
  const offlineSection = document.getElementById('offline-download-section');
  const contentType = document.getElementById('post-type')?.value;
  
  if (!mediaUrlInput || !offlineSection || contentType !== 'video') {
    if (offlineSection) offlineSection.style.display = 'none';
    return;
  }
  
  const url = mediaUrlInput.value.trim();
  const isExternalVideo = url && (
    url.includes('youtube.com') || 
    url.includes('youtu.be') || 
    url.includes('vimeo.com')
  );
  
  offlineSection.style.display = isExternalVideo ? 'block' : 'none';
}

// Event-Listener für Hintergrundmusik-Steuerung initialisieren
function initBackgroundMusicControls() {
  // Globale Musik-Einstellungen
  initGlobalMusicSettings();

  // Content-Type Änderung überwachen
  const contentTypeSelect = document.getElementById('post-type');
  if (contentTypeSelect) {
    contentTypeSelect.addEventListener('change', (e) => {
      updateBackgroundMusicVisibility(e.target.value);
      updateUploadSectionVisibility(e.target.value);
    });
  }

  // Lautstärke-Slider
  const volumeSlider = document.getElementById('background-music-volume');
  const volumeDisplay = document.getElementById('volume-display');
  if (volumeSlider && volumeDisplay) {
    volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value;
      volumeDisplay.textContent = volume + '%';
      volumeSlider.style.setProperty('--volume-percent', volume + '%');

      // Vorschau-Lautstärke anpassen
      const musicPreview = document.getElementById('music-preview');
      if (musicPreview && !musicPreview.paused) {
        musicPreview.volume = volume / 100;
      }
    });
  }

  // Musik entfernen Button
  const removeMusicBtn = document.getElementById('remove-music-btn');
  if (removeMusicBtn) {
    removeMusicBtn.addEventListener('click', removeBackgroundMusic);
  }

  // Vorschau Button
  const previewMusicBtn = document.getElementById('preview-music-btn');
  if (previewMusicBtn) {
    previewMusicBtn.addEventListener('click', toggleMusicPreview);
  }

  // Musik-Vorschau beendet
  const musicPreview = document.getElementById('music-preview');
  if (musicPreview) {
    musicPreview.addEventListener('ended', () => {
      const previewBtn = document.getElementById('preview-music-btn');
      if (previewBtn) previewBtn.textContent = '▶ Vorschau';
    });
  }

  // Neue Musik-Datei ausgewählt
  const musicFileInput = document.getElementById('background-music-file');
  if (musicFileInput) {
    musicFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const musicInfo = document.getElementById('current-music-info');
        const musicNameSpan = document.getElementById('current-music-name');

        if (musicInfo && musicNameSpan) {
          musicNameSpan.textContent = file.name + ' (neu)';
          musicInfo.style.display = 'block';
        }

        // Vorschau mit lokaler Datei ermöglichen
        currentBackgroundMusicUrl = URL.createObjectURL(file);
      }
    });
  }
}

async function deletePost(id) {
  if (!confirm('Möchten Sie diesen Beitrag wirklich löschen?')) return;

  try {
    await apiRequest(`/posts/${id}`, { method: 'DELETE' });
    await loadPosts();
    await updateDashboardStats();
    showNotification('Beitrag erfolgreich gelöscht!', 'success');
  } catch (error) {
    showNotification('Fehler beim Löschen: ' + error.message, 'error');
  }
}

async function handlePostFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const fileInput = document.getElementById('media-file');
  let mediaId = null;
  let isPresentationUpload = false;
  let presentationId = null;

  // Datei-Upload falls vorhanden
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    isPresentationUpload = file.name.toLowerCase().match(/\.(pptx?|odp)$/);

    try {
      const uploadResult = await uploadFile(file);
      mediaId = uploadResult.id;
      
      // Bei PPT: Speichere presentationId
      if (uploadResult.type === 'presentation' && uploadResult.presentationId) {
        presentationId = uploadResult.presentationId;
        console.log(`PPT hochgeladen: ${uploadResult.totalSlides} Slides, ID: ${presentationId}`);
      }
    } catch (error) {
      showNotification('Datei-Upload fehlgeschlagen: ' + error.message, 'error');
      return;
    }
  }

  const categoryId = formData.get('category_id');
  const mediaUrl = formData.get('media_url');

  // Bei Präsentations-Upload: contentType automatisch auf 'presentation' setzen
  let contentType = formData.get('content_type');
  if (isPresentationUpload) {
    contentType = 'presentation';
  }

  // Hintergrundmusik-Upload (nur für nicht-Video-Inhalte)
  let backgroundMusicUrl = currentBackgroundMusicUrl || null;
  const musicFileInput = document.getElementById('background-music-file');
  if (musicFileInput && musicFileInput.files.length > 0 && contentType !== 'video') {
    try {
      const musicFile = musicFileInput.files[0];
      const musicUploadResult = await uploadFile(musicFile, 'audio');
      backgroundMusicUrl =
        musicUploadResult.url || `/uploads/originals/${musicUploadResult.filename}`;
    } catch (error) {
      showNotification('Musik-Upload fehlgeschlagen: ' + error.message, 'error');
      return;
    }
  }

  // Bei Video-Content: Keine Hintergrundmusik
  if (contentType === 'video') {
    backgroundMusicUrl = null;
  }

  const backgroundMusicVolume = parseInt(formData.get('background_music_volume')) || 50;

  // Bei Video/Bild-Posts mit Medien-URL: URL im content speichern
  // Die Medien-URL hat Priorität für Video/Bild-Posts
  let content = formData.get('content') || '';
  
  // Bei PPT: presentationId als content speichern
  if (presentationId) {
    content = presentationId;
  } else if (mediaUrl && ['video', 'image'].includes(contentType)) {
    // Medien-URL wird als Content gespeichert (für YouTube, Vimeo, externe Bilder)
    // Falls zusätzlicher Beschreibungstext vorhanden, wird er nach der URL angehängt
    if (content && content !== mediaUrl) {
      content = mediaUrl; // URL hat Priorität, Beschreibungstext wird ignoriert für Video/Bild
    } else {
      content = mediaUrl;
    }
  }

  const showTitleCheckbox = document.getElementById('show-title');
  const showTitleValue = showTitleCheckbox?.checked ?? true;

  // Display-Auswahl sammeln
  const displayMode = document.querySelector('input[name=\"display_mode\"]:checked')?.value || 'all';
  const displayIds = [];
  if (displayMode === 'specific') {
    document.querySelectorAll('input[name=\"display_ids\"]:checked').forEach(checkbox => {
      displayIds.push(parseInt(checkbox.value));
    });
  }

  const postData = {
    title: formData.get('title'),
    contentType: contentType,
    content: content,
    categoryId: categoryId ? parseInt(categoryId) : null,
    duration: parseInt(formData.get('display_duration')) || 10,
    priority: parseInt(formData.get('priority')) || 0,
    startDate: formData.get('start_date') || null,
    endDate: formData.get('end_date') || null,
    isActive: document.getElementById('is-active')?.checked ?? true,
    showTitle: showTitleValue,
    backgroundMusicUrl: backgroundMusicUrl,
    backgroundMusicVolume: backgroundMusicVolume,
    blendEffect: formData.get('blend_effect') || null,
    displayMode: displayMode,
    displayIds: displayIds,
  };

  if (mediaId) {
    postData.mediaId = mediaId;
  }

  try {
    if (currentPostId) {
      // Update
      await apiRequest(`/posts/${currentPostId}`, {
        method: 'PUT',
        body: JSON.stringify(postData),
      });
      showNotification('Beitrag erfolgreich aktualisiert!', 'success');
    } else {
      // Create
      const result = await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
      
      // Prüfe ob Video offline verfügbar gemacht werden soll
      const downloadOfflineCheckbox = document.getElementById('download-video-offline');
      if (downloadOfflineCheckbox && downloadOfflineCheckbox.checked && 
          contentType === 'video' && mediaUrl && 
          (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') || mediaUrl.includes('vimeo.com'))) {
        
        const postId = Array.isArray(result.data) ? result.data[0]?.id : result.data?.id;
        if (postId) {
          showNotification('Beitrag erstellt! Video-Download wird gestartet...', 'info');
          
          // Triggere Video-Download im Hintergrund
          try {
            await apiRequest(`/posts/${postId}/download-video`, {
              method: 'POST'
            });
            showNotification('Video wird heruntergeladen und ist bald offline verfügbar!', 'success');
          } catch (downloadError) {
            console.error('Video-Download Fehler:', downloadError);
            showNotification('Beitrag erstellt, aber Video-Download fehlgeschlagen: ' + downloadError.message, 'warning');
          }
        }
      }
      
      // Bei PPT: Zeige Anzahl der erstellten Slides
      if (presentationId && result.data && Array.isArray(result.data)) {
        showNotification(`Präsentation erfolgreich erstellt! ${result.data.length} Slides wurden als separate Beiträge hinzugefügt.`, 'success');
      } else {
        showNotification('Beitrag erfolgreich erstellt!', 'success');
      }
    }

    hidePostForm();
    await loadPosts();
    await updateDashboardStats();
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    showNotification('Fehler beim Speichern: ' + error.message, 'error');
    // Formular bleibt bei Fehler offen, damit Nutzer Änderungen vornehmen kann
  }
}

// ============================================
// File Upload
// ============================================
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const progressDiv = document.getElementById('upload-progress');
  const progressBar = document.getElementById('upload-progress-bar');
  const statusText = document.getElementById('upload-status');

  const isPowerPoint = file.name.toLowerCase().match(/\.(pptx?|odp)$/);

  if (progressDiv) {
    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.textContent = isPowerPoint ? 'PowerPoint wird hochgeladen...' : 'Uploading...';
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && progressBar) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressBar.style.width = percentComplete + '%';
        statusText.textContent = isPowerPoint
          ? `PowerPoint wird hochgeladen... ${Math.round(percentComplete)}%`
          : `Uploading... ${Math.round(percentComplete)}%`;
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (progressBar) {
            progressBar.style.width = '100%';
            statusText.textContent = '✓ Upload erfolgreich!';
            statusText.style.color = '#28a745';
            setTimeout(() => {
              progressDiv.style.display = 'none';
              statusText.style.color = '#007bff';
            }, 2000);
          }
          resolve(response.data);
        } catch (err) {
          reject(new Error('Upload-Response konnte nicht verarbeitet werden'));
        }
      } else {
        reject(new Error(`Upload fehlgeschlagen: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Netzwerkfehler beim Upload'));
    });

    xhr.open('POST', '/api/media/upload');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      reject(new Error('Kein Token gefunden. Bitte neu einloggen.'));
      return;
    }
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// ============================================
// Categories Management (API)
// ============================================
let categoriesCache = [];
let draggedCategory = null;

async function loadCategories() {
  const categoriesList = document.getElementById('categories-list');
  categoriesList.innerHTML = '<p style="text-align:center; color: #6c757d;">Lade Kategorien...</p>';

  try {
    const response = await apiRequest('/categories');
    categoriesCache = response?.data || [];

    if (categoriesCache.length === 0) {
      categoriesList.innerHTML =
        '<p style="text-align:center; color: #6c757d;">Noch keine Kategorien vorhanden</p>';
      return;
    }

    categoriesList.innerHTML =
      `<div class="drag-drop-hint">${t('hint.dragDropCategories')}</div>` +
      categoriesCache
        .map(
          (cat, index) => `
        <div class="list-item draggable-category" draggable="true" data-category-id="${cat.id}" data-index="${index}">
            <div class="drag-handle" title="Ziehen zum Sortieren">⋮⋮</div>
            <div class="list-item-content clickable" data-action="edit-category" data-category-id="${cat.id}" title="Klicken zum Bearbeiten">
                <h3>${cat.icon || ''} ${escapeHtml(cat.name)}</h3>
                <p style="color: ${cat.color};">■ Farbe: ${cat.color}</p>
                ${cat.description ? `<p style="color: #6c757d;">${escapeHtml(cat.description)}</p>` : ''}
            </div>
            <div class="list-item-actions">
                <button class="btn btn-secondary" data-action="edit-category" data-category-id="${cat.id}">${t('common.edit')}</button>
                <button class="btn btn-danger" data-action="delete" data-category-id="${cat.id}">${t('common.delete')}</button>
            </div>
        </div>
      `
        )
        .join('');

    // Drag & Drop Event Listeners für Kategorien initialisieren
    initCategoryDragAndDrop();
  } catch (error) {
    categoriesList.innerHTML = `<p style="text-align:center; color: #dc3545;">Fehler beim Laden: ${error.message}</p>`;
  }
}

// ============================================
// Drag & Drop für Kategorien
// ============================================
function initCategoryDragAndDrop() {
  const categoriesList = document.getElementById('categories-list');
  const draggableItems = categoriesList.querySelectorAll('.draggable-category');

  draggableItems.forEach((item) => {
    item.addEventListener('dragstart', handleCategoryDragStart);
    item.addEventListener('dragend', handleCategoryDragEnd);
    item.addEventListener('dragover', handleCategoryDragOver);
    item.addEventListener('dragenter', handleCategoryDragEnter);
    item.addEventListener('dragleave', handleCategoryDragLeave);
    item.addEventListener('drop', handleCategoryDrop);
  });
}

function handleCategoryDragStart(e) {
  draggedCategory = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.categoryId);

  setTimeout(() => {
    this.style.opacity = '0.5';
  }, 0);
}

function handleCategoryDragEnd(e) {
  this.classList.remove('dragging');
  this.style.opacity = '1';

  document.querySelectorAll('.draggable-category').forEach((item) => {
    item.classList.remove('drag-over');
  });

  draggedCategory = null;
}

function handleCategoryDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleCategoryDragEnter(e) {
  e.preventDefault();
  if (this !== draggedCategory) {
    this.classList.add('drag-over');
  }
}

function handleCategoryDragLeave(e) {
  this.classList.remove('drag-over');
}

async function handleCategoryDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  if (this === draggedCategory) return;

  const categoriesList = document.getElementById('categories-list');
  const items = Array.from(categoriesList.querySelectorAll('.draggable-category'));
  const draggedIndex = items.indexOf(draggedCategory);
  const dropIndex = items.indexOf(this);

  // DOM neu anordnen
  if (draggedIndex < dropIndex) {
    this.parentNode.insertBefore(draggedCategory, this.nextSibling);
  } else {
    this.parentNode.insertBefore(draggedCategory, this);
  }

  // Neue Reihenfolge an Backend senden
  await saveCategoryOrder();
}

async function saveCategoryOrder() {
  const categoriesList = document.getElementById('categories-list');
  const items = categoriesList.querySelectorAll('.draggable-category');
  const orderedIds = Array.from(items).map((item) => parseInt(item.dataset.categoryId));

  try {
    await apiRequest('/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });

    showNotification('Reihenfolge gespeichert!', 'success');

    // Cache aktualisieren
    const newCategoriesCache = [];
    orderedIds.forEach((id, index) => {
      const cat = categoriesCache.find((c) => c.id === id);
      if (cat) {
        cat.sortOrder = index;
        newCategoriesCache.push(cat);
      }
    });
    categoriesCache = newCategoriesCache;
  } catch (error) {
    showNotification('Fehler beim Speichern der Reihenfolge: ' + error.message, 'error');
    await loadCategories();
  }
}

// Variable für aktuelle Kategorie-ID (Edit-Modus)
let currentCategoryId = null;

function showCategoryForm() {
  currentCategoryId = null;
  document.getElementById('category-form').style.display = 'block';

  // Formular-Titel aktualisieren
  const formTitle = document.querySelector('#category-form h2');
  if (formTitle) formTitle.textContent = '+ Neue Kategorie';

  // Submit-Button aktualisieren
  const submitBtn = document.querySelector('#categoryForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Kategorie erstellen';
}

function hideCategoryForm() {
  document.getElementById('category-form').style.display = 'none';
  document.getElementById('categoryForm').reset();
  currentCategoryId = null;
}

async function editCategory(id) {
  // Finde Kategorie im Cache oder lade neu
  let category = categoriesCache.find((c) => c.id === id);

  if (!category) {
    try {
      const response = await apiRequest(`/categories/${id}`);
      category = response?.data;
    } catch (error) {
      showNotification('Fehler beim Laden der Kategorie: ' + error.message, 'error');
      return;
    }
  }

  if (!category) return;

  currentCategoryId = id;
  document.getElementById('category-form').style.display = 'block';

  // Formular-Titel aktualisieren
  const formTitle = document.querySelector('#category-form h2');
  if (formTitle) formTitle.textContent = '✎ Kategorie bearbeiten';

  // Submit-Button aktualisieren
  const submitBtn = document.querySelector('#categoryForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Kategorie speichern';

  // Formularfelder füllen
  document.getElementById('category-name').value = category.name || '';
  document.getElementById('category-color').value = category.color || '#4caf50';
  document.getElementById('category-icon').value = category.icon || '■';

  const descField = document.getElementById('category-description');
  if (descField) descField.value = category.description || '';
}

async function deleteCategory(id) {
  if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;

  try {
    await apiRequest(`/categories/${id}`, { method: 'DELETE' });
    await loadCategories();
    await updateDashboardStats();
    showNotification('Kategorie erfolgreich gelöscht!', 'success');
  } catch (error) {
    showNotification('Fehler beim Löschen: ' + error.message, 'error');
  }
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const categoryData = {
    name: formData.get('name'),
    color: formData.get('color'),
    icon: formData.get('icon') || '■',
    description: formData.get('description') || '',
  };

  try {
    if (currentCategoryId) {
      // Update
      await apiRequest(`/categories/${currentCategoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });
      showNotification('Kategorie erfolgreich aktualisiert!', 'success');
    } else {
      // Create
      await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });
      showNotification('Kategorie erfolgreich erstellt!', 'success');
    }

    hideCategoryForm();
    await loadCategories();
    await updateDashboardStats();
  } catch (error) {
    showNotification('Fehler beim Speichern: ' + error.message, 'error');
  }
}

// ============================================
// Display Management
// ============================================
let displaysCache = [];
let currentDisplayId = null;

async function loadDisplays() {
  const displaysList = document.getElementById('displays-list');
  displaysList.innerHTML = '<p style="text-align:center; color: #6c757d;">Lade Displays...</p>';

  try {
    const response = await apiRequest('/displays');
    displaysCache = response?.data || [];

    if (displaysCache.length === 0) {
      displaysList.innerHTML =
        '<p style="text-align:center; color: #6c757d;">Noch keine Displays registriert. Erstellen Sie das erste Display!</p>';
      return;
    }

    displaysList.innerHTML = displaysCache
      .map(
        (display) => `
        <div class="list-item" data-display-id="${display.id}">
            <div class="list-item-content clickable" data-action="edit-display" data-display-id="${display.id}" title="Klicken zum Bearbeiten">
                <h3>${escapeHtml(display.name)} ${display.isActive ? '<span style="color: #28a745;">●</span>' : '<span style="color: #6c757d;">○</span>'}</h3>
                <p style="color: #6c757d; font-family: monospace; font-size: 0.9em;">🔗 ${escapeHtml(display.identifier)}</p>
                ${display.description ? `<p style="color: #6c757d; margin-top: 0.5rem;">${escapeHtml(display.description)}</p>` : ''}
                <p style="color: #007bff; font-size: 0.85em; margin-top: 0.5rem;">
                  📺 Display-URL: <code>/public/display.html?id=${escapeHtml(display.identifier)}</code>
                </p>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-secondary btn-sm" onclick="window.open('/public/display.html?id=${escapeHtml(display.identifier)}', '_blank')" title="Display öffnen">
                  ▷ Öffnen
                </button>
                <button class="btn btn-secondary" data-action="edit-display" data-display-id="${display.id}">Bearbeiten</button>
                <button class="btn btn-danger" data-action="delete-display" data-display-id="${display.id}">Löschen</button>
            </div>
        </div>
      `
      )
      .join('');
  } catch (error) {
    displaysList.innerHTML = `<p style="text-align:center; color: #dc3545;">Fehler beim Laden: ${error.message}</p>`;
  }
}

function showDisplayForm() {
  currentDisplayId = null;
  document.getElementById('display-form').style.display = 'block';

  // Formular-Titel aktualisieren
  const formTitle = document.querySelector('#display-form h2');
  if (formTitle) formTitle.textContent = '+ Neues Display';

  // Submit-Button aktualisieren
  const submitBtn = document.querySelector('#displayForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Display erstellen';
}

function hideDisplayForm() {
  document.getElementById('display-form').style.display = 'none';
  document.getElementById('displayForm').reset();
  currentDisplayId = null;
}

async function editDisplay(id) {
  // Finde Display im Cache
  const display = displaysCache.find((d) => d.id === parseInt(id));
  if (!display) {
    showNotification('Display nicht gefunden', 'error');
    return;
  }

  currentDisplayId = id;

  // Formular anzeigen
  document.getElementById('display-form').style.display = 'block';

  // Formular-Titel aktualisieren
  const formTitle = document.querySelector('#display-form h2');
  if (formTitle) formTitle.textContent = 'Display bearbeiten';

  // Submit-Button aktualisieren
  const submitBtn = document.querySelector('#displayForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Änderungen speichern';

  // Formular-Felder füllen
  document.getElementById('display-name').value = display.name || '';
  document.getElementById('display-identifier').value = display.identifier || '';
  document.getElementById('display-description').value = display.description || '';
  document.getElementById('display-isActive').checked = display.isActive !== false;

  // Scrolle zum Formular
  document.getElementById('display-form').scrollIntoView({ behavior: 'smooth' });
}

async function deleteDisplay(id) {
  if (!confirm('Display wirklich löschen? Zugewiesene Beiträge werden nicht gelöscht.')) {
    return;
  }

  try {
    await apiRequest(`/displays/${id}`, { method: 'DELETE' });
    await loadDisplays();
    await updateDashboardStats();
    showNotification('Display erfolgreich gelöscht!', 'success');
  } catch (error) {
    showNotification('Fehler beim Löschen: ' + error.message, 'error');
  }
}

async function handleDisplayFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const displayData = {
    name: formData.get('name'),
    identifier: formData.get('identifier'),
    description: formData.get('description') || '',
    isActive: document.getElementById('display-isActive').checked,
  };

  try {
    if (currentDisplayId) {
      // Update
      await apiRequest(`/displays/${currentDisplayId}`, {
        method: 'PUT',
        body: JSON.stringify(displayData),
      });
      showNotification('Display erfolgreich aktualisiert!', 'success');
    } else {
      // Create
      await apiRequest('/displays', {
        method: 'POST',
        body: JSON.stringify(displayData),
      });
      showNotification('Display erfolgreich erstellt!', 'success');
    }

    hideDisplayForm();
    await loadDisplays();
    await updateDashboardStats();
  } catch (error) {
    showNotification('Fehler beim Speichern: ' + error.message, 'error');
  }
}

// ============================================
// Utilities
// ============================================
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

function showNotification(message, type = 'info') {
  // Einfache Alert-Variante - kann später durch Toast ersetzt werden
  if (type === 'error') {
    alert('✕ ' + message);
  } else if (type === 'success') {
    alert('✓ ' + message);
  } else {
    alert(message);
  }
}

// ============================================
// Footer Clock
// ============================================
function updateFooterClock() {
  const clockElement = document.getElementById('footer-clock');
  const dateElement = document.getElementById('footer-date');

  if (!clockElement) return;

  const now = new Date();

  // Uhrzeit formatieren (HH:MM:SS)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  clockElement.textContent = `${hours}:${minutes}:${seconds}`;

  // Datum formatieren (Wochentag, DD. Monat YYYY)
  if (dateElement) {
    const weekdays = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    const months = [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ];
    const weekday = weekdays[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    dateElement.textContent = `${weekday}, ${day}. ${month} ${year}`;
  }
}

function startFooterClock() {
  updateFooterClock();
  setInterval(updateFooterClock, 1000);
}

// ============================================
// Users Management (API)
// ============================================
let usersCache = [];
let currentUserId = null;

async function loadUsers() {
  const usersList = document.getElementById('users-list');
  if (!usersList) return;

  usersList.innerHTML = '<p style="text-align:center; color: #6c757d;">Lade Benutzer...</p>';

  try {
    const response = await apiRequest('/users');
    usersCache = response?.data || [];
    renderUsers();
  } catch (error) {
    usersList.innerHTML = `<p style="color: #dc3545;">Fehler beim Laden: ${escapeHtml(error.message)}</p>`;
  }
}

function renderUsers() {
  const usersList = document.getElementById('users-list');
  if (!usersList || usersCache.length === 0) {
    if (usersList) {
      usersList.innerHTML =
        '<p style="text-align:center; color: #6c757d;">Keine Benutzer vorhanden</p>';
    }
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    editor: 'Editor',
    viewer: 'Betrachter',
    display: 'Display',
  };

  const html = usersCache
    .map((user) => {
      // Prüfe Berechtigungen für Aktionen
      const canEdit = canEditUser(currentUser, user);
      const canDelete = canDeleteUser(currentUser, user);
      const canToggle = canToggleUser(currentUser, user);
      const canResetPassword = canResetUserPassword(currentUser, user);

      return `
    <div class="user-item" data-user-id="${user.id}">
      <div class="user-info-block ${canEdit ? 'clickable' : ''}" ${canEdit ? `data-action="edit" data-user-id="${user.id}" title="Klicken zum Bearbeiten"` : ''}>
        <div class="user-avatar">
          ${user.firstName?.charAt(0) || '?'}${user.lastName?.charAt(0) || ''}
        </div>
        <div class="user-details">
          <strong>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</strong>
          <small>${escapeHtml(user.email)}</small>
        </div>
      </div>
      <div class="user-meta">
        <span class="user-role role-${user.role}">${roleLabels[user.role] || user.role}</span>
        <span class="user-status ${user.isActive ? 'status-active' : 'status-inactive'}">
          ${user.isActive ? '✓ Aktiv' : '✗ Inaktiv'}
        </span>
      </div>
      <div class="user-actions">
        ${
          canEdit
            ? `
        <button class="btn btn-secondary btn-sm" data-action="edit" data-user-id="${user.id}">
          ✎ Bearbeiten
        </button>
        `
            : ''
        }
        ${
          canResetPassword
            ? `
        <button class="btn btn-secondary btn-sm" data-action="reset-password" data-user-id="${user.id}">
          ▷ Passwort
        </button>
        `
            : ''
        }
        ${
          canToggle
            ? `
        <button class="btn btn-secondary btn-sm" data-action="toggle" data-user-id="${user.id}">
          ${user.isActive ? '○ Deaktivieren' : '● Aktivieren'}
        </button>
        `
            : ''
        }
        ${
          canDelete
            ? `
        <button class="btn btn-danger btn-sm" data-action="delete" data-user-id="${user.id}">
          ✕ Löschen
        </button>
        `
            : ''
        }
      </div>
    </div>
  `;
    })
    .join('');

  usersList.innerHTML = html;
}

/**
 * Berechtigungsprüfungen für Benutzeraktionen
 */
function canEditUser(currentUser, targetUser) {
  if (currentUser.role === 'super_admin') return true;
  if (currentUser.role === 'admin') {
    // Admin kann sich selbst und untergeordnete Rollen bearbeiten
    return (
      targetUser.id === currentUser.id || ['editor', 'viewer', 'display'].includes(targetUser.role)
    );
  }
  // Editors können nur sich selbst bearbeiten (aber nicht über diese UI)
  return false;
}

function canDeleteUser(currentUser, targetUser) {
  if (currentUser.id === targetUser.id) return false; // Niemand kann sich selbst löschen
  if (currentUser.role === 'super_admin') return true;
  if (currentUser.role === 'admin') {
    // Admin kann nur untergeordnete Rollen löschen
    return ['editor', 'viewer', 'display'].includes(targetUser.role);
  }
  return false;
}

function canToggleUser(currentUser, targetUser) {
  if (currentUser.id === targetUser.id) return false; // Niemand kann sich selbst deaktivieren
  if (currentUser.role === 'super_admin') return true;
  if (currentUser.role === 'admin') {
    // Admin kann nur untergeordnete Rollen aktivieren/deaktivieren
    return ['editor', 'viewer', 'display'].includes(targetUser.role);
  }
  return false;
}

function canResetUserPassword(currentUser, targetUser) {
  if (currentUser.role === 'super_admin') return true;
  if (currentUser.role === 'admin') {
    // Admin kann sein eigenes und untergeordnete Passwörter zurücksetzen
    return (
      targetUser.id === currentUser.id || ['editor', 'viewer', 'display'].includes(targetUser.role)
    );
  }
  return false;
}

function showUserForm() {
  const form = document.getElementById('user-form');
  if (form) {
    form.style.display = 'block';
    document.getElementById('userForm').reset();
    document.getElementById('user-password').required = true;
    currentUserId = null;

    // Rollenauswahl basierend auf aktueller Benutzerrolle anpassen
    updateRoleOptions();
  }
}

/**
 * Aktualisiert die Rollenauswahl basierend auf der Rolle des aktuellen Benutzers
 */
function updateRoleOptions() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const roleSelect = document.getElementById('user-role');
  if (!roleSelect) return;

  const allRoles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Administrator' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Betrachter' },
    { value: 'display', label: 'Display' },
  ];

  // Erlaubte Rollen je nach aktuellem Benutzer
  let allowedRoles = [];
  switch (currentUser.role) {
    case 'super_admin':
      allowedRoles = ['super_admin', 'admin', 'editor', 'viewer', 'display'];
      break;
    case 'admin':
      // Admin kann KEINE Admins oder Super-Admins erstellen
      allowedRoles = ['editor', 'viewer', 'display'];
      break;
    default:
      allowedRoles = [];
  }

  // Optionen neu aufbauen
  roleSelect.innerHTML = allRoles
    .filter((role) => allowedRoles.includes(role.value))
    .map((role) => `<option value="${role.value}">${role.label}</option>`)
    .join('');
}

function hideUserForm() {
  const form = document.getElementById('user-form');
  if (form) {
    form.style.display = 'none';
    document.getElementById('userForm').reset();
    currentUserId = null;
  }
}

async function editUser(userId) {
  const user = usersCache.find((u) => u.id === userId);
  if (!user) return;

  currentUserId = userId;

  // Rollenauswahl aktualisieren
  updateRoleOptions();

  document.getElementById('user-firstName').value = user.firstName || '';
  document.getElementById('user-lastName').value = user.lastName || '';
  document.getElementById('user-email').value = user.email || '';
  document.getElementById('user-role').value = user.role || 'viewer';
  document.getElementById('user-isActive').value = user.isActive ? 'true' : 'false';
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = false; // Nicht erforderlich bei Bearbeitung

  document.getElementById('user-form').style.display = 'block';
}

async function handleUserFormSubmit(e) {
  e.preventDefault();

  // Fehlermeldungen zurücksetzen
  Validator.clearErrors('userForm');

  const formData = new FormData(e.target);
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const password = formData.get('password');

  // Validierung
  const errors = Validator.validateForm({
    'user-firstName': [
      () => Validator.required(firstName, 'Vorname'),
      () => Validator.maxLength(firstName, 50, 'Vorname'),
    ],
    'user-lastName': [
      () => Validator.required(lastName, 'Nachname'),
      () => Validator.maxLength(lastName, 50, 'Nachname'),
    ],
    'user-email': [() => Validator.required(email, 'E-Mail'), () => Validator.email(email)],
    'user-password': [
      () => (!currentUserId && !password ? 'Passwort ist erforderlich' : null),
      () => (password && password.length < 6 ? 'Passwort muss mindestens 6 Zeichen haben' : null),
    ],
  });

  if (errors.length > 0) {
    errors.forEach(({ field, error }) => Validator.showFieldError(field, error));
    showNotification('Bitte korrigieren Sie die markierten Felder', 'error');
    return;
  }

  const userData = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    role: formData.get('role'),
    isActive: formData.get('isActive') === 'true',
  };

  // Passwort nur senden, wenn ausgefüllt
  if (password && password.length >= 6) {
    userData.password = password;
  }

  try {
    if (currentUserId) {
      // Update
      await apiRequest(`/users/${currentUserId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      showNotification('Benutzer erfolgreich aktualisiert!', 'success');
    } else {
      // Create
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      showNotification('Benutzer erfolgreich erstellt!', 'success');
    }

    hideUserForm();
    await loadUsers();
  } catch (error) {
    showNotification('Fehler beim Speichern: ' + error.message, 'error');
  }
}

async function deleteUser(userId) {
  const user = usersCache.find((u) => u.id === userId);
  if (!user) return;

  if (!confirm(`Möchten Sie den Benutzer "${user.firstName} ${user.lastName}" wirklich löschen?`)) {
    return;
  }

  try {
    await apiRequest(`/users/${userId}`, { method: 'DELETE' });
    await loadUsers();
    showNotification('Benutzer erfolgreich gelöscht!', 'success');
  } catch (error) {
    showNotification('Fehler beim Löschen: ' + error.message, 'error');
  }
}

async function toggleUserActive(userId) {
  try {
    await apiRequest(`/users/${userId}/toggle-active`, { method: 'PATCH' });
    await loadUsers();
    showNotification('Benutzerstatus geändert!', 'success');
  } catch (error) {
    showNotification('Fehler: ' + error.message, 'error');
  }
}

/**
 * Passwort eines Benutzers zurücksetzen (Admin-Funktion)
 */
async function resetUserPassword(userId) {
  const user = usersCache.find((u) => u.id === userId);
  if (!user) return;

  const newPassword = prompt(
    `Neues Passwort für ${user.firstName} ${user.lastName} eingeben (min. 6 Zeichen):`
  );
  if (!newPassword) return;

  if (newPassword.length < 6) {
    showNotification('Passwort muss mindestens 6 Zeichen haben', 'error');
    return;
  }

  try {
    await apiRequest(`/users/${userId}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
    showNotification('Passwort erfolgreich zurückgesetzt!', 'success');
  } catch (error) {
    showNotification('Fehler beim Zurücksetzen: ' + error.message, 'error');
  }
}

/**
 * Modal für eigenes Passwort ändern
 */
function showPasswordModal() {
  const modal = document.getElementById('password-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('changePasswordForm').reset();
  }
}

function hidePasswordModal() {
  const modal = document.getElementById('password-modal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('changePasswordForm').reset();
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    showNotification('Die Passwörter stimmen nicht überein', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showNotification('Neues Passwort muss mindestens 6 Zeichen haben', 'error');
    return;
  }

  try {
    await apiRequest('/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    hidePasswordModal();
    showNotification('Passwort erfolgreich geändert!', 'success');
  } catch (error) {
    showNotification('Fehler: ' + error.message, 'error');
  }
}

// ============================================
// SSO Configuration Management (nur Super-Admin)
// ============================================
let ssoConfigLoaded = false;

/**
 * Prüft ob der aktuelle Benutzer ein Super-Admin ist und zeigt SSO-Einstellungen
 */
async function initSSOSettings() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const ssoSection = document.getElementById('sso-settings-section');

  if (!ssoSection) return;

  // Nur Super-Admin sieht SSO-Einstellungen
  if (user.role !== 'super_admin') {
    ssoSection.style.display = 'none';
    return;
  }

  ssoSection.style.display = 'block';

  // Event Listeners für SSO-Formulare
  const ssoEnabledCheckbox = document.getElementById('sso-enabled');
  const ssoProviderSelect = document.getElementById('sso-provider');
  const ssoConfigForm = document.getElementById('sso-config-form');
  const ssoTestBtn = document.getElementById('sso-test-btn');

  if (ssoEnabledCheckbox) {
    ssoEnabledCheckbox.addEventListener('change', toggleSSOConfigDetails);
  }

  if (ssoProviderSelect) {
    ssoProviderSelect.addEventListener('change', toggleSSOProviderConfig);
  }

  if (ssoConfigForm) {
    ssoConfigForm.addEventListener('submit', handleSSOConfigSubmit);
  }

  if (ssoTestBtn) {
    ssoTestBtn.addEventListener('click', testSSOConnection);
  }

  // Lade aktuelle SSO-Konfiguration
  await loadSSOConfiguration();
}

/**
 * Zeigt/versteckt SSO-Konfigurationsdetails basierend auf Checkbox
 */
function toggleSSOConfigDetails() {
  const enabled = document.getElementById('sso-enabled').checked;
  const details = document.getElementById('sso-config-details');

  if (details) {
    details.style.display = enabled ? 'block' : 'none';
    if (enabled) {
      toggleSSOProviderConfig();
    }
  }
}

/**
 * Zeigt die Provider-spezifische Konfiguration basierend auf Auswahl
 */
function toggleSSOProviderConfig() {
  const provider = document.getElementById('sso-provider').value;
  const azureConfig = document.getElementById('azure-ad-config');
  const ldapConfig = document.getElementById('ldap-config');

  // Verstecke alle Provider-Configs
  if (azureConfig) azureConfig.style.display = 'none';
  if (ldapConfig) ldapConfig.style.display = 'none';

  // Zeige die ausgewählte
  if (provider === 'azure_ad' && azureConfig) {
    azureConfig.style.display = 'block';
  } else if (provider === 'ldap' && ldapConfig) {
    ldapConfig.style.display = 'block';
  }
}

/**
 * Lädt die aktuelle SSO-Konfiguration vom Server
 */
async function loadSSOConfiguration() {
  try {
    const response = await apiRequest('/auth/sso/config');

    if (!response?.data) {
      updateSSOStatusBanner('error', 'Konfiguration konnte nicht geladen werden');
      return;
    }

    const config = response.data;
    ssoConfigLoaded = true;

    // Fülle Formularfelder
    document.getElementById('sso-enabled').checked = config.enabled;
    document.getElementById('sso-provider').value = config.provider || 'azure_ad';
    document.getElementById('sso-auto-create').checked = config.autoCreateUsers !== false;
    document.getElementById('sso-default-role').value = config.defaultRole || 'editor';
    document.getElementById('sso-allowed-domains').value = Array.isArray(config.allowedDomains)
      ? config.allowedDomains.join(', ')
      : config.allowedDomains || '';

    // Azure AD Felder
    if (config.azureAD) {
      document.getElementById('azure-tenant-id').value = config.azureAD.tenantId || '';
      document.getElementById('azure-client-id').value = config.azureAD.clientId || '';
      // Client Secret wird nicht zurückgegeben (Sicherheit)
      document.getElementById('azure-client-secret').placeholder = config.azureAD.clientSecret
        ? '••••••••'
        : 'Geheimnis eingeben...';
      document.getElementById('azure-redirect-uri').value =
        config.azureAD.redirectUri || 'http://localhost:3000/api/auth/sso/callback';
      document.getElementById('azure-logout-uri').value =
        config.azureAD.postLogoutRedirectUri || 'http://localhost:3000/admin';
    }

    // LDAP Felder
    if (config.ldap) {
      const ldapUrl = document.getElementById('ldap-url');
      const ldapBaseDN = document.getElementById('ldap-base-dn');
      const ldapBindDN = document.getElementById('ldap-bind-dn');
      const ldapBindPassword = document.getElementById('ldap-bind-password');
      const ldapUserSearchBase = document.getElementById('ldap-user-search-base');
      const ldapUserSearchFilter = document.getElementById('ldap-user-search-filter');
      const ldapAdminGroup = document.getElementById('ldap-admin-group');
      const ldapEditorGroup = document.getElementById('ldap-editor-group');
      const ldapTlsReject = document.getElementById('ldap-tls-reject');

      if (ldapUrl) ldapUrl.value = config.ldap.url || '';
      if (ldapBaseDN) ldapBaseDN.value = config.ldap.baseDN || '';
      if (ldapBindDN) ldapBindDN.value = config.ldap.bindDN || '';
      if (ldapBindPassword)
        ldapBindPassword.placeholder = config.ldap.bindPassword
          ? '••••••••'
          : 'Passwort eingeben...';
      if (ldapUserSearchBase) ldapUserSearchBase.value = config.ldap.userSearchBase || '';
      if (ldapUserSearchFilter)
        ldapUserSearchFilter.value =
          config.ldap.userSearchFilter || '(sAMAccountName={{username}})';
      if (ldapAdminGroup) ldapAdminGroup.value = config.ldap.adminGroup || '';
      if (ldapEditorGroup) ldapEditorGroup.value = config.ldap.editorGroup || '';
      if (ldapTlsReject)
        ldapTlsReject.checked = config.ldap.tlsOptions?.rejectUnauthorized !== false;
    }

    // Zeige Config-Details wenn aktiviert
    toggleSSOConfigDetails();

    // Provider-spezifische Config anzeigen
    toggleSSOProviderConfig();

    // Status-Banner aktualisieren
    if (config.enabled) {
      const providerName = config.provider === 'ldap' ? 'LDAP/Active Directory' : 'Azure AD';
      if (config.validation?.valid) {
        updateSSOStatusBanner(
          'success',
          `SSO (${providerName}) ist aktiviert und korrekt konfiguriert`
        );
      } else {
        updateSSOStatusBanner(
          'warning',
          `SSO (${providerName}) ist aktiviert, aber unvollständig konfiguriert: ` +
            (config.validation?.errors?.join(', ') || 'Unbekannter Fehler')
        );
      }
    } else {
      updateSSOStatusBanner('info', 'SSO ist deaktiviert');
    }
  } catch (error) {
    console.error('SSO Konfiguration laden fehlgeschlagen:', error);
    updateSSOStatusBanner('error', 'Fehler beim Laden: ' + error.message);
  }
}

/**
 * Aktualisiert das SSO Status-Banner
 */
function updateSSOStatusBanner(status, message) {
  const banner = document.getElementById('sso-status-banner');
  if (!banner) return;

  const indicator = banner.querySelector('.sso-status-indicator');
  const text = banner.querySelector('.sso-status-text');

  // Entferne alle Status-Klassen
  banner.className = 'sso-status-banner sso-status-' + status;

  if (indicator) {
    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ',
    };
    indicator.textContent = icons[status] || 'ℹ';
  }

  if (text) {
    text.textContent = message;
  }
}

/**
 * Speichert die SSO-Konfiguration
 */
async function handleSSOConfigSubmit(e) {
  e.preventDefault();

  const saveBtn = document.getElementById('sso-save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = '⏳ Speichern...';
  saveBtn.disabled = true;

  try {
    const provider = document.getElementById('sso-provider').value;

    const configData = {
      enabled: document.getElementById('sso-enabled').checked,
      provider: provider,
      autoCreateUsers: document.getElementById('sso-auto-create').checked,
      defaultRole: document.getElementById('sso-default-role').value,
      allowedDomains: document
        .getElementById('sso-allowed-domains')
        .value.split(',')
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d),
    };

    // Azure AD Konfiguration
    if (provider === 'azure_ad') {
      configData.azureAD = {
        tenantId: document.getElementById('azure-tenant-id').value.trim(),
        clientId: document.getElementById('azure-client-id').value.trim(),
        clientSecret: document.getElementById('azure-client-secret').value.trim() || undefined,
        redirectUri: document.getElementById('azure-redirect-uri').value.trim(),
        postLogoutRedirectUri: document.getElementById('azure-logout-uri').value.trim(),
      };
    }

    // LDAP Konfiguration
    if (provider === 'ldap') {
      configData.ldap = {
        url: document.getElementById('ldap-url').value.trim(),
        baseDN: document.getElementById('ldap-base-dn').value.trim(),
        bindDN: document.getElementById('ldap-bind-dn').value.trim(),
        bindPassword: document.getElementById('ldap-bind-password').value.trim() || undefined,
        userSearchBase: document.getElementById('ldap-user-search-base').value.trim(),
        userSearchFilter:
          document.getElementById('ldap-user-search-filter').value.trim() ||
          '(sAMAccountName={{username}})',
        adminGroup: document.getElementById('ldap-admin-group').value.trim() || undefined,
        editorGroup: document.getElementById('ldap-editor-group').value.trim() || undefined,
        tlsOptions: {
          rejectUnauthorized: document.getElementById('ldap-tls-reject').checked,
        },
      };
    }

    const response = await apiRequest('/auth/sso/config', {
      method: 'PUT',
      body: JSON.stringify(configData),
    });

    if (response?.success) {
      showNotification('SSO-Konfiguration erfolgreich gespeichert!', 'success');

      // Lade Konfiguration neu
      await loadSSOConfiguration();

      // Hinweis auf Neustart wenn nötig
      if (response.data?.requiresRestart) {
        showNotification(
          'Hinweis: Für vollständige Aktivierung wird ein Server-Neustart empfohlen.',
          'info'
        );
      }
    } else {
      throw new Error(response?.error?.message || 'Unbekannter Fehler');
    }
  } catch (error) {
    showNotification('Fehler beim Speichern: ' + error.message, 'error');
  } finally {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

/**
 * Testet die SSO-Verbindung
 */
async function testSSOConnection() {
  const testBtn = document.getElementById('sso-test-btn');
  const resultDiv = document.getElementById('sso-test-result');
  const provider = document.getElementById('sso-provider').value;

  const originalText = testBtn.textContent;
  testBtn.textContent = '⏳ Teste...';
  testBtn.disabled = true;
  resultDiv.style.display = 'block';
  resultDiv.className = 'sso-test-result sso-test-pending';

  const providerName = provider === 'ldap' ? 'LDAP/Active Directory' : 'Azure AD';
  resultDiv.innerHTML = `<p>↻ Teste Verbindung zu ${providerName}...</p>`;

  try {
    const response = await apiRequest('/auth/sso/test', {
      method: 'POST',
    });

    if (!response?.data) {
      throw new Error('Keine Antwort vom Server');
    }

    const result = response.data;

    switch (result.status) {
      case 'ok':
        resultDiv.className = 'sso-test-result sso-test-success';
        if (provider === 'ldap') {
          resultDiv.innerHTML = `
            <p>✓ <strong>${result.message}</strong></p>
            <ul>
              <li>Server: ${result.details?.server || 'OK'}</li>
              <li>Base DN: ${result.details?.baseDN || 'OK'}</li>
              <li>Bind: Erfolgreich</li>
            </ul>
          `;
        } else {
          resultDiv.innerHTML = `
            <p>✓ <strong>${result.message}</strong></p>
            <ul>
              <li>Issuer: ${result.details?.issuer || 'OK'}</li>
              <li>Authorization Endpoint: ${result.details?.authorizationEndpoint || 'OK'}</li>
              <li>Token Endpoint: ${result.details?.tokenEndpoint || 'OK'}</li>
            </ul>
          `;
        }
        break;

      case 'disabled':
        resultDiv.className = 'sso-test-result sso-test-info';
        resultDiv.innerHTML = `<p>ℹ ${result.message}</p>`;
        break;

      case 'invalid_config':
        resultDiv.className = 'sso-test-result sso-test-warning';
        resultDiv.innerHTML = `
          <p>⚠ <strong>${result.message}</strong></p>
          <ul>
            ${result.errors?.map((e) => `<li>${e}</li>`).join('') || ''}
          </ul>
        `;
        break;

      case 'error':
      default:
        resultDiv.className = 'sso-test-result sso-test-error';
        resultDiv.innerHTML = `
          <p>✕ <strong>${result.message}</strong></p>
          ${result.error ? `<p>Details: ${result.error}</p>` : ''}
        `;
    }
  } catch (error) {
    resultDiv.className = 'sso-test-result sso-test-error';
    resultDiv.innerHTML = `<p>✕ Fehler beim Testen: ${error.message}</p>`;
  } finally {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
  }
}

// ============================================
// Initialization
// ============================================
window.addEventListener('load', async () => {
  if (!checkAuth()) return;

  // Logout Event Listener
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Navigation Event Listeners
  const navLinks = document.querySelectorAll('.sidebar-menu a:not(#logout)');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').substring(1);
      navigateTo(target);
    });
  });

  // Form Event Listeners
  const postForm = document.getElementById('postForm');
  if (postForm) {
    postForm.addEventListener('submit', handlePostFormSubmit);
  }
  
  // Media-URL Input: Zeige Offline-Download Option für externe Videos
  const mediaUrlInput = document.getElementById('media-url');
  if (mediaUrlInput) {
    mediaUrlInput.addEventListener('input', updateOfflineDownloadVisibility);
    mediaUrlInput.addEventListener('blur', updateOfflineDownloadVisibility);
  }

  const categoryForm = document.getElementById('categoryForm');
  if (categoryForm) {
    categoryForm.addEventListener('submit', handleCategoryFormSubmit);
  }

  const displayForm = document.getElementById('displayForm');
  if (displayForm) {
    displayForm.addEventListener('submit', handleDisplayFormSubmit);
  }

  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', handleUserFormSubmit);
  }

  // Button Event Listeners
  const quickNewPostBtn = document.getElementById('quickNewPostBtn');
  const showPostFormBtn = document.getElementById('showPostFormBtn');
  const hidePostFormBtn = document.getElementById('hidePostFormBtn');
  const showCategoryFormBtn = document.getElementById('showCategoryFormBtn');
  const hideCategoryFormBtn = document.getElementById('hideCategoryFormBtn');
  const showDisplayFormBtn = document.getElementById('showDisplayFormBtn');
  const hideDisplayFormBtn = document.getElementById('hideDisplayFormBtn');
  const showUserFormBtn = document.getElementById('showUserFormBtn');
  const hideUserFormBtn = document.getElementById('hideUserFormBtn');
  const openDisplayBtn = document.getElementById('openDisplayBtn');

  if (quickNewPostBtn) {
    quickNewPostBtn.addEventListener('click', () => navigateTo('posts'));
  }
  if (showPostFormBtn) {
    showPostFormBtn.addEventListener('click', showPostForm);
  }
  if (hidePostFormBtn) {
    hidePostFormBtn.addEventListener('click', hidePostForm);
  }

  // Display-Mode Radio-Buttons
  const displayModeAll = document.getElementById('display-mode-all');
  const displayModeSpecific = document.getElementById('display-mode-specific');
  const displaySelectionContainer = document.getElementById('display-selection-container');

  if (displayModeAll && displayModeSpecific && displaySelectionContainer) {
    displayModeAll.addEventListener('change', () => {
      if (displayModeAll.checked) {
        displaySelectionContainer.style.display = 'none';
      }
    });

    displayModeSpecific.addEventListener('change', async () => {
      if (displayModeSpecific.checked) {
        displaySelectionContainer.style.display = 'block';
        // Displays laden wenn noch nicht geschehen
        await loadDisplayCheckboxes();
      }
    });
  }

  if (showCategoryFormBtn) {
    showCategoryFormBtn.addEventListener('click', showCategoryForm);
  }
  if (hideCategoryFormBtn) {
    hideCategoryFormBtn.addEventListener('click', hideCategoryForm);
  }
  if (showDisplayFormBtn) {
    showDisplayFormBtn.addEventListener('click', showDisplayForm);
  }
  if (hideDisplayFormBtn) {
    hideDisplayFormBtn.addEventListener('click', hideDisplayForm);
  }
  if (showUserFormBtn) {
    showUserFormBtn.addEventListener('click', showUserForm);
  }
  if (hideUserFormBtn) {
    hideUserFormBtn.addEventListener('click', hideUserForm);
  }
  if (openDisplayBtn) {
    openDisplayBtn.addEventListener('click', () => {
      // Öffne Display lokal im Browser
      window.open('/public/display.html', '_blank');
    });
  }

  // Vortragsmodus Button - Öffnet Vortragsmodus im lokalen Browser
  const openPresentationBtn = document.getElementById('openPresentationBtn');
  if (openPresentationBtn) {
    openPresentationBtn.addEventListener('click', () => {
      // Öffne Display mit Vortragsmodus-Parameter in neuem Tab
      window.open('/public/display.html?mode=presentation', '_blank');
    });
  }

  // Hintergrundmusik-Steuerung initialisieren
  initBackgroundMusicControls();

  // Display-Einstellungen speichern
  const saveDisplaySettingsBtn = document.getElementById('saveDisplaySettings');
  if (saveDisplaySettingsBtn) {
    saveDisplaySettingsBtn.addEventListener('click', async () => {
      const refreshInterval = document.getElementById('refresh-interval');
      const defaultDuration = document.getElementById('default-duration');
      const blendEffectsEnabled = document.getElementById('blend-effects-enabled');
      const transitionsExternalOnly = document.getElementById('transitions-external-only');
      
      if (refreshInterval && defaultDuration && blendEffectsEnabled && transitionsExternalOnly) {
        const settingsArray = [
          { key: 'display.refreshInterval', value: parseInt(refreshInterval.value) || 5 },
          { key: 'display.defaultDuration', value: parseInt(defaultDuration.value) || 10 },
          { key: 'display.blendEffectsEnabled', value: blendEffectsEnabled.checked ? 'true' : 'false' },
          { key: 'display.transitionsExternalOnly', value: transitionsExternalOnly.checked ? 'true' : 'false' }
        ];
        
        console.log('💾 Speichere Display-Einstellungen (Array):', settingsArray);
        
        // Konvertiere zu normalem Objekt für API
        const settings = {};
        settingsArray.forEach(item => {
          settings[item.key] = item.value;
        });
        
        const requestBody = { settings };
        console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));
        
        try {
          const response = await fetch('/api/settings/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(requestBody)
          });

          console.log('📡 Response Status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Server-Fehler:', errorData);
            throw new Error('Fehler beim Speichern der Einstellungen');
          }

          const result = await response.json();
          console.log('✅ Erfolgreich gespeichert:', result);

          // Fallback zu localStorage für Kompatibilität
          localStorage.setItem('displaySettings', JSON.stringify({
            refreshInterval: parseInt(refreshInterval.value) || 5,
            defaultDuration: parseInt(defaultDuration.value) || 10,
            blendEffectsEnabled: blendEffectsEnabled.checked ? 'true' : 'false'
          }));

          showNotification('Display-Einstellungen gespeichert!', 'success');
        } catch (error) {
          console.error('❌ Fehler beim Speichern:', error);
          showNotification('Fehler beim Speichern der Einstellungen', 'error');
        }
      }
    });
  }

  // Display-Einstellungen laden
  const loadDisplaySettings = async () => {
    try {
      // Versuche von Backend zu laden
      const response = await fetch('/api/settings?category=display', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      let settings = {};

      if (response.ok) {
        const data = await response.json();
        settings = {
          refreshInterval: data['display.refreshInterval'],
          defaultDuration: data['display.defaultDuration'],
          blendEffectsEnabled: data['display.blendEffectsEnabled'],
          transitionsExternalOnly: data['display.transitionsExternalOnly']
        };
      } else {
        // Fallback zu localStorage
        const savedDisplaySettings = localStorage.getItem('displaySettings');
        if (savedDisplaySettings) {
          settings = JSON.parse(savedDisplaySettings);
        }
      }

      // Werte in UI setzen
      const refreshInterval = document.getElementById('refresh-interval');
      const defaultDuration = document.getElementById('default-duration');
      const blendEffectsEnabled = document.getElementById('blend-effects-enabled');
      const transitionsExternalOnly = document.getElementById('transitions-external-only');
      
      if (refreshInterval && settings.refreshInterval) {
        refreshInterval.value = settings.refreshInterval;
      }
      if (defaultDuration && settings.defaultDuration) {
        defaultDuration.value = settings.defaultDuration;
      }
      if (blendEffectsEnabled && settings.blendEffectsEnabled !== undefined) {
        blendEffectsEnabled.checked = (settings.blendEffectsEnabled === 'true' || settings.blendEffectsEnabled === true);
      }
      if (transitionsExternalOnly && settings.transitionsExternalOnly !== undefined) {
        transitionsExternalOnly.checked = (settings.transitionsExternalOnly === 'true' || settings.transitionsExternalOnly === true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Display-Einstellungen:', error);
      
      // Fallback zu localStorage bei Fehler
      try {
        const savedDisplaySettings = localStorage.getItem('displaySettings');
        if (savedDisplaySettings) {
          const settings = JSON.parse(savedDisplaySettings);
          const refreshInterval = document.getElementById('refresh-interval');
          const defaultDuration = document.getElementById('default-duration');
          const blendEffectsEnabled = document.getElementById('blend-effects-enabled');
          const transitionsExternalOnly = document.getElementById('transitions-external-only');
          
          if (refreshInterval && settings.refreshInterval) {
            refreshInterval.value = settings.refreshInterval;
          }
          if (defaultDuration && settings.defaultDuration) {
            defaultDuration.value = settings.defaultDuration;
          }
          if (blendEffectsEnabled && settings.blendEffectsEnabled !== undefined) {
            blendEffectsEnabled.checked = (settings.blendEffectsEnabled === 'true' || settings.blendEffectsEnabled === true);
          }
          if (transitionsExternalOnly && settings.transitionsExternalOnly !== undefined) {
            transitionsExternalOnly.checked = (settings.transitionsExternalOnly === 'true' || settings.transitionsExternalOnly === true);
          }
        }
      } catch (fallbackError) {
        console.error('Fehler beim Fallback-Laden:', fallbackError);
      }
    }
  };

  loadDisplaySettings();

  // System Mode Settings laden
  if (document.getElementById('mode-normal') || document.getElementById('mode-hotspot')) {
    loadSystemMode();
  }

  // Passwort ändern Modal
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordChange = document.getElementById('cancelPasswordChange');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordModal = document.getElementById('password-modal');

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', showPasswordModal);
  }
  if (closePasswordModal) {
    closePasswordModal.addEventListener('click', hidePasswordModal);
  }
  if (cancelPasswordChange) {
    cancelPasswordChange.addEventListener('click', hidePasswordModal);
  }
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
  }
  // Schließen bei Klick außerhalb des Modals
  if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        hidePasswordModal();
      }
    });
  }

  // Event Delegation für Posts
  const postsList = document.getElementById('posts-list');
  if (postsList) {
    postsList.addEventListener('click', (e) => {
      // Klick auf Button oder klickbaren Bereich
      const actionElement = e.target.closest('[data-action]');
      if (!actionElement) return;

      // Ignoriere Klicks auf drag-handle
      if (e.target.closest('.drag-handle')) return;

      const action = actionElement.dataset.action;
      const postId = parseInt(actionElement.dataset.postId);

      if (action === 'edit' && postId) {
        editPost(postId);
      } else if (action === 'delete' && postId) {
        deletePost(postId);
      }
    });
  }

  // Event Delegation für Kategorien
  const categoriesList = document.getElementById('categories-list');
  if (categoriesList) {
    categoriesList.addEventListener('click', (e) => {
      // Klick auf Button oder klickbaren Bereich
      const actionElement = e.target.closest('[data-action]');
      if (!actionElement) return;

      // Ignoriere Klicks auf drag-handle
      if (e.target.closest('.drag-handle')) return;

      const action = actionElement.dataset.action;
      const categoryId = parseInt(actionElement.dataset.categoryId);

      if (action === 'edit-category' && categoryId) {
        editCategory(categoryId);
      } else if (action === 'delete' && categoryId) {
        deleteCategory(categoryId);
      }
    });
  }

  // Event Delegation für Displays
  const displaysList = document.getElementById('displays-list');
  if (displaysList) {
    displaysList.addEventListener('click', (e) => {
      const actionElement = e.target.closest('[data-action]');
      if (!actionElement) return;

      const action = actionElement.dataset.action;
      const displayId = parseInt(actionElement.dataset.displayId);

      if (action === 'edit-display' && displayId) {
        editDisplay(displayId);
      } else if (action === 'delete-display' && displayId) {
        deleteDisplay(displayId);
      }
    });
  }

  // Event Delegation für Benutzer
  const usersList = document.getElementById('users-list');
  if (usersList) {
    usersList.addEventListener('click', (e) => {
      // Klick auf Button oder klickbaren Bereich (user-info-block)
      const actionElement = e.target.closest('[data-action]');
      if (!actionElement) return;

      const action = actionElement.dataset.action;
      const userId = parseInt(actionElement.dataset.userId);

      if (action === 'edit' && userId) {
        editUser(userId);
      } else if (action === 'delete' && userId) {
        deleteUser(userId);
      } else if (action === 'toggle' && userId) {
        toggleUserActive(userId);
      } else if (action === 'reset-password' && userId) {
        resetUserPassword(userId);
      }
    });
  }

  // Initial laden - Posts und Categories werden einmal geladen und für Stats wiederverwendet
  startFooterClock();
  await loadPosts();
  await loadCategories();
  await loadDisplays();
  await updateDashboardStats();

  // Dashboard Statistik-Karten klickbar machen
  document.querySelectorAll('.stat-card.clickable').forEach((card) => {
    card.addEventListener('click', () => {
      const targetSection = card.dataset.target;
      if (targetSection) {
        showSection(targetSection.replace('-section', ''));
      }
    });
  });

  // SSO-Einstellungen initialisieren (nur für Super-Admin)
  await initSSOSettings();

  // App-Info laden
  await loadAppInfo();

  // Sprache initialisieren
  initLanguage();

  // Sprach-Auswahl Event-Listener
  const langSelect = document.getElementById('app-language');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      changeLanguage(e.target.value);
    });
  }
});

/**
 * Lädt App-Informationen (Version, etc.) vom Server
 */
async function loadAppInfo() {
  try {
    const response = await fetch('/api/public/info');
    const result = await response.json();

    if (result.success && result.data) {
      const versionEl = document.getElementById('app-version');
      const buildDateEl = document.getElementById('app-build-date');

      if (versionEl) {
        versionEl.textContent = result.data.version || '1.0.0';
      }
      if (buildDateEl) {
        buildDateEl.textContent = result.data.buildYear || new Date().getFullYear();
      }
    }
  } catch (error) {
    console.log('App-Info konnte nicht geladen werden:', error);
  }
}

// Delete All Posts Handler
document.getElementById('deleteAllPostsBtn')?.addEventListener('click', async () => {
  if (!confirm('⚠️ ACHTUNG: Möchten Sie wirklich ALLE Beiträge unwiderruflich löschen?')) {
    return;
  }
  
  if (!confirm('🚨 Letzte Warnung: Diese Aktion kann nicht rückgängig gemacht werden!')) {
    return;
  }

  try {
    const response = await apiRequest('/posts', {
      method: 'DELETE'
    });

    if (response.success) {
      showNotification(`✅ ${response.deletedCount} Beiträge wurden gelöscht`, 'success');
      await loadPosts();
    }
  } catch (error) {
    console.error('Fehler beim Löschen aller Posts:', error);
    showNotification('❌ Fehler beim Löschen der Beiträge', 'error');
  }
});

// Download External Videos Handler
document.getElementById('downloadExternalVideosBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('downloadExternalVideosBtn');
  if (!btn) return;

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Videos werden heruntergeladen...';

  try {
    const response = await apiRequest('/media/download-external', {
      method: 'POST'
    });

    if (response.success) {
      const stats = response.stats || {};
      const message = `✅ Download abgeschlossen!\n` +
        `Downloads: ${stats.downloaded || 0}\n` +
        `Aktualisiert: ${stats.updated || 0}\n` +
        `Übersprungen: ${stats.skipped || 0}\n` +
        `Fehlgeschlagen: ${stats.failed || 0}`;
      showNotification(message, 'success');
      await loadPosts(); // Refresh post list to show updated media
    }
  } catch (error) {
    console.error('Fehler beim Download externer Videos:', error);
    showNotification('❌ Fehler beim Download der Videos: ' + (error.message || 'Unbekannter Fehler'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ============================================
// System Mode Switcher (Raspberry Pi)
// ============================================

document.getElementById('switchSystemMode')?.addEventListener('click', async () => {
  const selectedMode = document.querySelector('input[name="system-mode"]:checked')?.value;
  
  if (!selectedMode) {
    showNotification('Bitte wählen Sie einen Modus aus', 'error');
    return;
  }

  const modeText = selectedMode === 'hotspot' ? 'Hotspot-Modus' : 'Normal-Modus';
  
  if (!confirm(`Wirklich zu ${modeText} wechseln?`)) {
    return;
  }

  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      showNotification('❌ Nicht angemeldet. Bitte melden Sie sich erneut an.', 'error');
      return;
    }

    console.log('Switching to mode:', selectedMode);
    console.log('Auth token available:', !!accessToken);
    
    // Try bulk API first, then fallback to PUT
    let updateResponse = await fetch('/api/settings/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        settings: {
          'system.networkMode': selectedMode
        }
      })
    });

    // If bulk API fails, try single PUT endpoint
    if (!updateResponse.ok && updateResponse.status === 401) {
      console.log('Bulk API failed with 401, trying PUT endpoint...');
      updateResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          key: 'system.networkMode',
          value: selectedMode,
          type: 'string',
          category: 'system',
          description: 'Netzwerk-Modus: normal oder hotspot'
        })
      });
    }

    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('Settings update successful:', result);
      showNotification(`✅ System-Modus auf "${modeText}" gesetzt`, 'success');
      await loadSystemMode(); // Status neu laden
      
      // Optional: Info über Neustart anzeigen
      if (selectedMode === 'hotspot') {
        showNotification('ℹ️ Hotspot-Modus aktiviert. Neustart empfohlen für vollständige Aktivierung.', 'info');
      }
    } else {
      let errorMessage = `HTTP ${updateResponse.status}`;
      try {
        const errorData = await updateResponse.json();
        errorMessage = errorData.message || errorData.error?.message || errorMessage;
        console.error('API Error:', errorData);
      } catch (e) {
        console.error('Failed to parse error response');
      }
      
      if (updateResponse.status === 401) {
        showNotification('❌ Sitzung abgelaufen. Bitte melden Sie sich erneut an.', 'error');
        // Clear potentially invalid token
        localStorage.removeItem('accessToken');
        setTimeout(() => window.location.href = '/admin/', 2000);
      } else if (updateResponse.status === 403) {
        showNotification('❌ Keine Berechtigung. Sie benötigen Admin-Rechte.', 'error');
      } else {
        showNotification(`❌ Fehler beim Speichern: ${errorMessage}`, 'error');
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Fehler beim Wechseln des Modus:', error);
    if (!error.message.includes('HTTP 401') && !error.message.includes('HTTP 403')) {
      showNotification('❌ Verbindungsfehler: ' + error.message, 'error');
    }
  }
});

// Download External Videos Handler
document.getElementById('downloadExternalVideosBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('downloadExternalVideosBtn');
  if (!btn) return;
  
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Videos werden heruntergeladen...';
  
  try {
    const response = await apiRequest('/media/download-external', {
      method: 'POST'
    });

    if (response.success) {
      const stats = response.stats || {};
      const message = `✅ Download abgeschlossen!\n` +
        `Downloads: ${stats.downloaded || 0}\n` +
        `Aktualisiert: ${stats.updated || 0}\n` +
        `Übersprungen: ${stats.skipped || 0}\n` +
        `Fehlgeschlagen: ${stats.failed || 0}`;
      showNotification(message, 'success');
      await loadPosts(); // Refresh post list to show updated media
    }
  } catch (error) {
    console.error('Fehler beim Download externer Videos:', error);
    showNotification('❌ Fehler beim Download der Videos: ' + (error.message || 'Unbekannter Fehler'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ============================================
// System Mode Settings
// ============================================

/**
 * Load current system mode from settings
 */
async function loadSystemMode() {
  const statusDiv = document.getElementById('system-mode-status');
  const statusTextEl = document.querySelector('#system-mode-status .mode-text');
  
  try {
    if (statusTextEl) {
      statusTextEl.textContent = 'Status wird geladen...';
    }
    
    const response = await apiRequest('/settings?category=system');
    
    // Response is directly the settings object, not wrapped
    if (response && typeof response === 'object') {
      const settings = response;
      
      // Set radio button for current mode
      const currentMode = settings['system.networkMode'] || 'normal';
      const normalRadio = document.getElementById('mode-normal');
      const hotspotRadio = document.getElementById('mode-hotspot');
      
      if (normalRadio && hotspotRadio) {
        normalRadio.checked = currentMode === 'normal';
        hotspotRadio.checked = currentMode === 'hotspot';
        
        // Update radio button styles
        updateModeRadioStyles();
        
        // Update status display
        const modeIcon = currentMode === 'hotspot' ? '📶' : '🌐';
        const modeText = currentMode === 'hotspot' ? 'Hotspot-Modus' : 'Normal-Modus';
        
        if (statusDiv) {
          statusDiv.innerHTML = `
            <div class="mode-indicator">
              <span class="mode-icon">${modeIcon}</span>
              <span class="mode-text">Aktuell: <strong>${modeText}</strong></span>
            </div>
          `;
        }
        
        // Show hotspot info if in hotspot mode
        const hotspotInfo = document.getElementById('hotspot-info');
        if (hotspotInfo) {
          hotspotInfo.style.display = currentMode === 'hotspot' ? 'block' : 'none';
        }
        
        // Update hotspot credentials display
        if (settings['system.hotspotSSID']) {
          const ssidEl = document.getElementById('hotspot-ssid');
          if (ssidEl) ssidEl.textContent = settings['system.hotspotSSID'];
        }
        if (settings['system.hotspotPassword']) {
          const pwdEl = document.getElementById('hotspot-password');
          if (pwdEl) pwdEl.textContent = '••••••••';
        }
      }
    } else {
      console.warn('[System Mode] Unexpected response format:', response);
      if (statusTextEl) {
        statusTextEl.textContent = '⚠️ Keine System-Einstellungen gefunden';
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden des System-Modus:', error);
    if (statusTextEl) {
      statusTextEl.textContent = '❌ Fehler: ' + (error.message || 'Unbekannter Fehler');
    }
  }
}

/**
 * Update radio button visual styles based on selection
 */
function updateModeRadioStyles() {
  const radios = document.querySelectorAll('input[name="system-mode"]');
  radios.forEach(radio => {
    const label = radio.closest('label');
    if (label) {
      if (radio.checked) {
        label.style.borderColor = '#4CAF50';
        label.style.backgroundColor = '#f0f9f0';
      } else {
        label.style.borderColor = '#ddd';
        label.style.backgroundColor = 'white';
      }
    }
  });
}

/**
 * Switch system mode (normal <-> hotspot)
 */
async function switchSystemMode() {
  const normalRadio = document.getElementById('mode-normal');
  const hotspotRadio = document.getElementById('mode-hotspot');
  
  if (!normalRadio || !hotspotRadio) {
    showNotification('❌ Modus-Auswahl nicht gefunden', 'error');
    return;
  }
  
  const selectedMode = normalRadio.checked ? 'normal' : 'hotspot';
  
  // Confirm mode change
  const modeNames = { normal: 'Normal Modus', hotspot: 'Hotspot Modus' };
  if (!confirm(`Möchten Sie zum ${modeNames[selectedMode]} wechseln?\n\n⚠️ Das System wird neu gestartet!`)) {
    return;
  }
  
  try {
    console.log(`[Mode Switch] Switching to ${selectedMode} mode...`);
    
    // Update setting via PUT endpoint (bulk endpoint has issues with updates)
    const response = await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        key: 'system.networkMode',
        value: selectedMode,
        type: 'string',
        category: 'system',
        description: 'Network mode: normal (connect to existing networks) or hotspot (create ad-hoc network)'
      })
    });
    
    console.log('[Mode Switch] API Response:', response);
    
    // Check if settings were saved
    const saved = response.success === true || response.setting || response.message;
    
    if (saved) {
      showNotification(`✅ Modus auf ${modeNames[selectedMode]} umgestellt. Warte auf Netzwerk-Umschaltung...`, 'success');
      console.log('[Mode Switch] Database updated successfully, monitor will apply changes within 10 seconds');
      
      // Reload after 15 seconds to allow mode switch
      setTimeout(() => {
        console.log('[Mode Switch] Reloading page...');
        window.location.reload();
      }, 15000);
    } else {
      console.error('[Mode Switch] API returned unexpected format:', response);
      showNotification(`❌ Fehler beim Speichern: ${response.error?.message || response.message || 'Unbekannter Fehler'}`, 'error');
    }
  } catch (error) {
    console.error('[Mode Switch] Error:', error);
    showNotification(`❌ Fehler: ${error.message}`, 'error');
  }
}

// Event listeners for system mode
document.addEventListener('DOMContentLoaded', () => {
  // Initialize translations on page load
  translatePage();
  
  // Radio button change events
  const radios = document.querySelectorAll('input[name="system-mode"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateModeRadioStyles();
      
      // Show/hide hotspot info
      const hotspotInfo = document.getElementById('hotspot-info');
      if (hotspotInfo) {
        hotspotInfo.style.display = radio.value === 'hotspot' && radio.checked ? 'block' : 'none';
      }
    });
  });
  
  // Mode switch button
  const switchBtn = document.getElementById('switchSystemMode');
  if (switchBtn) {
    switchBtn.addEventListener('click', switchSystemMode);
  }
  
  // File upload button handler
  const triggerFileUploadBtn = document.getElementById('trigger-file-upload');
  const mediaFileInput = document.getElementById('media-file');
  if (triggerFileUploadBtn && mediaFileInput) {
    triggerFileUploadBtn.addEventListener('click', () => {
      mediaFileInput.click();
    });
  }

  // Update upload section visibility on page load
  const postTypeSelect = document.getElementById('post-type');
  if (postTypeSelect) {
    updateUploadSectionVisibility(postTypeSelect.value);
  }
});

console.log('Admin Dashboard geladen (API-Modus)');

// ============================================
// Live-Daten (ÖPNV & Verkehr) Management
// ============================================
let liveDataSettingsLoaded = false;
let transitSearchTimeout = null;

async function loadLiveDataSettings() {
  // Lade Transit-Einstellungen
  await loadTransitSettings();
  // Lade Traffic-Einstellungen
  await loadTrafficSettings();
  // Lade Autobahn-Liste
  await loadHighwayList();
  // Lade Cache-Stats
  await loadCacheStats();
  // Event-Listener initialisieren (nur einmal)
  if (!liveDataSettingsLoaded) {
    initLiveDataEventListeners();
    liveDataSettingsLoaded = true;
  }
}

function initLiveDataEventListeners() {
  // Transit toggle
  const transitEnabled = document.getElementById('transit-enabled');
  if (transitEnabled) {
    transitEnabled.addEventListener('change', () => {
      const config = document.getElementById('transit-config');
      if (config) config.style.display = transitEnabled.checked ? 'block' : 'none';
    });
  }

  // Traffic toggle
  const trafficEnabled = document.getElementById('traffic-enabled');
  if (trafficEnabled) {
    trafficEnabled.addEventListener('change', () => {
      const config = document.getElementById('traffic-config');
      if (config) config.style.display = trafficEnabled.checked ? 'block' : 'none';
    });
  }

  // Transit station search
  const searchBtn = document.getElementById('transit-search-btn');
  const searchInput = document.getElementById('transit-station-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => searchTransitStations());
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchTransitStations();
      }
    });
  }

  // Remove station
  const removeBtn = document.getElementById('transit-remove-station');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      document.getElementById('transit-selected-station').style.display = 'none';
      document.getElementById('transit-station-name').textContent = '–';
      document.getElementById('transit-station-id').textContent = '';
    });
  }

  // Save buttons
  document.getElementById('saveTransitSettings')?.addEventListener('click', saveTransitSettings);
  document.getElementById('saveTrafficSettings')?.addEventListener('click', saveTrafficSettings);

  // Preview buttons
  document.getElementById('previewTransitData')?.addEventListener('click', previewTransitData);
  document.getElementById('previewTrafficData')?.addEventListener('click', previewTrafficData);

  // Cache buttons
  document.getElementById('clearTransitCache')?.addEventListener('click', async () => {
    try {
      await apiRequest('/transit/cache/clear', { method: 'POST' });
      showNotification('ÖPNV-Cache geleert', 'success');
      loadCacheStats();
    } catch (e) {
      showNotification('Fehler beim Leeren des Cache', 'error');
    }
  });
  document.getElementById('clearTrafficCache')?.addEventListener('click', async () => {
    try {
      await apiRequest('/traffic/cache/clear', { method: 'POST' });
      showNotification('Verkehr-Cache geleert', 'success');
      loadCacheStats();
    } catch (e) {
      showNotification('Fehler beim Leeren des Cache', 'error');
    }
  });

  // Highway multi-select change
  const highwaySelect = document.getElementById('traffic-highway-select');
  if (highwaySelect) {
    highwaySelect.addEventListener('change', updateSelectedHighwaysDisplay);
  }
}

async function searchTransitStations() {
  const query = document.getElementById('transit-station-search')?.value?.trim();
  if (!query || query.length < 2) {
    showNotification('Bitte mindestens 2 Zeichen eingeben', 'warning');
    return;
  }

  const resultsDiv = document.getElementById('transit-search-results');
  resultsDiv.innerHTML = '<p class="text-muted">Suche läuft...</p>';
  resultsDiv.style.display = 'block';

  try {
    const data = await apiRequest(`/transit/stations/search?q=${encodeURIComponent(query)}&limit=8`);
    if (data.success && data.data.length > 0) {
      resultsDiv.innerHTML = data.data.map(station => `
        <div class="search-result-item" data-id="${station.id}" data-name="${station.name}">
          <div class="result-info">
            <strong>${station.name}</strong>
            <small class="text-muted">${station.id}</small>
          </div>
          <div class="result-products">
            ${station.products?.bus ? '<span class="product-badge bus">Bus</span>' : ''}
            ${station.products?.suburban ? '<span class="product-badge sbahn">S</span>' : ''}
            ${station.products?.subway ? '<span class="product-badge ubahn">U</span>' : ''}
            ${station.products?.tram ? '<span class="product-badge tram">Tram</span>' : ''}
            ${station.products?.regional ? '<span class="product-badge regional">RE</span>' : ''}
            ${station.products?.nationalExpress || station.products?.national ? '<span class="product-badge fernzug">ICE</span>' : ''}
          </div>
          <button class="btn btn-sm btn-primary select-station-btn">Auswählen</button>
        </div>
      `).join('');

      // Attach click handlers
      resultsDiv.querySelectorAll('.select-station-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.search-result-item');
          selectTransitStation(item.dataset.id, item.dataset.name);
          resultsDiv.style.display = 'none';
        });
      });
    } else {
      resultsDiv.innerHTML = '<p class="text-muted">Keine Stationen gefunden.</p>';
    }
  } catch (error) {
    resultsDiv.innerHTML = '<p class="text-error">Fehler bei der Suche. Ist der Server erreichbar?</p>';
    console.error('Transit search error:', error);
  }
}

function selectTransitStation(id, name) {
  const selectedDiv = document.getElementById('transit-selected-station');
  document.getElementById('transit-station-name').textContent = name;
  document.getElementById('transit-station-id').textContent = `ID: ${id}`;
  selectedDiv.style.display = 'flex';
  selectedDiv.dataset.stationId = id;
}

async function loadTransitSettings() {
  try {
    const response = await fetch('/api/settings?category=transit', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
    });
    if (!response.ok) return;
    const data = await response.json();

    const enabled = data['transit.enabled'] === true || data['transit.enabled'] === 'true';
    const transitEnabled = document.getElementById('transit-enabled');
    if (transitEnabled) {
      transitEnabled.checked = enabled;
      document.getElementById('transit-config').style.display = enabled ? 'block' : 'none';
    }

    if (data['transit.stationId'] && data['transit.stationName']) {
      selectTransitStation(data['transit.stationId'], data['transit.stationName']);
    }

    const maxDep = document.getElementById('transit-max-departures');
    if (maxDep && data['transit.maxDepartures']) maxDep.value = data['transit.maxDepartures'];

    const duration = document.getElementById('transit-duration');
    if (duration && data['transit.duration']) duration.value = data['transit.duration'];

    const refresh = document.getElementById('transit-refresh-interval');
    if (refresh && data['transit.refreshInterval']) refresh.value = data['transit.refreshInterval'];

    // Transport filters
    const filters = {
      'filter-bus': data['transit.filter.bus'] !== 'false',
      'filter-suburban': data['transit.filter.suburban'] !== 'false',
      'filter-subway': data['transit.filter.subway'] !== 'false',
      'filter-tram': data['transit.filter.tram'] !== 'false',
      'filter-regional': data['transit.filter.regional'] !== 'false',
      'filter-national': data['transit.filter.national'] !== 'false',
      'filter-ferry': data['transit.filter.ferry'] === 'true',
    };
    Object.entries(filters).forEach(([id, checked]) => {
      const el = document.getElementById(id);
      if (el) el.checked = checked;
    });
  } catch (error) {
    console.warn('Transit-Einstellungen konnten nicht geladen werden:', error);
  }
}

async function saveTransitSettings() {
  const selectedStation = document.getElementById('transit-selected-station');
  const stationId = selectedStation?.dataset?.stationId || '';
  const stationName = document.getElementById('transit-station-name')?.textContent || '';

  const settings = {
    'transit.enabled': document.getElementById('transit-enabled')?.checked ? 'true' : 'false',
    'transit.stationId': stationId,
    'transit.stationName': stationName,
    'transit.maxDepartures': document.getElementById('transit-max-departures')?.value || '10',
    'transit.duration': document.getElementById('transit-duration')?.value || '60',
    'transit.refreshInterval': document.getElementById('transit-refresh-interval')?.value || '30',
    'transit.filter.bus': document.getElementById('filter-bus')?.checked ? 'true' : 'false',
    'transit.filter.suburban': document.getElementById('filter-suburban')?.checked ? 'true' : 'false',
    'transit.filter.subway': document.getElementById('filter-subway')?.checked ? 'true' : 'false',
    'transit.filter.tram': document.getElementById('filter-tram')?.checked ? 'true' : 'false',
    'transit.filter.regional': document.getElementById('filter-regional')?.checked ? 'true' : 'false',
    'transit.filter.national': document.getElementById('filter-national')?.checked ? 'true' : 'false',
    'transit.filter.ferry': document.getElementById('filter-ferry')?.checked ? 'true' : 'false',
  };

  try {
    const response = await fetch('/api/settings/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ settings })
    });

    if (!response.ok) throw new Error('Speichern fehlgeschlagen');
    showNotification('ÖPNV-Einstellungen gespeichert!', 'success');
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    showNotification('Fehler beim Speichern der ÖPNV-Einstellungen', 'error');
  }
}

async function previewTransitData() {
  const selectedStation = document.getElementById('transit-selected-station');
  const stationId = selectedStation?.dataset?.stationId;

  if (!stationId) {
    showNotification('Bitte zuerst eine Station auswählen', 'warning');
    return;
  }

  const previewCard = document.getElementById('transit-preview-card');
  const previewContent = document.getElementById('transit-preview-content');
  previewCard.style.display = 'block';
  previewContent.innerHTML = '<p class="text-muted">Lade Abfahrten...</p>';

  const maxDep = document.getElementById('transit-max-departures')?.value || 10;
  const duration = document.getElementById('transit-duration')?.value || 60;

  try {
    const data = await apiRequest(`/transit/departures/${stationId}?limit=${maxDep}&duration=${duration}`);
    if (data.success && data.data.length > 0) {
      const stationName = document.getElementById('transit-station-name')?.textContent || stationId;
      previewContent.innerHTML = `
        <div class="departure-board">
          <div class="departure-board-header">
            <span>Abfahrten ${stationName}</span>
            <span class="departure-time-label">${new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}</span>
          </div>
          <table class="departure-table">
            <thead>
              <tr>
                <th>Linie</th>
                <th>Richtung</th>
                <th>Abfahrt</th>
                <th>Gleis</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.map(dep => {
                const when = dep.when ? new Date(dep.when) : null;
                const planned = dep.plannedWhen ? new Date(dep.plannedWhen) : null;
                const timeStr = when ? when.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : (planned ? planned.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : '–');
                const delayMin = dep.delay ? Math.round(dep.delay / 60) : 0;
                const delayClass = dep.cancelled ? 'cancelled' : (delayMin > 0 ? 'delayed' : 'on-time');
                const statusText = dep.cancelled ? 'Ausfall' : (delayMin > 0 ? `+${delayMin} min` : 'pünktl.');
                const lineClass = dep.line?.product || 'bus';
                return `
                  <tr class="${dep.cancelled ? 'row-cancelled' : ''}">
                    <td><span class="line-badge line-${lineClass}">${dep.line?.name || '?'}</span></td>
                    <td class="direction-cell">${dep.direction || '–'}</td>
                    <td class="time-cell">${timeStr}</td>
                    <td>${dep.platform || dep.plannedPlatform || '–'}</td>
                    <td><span class="status-badge ${delayClass}">${statusText}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      previewContent.innerHTML = '<p class="text-muted">Keine Abfahrten im gewählten Zeitraum.</p>';
    }
  } catch (error) {
    previewContent.innerHTML = `<p class="text-error">Fehler: ${error.message || 'Konnte Abfahrten nicht laden'}</p>`;
    console.error('Transit preview error:', error);
  }
}

async function loadTrafficSettings() {
  try {
    const response = await fetch('/api/settings?category=traffic', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
    });
    if (!response.ok) return;
    const data = await response.json();

    const enabled = data['traffic.enabled'] === true || data['traffic.enabled'] === 'true';
    const trafficEnabled = document.getElementById('traffic-enabled');
    if (trafficEnabled) {
      trafficEnabled.checked = enabled;
      document.getElementById('traffic-config').style.display = enabled ? 'block' : 'none';
    }

    const refresh = document.getElementById('traffic-refresh-interval');
    if (refresh && data['traffic.refreshInterval']) refresh.value = data['traffic.refreshInterval'];

    const maxWarn = document.getElementById('traffic-max-warnings');
    if (maxWarn && data['traffic.maxWarnings']) maxWarn.value = data['traffic.maxWarnings'];

    // Selected highways
    if (data['traffic.highways']) {
      const highways = data['traffic.highways'].split(',').map(h => h.trim());
      setTimeout(() => {
        const select = document.getElementById('traffic-highway-select');
        if (select) {
          Array.from(select.options).forEach(opt => {
            opt.selected = highways.includes(opt.value);
          });
          updateSelectedHighwaysDisplay();
        }
      }, 500);
    }

    // Show types
    const showWarnings = document.getElementById('show-warnings');
    if (showWarnings) showWarnings.checked = data['traffic.showWarnings'] !== false && data['traffic.showWarnings'] !== 'false';
    const showRoadworks = document.getElementById('show-roadworks');
    if (showRoadworks) showRoadworks.checked = data['traffic.showRoadworks'] !== false && data['traffic.showRoadworks'] !== 'false';
    const showClosures = document.getElementById('show-closures');
    if (showClosures) showClosures.checked = data['traffic.showClosures'] !== false && data['traffic.showClosures'] !== 'false';
  } catch (error) {
    console.warn('Traffic-Einstellungen konnten nicht geladen werden:', error);
  }
}

async function loadHighwayList() {
  const select = document.getElementById('traffic-highway-select');
  if (!select) return;

  try {
    const data = await apiRequest('/traffic/roads');
    if (data.success && data.data.length > 0) {
      select.innerHTML = data.data.map(road => 
        `<option value="${road}">${road}</option>`
      ).join('');
    }
  } catch (error) {
    select.innerHTML = '<option value="" disabled>Fehler beim Laden</option>';
    console.error('Highway list error:', error);
  }
}

function updateSelectedHighwaysDisplay() {
  const select = document.getElementById('traffic-highway-select');
  const display = document.getElementById('traffic-selected-highways');
  if (!select || !display) return;

  const selected = Array.from(select.selectedOptions).map(opt => opt.value);
  if (selected.length === 0) {
    display.innerHTML = '<p class="text-muted">Keine Autobahnen ausgewählt</p>';
    return;
  }
  display.innerHTML = selected.map(h => 
    `<span class="highway-badge">${h} <button type="button" class="remove-highway" data-highway="${h}">&times;</button></span>`
  ).join('');

  display.querySelectorAll('.remove-highway').forEach(btn => {
    btn.addEventListener('click', () => {
      const highway = btn.dataset.highway;
      const opt = Array.from(select.options).find(o => o.value === highway);
      if (opt) opt.selected = false;
      updateSelectedHighwaysDisplay();
    });
  });
}

async function saveTrafficSettings() {
  const select = document.getElementById('traffic-highway-select');
  const selectedHighways = select ? Array.from(select.selectedOptions).map(o => o.value).join(',') : '';

  const settings = {
    'traffic.enabled': document.getElementById('traffic-enabled')?.checked ? 'true' : 'false',
    'traffic.highways': selectedHighways,
    'traffic.refreshInterval': document.getElementById('traffic-refresh-interval')?.value || '5',
    'traffic.maxWarnings': document.getElementById('traffic-max-warnings')?.value || '5',
    'traffic.showWarnings': document.getElementById('show-warnings')?.checked ? 'true' : 'false',
    'traffic.showRoadworks': document.getElementById('show-roadworks')?.checked ? 'true' : 'false',
    'traffic.showClosures': document.getElementById('show-closures')?.checked ? 'true' : 'false',
  };

  try {
    const response = await fetch('/api/settings/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ settings })
    });

    if (!response.ok) throw new Error('Speichern fehlgeschlagen');
    showNotification('Verkehrs-Einstellungen gespeichert!', 'success');
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    showNotification('Fehler beim Speichern der Verkehrs-Einstellungen', 'error');
  }
}

async function previewTrafficData() {
  const select = document.getElementById('traffic-highway-select');
  const selectedHighways = select ? Array.from(select.selectedOptions).map(o => o.value) : [];

  if (selectedHighways.length === 0) {
    showNotification('Bitte mindestens eine Autobahn auswählen', 'warning');
    return;
  }

  const previewCard = document.getElementById('traffic-preview-card');
  const previewContent = document.getElementById('traffic-preview-content');
  previewCard.style.display = 'block';
  previewContent.innerHTML = '<p class="text-muted">Lade Verkehrsdaten...</p>';

  try {
    const maxWarnings = document.getElementById('traffic-max-warnings')?.value || 5;
    let allHtml = '';

    for (const highway of selectedHighways.slice(0, 5)) {
      const data = await apiRequest(`/traffic/highways/${highway}`);
      if (data.success) {
        const warnings = (data.data.warnings || []).slice(0, maxWarnings);
        const roadworks = (data.data.roadworks || []).slice(0, maxWarnings);
        const closures = (data.data.closures || []).slice(0, maxWarnings);

        allHtml += `
          <div class="traffic-highway-card">
            <div class="highway-header">
              <span class="highway-icon">🛣️</span>
              <h4>${highway}</h4>
              <span class="traffic-count">${warnings.length} Warnungen, ${roadworks.length} Baustellen, ${closures.length} Sperrungen</span>
            </div>
            ${warnings.length === 0 && roadworks.length === 0 && closures.length === 0 
              ? '<p class="text-muted" style="padding: 0.5rem 1rem;">Keine Meldungen – freie Fahrt! ✅</p>' 
              : ''}
            ${warnings.map(w => `
              <div class="traffic-item warning">
                <span class="traffic-type-icon">⚠️</span>
                <div class="traffic-details">
                  <strong>${w.title || 'Verkehrswarnung'}</strong>
                  <p>${w.subtitle || ''}</p>
                  ${w.description && w.description.length > 0 ? `<small>${w.description.slice(0, 3).join(' | ')}</small>` : ''}
                </div>
              </div>
            `).join('')}
            ${roadworks.map(r => `
              <div class="traffic-item roadwork">
                <span class="traffic-type-icon">🚧</span>
                <div class="traffic-details">
                  <strong>${r.title || 'Baustelle'}</strong>
                  <p>${r.subtitle || ''}</p>
                  ${r.description && r.description.length > 0 ? `<small>${r.description.slice(0, 3).join(' | ')}</small>` : ''}
                </div>
              </div>
            `).join('')}
            ${closures.map(c => `
              <div class="traffic-item closure">
                <span class="traffic-type-icon">🚫</span>
                <div class="traffic-details">
                  <strong>${c.title || 'Sperrung'}</strong>
                  <p>${c.subtitle || ''}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    previewContent.innerHTML = allHtml || '<p class="text-muted">Keine Verkehrsdaten verfügbar.</p>';
  } catch (error) {
    previewContent.innerHTML = `<p class="text-error">Fehler: ${error.message || 'Konnte Verkehrsdaten nicht laden'}</p>`;
    console.error('Traffic preview error:', error);
  }
}

async function loadCacheStats() {
  try {
    const transitData = await apiRequest('/transit/cache/stats');
    const trafficData = await apiRequest('/traffic/cache/stats');
    
    const transitCount = document.getElementById('transit-cache-count');
    const trafficCount = document.getElementById('traffic-cache-count');
    
    if (transitCount) transitCount.textContent = `${transitData?.data?.keys || 0} Einträge`;
    if (trafficCount) trafficCount.textContent = `${trafficData?.data?.keys || 0} Einträge`;
  } catch (error) {
    console.warn('Cache-Stats konnten nicht geladen werden:', error);
  }
}

// Load system mode only once when visiting settings for the first time
let systemModeLoaded = false;
document.querySelector('a[href="#settings"]')?.addEventListener('click', () => {
  if (!systemModeLoaded) {
    setTimeout(loadSystemMode, 100);
    systemModeLoaded = true;
  }
});

// Automatisches Enddatum: Wenn Startdatum manuell geändert wird, +7 Tage zum Enddatum
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

if (startDateInput && endDateInput) {
  startDateInput.addEventListener('change', function() {
    if (this.value) {
      const startDate = new Date(this.value);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      
      // Format: YYYY-MM-DDTHH:mm
      const endDateTime = endDate.toISOString().slice(0, 16);
      endDateInput.value = endDateTime;
    }
  });
}

// ============================================
// YouTube Video Duration Auto-Detection
// ============================================
const mediaUrlInput = document.getElementById('media-url');
const durationInput = document.getElementById('display-duration');
const postTypeInput = document.getElementById('post-type');

let youtubeFetchTimeout = null;

if (mediaUrlInput && durationInput && postTypeInput) {
  mediaUrlInput.addEventListener('input', function() {
    // Debounce: Warte 500ms nach letzter Eingabe
    clearTimeout(youtubeFetchTimeout);
    
    const url = this.value.trim();
    const contentType = postTypeInput.value;
    
    // Nur bei Video-Content und YouTube URLs
    if (contentType === 'video' && url && 
        (url.includes('youtube.com') || url.includes('youtu.be'))) {
      
      youtubeFetchTimeout = setTimeout(async () => {
        try {
          // Zeige Loading-Indikator
          durationInput.style.borderColor = '#ffc107';
          durationInput.disabled = true;
          
          const response = await apiRequest('/youtube/duration', {
            method: 'POST',
            body: JSON.stringify({ url }),
          });
          
          if (response.success && response.data.duration) {
            durationInput.value = response.data.duration;
            durationInput.style.borderColor = '#28a745';
            showNotification(`Video-Dauer automatisch gesetzt: ${response.data.duration}s`, 'success');
          }
        } catch (error) {
          console.warn('Fehler beim Abrufen der Video-Dauer:', error);
          durationInput.style.borderColor = '#dc3545';
          // Fallback: Behalte Standard-Wert bei
        } finally {
          durationInput.disabled = false;
          // Reset border color nach 2 Sekunden
          setTimeout(() => {
            durationInput.style.borderColor = '';
          }, 2000);
        }
      }, 500); // 500ms Debounce
    }
  });
}



