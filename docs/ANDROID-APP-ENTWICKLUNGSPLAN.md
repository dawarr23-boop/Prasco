# PRASCO Android App - Entwicklungsplan

## 📱 Projektübersicht

**Projektname:** PRASCO Mobile - Post Creator  
**Plattform:** Android (min. API 26 / Android 8.0)  
**Zweck:** Mobile App zum Erstellen, Bearbeiten und Verwalten von Posts für das PRASCO Digital Signage System

---

## 🎯 Projektziele

### Hauptziele
- ✅ Einfaches Erstellen von Posts direkt vom Smartphone
- ✅ Foto-Upload mit Kamera oder Galerie
- ✅ Kategorisierung und Zeitplanung von Posts
- ✅ Offline-Fähigkeit mit Sync-Funktionalität
- ✅ Intuitive Benutzeroberfläche nach Material Design 3

### Sekundäre Ziele
- Push-Benachrichtigungen für wichtige Events
- QR-Code Scanner für schnelle Post-Erstellung
- Post-Vorlagen für häufige Inhaltstypen
- Multi-User-Support mit Rollenbasierter Zugriffssteuerung

---

## 🛠 Technologie-Stack

### Frontend
- **Sprache:** Kotlin
- **UI Framework:** Jetpack Compose (Material Design 3)
- **Architektur:** MVVM (Model-View-ViewModel)
- **Dependency Injection:** Hilt / Dagger
- **Navigation:** Jetpack Navigation Component

### Backend Integration
- **API Client:** Retrofit 2 + OkHttp
- **JSON Parsing:** Kotlinx Serialization / Moshi
- **Bildverarbeitung:** Coil / Glide
- **Authentifizierung:** JWT Token Management

### Lokale Datenbank
- **Datenbank:** Room (SQLite)
- **Caching:** DataStore (SharedPreferences Nachfolger)
- **Offline-Sync:** WorkManager für Background-Tasks

### Media & Kamera
- **Kamera:** CameraX API
- **Image Compression:** Compressor Library
- **Video Recording:** ExoPlayer + CameraX

### Testing
- **Unit Tests:** JUnit 5 + MockK
- **UI Tests:** Espresso + Compose Testing
- **Integration Tests:** Robolectric

---

## 📋 Feature-Spezifikation

### Phase 1: MVP (Minimum Viable Product) - 4-6 Wochen

#### 1.1 Authentifizierung & Autorisierung
- [ ] Login-Screen mit E-Mail/Passwort
- [ ] JWT Token-Verwaltung (Access + Refresh Token)
- [ ] Automatisches Token-Refresh
- [ ] Biometrische Authentifizierung (Fingerprint/Face)
- [ ] Passwort vergessen / Reset-Funktion

#### 1.2 Post-Erstellung (Text)
- [ ] Einfacher Text-Editor
- [ ] Titel + Content-Felder
- [ ] Kategorie-Auswahl (Dropdown)
- [ ] Anzeigedauer (Slider: 5-60 Sekunden)
- [ ] Priorität (Niedrig/Mittel/Hoch)
- [ ] Start-/Enddatum-Picker
  - Automatisches Enddatum (+7 Tage)
- [ ] Aktiv/Inaktiv Toggle

#### 1.3 Bild-Posts
- [ ] Foto mit Kamera aufnehmen
- [ ] Bild aus Galerie auswählen
- [ ] Bild-Preview mit Crop-Funktion
- [ ] Automatische Kompression (max 5MB)
- [ ] Optionaler Text-Overlay

#### 1.4 Post-Liste & Verwaltung
- [ ] Liste aller eigenen Posts
- [ ] Filter: Aktiv/Inaktiv, Kategorie
- [ ] Suche nach Titel
- [ ] Swipe-Actions: Bearbeiten/Löschen
- [ ] Pull-to-Refresh

#### 1.5 Post-Details & Bearbeiten
- [ ] Detailansicht eines Posts
- [ ] Bearbeiten aller Felder
- [ ] Post aktivieren/deaktivieren
- [ ] Post löschen (mit Bestätigung)

