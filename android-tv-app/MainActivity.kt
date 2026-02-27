package net.prasco.display.tv

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Process
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.annotation.RequiresApi
import androidx.fragment.app.FragmentActivity

/**
 * PRASCO Display TV - Android TV App
 * 
 * Optimiert für Android TV mit Fernbedienungs-Support und Kiosk-Modus
 */
class MainActivity : FragmentActivity() {

    private lateinit var webView: WebView
    
    /**
     * PRASCO Server URL - Hier anpassen!
     * 
     * Beispiele:
     * - Lokales Netzwerk: "http://192.168.1.100:3000"
     * - Hostname: "http://prasco.local:3000"
     * - Cloud-Server: "https://prasco.example.com"
     */
    private val SERVER_URL = "http://192.168.1.100:3000"
    
    /**
     * Auto-Reload Intervall in Millisekunden
     * 0 = deaktiviert
     * 300000 = 5 Minuten
     */
    private val AUTO_RELOAD_INTERVAL = 0L
    
    /**
     * Geheime Tasten-Kombination für Einstellungen
     */
    private var secretKeyPresses = 0
    private val SECRET_KEY_COUNT = 5

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Rendering-Thread auf höchste Display-Priorität setzen
        Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY)
        
        // TV Fullscreen-Modus
        setupTVFullscreen()
        
        // WebView erstellen
        webView = WebView(this)
        setContentView(webView)
        
        // WebView konfigurieren
        setupWebView()
        
        // URL laden
        webView.loadUrl(SERVER_URL)
        
        // Optional: Auto-Reload
        if (AUTO_RELOAD_INTERVAL > 0) {
            scheduleAutoReload()
        }
    }

    /**
     * TV Fullscreen-Modus konfigurieren
     */
    private fun setupTVFullscreen() {
        // Display immer an
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Vollbild ohne System-UI (immersive mode)
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

    /**
     * WebView für TV konfigurieren
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // WebView Clients
        webView.webViewClient = PrascoWebViewClient()
        webView.webChromeClient = WebChromeClient()
        
        // Schwarzer Hintergrund – verhindert weißes Aufblitzen zwischen Animationen
        webView.setBackgroundColor(Color.BLACK)
        
        // Hardware-Layer für GPU-Compositing (CSS-Animationen laufen auf GPU)
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        // Renderer-Priorität: WICHTIG bleibt auch im Hintergrund aktiv
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true)
        }
        
        // WebView Einstellungen
        val settings = webView.settings
        
        // JavaScript aktivieren
        settings.javaScriptEnabled = true
        
        // Storage aktivieren
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        
        // Media ohne User-Geste abspielen
        settings.mediaPlaybackRequiresUserGesture = false
        
        // Cache: Netzwerk bevorzugen, Cache als Fallback (weniger Ladezeit)
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        
        // File Access
        settings.allowFileAccess = true
        
        // TV-optimierte Einstellungen
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        
        // Korrekter initialer Zoom für TV (100% = kein Zoom)
        settings.initialScale = 100
        
        // Rendering-Priorität maximieren
        @Suppress("DEPRECATION")
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH)
        
        // Sanftes Scrollen (hilft auch bei Animationen)
        @Suppress("DEPRECATION")
        settings.setEnableSmoothTransition(true)
    }

    /**
     * Custom WebViewClient
     */
    private inner class PrascoWebViewClient : WebViewClient() {
        
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            // Alle URLs in der App laden
            return false
        }
        
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            // Seite geladen
        }
        
        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            // Fehlerbehandlung
        }
    }

    /**
     * Fernbedienungs-Tasten behandeln
     */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            // D-Pad Tasten - optional an JavaScript weitergeben
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_DPAD_UP,
            KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_CENTER -> {
                // Optional: Tasten-Events an JavaScript senden
                injectKeyEvent(keyCode)
                return true
            }
            
            // Zurück-Taste blockieren (Kiosk-Modus)
            KeyEvent.KEYCODE_BACK -> {
                return true // Event konsumieren = Taste blockieren
            }
            
            // Menu-Taste (5x) für Einstellungen
            KeyEvent.KEYCODE_MENU -> {
                secretKeyPresses++
                if (secretKeyPresses >= SECRET_KEY_COUNT) {
                    secretKeyPresses = 0
                    openSettings()
                    return true
                }
                return true
            }
            
            // Home-Taste (kann nicht blockiert werden)
            KeyEvent.KEYCODE_HOME -> {
                return super.onKeyDown(keyCode, event)
            }
        }
        
        // Reset secret key counter bei anderen Tasten
        secretKeyPresses = 0
        
        return super.onKeyDown(keyCode, event)
    }
    
    /**
     * Tastendruck an JavaScript weitergeben (optional)
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
            var event = new KeyboardEvent('keydown', {
                key: '$key',
                code: '$key',
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        """.trimIndent()
        
        webView.evaluateJavascript(js, null)
    }

    /**
     * Einstellungen öffnen (optional implementieren)
     */
    private fun openSettings() {
        // TODO: Implementiere Settings Activity
        // val intent = Intent(this, SettingsActivity::class.java)
        // startActivity(intent)
    }

    /**
     * Auto-Reload planen
     */
    private fun scheduleAutoReload() {
        webView.postDelayed({
            webView.reload()
            scheduleAutoReload()
        }, AUTO_RELOAD_INTERVAL)
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
        super.onDestroy()
        webView.destroy()
    }
    
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            setupTVFullscreen()
        }
    }
}
