package net.prasco.display.tv

import android.annotation.SuppressLint
import android.content.SharedPreferences
import android.graphics.Color
import android.graphics.Typeface
import android.net.http.SslError
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.FragmentActivity
import kotlin.concurrent.thread

/**
 * PRASCO Display TV - Android TV Client App v2.1
 *
 * Vollwertige Android TV Client-Software für das PRASCO Digital Signage System.
 *
 * Features:
 * - Automatische Geräteregistrierung & Autorisierung
 * - TV Fullscreen Kiosk-Modus (Immersive Sticky)
 * - Fernbedienungs-Navigation (D-Pad → JavaScript Events)
 * - Automatischer Reconnect bei Verbindungsverlust
 * - Konfigurierbarer Auto-Reload
 * - Geheime Tasten-Kombination für Einstellungen (5x Menu)
 * - Persistente Server-URL Konfiguration (SharedPreferences)
 * - Hardware-beschleunigtes WebView-Rendering
 * - Blend-Effekte / Übergangsanimationen Support
 */
class MainActivity : FragmentActivity() {

    private lateinit var webView: WebView
    private lateinit var prefs: SharedPreferences
    private lateinit var registrationManager: DeviceRegistrationManager
    private val handler = Handler(Looper.getMainLooper())

    companion object {
        /** Standard Server-URL — wird durch gespeicherte Einstellung überschrieben */
        private const val DEFAULT_SERVER_URL = "https://212.227.20.158"
        private const val PREFS_NAME = "prasco_tv_prefs"
        private const val PREF_SERVER_URL = "server_url"

        /** Auto-Reload: 0 = deaktiviert, sonst Intervall in ms (z.B. 300000 = 5 Min) */
        private const val AUTO_RELOAD_INTERVAL = 0L

        /** Reconnect-Intervall bei Verbindungsverlust (ms) */
        private const val RECONNECT_INTERVAL = 15_000L

        /** Geheime Tasten-Kombination: So oft Menu drücken für Einstellungen */
        private const val SECRET_KEY_COUNT = 5
    }

    private var secretKeyPresses = 0
    private var isConnectionError = false
    private var reconnectRunnable: Runnable? = null
    private var statusPollRunnable: Runnable? = null
    private var heartbeatRunnable: Runnable? = null

    // ============================================
    // Lifecycle
    // ============================================

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        registrationManager = DeviceRegistrationManager(this)

        // TV Fullscreen-Modus
        setupTVFullscreen()

        // WebView erstellen
        webView = WebView(this)

        // WebView konfigurieren
        setupWebView()