---

### Phase 2: Erweiterte Features - 3-4 Wochen

#### 2.1 Video-Posts
- [ ] Video mit Kamera aufnehmen (max 30 Sekunden)
- [ ] Video aus Galerie auswählen
- [ ] Video-Preview Player
- [ ] Thumbnail-Generierung
- [ ] Kompression (max 50MB)

#### 2.2 HTML-Posts
- [ ] Rich-Text-Editor mit Formatierung
  - Fett, Kursiv, Unterstrichen
  - Überschriften (H1-H3)
  - Listen (geordnet/ungeordnet)
  - Farben und Hintergrundfarben
- [ ] HTML-Preview

#### 2.3 Offline-Funktionalität
- [ ] Posts lokal speichern (Room DB)
- [ ] Offline-Indikator in UI
- [ ] Automatische Synchronisation bei Verbindung
- [ ] Conflict-Resolution (Server gewinnt)
- [ ] Upload-Queue für Medien

#### 2.4 Kategorien-Verwaltung
- [ ] Kategorien auflisten
- [ ] Neue Kategorie erstellen
- [ ] Kategorie bearbeiten (Name, Farbe, Icon)
- [ ] Kategorie löschen (mit Warnung)

#### 2.5 Benachrichtigungen
- [ ] FCM (Firebase Cloud Messaging) Integration
- [ ] Push für abgelaufene Posts
- [ ] Push für neue Kommentare (zukünftig)
- [ ] In-App Notification Center

---

### Phase 3: Premium Features - 2-3 Wochen

#### 3.1 Post-Vorlagen
- [ ] Vordefinierte Templates
  - Geburtstag
  - Ankündigung
  - Notfall-Warnung
  - Event-Einladung
- [ ] Eigene Vorlagen speichern
- [ ] Template-Galerie

#### 3.2 Bulk-Operationen
- [ ] Multi-Select in Post-Liste
- [ ] Mehrere Posts gleichzeitig löschen
- [ ] Bulk-Aktivierung/Deaktivierung
- [ ] Kategoriewechsel für mehrere Posts

#### 3.3 Analytics & Statistiken
- [ ] Dashboard mit Metriken
  - Anzahl aktiver Posts
  - Anzeigehäufigkeit (Views)
  - Beliebteste Kategorien
- [ ] Zeitlicher Verlauf (Charts)

#### 3.4 Erweiterte Medien
- [ ] Hintergrundmusik für Posts
- [ ] Audio-Aufnahme (Sprachnachrichten)
- [ ] GIF-Unterstützung
- [ ] Bild-Galerien (Slideshow)

#### 3.5 QR-Code Integration
- [ ] QR-Code Scanner
- [ ] QR-Code Generierung für Posts
- [ ] Schnelles Teilen von Posts via QR

---

## 🏗 App-Architektur

### MVVM Pattern

```
┌─────────────────────────────────────────────┐
│              UI Layer (Compose)             │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │   Screens   │  │   Navigation Host    │ │
│  └─────────────┘  └──────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           ViewModel Layer (Hilt)            │
│  ┌──────────────┐  ┌──────────────────────┐│
│  │ PostViewModel│  │ AuthViewModel        ││
│  │ CategoryVM   │  │ MediaViewModel       ││
│  └──────────────┘  └──────────────────────┘│
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│            Domain Layer (Use Cases)         │
│  ┌──────────────┐  ┌──────────────────────┐│
│  │ CreatePost   │  │ UploadMedia          ││
│  │ UpdatePost   │  │ SyncPosts            ││
│  │ DeletePost   │  │ ValidateToken        ││
│  └──────────────┘  └──────────────────────┘│
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Data Layer (Repositories)           │
│  ┌──────────────┐  ┌──────────────────────┐│
│  │PostRepository│  │ MediaRepository      ││
│  │AuthRepository│  │ CategoryRepository   ││
│  └──────────────┘  └──────────────────────┘│
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ Remote Data  │    │  Local Data      │
│  (Retrofit)  │    │  (Room DB)       │
│              │    │  (DataStore)     │
└──────────────┘    └──────────────────┘
```

