package net.prasco.display

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

/**
 * PRASCO Display - Android App
 * 
 * Hauptactivity für das digitale Schwarze Brett
 * Zeigt die PRASCO Display-Ansicht in einem WebView im Fullscreen-Modus
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    
    /**
     * PRASCO Server URL - Hier die eigene Server-URL eintragen!
     * 
     * Beispiele:
     * - Lokales Netzwerk: "http://192.168.1.100:3000"
     * - Hostname: "http://prasco.local:3000"
     * - Cloud-Server: "https://prasco.example.com"
     */
    private val SERVER_URL = "http://192.168.1.100:3000"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Fullscreen-Modus aktivieren und Display immer an
        setupFullscreenMode()
        
        // WebView erstellen und konfigurieren
        webView = WebView(this)
        setContentView(webView)
        
        // WebView Clients konfigurieren
        webView.webViewClient = PrascoWebViewClient()
        webView.webChromeClient = WebChromeClient()
        
        // WebView Einstellungen
        setupWebViewSettings()
        
        // URL laden
        webView.loadUrl(SERVER_URL)
    }

    /**
     * Fullscreen-Modus konfigurieren
     */
    private fun setupFullscreenMode() {
        // Display immer an
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Vollbild ohne System-UI
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
     * WebView Einstellungen konfigurieren
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebViewSettings() {
        val webSettings: WebSettings = webView.settings
        
        // JavaScript aktivieren (benötigt für PRASCO Display)
        webSettings.javaScriptEnabled = true
        
        // DOM Storage aktivieren (für LocalStorage)
        webSettings.domStorageEnabled = true
        
        // Database aktivieren
        webSettings.databaseEnabled = true
        
        // Cache-Modus
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        
        // File Access
        webSettings.allowFileAccess = true
        
        // Medien ohne User-Geste abspielen (für Auto-Play)
        webSettings.mediaPlaybackRequiresUserGesture = false
        
        // Hardware-Beschleunigung aktivieren
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        // Viewport anpassen
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true
        
        // Zoom deaktivieren
        webSettings.setSupportZoom(false)
        webSettings.builtInZoomControls = false
        webSettings.displayZoomControls = false
    }

    /**
     * Custom WebViewClient für bessere Kontrolle
     */
    private inner class PrascoWebViewClient : WebViewClient() {
        
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            // Alle URLs in der App laden (nicht im externen Browser öffnen)
            return false
        }
        
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            // Seite geladen - optional: Loading-Indicator ausblenden
        }
        
        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            // Fehlerbehandlung - optional: Fehlerseite anzeigen
        }
    }

    /**
     * Zurück-Taste für Kiosk-Modus deaktivieren
     * 
     * Für normale Navigation kommentiere diese Methode aus oder
     * implementiere WebView.goBack() Funktionalität
     */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Leer lassen für Kiosk-Modus (Zurück-Taste deaktiviert)
        
        // Alternative: Navigation in WebView
        // if (webView.canGoBack()) {
        //     webView.goBack()
        // } else {
        //     super.onBackPressed()
        // }
        
        // Alternative: Dialog zum Beenden
        // showExitDialog()
    }

    /**
     * Fullscreen-Modus nach Resume wiederherstellen
     */
    override fun onResume() {
        super.onResume()
        webView.onResume()
        setupFullscreenMode()
    }

    /**
     * WebView pausieren
     */
    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    /**
     * Cleanup beim Beenden
     */
    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
    }
    
    /**
     * Window Focus für Fullscreen-Modus
     */
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            setupFullscreenMode()
        }
    }
}
