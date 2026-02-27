package net.prasco.tv

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import net.prasco.tv.config.AppConfig
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.network.ConnectivityMonitor
import net.prasco.tv.network.HealthCheckWorker
import net.prasco.tv.network.PrascoApiClient
import net.prasco.tv.service.DisplayService
import net.prasco.tv.util.DeviceInfo
import net.prasco.tv.util.Logger
import net.prasco.tv.util.enableFullscreen
import net.prasco.tv.util.keepScreenOn
import net.prasco.tv.webview.JavaScriptBridge
import net.prasco.tv.webview.PrascoWebChromeClient
import net.prasco.tv.webview.PrascoWebViewClient
import net.prasco.tv.webview.WebViewPool

/**
 * Haupt-Activity der PRASCO TV App
 * Zeigt die PRASCO Display-Seite im WebView an
 */
class MainActivity : AppCompatActivity(),
    PrascoWebViewClient.WebViewClientListener,
    JavaScriptBridge.BridgeListener {

    private lateinit var preferencesManager: PreferencesManager
    private lateinit var connectivityMonitor: ConnectivityMonitor
    private var isViewsInitialized = false

    // UI-Elemente
    private lateinit var webView: WebView
    private lateinit var loadingOverlay: LinearLayout
    private lateinit var errorOverlay: LinearLayout
    private lateinit var errorTitle: TextView
    private lateinit var errorMessage: TextView
    private lateinit var errorRetryInfo: TextView
    private lateinit var btnRetry: Button
    private lateinit var statusOverlay: LinearLayout
    private lateinit var statusIcon: ImageView

    // Reconnect-Logik
    private val handler = Handler(Looper.getMainLooper())
    private var reconnectAttempt = 0
    private var reconnectDelay = AppConfig.RECONNECT_INITIAL_DELAY_MS
    private var isReconnecting = false

    // Settings-Zugang: Menu-Taste oder Langdruck auf Zurück
    private var menuPressCount = 0
    private var lastMenuPressTime = 0L
    private var backPressStartTime = 0L
    private val LONG_PRESS_THRESHOLD_MS = 3000L

    // Settings-Overlay
    private lateinit var settingsOverlay: FrameLayout
    private var isSettingsVisible = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)

        // Fullscreen nach setContentView (DecorView muss existieren)
        enableFullscreen()

        // Initialisierung
        preferencesManager = (application as PrascoApp).preferencesManager
        connectivityMonitor = ConnectivityMonitor(this)

        Logger.info("MainActivity gestartet – Gerät: ${DeviceInfo.getSummary(this)}")

        // Prüfen ob Setup bereits abgeschlossen
        if (!preferencesManager.isSetupCompleted) {
            Logger.info("Setup nicht abgeschlossen – starte Setup Wizard")
            startActivity(Intent(this, SetupWizardActivity::class.java))
            finish()
            return
        }

        // UI initialisieren
        initViews()
        setupWebView()
        setupConnectivityMonitoring()

        // Screen an lassen
        if (preferencesManager.screenAlwaysOn) {
            keepScreenOn(true)
        }

        // Health-Check starten
        HealthCheckWorker.schedule(this)

        // Foreground Service starten
        DisplayService.start(this)

        // Display-Seite laden
        loadDisplayPage()
    }

    private fun initViews() {
        webView = findViewById(R.id.webView)
        loadingOverlay = findViewById(R.id.loadingOverlay)
        errorOverlay = findViewById(R.id.errorOverlay)
        errorTitle = findViewById(R.id.errorTitle)
        errorMessage = findViewById(R.id.errorMessage)
        errorRetryInfo = findViewById(R.id.errorRetryInfo)
        btnRetry = findViewById(R.id.btnRetry)
        statusOverlay = findViewById(R.id.statusOverlay)
        statusIcon = findViewById(R.id.statusIcon)

        btnRetry.setOnClickListener {
            hideError()
            loadDisplayPage()
        }

        // Settings-Overlay initialisieren
        settingsOverlay = findViewById(R.id.settingsOverlay)
        setupSettingsOverlay()

        isViewsInitialized = true
    }

    /**
     * Settings-Overlay Buttons konfigurieren
     */
    private fun setupSettingsOverlay() {
        val serverUrlText = settingsOverlay.findViewById<TextView>(R.id.settingsServerUrl)
        val displayNameText = settingsOverlay.findViewById<TextView>(R.id.settingsDisplayName)
        val btnChangeServer = settingsOverlay.findViewById<Button>(R.id.btnSettingsChangeServer)
        val btnChangeDisplay = settingsOverlay.findViewById<Button>(R.id.btnSettingsChangeDisplay)
        val btnClearCache = settingsOverlay.findViewById<Button>(R.id.btnSettingsClearCache)
        val btnAutostart = settingsOverlay.findViewById<Button>(R.id.btnSettingsAutostart)
        val btnClose = settingsOverlay.findViewById<Button>(R.id.btnSettingsClose)

        // Aktuelle Werte anzeigen
        serverUrlText.text = preferencesManager.serverUrl
        val dispName = preferencesManager.displayName
        val dispId = preferencesManager.displayIdentifier
        displayNameText.text = if (dispId.isNotEmpty()) "$dispName ($dispId)" else dispName

        // Autostart-Status
        updateAutostartButton(btnAutostart)

        btnChangeServer.setOnClickListener {
            hideSettingsOverlay()
            // Setup komplett neu starten
            preferencesManager.isSetupCompleted = false
            startActivity(Intent(this, SetupWizardActivity::class.java))
            finish()
        }

        btnChangeDisplay.setOnClickListener {
            hideSettingsOverlay()
            // Nur Display-Auswahl neu starten (Setup mit Step 2)
            preferencesManager.isSetupCompleted = false
            startActivity(Intent(this, SetupWizardActivity::class.java))
            finish()
        }

        btnClearCache.setOnClickListener {
            webView.clearCache(true)
            preferencesManager.lastCacheUpdate = 0
            hideSettingsOverlay()
            loadDisplayPage()
            Logger.info("Cache geleert, Seite wird neu geladen")
        }

        btnAutostart.setOnClickListener {
            preferencesManager.isAutoStartEnabled = !preferencesManager.isAutoStartEnabled
            updateAutostartButton(btnAutostart)
        }

        btnClose.setOnClickListener {
            hideSettingsOverlay()
        }
    }

    private fun updateAutostartButton(btn: Button) {
        val enabled = preferencesManager.isAutoStartEnabled
        btn.text = getString(R.string.settings_autostart) + ": " + if (enabled) "AN" else "AUS"
    }

    private fun showSettingsOverlay() {
        // Werte aktualisieren
        settingsOverlay.findViewById<TextView>(R.id.settingsServerUrl).text = preferencesManager.serverUrl
        val dispName = preferencesManager.displayName
        val dispId = preferencesManager.displayIdentifier
        settingsOverlay.findViewById<TextView>(R.id.settingsDisplayName).text =
            if (dispId.isNotEmpty()) "$dispName ($dispId)" else dispName

        settingsOverlay.visibility = View.VISIBLE
        isSettingsVisible = true
        settingsOverlay.findViewById<Button>(R.id.btnSettingsClose).requestFocus()
        Logger.info("Settings-Overlay geöffnet")
    }

    private fun hideSettingsOverlay() {
        settingsOverlay.visibility = View.GONE
        isSettingsVisible = false
    }

    private fun setupWebView() {
        WebViewPool.configureWebView(webView, this)

        // WebViewClient für Fehler-Handling + SSL-Proxy
        val serverHost = try {
            android.net.Uri.parse(preferencesManager.serverUrl).host ?: ""
        } catch (_: Exception) { "" }
        webView.webViewClient = PrascoWebViewClient(this, this, serverHost)

        // Chrome Client für Console-Logs und Video
        webView.webChromeClient = PrascoWebChromeClient()

        // JavaScript Bridge registrieren
        val bridge = JavaScriptBridge(preferencesManager, this)
        webView.addJavascriptInterface(bridge, JavaScriptBridge.INTERFACE_NAME)

        Logger.info("WebView konfiguriert mit JS-Bridge '${JavaScriptBridge.INTERFACE_NAME}'")
    }

    private fun setupConnectivityMonitoring() {
        connectivityMonitor.startMonitoring()

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                connectivityMonitor.isConnected.collect { isConnected ->
                    Logger.info("Netzwerk-Status: ${if (isConnected) "Verbunden" else "Getrennt"}")
                    updateStatusOverlay(isConnected)

                    if (isConnected && isReconnecting) {
                        Logger.info("Netzwerk wiederhergestellt – lade Seite neu")
                        reconnectAttempt = 0
                        reconnectDelay = AppConfig.RECONNECT_INITIAL_DELAY_MS
                        isReconnecting = false
                        loadDisplayPage()
                    } else if (!isConnected) {
                        isReconnecting = true
                    }
                }
            }
        }
    }

    /**
     * Display-Seite vom PRASCO-Server laden
     */
    private fun loadDisplayPage() {
        val serverUrl = preferencesManager.serverUrl
        val displayId = preferencesManager.displayIdentifier.ifEmpty { null }
        val displayUrl = AppConfig.getDisplayUrl(serverUrl, displayId)

        Logger.info("Lade Display-Seite: $displayUrl")
        showLoading()
        webView.loadUrl(displayUrl)
    }

    /**
     * Auto-Reconnect mit Exponential Backoff
     */
    private fun scheduleReconnect() {
        if (!isReconnecting) return

        reconnectAttempt++
        val delayMs = reconnectDelay.coerceAtMost(AppConfig.RECONNECT_MAX_DELAY_MS)

        Logger.info("Reconnect #$reconnectAttempt in ${delayMs / 1000}s")
        runOnUiThread {
            errorRetryInfo.text = getString(R.string.error_retry_countdown, reconnectAttempt, delayMs / 1000)
        }

        handler.postDelayed({
            if (isReconnecting && lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)) {
                loadDisplayPage()
            }
        }, delayMs)

        reconnectDelay = (reconnectDelay * AppConfig.RECONNECT_BACKOFF_MULTIPLIER).toLong()
    }

    // === WebViewClient Callbacks ===

    override fun onPageStarted(url: String) {
        runOnUiThread { showLoading() }
    }

    override fun onPageFinished(url: String) {
        runOnUiThread {
            hideLoading()
            hideError()
            // CSS-Override: TV-Anpassungen (Overscan, Vollbild-Video, Logo/Uhr)
            val css = """
                body, #bulletin-board {
                    height: 100vh !important;
                    max-height: 100vh !important;
                    overflow: hidden !important;
                }
                .display-main {
                    padding: 0.5rem !important;
                }
                .post-container {
                    max-width: 100% !important;
                }
                .post {
                    padding: 0.5rem !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }
                .post img, .post video, .post iframe {
                    max-height: 85vh !important;
                    max-width: 100% !important;
                    width: auto !important;
                    border-radius: 0 !important;
                }
                .post iframe {
                    width: 100% !important;
                    height: 85vh !important;
                }
                .post.type-video {
                    padding: 0 !important;
                }
                .video-fullscreen-container {
                    transform: scale(1.0526) !important;
                    transform-origin: center center !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    z-index: 9999 !important;
                }
                .video-fullscreen-container iframe,
                .video-fullscreen-container video {
                    width: 100% !important;
                    height: 100% !important;
                    max-height: 100% !important;
                    object-fit: contain !important;
                }
                .logo-image { max-height: 32px !important; }
                .logo { font-size: 1.08rem !important; }
                .clock { font-size: 1.08rem !important; }
            """.trimIndent().replace("\n", " ")
            val js = "javascript:(function(){" +
                "var s=document.createElement('style');" +
                "s.textContent='$css';" +
                "document.head.appendChild(s);" +
                // MutationObserver: YouTube-Autoplay bei jedem Post-Wechsel erzwingen
                "var obs=new MutationObserver(function(muts){" +
                "muts.forEach(function(m){" +
                "m.addedNodes.forEach(function(n){" +
                "if(!n.querySelectorAll)return;" +
                "var iframes=n.querySelectorAll('iframe[src*=youtube]');" +
                "iframes.forEach(function(f){" +
                "setTimeout(function(){" +
                "var src=f.src;" +
                "f.src='';" +
                "setTimeout(function(){f.src=src;},100);" +
                "},500);" +
                "});" +
                "});" +
                "});" +
                "});" +
                "var cp=document.getElementById('current-post');" +
                "if(cp)obs.observe(cp,{childList:true,subtree:true});" +
                "})()"
            webView.loadUrl(js)
        }
        reconnectAttempt = 0
        reconnectDelay = AppConfig.RECONNECT_INITIAL_DELAY_MS
        isReconnecting = false
        Logger.info("Display-Seite geladen: $url")
    }

    override fun onPageError(errorCode: Int, description: String, url: String) {
        runOnUiThread {
            showError(
                getString(R.string.error_page_load_title),
                getString(R.string.error_page_load_message, description)
            )
        }
        isReconnecting = true
        scheduleReconnect()
    }

    override fun onServerUnreachable(url: String) {
        isReconnecting = true
        runOnUiThread {
            showError(
                getString(R.string.error_connection_title),
                getString(R.string.error_connection_message)
            )
        }
        scheduleReconnect()
    }

    // === JavaScriptBridge Callbacks ===

    override fun onRestartRequested() {
        Logger.info("App-Neustart angefordert")
        handler.postDelayed({
            val intent = packageManager.getLaunchIntentForPackage(packageName)
            intent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            finish()
        }, 500)
    }

    override fun onOpenSettingsRequested() {
        openSettings()
    }

    override fun onDisplayReady() {
        Logger.info("Display meldet: Bereit")
        runOnUiThread {
            hideLoading()
            hideError()
        }
    }

    override fun onLog(level: String, message: String) {
        when (level.uppercase()) {
            "ERROR" -> Logger.error("[JS-Bridge] $message")
            "DEBUG" -> Logger.debug("[JS-Bridge] $message")
            else -> Logger.info("[JS-Bridge] $message")
        }
    }

    override fun getContext(): Context = this

    // === D-Pad & Remote-Steuerung ===

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            // Menu-Taste → Settings-Overlay direkt öffnen
            KeyEvent.KEYCODE_MENU,
            KeyEvent.KEYCODE_BOOKMARK -> {
                if (isSettingsVisible) {
                    hideSettingsOverlay()
                } else {
                    showSettingsOverlay()
                }
                return true
            }
            // Back-Button: Langdruck → Settings, Kurzdruck → blockiert
            KeyEvent.KEYCODE_BACK -> {
                if (isSettingsVisible) {
                    hideSettingsOverlay()
                    return true
                }
                if (event?.repeatCount == 0) {
                    backPressStartTime = System.currentTimeMillis()
                }
                // Langdruck erkennen (event.repeatCount > 0 bei gehaltenem Button)
                if (event != null && event.repeatCount > 0) {
                    val elapsed = System.currentTimeMillis() - backPressStartTime
                    if (elapsed >= LONG_PRESS_THRESHOLD_MS && !isSettingsVisible) {
                        showSettingsOverlay()
                        backPressStartTime = 0 // Reset damit nicht mehrfach feuert
                        return true
                    }
                }
                // Kurzdruck blockieren (Kiosk)
                return true
            }
            // D-Pad Tasten an WebView weiterleiten
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_CENTER -> {
                if (!isSettingsVisible) {
                    injectDPadEvent(keyCode)
                    return true
                }
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            backPressStartTime = 0
            return true
        }
        return super.onKeyUp(keyCode, event)
    }

    /**
     * Settings öffnen – via Overlay statt separater Activity
     */
    private fun openSettings() {
        showSettingsOverlay()
    }

    /**
     * D-Pad Events als Custom JavaScript Events injizieren
     */
    private fun injectDPadEvent(keyCode: Int) {
        val direction = when (keyCode) {
            KeyEvent.KEYCODE_DPAD_UP -> "up"
            KeyEvent.KEYCODE_DPAD_DOWN -> "down"
            KeyEvent.KEYCODE_DPAD_LEFT -> "left"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "right"
            KeyEvent.KEYCODE_DPAD_CENTER -> "center"
            else -> return
        }

        val js = """
            (function() {
                var event = new CustomEvent('prascoRemote', {
                    detail: { key: '$direction', timestamp: Date.now() }
                });
                document.dispatchEvent(event);
            })();
        """.trimIndent()

        WebViewPool.evaluateJavaScript(webView, js)
    }

    // === UI-Helfer ===

    private fun showLoading() {
        loadingOverlay.visibility = View.VISIBLE
        errorOverlay.visibility = View.GONE
    }

    private fun hideLoading() {
        loadingOverlay.visibility = View.GONE
    }

    private fun showError(title: String, message: String) {
        loadingOverlay.visibility = View.GONE
        errorOverlay.visibility = View.VISIBLE
        errorTitle.text = title
        errorMessage.text = message
        btnRetry.requestFocus()
    }

    private fun hideError() {
        errorOverlay.visibility = View.GONE
    }

    private fun updateStatusOverlay(isConnected: Boolean) {
        if (preferencesManager.showStatusOverlay) {
            statusOverlay.visibility = View.VISIBLE
            statusIcon.setImageResource(
                if (isConnected) android.R.drawable.presence_online
                else android.R.drawable.presence_busy
            )

            // Nach 5 Sekunden ausblenden wenn verbunden
            if (isConnected) {
                handler.postDelayed({
                    statusOverlay.visibility = View.GONE
                }, 5000)
            }
        }
    }

    // === Lifecycle ===

    override fun onResume() {
        super.onResume()
        enableFullscreen()
        if (isViewsInitialized) {
            webView.onResume()
            // Bei Rückkehr aus Hintergrund: Posts manuell refreshen
            // (JavaScript setInterval kann im Hintergrund einfrieren)
            webView.evaluateJavascript(
                "if(typeof fetchPosts==='function'){fetchPosts().then(function(){if(typeof displayCurrentPost==='function')displayCurrentPost();});}", null
            )
        }
    }

    override fun onPause() {
        if (isViewsInitialized) webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        if (::connectivityMonitor.isInitialized) connectivityMonitor.stopMonitoring()
        if (isViewsInitialized) WebViewPool.destroyWebView(webView)
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            enableFullscreen()
        }
    }
}