### Projekt-Struktur

```
app/
├── src/
│   ├── main/
│   │   ├── java/com/prasco/mobile/
│   │   │   ├── ui/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginScreen.kt
│   │   │   │   │   └── AuthViewModel.kt
│   │   │   │   ├── posts/
│   │   │   │   │   ├── PostListScreen.kt
│   │   │   │   │   ├── PostDetailScreen.kt
│   │   │   │   │   ├── CreatePostScreen.kt
│   │   │   │   │   └── PostViewModel.kt
│   │   │   │   ├── categories/
│   │   │   │   │   ├── CategoryListScreen.kt
│   │   │   │   │   └── CategoryViewModel.kt
│   │   │   │   ├── components/
│   │   │   │   │   ├── PostCard.kt
│   │   │   │   │   ├── ImagePicker.kt
│   │   │   │   │   └── DateTimePicker.kt
│   │   │   │   └── theme/
│   │   │   │       ├── Color.kt
│   │   │   │       ├── Theme.kt
│   │   │   │       └── Type.kt
│   │   │   ├── data/
│   │   │   │   ├── remote/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── PrascoApi.kt
│   │   │   │   │   │   ├── AuthApi.kt
│   │   │   │   │   │   └── MediaApi.kt
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── PostDto.kt
│   │   │   │   │   │   ├── CategoryDto.kt
│   │   │   │   │   │   └── LoginRequest.kt
│   │   │   │   │   └── interceptors/
│   │   │   │   │       ├── AuthInterceptor.kt
│   │   │   │   │       └── LoggingInterceptor.kt
│   │   │   │   ├── local/
│   │   │   │   │   ├── database/
│   │   │   │   │   │   ├── PrascoDatabase.kt
│   │   │   │   │   │   ├── PostDao.kt
│   │   │   │   │   │   └── CategoryDao.kt
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   ├── PostEntity.kt
│   │   │   │   │   │   └── CategoryEntity.kt
│   │   │   │   │   └── datastore/
│   │   │   │   │       └── PreferencesManager.kt
│   │   │   │   └── repository/
│   │   │   │       ├── PostRepository.kt
│   │   │   │       ├── CategoryRepository.kt
│   │   │   │       ├── MediaRepository.kt
│   │   │   │       └── AuthRepository.kt
│   │   │   ├── domain/
│   │   │   │   ├── model/
│   │   │   │   │   ├── Post.kt
│   │   │   │   │   ├── Category.kt
│   │   │   │   │   └── User.kt
│   │   │   │   ├── usecase/
│   │   │   │   │   ├── post/
│   │   │   │   │   │   ├── CreatePostUseCase.kt
│   │   │   │   │   │   ├── UpdatePostUseCase.kt
│   │   │   │   │   │   ├── DeletePostUseCase.kt
│   │   │   │   │   │   └── GetPostsUseCase.kt
│   │   │   │   │   ├── media/
│   │   │   │   │   │   ├── UploadImageUseCase.kt
│   │   │   │   │   │   └── CompressImageUseCase.kt
│   │   │   │   │   └── auth/
│   │   │   │   │       ├── LoginUseCase.kt
│   │   │   │   │       └── RefreshTokenUseCase.kt
│   │   │   │   └── validator/
│   │   │   │       ├── PostValidator.kt
│   │   │   │       └── MediaValidator.kt
│   │   │   ├── di/
│   │   │   │   ├── AppModule.kt
│   │   │   │   ├── NetworkModule.kt
│   │   │   │   ├── DatabaseModule.kt
│   │   │   │   └── RepositoryModule.kt
│   │   │   ├── util/
│   │   │   │   ├── NetworkMonitor.kt
│   │   │   │   ├── DateFormatter.kt
│   │   │   │   ├── ImageCompressor.kt
│   │   │   │   └── Constants.kt
│   │   │   └── worker/
│   │   │       ├── SyncWorker.kt
│   │   │       └── UploadWorker.kt
│   │   └── res/
│   │       ├── drawable/
│   │       ├── layout/
│   │       ├── values/
│   │       │   ├── strings.xml
│   │       │   ├── colors.xml
│   │       │   └── themes.xml
│   │       └── xml/
│   │           └── network_security_config.xml
│   └── test/
│       └── java/com/prasco/mobile/
│           ├── viewmodel/
│           ├── usecase/
│           └── repository/
└── build.gradle.kts
```

