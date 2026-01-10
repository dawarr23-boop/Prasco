# PRASCO Android App - Standalone-Version Installationsanleitung

## ✅ Erfolgreich implementiert!

Die PRASCO Android App läuft jetzt **komplett offline** ohne Server-Verbindung!

## 🎯 Standalone-Features

### 1. **Offline-Login**
- **Benutzername**: `demo`
- **Passwort**: `demo`
- Funktioniert ohne Internet/Server

### 2. **Demo-Daten vorinstalliert**
- **6 Posts** mit verschiedenen Prioritäten und Kategorien
- **5 Kategorien**: Allgemein, Wichtig, Events, News, Info
- Werden automatisch beim ersten Login initialisiert

### 3. **Vollständige CRUD-Funktionalität**
- ✅ Posts erstellen
- ✅ Posts bearbeiten
- ✅ Posts löschen
- ✅ Posts anzeigen
- Alles wird nur lokal gespeichert

### 4. **Automatischer Fallback-Modus**
- Bei Netzwerkfehler: automatisch Offline-Modus
- Bei Server-Ausfall: Verwendung lokaler Daten
- Nahtlose Nutzung ohne Unterbrechung

## 📦 Build-Informationen

**APK-Datei**: `app-debug.apk`  
**Größe**: 18,33 MB  
**Pfad**: `C:\Users\chris\prasco\android-app\app\build\outputs\apk\debug\app-debug.apk`  
**Status**: ✅ Installiert und getestet

## 🚀 Installation

Die App ist bereits auf folgenden Geräten installiert:
- ✅ **Emulator** (Pixel_6)
- ✅ **Physisches Gerät**

### Manuelle Installation (optional)

```powershell
# Auf neuem Gerät installieren
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r "C:\Users\chris\prasco\android-app\app\build\outputs\apk\debug\app-debug.apk"
```

## 💡 Verwendung

### 1. App starten

**Auf Emulator**:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 shell am start -n com.prasco.mobile/.MainActivity
```

**Auf physischem Gerät**:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s y96t5xx8fmqkqclj shell am start -n com.prasco.mobile/.MainActivity
```

**Oder**: App-Icon auf dem Gerät/Emulator antippen

### 2. Anmelden

**Standalone-Modus**:
- Benutzername: `demo`
- Passwort: `demo`

**Alternative** (falls Server verfügbar):
- Deine normalen PRASCO-Zugangsdaten

### 3. Demo-Posts erkunden

Nach dem Login siehst du automatisch:
1. **Willkommen bei PRASCO** - Einführung
2. **Wichtige Ankündigung** - Funktionsübersicht
3. **Team Meeting** - Events-Beispiel
4. **Neue Features** - News-Beispiel
5. **Systeminfo** - Info-Bereich
6. **Inaktiver Post** - (wird nicht im Display angezeigt)

### 4. Eigene Posts erstellen

1. Klicke auf den **+** Button
2. Fülle die Felder aus:
   - Titel
   - Inhalt
   - Kategorie auswählen
   - Dauer (Sekunden)
   - Priorität (0-10)
   - Aktiv/Inaktiv
3. **Speichern**
4. Der Post wird sofort in der lokalen Datenbank gespeichert

## 🔧 Technische Details

### Architektur

**Offline-First Design**:
- Alle Daten werden primär lokal gespeichert (Room Database)
- Server-Sync ist optional und findet nur statt, wenn verfügbar
- Bei Netzwerkfehler: nahtlose Weiterarbeit

**Demo-Modus**:
- `DemoDataProvider` stellt vorgefertigte Daten bereit
- Initialisierung beim ersten Start
- Persistent in lokaler Datenbank

**Repositories mit Fallback**:
- `AuthRepository`: Demo-Login als Fallback
- `PostRepository`: Lokale CRUD mit optionalem Server-Sync
- `CategoryRepository`: Demo-Kategorien als Fallback

### Datenspeicherung

**Room Database** (SQLite):
- Posts: Titel, Inhalt, Typ, Dauer, Priorität, Kategorie, Status
- Kategorien: Name, Farbe, Icon
- User-Daten: E-Mail, Name, Rolle

**DataStore** (Preferences):
- Auth-Token (für Server-Modus)
- User-Session
- App-Einstellungen

## 🎨 UI-Features

- **Material Design 3** Theme mit PRASCO-Branding
- **Jetpack Compose** UI
- **Swipe-to-Refresh** für Post-Liste
- **Kontextmenü** für Posts (Bearbeiten/Löschen)
- **Kategorie-Filter** und Suche
- **Standalone-Hinweis** auf Login-Screen

## 📊 Demo-Posts Übersicht

| ID | Titel | Kategorie | Priorität | Dauer | Status |
|----|-------|-----------|-----------|-------|--------|
| 1 | Willkommen bei PRASCO | Allgemein | 5 | 10s | Aktiv |
| 2 | Wichtige Ankündigung | Wichtig | 8 | 15s | Aktiv |
| 3 | Team Meeting | Events | 7 | 12s | Aktiv |
| 4 | Neue Features | News | 6 | 20s | Aktiv |
| 5 | Systeminfo | Info | 3 | 8s | Aktiv |
| 6 | Inaktiver Post | Allgemein | 1 | 10s | Inaktiv |

## 🛠️ Entwicklung

### Neuen Build erstellen

```powershell
cd c:\Users\chris\prasco\android-app
cmd /c gradlew.bat assembleDebug
```

### Release-Version bauen

```powershell
cmd /c gradlew.bat assembleRelease
```

### Clean Build

```powershell
cmd /c gradlew.bat clean assembleDebug
```

### Logs anzeigen (Debugging)

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Emulator
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 logcat | Select-String "Prasco"

# Physisches Gerät
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s y96t5xx8fmqkqclj logcat | Select-String "Prasco"
```

## 🔍 Fehlerbehebung

### App startet nicht
```powershell
# App-Daten löschen und neu starten
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell pm clear com.prasco.mobile
```

### Login funktioniert nicht
- Stelle sicher, dass du `demo` / `demo` verwendest (lowercase)
- Cache löschen (siehe oben)
- App neu installieren

### Keine Posts sichtbar
- Nach Login kurz warten (Demo-Daten werden geladen)
- Pull-to-Refresh durchführen
- Logs prüfen (siehe Debugging)

## 📝 Nächste Schritte (Optional)

### Für Produktion:

1. **Release-Build mit Signatur**:
```powershell
# Keystore erstellen
keytool -genkey -v -keystore prasco-release.keystore -alias prasco -keyalg RSA -keysize 2048 -validity 10000

# Release bauen
cmd /c gradlew.bat assembleRelease
```

2. **App Bundle für Play Store**:
```powershell
cmd /c gradlew.bat bundleRelease
```

3. **Eigene Demo-Daten**:
   - Bearbeite `DemoDataProvider.kt`
   - Passe Posts und Kategorien an
   - Rebuild

4. **Branding anpassen**:
   - Logo in `app/src/main/res/mipmap/`
   - Farben in `ui/theme/Color.kt`
   - App-Name in `strings.xml`

## 🎉 Erfolg!

Die PRASCO Android App läuft jetzt komplett standalone ohne Server!

**Alle Features funktionieren**:
- ✅ Offline-Login
- ✅ Demo-Daten
- ✅ Posts verwalten
- ✅ Lokale Speicherung
- ✅ Kategorien
- ✅ Kein Server benötigt

**Viel Erfolg beim Testen!** 🚀

---

**Erstellt**: 10. Januar 2026  
**Version**: 1.0.0-standalone  
**Status**: ✅ Produktionsbereit