        // Geräteregistrierung starten
        startDeviceRegistration()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        setupTVFullscreen()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        stopReconnect()
        stopStatusPolling()
        stopHeartbeat()
        handler.removeCallbacksAndMessages(null)
        webView.destroy()
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            setupTVFullscreen()
        }
    }

    // ============================================
    // Device Registration Flow
    // ============================================

    /**
     * Geräteregistrierung starten:
     * 1. Server-URL prüfen → ggf. Einstellungen zeigen
     * 2. Bei Server registrieren → Token erhalten
     * 3. Status prüfen → pending/authorized/rejected
     * 4. Bei "authorized" → Display laden
     * 5. Bei "pending" → Wartebildschirm zeigen, Status pollen
     */
    private fun startDeviceRegistration() {
        val serverUrl = getServerUrl()

        // Registrierungsbildschirm zeigen
        showRegistrationScreen("Verbinde mit PRASCO Server...")

        thread {
            val result = registrationManager.registerDevice(serverUrl)

            handler.post {
                if (result.success) {
                    handleAuthStatus(result.status, result.displayIdentifier)
                } else {
                    showRegistrationScreen(
                        "Registrierung fehlgeschlagen\n\n${result.error ?: "Unbekannter Fehler"}\n\n" +
                        "Server: $serverUrl\n\nAutomatischer Retry in 15 Sekunden..."
                    )
                    // Retry nach 15 Sekunden
                    handler.postDelayed({ startDeviceRegistration() }, RECONNECT_INTERVAL)
                }
            }
        }
    }

    /**
     * Autorisierungsstatus verarbeiten
     */
    private fun handleAuthStatus(status: String, displayIdentifier: String?) {
        when (status) {
            "authorized" -> {
                // Gerät autorisiert → Display laden
                loadAuthorizedDisplay(displayIdentifier)
            }
            "pending" -> {
                // Warten auf Admin-Freigabe
                showPendingScreen()
                startStatusPolling()
            }
            "rejected" -> {
                showRejectedScreen()
            }
            "revoked" -> {
                showRevokedScreen()
            }
            else -> {
                showRegistrationScreen("Unbekannter Status: $status")
            }
        }
    }

    /**
     * Autorisiertes Display laden
     */
    private fun loadAuthorizedDisplay(displayIdentifier: String?) {
        stopStatusPolling()
        startHeartbeat()

        val serverUrl = getServerUrl()
        val url = if (displayIdentifier != null && displayIdentifier.isNotEmpty()) {
            "$serverUrl/display/$displayIdentifier"
        } else {
            serverUrl
        }

        setContentView(webView)
        webView.loadUrl(url)

        // Auto-Reload starten (falls konfiguriert)
        if (AUTO_RELOAD_INTERVAL > 0) {
            scheduleAutoReload()
        }
    }

    // ============================================
    // Status-Bildschirme
    // ============================================

    @SuppressLint("SetTextI18n")
    private fun showRegistrationScreen(message: String) {
        val layout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#1a1a1a"))
        }

        val innerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(64, 64, 64, 64)
        }

        val logo = TextView(this).apply {
            text = "PRASCO"
            setTextColor(Color.parseColor("#4a9eff"))
            textSize = 36f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        val progress = ProgressBar(this).apply {
            setPadding(0, 0, 0, 24)
        }

        val messageView = TextView(this).apply {
            text = message
            setTextColor(Color.WHITE)
            textSize = 18f
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 0)
        }

        innerLayout.addView(logo)
        innerLayout.addView(progress)
        innerLayout.addView(messageView)

        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply { gravity = Gravity.CENTER }

        layout.addView(innerLayout, params)
        setContentView(layout)
    }

    @SuppressLint("SetTextI18n")
    private fun showPendingScreen() {
        val layout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#1a1a1a"))
        }

        val innerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(64, 64, 64, 64)
        }

        val logo = TextView(this).apply {
            text = "PRASCO"
            setTextColor(Color.parseColor("#4a9eff"))
            textSize = 36f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        val icon = TextView(this).apply {
            text = "⏳"
            textSize = 48f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        val title = TextView(this).apply {
            text = "Autorisierung ausstehend"
            setTextColor(Color.parseColor("#ffaa00"))
            textSize = 24f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }

        val serial = DeviceIdentifier.getSerialNumber(this@MainActivity)
        val model = DeviceIdentifier.getDeviceModel()

        val details = TextView(this).apply {
            text = "Dieses Gerät wurde beim Server registriert.\n\n" +
                    "Bitte autorisieren Sie das Gerät im Admin-Panel:\n\n" +
                    "Modell: $model\n" +
                    "Seriennummer: $serial\n\n" +
                    "Server: ${getServerUrl()}"
            setTextColor(Color.parseColor("#cccccc"))
            textSize = 16f
            gravity = Gravity.CENTER
        }

        val progress = ProgressBar(this).apply {
            setPadding(0, 32, 0, 0)
        }

        innerLayout.addView(logo)
        innerLayout.addView(icon)
        innerLayout.addView(title)
        innerLayout.addView(details)
        innerLayout.addView(progress)

        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply { gravity = Gravity.CENTER }

        layout.addView(innerLayout, params)
        setContentView(layout)
    }

    @SuppressLint("SetTextI18n")
    private fun showRejectedScreen() {
        val layout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#1a1a1a"))
        }

        val innerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(64, 64, 64, 64)
        }

        val logo = TextView(this).apply {
            text = "PRASCO"
            setTextColor(Color.parseColor("#4a9eff"))
            textSize = 36f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        val icon = TextView(this).apply {
            text = "🚫"
            textSize = 48f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        val title = TextView(this).apply {
            text = "Gerät abgelehnt"
            setTextColor(Color.parseColor("#ff4444"))
            textSize = 24f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }

        val details = TextView(this).apply {
            text = "Dieses Gerät wurde vom Administrator abgelehnt.\n\n" +
                    "Bitte kontaktieren Sie den Systemadministrator."
            setTextColor(Color.parseColor("#cccccc"))
            textSize = 16f
            gravity = Gravity.CENTER
        }

        innerLayout.addView(logo)
        innerLayout.addView(icon)
        innerLayout.addView(title)
        innerLayout.addView(details)

        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply { gravity = Gravity.CENTER }

        layout.addView(innerLayout, params)
        setContentView(layout)
    }

    @SuppressLint("SetTextI18n")
    private fun showRevokedScreen() {
        val layout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#1a1a1a"))
        }

        val innerLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(64, 64, 64, 64)
        }

        val logo = TextView(this).apply {
            text = "PRASCO"
            setTextColor(Color.parseColor("#4a9eff"))
            textSize = 36f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        val icon = TextView(this).apply {
            text = "🔒"
            textSize = 48f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        val title = TextView(this).apply {
            text = "Autorisierung widerrufen"
            setTextColor(Color.parseColor("#ff8800"))
            textSize = 24f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }

        val details = TextView(this).apply {
            text = "Die Autorisierung für dieses Gerät wurde widerrufen.\n\n" +
                    "Bitte kontaktieren Sie den Systemadministrator."
            setTextColor(Color.parseColor("#cccccc"))
            textSize = 16f
            gravity = Gravity.CENTER
        }

        innerLayout.addView(logo)
        innerLayout.addView(icon)
        innerLayout.addView(title)
        innerLayout.addView(details)

        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply { gravity = Gravity.CENTER }

        layout.addView(innerLayout, params)
        setContentView(layout)
    }

    // ============================================
    // Status Polling (für Pending-Status)
    // ============================================

    private fun startStatusPolling() {
        stopStatusPolling()
        statusPollRunnable = object : Runnable {
            override fun run() {
                thread {
                    val status = registrationManager.checkStatus(getServerUrl())
                    handler.post {
                        if (status != null && status != "pending") {
                            handleAuthStatus(status, registrationManager.getDisplayIdentifier())
                        } else {
                            // Weiter pollen
                            statusPollRunnable?.let {
                                handler.postDelayed(it, DeviceRegistrationManager.STATUS_POLL_INTERVAL)
                            }
                        }
                    }
                }
            }
        }
        handler.postDelayed(statusPollRunnable!!, DeviceRegistrationManager.STATUS_POLL_INTERVAL)
    }

    private fun stopStatusPolling() {
        statusPollRunnable?.let { handler.removeCallbacks(it) }
        statusPollRunnable = null
    }

    // ============================================
    // Heartbeat (für autorisierte Geräte)
    // ============================================

    private fun startHeartbeat() {
        stopHeartbeat()
        heartbeatRunnable = object : Runnable {
            override fun run() {
                thread {
                    registrationManager.sendHeartbeat(getServerUrl())
                    // Prüfen ob Autorisierung widerrufen wurde
                    val status = registrationManager.getAuthStatus()
                    handler.post {
                        if (status == "revoked" || status == "rejected") {
                            handleAuthStatus(status, null)
                        } else {
                            heartbeatRunnable?.let {
                                handler.postDelayed(it, DeviceRegistrationManager.HEARTBEAT_INTERVAL)
                            }
                        }
                    }
                }
            }
        }
        handler.postDelayed(heartbeatRunnable!!, DeviceRegistrationManager.HEARTBEAT_INTERVAL)
    }

    private fun stopHeartbeat() {
        heartbeatRunnable?.let { handler.removeCallbacks(it) }
        heartbeatRunnable = null
    }

    // ============================================
    // TV Fullscreen / Immersive Mode
    // ============================================

    private fun setupTVFullscreen() {
        // Display immer an
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Vollbild ohne System-UI (immersive sticky)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )
    }

    // ============================================
    // WebView Konfiguration
    // ============================================

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.webViewClient = PrascoWebViewClient()
        webView.webChromeClient = WebChromeClient()

        webView.settings.apply {
            // JavaScript (erforderlich für PRASCO)
            javaScriptEnabled = true

            // Storage (LocalStorage, SessionStorage, IndexedDB)
            domStorageEnabled = true
            databaseEnabled = true

            // Media ohne User-Geste abspielen (Videos, Hintergrundmusik)
            mediaPlaybackRequiresUserGesture = false

            // Mixed Content erlauben (HTTP-Ressourcen auf HTTPS-Seite)
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Cache
            cacheMode = WebSettings.LOAD_DEFAULT

            // File Access
            allowFileAccess = true

            // TV-optimierte Darstellung
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            // Rendering-Priorität
            @Suppress("DEPRECATION")
            setRenderPriority(WebSettings.RenderPriority.HIGH)
        }

        // Hardware-Beschleunigung für flüssige Blend-Effekte
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
    }

    /**
     * Custom WebViewClient mit Fehlerbehandlung und Auto-Reconnect
     */
    private inner class PrascoWebViewClient : WebViewClient() {

        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            return false // Alle URLs im WebView laden
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            if (isConnectionError) {
                isConnectionError = false
                stopReconnect()
            }
            // Cursor ausblenden (TV braucht keinen Mauszeiger)
            view?.evaluateJavascript("document.body.style.cursor='none';", null)
        }

        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            // Nur bei Hauptframe-Fehler reconnecten
            if (request?.isForMainFrame == true) {
                isConnectionError = true
                showConnectionError()
                startReconnect()
            }
        }

        @SuppressLint("WebViewClientOnReceivedSslError")
        override fun onReceivedSslError(
            view: WebView?,
            handler: SslErrorHandler?,
            error: SslError?
        ) {
            // SSL-Zertifikat akzeptieren (Server nutzt IP-basierte URL,
            // Zertifikat ist ggf. für Domainnamen ausgestellt)
            handler?.proceed()
        }
    }

    // ============================================
    // Verbindungsfehler & Auto-Reconnect
    // ============================================

    @SuppressLint("SetTextI18n")
    private fun showConnectionError() {
        val errorLayout = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#1a1a1a"))
        }

        val textView = TextView(this).apply {
            text = "Verbindung zum PRASCO Server wird hergestellt...\n\n${getServerUrl()}\n\nAutomatischer Reconnect aktiv"
            setTextColor(Color.WHITE)
            textSize = 20f
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
        }

        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ).apply { gravity = Gravity.CENTER }

        errorLayout.addView(textView, params)
        setContentView(errorLayout)
    }

    private fun startReconnect() {
        stopReconnect()
        reconnectRunnable = object : Runnable {
            override fun run() {
                // WebView wiederherstellen und erneut laden
                setContentView(webView)
                val identifier = registrationManager.getDisplayIdentifier()
                val url = if (identifier != null && identifier.isNotEmpty()) {
                    "${getServerUrl()}/display/$identifier"
                } else {
                    getServerUrl()
                }
                webView.loadUrl(url)
                handler.postDelayed(this, RECONNECT_INTERVAL)
            }
        }
        handler.postDelayed(reconnectRunnable!!, RECONNECT_INTERVAL)
    }

    private fun stopReconnect() {
        reconnectRunnable?.let { handler.removeCallbacks(it) }
        reconnectRunnable = null
    }

    // ============================================
    // Fernbedienung / Tastatur
    // ============================================

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            // D-Pad → an JavaScript weitergeben
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_CENTER -> {
                injectKeyEvent(keyCode)
                return true
            }

            // Zurück-Taste blockieren (Kiosk-Modus)
            KeyEvent.KEYCODE_BACK -> {
                return true
            }

            // Menu-Taste: 5x drücken → Einstellungen
            KeyEvent.KEYCODE_MENU -> {
                secretKeyPresses++
                if (secretKeyPresses >= SECRET_KEY_COUNT) {
                    secretKeyPresses = 0
                    openSettings()
                }
                return true
            }

            // Home-Taste kann nicht blockiert werden
            KeyEvent.KEYCODE_HOME -> {
                return super.onKeyDown(keyCode, event)
            }
        }

        // Andere Tasten → Secret-Key-Counter zurücksetzen
        secretKeyPresses = 0
        return super.onKeyDown(keyCode, event)
    }

    /**
     * Tastendruck als JavaScript KeyboardEvent an die PRASCO-Webseite senden
     */
    private fun injectKeyEvent(keyCode: Int) {
        val key = when (keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
            KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
            KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
            KeyEvent.KEYCODE_DPAD_CENTER -> "Enter"
            else -> return
        }

        val js = """
            (function() {
                var event = new KeyboardEvent('keydown', {
                    key: '$key',
                    code: '$key',
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(event);
            })();
        """.trimIndent()

        webView.evaluateJavascript(js, null)
    }

    // ============================================
    // Einstellungen (Server-URL konfigurieren)
    // ============================================

    private fun getServerUrl(): String {
        return prefs.getString(PREF_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
    }

    private fun saveServerUrl(url: String) {
        prefs.edit().putString(PREF_SERVER_URL, url).apply()
    }

    /**
     * Einstellungs-Dialog: Server-URL konfigurieren + Geräte-Info
     * Aufruf: 5x Menu-Taste auf der Fernbedienung
     */
    @SuppressLint("SetTextI18n")
    private fun openSettings() {
        val currentUrl = getServerUrl()

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 32, 48, 16)
        }

        val label = TextView(this).apply {
            text = "PRASCO Server URL:"
            setTextColor(Color.WHITE)
            textSize = 16f
        }

        val input = EditText(this).apply {
            setText(currentUrl)
            setTextColor(Color.WHITE)
            setHintTextColor(Color.GRAY)
            textSize = 18f
            isSingleLine = true
            hint = "https://212.227.20.158"
            setSelection(text.length)
        }

        val serial = DeviceIdentifier.getSerialNumber(this)
        val model = DeviceIdentifier.getDeviceModel()
        val authStatus = registrationManager.getAuthStatus()
        val displayId = registrationManager.getDisplayIdentifier() ?: "—"

        val info = TextView(this).apply {
            text = "App Version: 2.1.0 | Menu × 5 = Einstellungen\n" +
                    "Gerät: $model\n" +
                    "Seriennummer: $serial\n" +
                    "Autorisierung: $authStatus\n" +
                    "Display: $displayId"
            setTextColor(Color.GRAY)
            textSize = 12f
            setPadding(0, 16, 0, 0)
        }

        layout.addView(label)
        layout.addView(input)
        layout.addView(info)

        AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog)
            .setTitle("PRASCO TV Einstellungen")
            .setView(layout)
            .setPositiveButton("Speichern & Registrieren") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    saveServerUrl(newUrl)
                    registrationManager.clearRegistration()
                    startDeviceRegistration()
                    Toast.makeText(this, "Server-URL gespeichert: $newUrl — Registrierung gestartet", Toast.LENGTH_LONG).show()
                }
            }
            .setNeutralButton("Seite neu laden") { _, _ ->
                if (registrationManager.isAuthorized()) {
                    loadAuthorizedDisplay(registrationManager.getDisplayIdentifier())
                } else {
                    startDeviceRegistration()
                }
            }
            .setNegativeButton("Abbrechen", null)
            .show()
    }

    // ============================================
    // Auto-Reload
    // ============================================

    private fun scheduleAutoReload() {
        handler.postDelayed({
            if (!isConnectionError) {
                webView.reload()
            }
            scheduleAutoReload()
        }, AUTO_RELOAD_INTERVAL)
    }
}