---

## 🔌 API-Integration

### Base URL
```
Production: https://10.0.162.110:3000
Development: http://localhost:3000
```

### Endpoints (Retrofit Interface)

```kotlin
interface PrascoApi {
    // Authentication
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
    
    @POST("/api/auth/refresh")
    suspend fun refreshToken(@Body token: RefreshRequest): TokenResponse
    
    // Posts
    @GET("/api/posts")
    suspend fun getPosts(
        @Query("page") page: Int,
        @Query("limit") limit: Int,
        @Query("category") categoryId: Int?
    ): PostResponse
    
    @GET("/api/posts/{id}")
    suspend fun getPostById(@Path("id") id: Int): PostDetailResponse
    
    @POST("/api/posts")
    suspend fun createPost(@Body post: CreatePostRequest): PostDetailResponse
    
    @PUT("/api/posts/{id}")
    suspend fun updatePost(
        @Path("id") id: Int,
        @Body post: UpdatePostRequest
    ): PostDetailResponse
    
    @DELETE("/api/posts/{id}")
    suspend fun deletePost(@Path("id") id: Int): DeleteResponse
    
    // Categories
    @GET("/api/categories")
    suspend fun getCategories(): CategoryResponse
    
    @POST("/api/categories")
    suspend fun createCategory(@Body category: CreateCategoryRequest): CategoryDetailResponse
    
    // Media Upload
    @Multipart
    @POST("/api/media/upload")
    suspend fun uploadMedia(
        @Part file: MultipartBody.Part,
        @Part("type") type: RequestBody
    ): MediaUploadResponse
}
```

### Datenmodelle (DTOs)

```kotlin
data class Post(
    val id: Int,
    val title: String,
    val content: String,
    val contentType: ContentType,
    val categoryId: Int?,
    val mediaId: Int?,
    val startDate: String?,
    val endDate: String?,
    val duration: Int,
    val priority: Int,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

enum class ContentType {
    TEXT, IMAGE, VIDEO, HTML
}

data class Category(
    val id: Int,
    val name: String,
    val color: String,
    val icon: String?
)
```

---

## 🎨 UI/UX Design

### Design System (Material Design 3)

#### Farben
```kotlin
// PRASCO Brand Colors
val PrascoPrimary = Color(0xFF1976D2)      // Blau
val PrascoSecondary = Color(0xFF388E3C)    // Grün
val PrascoError = Color(0xFFD32F2F)        // Rot
val PrascoWarning = Color(0xFFF57C00)      // Orange
val PrascoBackground = Color(0xFFF5F5F5)   // Hellgrau
```

#### Typografie
```kotlin
val Typography = Typography(
    displayLarge = TextStyle(fontSize = 57.sp, fontWeight = FontWeight.Bold),
    headlineLarge = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Medium),
    bodyLarge = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Normal),
    labelLarge = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)
)
```

### Hauptscreens

#### 1. Login Screen
- PRASCO Logo (zentriert)
- E-Mail-Feld
- Passwort-Feld (mit Show/Hide Toggle)
- "Angemeldet bleiben" Checkbox
- Login Button (Vollbreite)
- "Passwort vergessen?" Link
- Biometrische Login-Option (Fingerprint Icon)

#### 2. Post-Liste Screen
- Top App Bar
  - Titel: "Meine Posts"
  - Filter-Icon
  - Such-Icon
  - Profil-Icon (Menü)
