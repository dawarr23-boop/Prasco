# Changelog

Alle nennenswerten Änderungen an der PRASCO Android TV App.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [0.1.0] - 2024-01-15

### Hinzugefügt

- **Projekt-Scaffold:** Gradle KTS Build-System (AGP 8.2.0, Kotlin 1.9.20, Gradle 8.5)
- **Core:** PrascoApp, AppConfig, PreferencesManager, Logger, Extensions, DeviceInfo
- **WebView:** PrascoWebViewClient, PrascoWebChromeClient, JavaScriptBridge, WebViewPool
- **Network:** PrascoApiClient (Retrofit 2), ApiModels, ConnectivityMonitor, HealthCheckWorker
- **UI:** MainActivity (Fullscreen WebView), SettingsActivity, SetupWizardActivity
- **Overlays:** StatusOverlay, ErrorOverlay mit Auto-Reconnect
- **Services:** DisplayService (Foreground + WakeLock), BootReceiver (Auto-Start)
- **Cache:** Room Database (CachedPost, CachedMedia), OfflineCacheManager
- **Resources:** Strings (DE + EN), Colors, Themes, Dimens, Network Security Config
- **Offline:** Fallback HTML-Seite, Offline-Cache mit generierten Inhalten
- **D-Pad:** Fernbedienungs-Navigation, 5× Menü für Settings
- **Kiosk:** Back-Button-Sperre, Fullscreen, Screen Always On
- **Docs:** README, API-Integration, Build Guide, Deployment, Architektur
- **CI/CD:** GitHub Actions Build Workflow, VS Code Tasks
- **Scripts:** install-on-device (PS1/SH), generate-keystore, build-release
