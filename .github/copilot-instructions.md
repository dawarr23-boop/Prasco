- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements

- [x] Scaffold the Project

- [x] Customize the Project

- [x] Install Required Extensions

- [x] Compile the Project

- [x] Create and Run Task

- [x] Launch the Project

- [x] Ensure Documentation is Complete

## Projekt-Informationen

**Projekttyp:** Digitales Schwarzes Brett (Digital Signage)  
**Technologien:** Node.js, Express, HTML5, CSS3, JavaScript (ES6+), SQLite (vorbereitet)  
**Zielplattform:** Raspberry Pi mit Fernseher-Display  
**Status:** MVP abgeschlossen, Backend-API vorbereitet

## Projektstruktur

```
digital-bulletin-board/
├── views/
│   ├── admin/           # Admin-Interface
│   └── public/          # Public Display
├── css/
│   ├── display.css      # Display-Styles
│   └── admin.css        # Admin-Styles
├── js/
│   ├── display.js       # Display-Logik mit Auto-Rotation
│   ├── admin.js         # Admin-Dashboard
│   └── admin-login.js   # Login-Handling
├── server.js            # Express-Server
├── package.json         # Dependencies
├── .env.example         # Umgebungsvariablen
├── README.md            # Hauptdokumentation
└── DEPLOYMENT.md        # Raspberry Pi Deployment-Guide
```

## Features

- **Public Display**: Vollbild-Anzeige mit automatischer Rotation
- **Admin-Panel**: Webbasierte Verwaltung von Beiträgen
- **Content-Typen**: Text, Bilder, Videos, HTML
- **Zeitplanung**: Start/End-Datum für Beiträge
- **Auto-Refresh**: Automatische Aktualisierung
- **LocalStorage**: Aktuell für Demo (Backend-API vorbereitet)

## Entwicklungsrichtlinien

- Verwende moderne ES6+ JavaScript-Features
- Backend-API-Struktur ist vorbereitet für SQLite/PostgreSQL
- Responsive Design für verschiedene Display-Größen
- Optimierung für Raspberry Pi Performance
- Sicherheit: Umgebungsvariablen für Secrets verwenden

## Starten der Anwendung

**Entwicklung:**
```bash
npm install
npm run dev
```

**Produktion (Raspberry Pi):**
```bash
npm install
pm2 start server.js --name bulletin-board
```

**Zugriff:**
- Display: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Demo-Login: admin / admin

**Details:** Siehe README.md und DEPLOYMENT.md