- Floating Action Button (+)
- Liste mit PostCards
  - Thumbnail/Icon
  - Titel + Kategorie-Badge
  - Status-Indikator (aktiv/inaktiv)
  - Datum-Range
  - Swipe: Bearbeiten/Löschen
- Pull-to-Refresh
- Bottom Navigation (optional)

#### 3. Post Erstellen/Bearbeiten Screen
- Top App Bar
  - Zurück-Button
  - Titel: "Neuer Post"
  - Speichern-Button (✓)
- Scrollbarer Content
  - Content-Type Selector (Tabs: Text/Bild/Video/HTML)
  - Titel-Feld
  - Content-Editor (je nach Type)
  - Kategorie-Dropdown
  - Anzeigedauer-Slider
  - Priorität-Chips (Niedrig/Mittel/Hoch)
  - Datumswähler (Start/End)
  - Aktiv-Toggle
- Medien-Upload-Sektion
  - Kamera-Button
  - Galerie-Button
  - Preview

#### 4. Kategorie-Verwaltung Screen
- Liste der Kategorien
- Farbige Karten mit Icon
- Edit/Delete Actions
- FAB zum Erstellen

---

## 📅 Zeitplan & Meilensteine

### Sprint-Planung (2-Wochen-Sprints)

#### Sprint 1-2: Setup & Auth (Woche 1-4)
- [ ] Projekt-Setup (Gradle, Dependencies)
- [ ] MVVM-Architektur aufsetzen
- [ ] Hilt Dependency Injection
- [ ] Retrofit + API-Integration
- [ ] Room Database Setup
- [ ] Login/Logout-Funktionalität
- [ ] Token-Management
- [ ] Biometrische Auth

**Deliverable:** Funktionierende Authentifizierung

#### Sprint 3-4: Post-Erstellung (Woche 5-8)
- [ ] Post-Liste Screen (UI)
- [ ] Post-Detail Screen
- [ ] Create Post (Text) Screen
- [ ] Kategorie-Integration
- [ ] Datum-/Zeitpicker
- [ ] Validierung
- [ ] CRUD-Operationen über API
- [ ] Lokale Caching (Room)

**Deliverable:** Text-Posts erstellen und verwalten

#### Sprint 5: Medien-Upload (Woche 9-10)
- [ ] CameraX Integration
- [ ] Image Picker
- [ ] Image Compression
- [ ] Upload zu Server
- [ ] Preview-Funktionalität
- [ ] Bild-Posts erstellen

**Deliverable:** Bild-Posts mit Kamera/Galerie

#### Sprint 6: Offline & Sync (Woche 11-12)
- [ ] Offline-Detection
- [ ] WorkManager für Sync
- [ ] Upload-Queue
- [ ] Conflict-Resolution
- [ ] Progress-Indikatoren

**Deliverable:** App funktioniert offline

#### Sprint 7-8: Erweiterte Features (Woche 13-16)
- [ ] Video-Posts
- [ ] HTML-Editor
- [ ] Bulk-Operationen
- [ ] Push-Notifications (FCM)
- [ ] Templates

**Deliverable:** Vollständige Feature-Set

#### Sprint 9: Testing & Optimization (Woche 17-18)
- [ ] Unit Tests (80% Coverage)
- [ ] UI Tests (kritische Flows)
- [ ] Performance-Optimierung
- [ ] Bug-Fixes
- [ ] Code-Review

**Deliverable:** Stabile, getestete App

#### Sprint 10: Release Preparation (Woche 19-20)
- [ ] Beta-Testing mit echten Usern
- [ ] Play Store Listing erstellen
- [ ] Screenshots & Beschreibung
- [ ] Datenschutzerklärung
- [ ] Release-Build (signiert)
- [ ] Play Store Upload

**Deliverable:** App im Play Store (Beta)

---

## 🧪 Testing-Strategie

