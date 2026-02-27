package net.prasco.display.tv

import android.annotation.SuppressLint
import android.content.SharedPreferences
import android.graphics.Color
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
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.FragmentActivity

/**
 * PRASCO Display TV - Android TV Client App v2.0
 *
 * Vollwertige Android TV Client-Software für das PRASCO Digital Signage System.
 *
 * Features:
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

    // ============================================
    // Lifecycle
    // ============================================

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)

        // TV Fullscreen-Modus
        setupTVFullscreen()

        // WebView erstellen
        webView = WebView(this)
        setContentView(webView)

        // WebView konfigurieren
        setupWebView()

        // Server-URL laden und öffnen
        val serverUrl = getServerUrl()
        webView.loadUrl(serverUrl)

        // Auto-Reload starten (falls konfiguriert)
        if (AUTO_RELOAD_INTERVAL > 0) {
            scheduleAutoReload()
        }
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
                webView.loadUrl(getServerUrl())
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
     * Einstellungs-Dialog: Server-URL konfigurieren
     * Aufruf: 5x Menu-Taste auf der Fernbedienung
     */
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
            hint = "http://192.168.1.100:3000"
            setSelection(text.length)
        }

        val info = TextView(this).apply {
            text = "App Version: 2.0.0 | Menu × 5 = Einstellungen"
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
            .setPositiveButton("Speichern & Neu laden") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotEmpty()) {
                    saveServerUrl(newUrl)
                    webView.loadUrl(newUrl)
                    Toast.makeText(this, "Server-URL gespeichert: $newUrl", Toast.LENGTH_LONG).show()
                }
            }
            .setNeutralButton("Seite neu laden") { _, _ ->
                webView.reload()
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