### Unit Tests
```kotlin
@Test
fun `createPost should return success when valid data provided`() {
    // Given
    val post = CreatePostRequest(
        title = "Test Post",
        content = "Test Content",
        contentType = ContentType.TEXT
    )
    
    // When
    val result = postRepository.createPost(post)
    
    // Then
    assertTrue(result.isSuccess)
}
```

### UI Tests
```kotlin
@Test
fun loginFlowTest() {
    composeTestRule.apply {
        onNodeWithText("E-Mail").performTextInput("admin@prasco.net")
        onNodeWithText("Passwort").performTextInput("admin123")
        onNodeWithTag("LoginButton").performClick()
        
        // Verify navigation to post list
        onNodeWithText("Meine Posts").assertIsDisplayed()
    }
}
```

### Integration Tests
- API-Kommunikation mit Mock-Server (MockWebServer)
- Datenbank-Operationen
- WorkManager-Jobs

### Test Coverage Ziele
- **Unit Tests:** 80%+ Coverage
- **UI Tests:** Alle kritischen User-Flows
- **Integration Tests:** API & DB Interaktionen

---

## 🚀 Deployment & Distribution

### Build Variants

```kotlin
android {
    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            buildConfigField("String", "API_URL", "\"http://10.0.162.110:3000\"")
        }
        release {
            minifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            buildConfigField("String", "API_URL", "\"https://api.prasco.net\"")
        }
    }
    
    flavorDimensions += "environment"
    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
        }
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
        }
        create("production") {
            dimension = "environment"
        }
    }
}
```

### Play Store Release Prozess

1. **Interne Tests** (Woche 1-2)
   - Closed Alpha Track
   - 5-10 interne Tester

2. **Closed Beta** (Woche 3-4)
   - Beta Track
   - 20-50 ausgewählte User
   - Feedback sammeln

3. **Open Beta** (Woche 5-6)
   - Öffentlich zugänglich (optional)
   - Bug-Reports & Feature-Requests

4. **Production Release**
   - Staged Rollout (10% → 50% → 100%)
   - Monitoring mit Firebase Crashlytics
   - Hotfix-Bereitschaft

### App Signing
- **Keystore:** Sicher verwahren (Passwort-Manager)
- **Play App Signing:** Aktivieren für automatisches Management
- **Backup:** Keystore auf mehreren sicheren Locations

---

## 📊 Metriken & Monitoring

### Analytics (Firebase Analytics)
- Screen Views
- Button Clicks
- Post Creation Events
- Upload Success/Failure Rate
- Average Session Duration
- User Retention

### Crash Reporting (Firebase Crashlytics)
- Automatische Crash-Reports
- Non-Fatal Errors
- Custom Logs für Debugging

### Performance Monitoring
- App-Startzeit
- API Response Times
- Image Load Times
- Database Query Performance

---

## 🔒 Sicherheit & Datenschutz

### Sicherheitsmaßnahmen
- ✅ HTTPS-only Kommunikation
- ✅ Certificate Pinning
- ✅ JWT Token in verschlüsseltem Storage (EncryptedSharedPreferences)
- ✅ ProGuard/R8 Code Obfuscation
- ✅ Input-Validierung (Client + Server)
- ✅ SQL Injection Prevention (Room/Prepared Statements)

### Datenschutz (DSGVO-konform)
- **Datenschutzerklärung** in App integriert
- **Einwilligungen** für Kamera, Speicher, Benachrichtigungen
- **Lösch-Funktionalität** für User-Daten
- **Datenminimierung** - nur notwendige Daten sammeln
- **Lokale Speicherung** bevorzugt

### Berechtigungen
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

---

## 💰 Kosten & Ressourcen

### Entwicklungskosten (Schätzung)

| Position | Zeitaufwand | Stundensatz | Kosten |
|----------|-------------|-------------|--------|
| Android Entwickler (Senior) | 400h | €80-120 | €32.000-48.000 |
| UI/UX Designer | 80h | €60-100 | €4.800-8.000 |
| Backend Anpassungen | 40h | €70-100 | €2.800-4.000 |
| QA Testing | 60h | €50-80 | €3.000-4.800 |
| Projektmanagement | 60h | €60-100 | €3.600-6.000 |
| **Gesamt** | **640h** | | **€46.200-70.800** |

### Laufende Kosten (jährlich)
- Google Play Developer Account: €25 (einmalig)
- Firebase (Blaze Plan): €0-50/Monat (je nach Nutzung)
- Server (API-Erweiterung): inkludiert
- App-Updates & Wartung: ~€5.000-10.000/Jahr

---

## 🛣 Roadmap (Post-Launch)

### Version 1.1 (Q2 2026)
- Dark Mode
- Widget für Homescreen
- Voice-to-Text für Posts
- Mehrsprachigkeit (EN, IT)

### Version 1.2 (Q3 2026)
- Tablet-Optimierung
- Drag & Drop für Medien
- Post-Duplikation
- Export-Funktion (PDF)

### Version 2.0 (Q4 2026)
- Kalender-Integration
- Kollaborative Posts (Multi-User)
- Kommentar-System
- Post-Genehmigungsworkflow

---

## 📚 Dokumentation

### Developer Documentation
- README.md mit Setup-Anleitung
- Architecture Decision Records (ADRs)
- API Documentation (Swagger/OpenAPI)
- Code Comments (KDoc)

### User Documentation
- In-App Tutorial (erste Nutzung)
- FAQ-Sektion
- Video-Tutorials (YouTube)
- Support-E-Mail

---

## ✅ Erfolgskriterien

### Technische KPIs
- [ ] App-Startzeit < 2 Sekunden
- [ ] API Response Time < 500ms (95. Perzentil)
- [ ] Crash-Free Rate > 99,5%
- [ ] ANR-Rate < 0,1%

### User KPIs
- [ ] Durchschnittlich 10+ Posts/Woche pro aktiven User
- [ ] User Retention (Day 7) > 40%
- [ ] App Store Rating > 4,5 Sterne
- [ ] 80%+ Upload-Erfolgsrate

### Business KPIs
- [ ] 100+ Downloads in ersten 3 Monaten
- [ ] 50+ aktive Nutzer nach 6 Monaten
- [ ] ROI positiv nach 12 Monaten

---

## 🤝 Team & Verantwortlichkeiten

### Empfohlenes Team

- **Product Owner:** Anforderungen, Priorisierung
- **Android Developer (Lead):** Architektur, Core-Features
- **Android Developer (Junior):** UI-Implementation, Testing
- **UI/UX Designer:** Screens, Flows, Prototyping
- **Backend Developer:** API-Anpassungen, Optimierungen
- **QA Engineer:** Testing, Bug-Reporting
- **DevOps:** CI/CD, Release-Management

---

## 📞 Support & Maintenance

### Support-Kanäle
- E-Mail: support@prasco.net
- In-App Feedback-Formular
- GitHub Issues (für Entwickler)

### Wartungsplan
- **Hotfixes:** Innerhalb 24h bei kritischen Bugs
- **Minor Updates:** Alle 2-4 Wochen
- **Major Updates:** Quartalsweise
- **Security Patches:** Sofort nach Bekanntwerden

---

## 📖 Anhang

### Nützliche Libraries

```gradle
dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    
    // Jetpack Compose
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.navigation:navigation-compose:2.7.6")
    
    // Dependency Injection
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // CameraX
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-view:1.3.1")
    
    // Work Manager
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    
    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("io.mockk:mockk:1.13.9")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

### Referenzen & Links
- [Android Developer Documentation](https://developer.android.com/)
- [Jetpack Compose Samples](https://github.com/android/compose-samples)
- [Material Design 3](https://m3.material.io/)
- [PRASCO Backend API Docs](./API-DOCUMENTATION.md)

---

**Version:** 1.0  
**Erstellt:** 2. Januar 2026  
**Autor:** PRASCO Development Team  
**Status:** Draft für Review
