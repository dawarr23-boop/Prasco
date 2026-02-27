package net.prasco.tv.webview

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.webkit.WebSettings
import android.webkit.WebView
import net.prasco.tv.BuildConfig
import net.prasco.tv.util.Logger

/**
 * WebView Lifecycle & Configuration Management
 * Zentralisiert WebView-Konfiguration und Ressourcen-Management
 */
object WebViewPool {

    /**
     * WebView mit optimalen Einstellungen für PRASCO Digital Signage konfigurieren
     */
    @SuppressLint("SetJavaScriptEnabled")
    fun configureWebView(webView: WebView, context: Context) {
        Logger.debug("WebView wird konfiguriert...")

        webView.settings.apply {
            // JavaScript ist erforderlich für display.js
            javaScriptEnabled = true

            // DOM Storage für die Display-Logik
            domStorageEnabled = true

            // Cache-Einstellungen
            cacheMode = WebSettings.LOAD_DEFAULT
            databaseEnabled = true

            // Medien-Einstellungen
            mediaPlaybackRequiresUserGesture = false  // Auto-Play für Videos
            loadWithOverviewMode = true
            useWideViewPort = true

            // Zoom deaktivieren (TV braucht keinen Zoom)
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)

            // Mixed Content erlauben (HTTP-Medien auf HTTPS-Seite)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            // Encoding
            defaultTextEncodingName = "UTF-8"

            // Allow file access (für offline_display.html aus raw/)
            allowFileAccess = true
            allowContentAccess = true

            // Deprecated aber nötig für ältere APIs
            @Suppress("DEPRECATION")
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
            }

            // User Agent mit PRASCO-Kennung ergänzen
            val defaultUserAgent = userAgentString
            userAgentString = "$defaultUserAgent PrascoTV/${BuildConfig.VERSION_NAME}"
        }

        // Hardware-Beschleunigung
        webView.setLayerType(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                android.view.View.LAYER_TYPE_HARDWARE
            } else {
                android.view.View.LAYER_TYPE_SOFTWARE
            },
            null
        )

        // Scrollbar ausblenden (Digital Signage braucht keine)
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        // Overscroll deaktivieren
        webView.overScrollMode = android.view.View.OVER_SCROLL_NEVER

        // Hintergrundfarbe (Schwarz, damit kein weißer Flash beim Laden)
        webView.setBackgroundColor(android.graphics.Color.BLACK)

        // Debug-Modus für Chrome DevTools
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
            Logger.debug("WebView Remote-Debugging aktiviert (chrome://inspect)")
        }

        Logger.info("WebView konfiguriert – UA: ${webView.settings.userAgentString}")
    }

    /**
     * WebView-Ressourcen freigeben
     */
    fun destroyWebView(webView: WebView?) {
        webView?.let {
            Logger.debug("WebView wird zerstört")
            it.stopLoading()
            it.clearHistory()
            it.clearCache(true)
            it.loadUrl("about:blank")
            it.onPause()
            it.removeAllViews()
            it.destroy()
        }
    }

    /**
     * WebView-Cache leeren
     */
    fun clearCache(webView: WebView?) {
        webView?.let {
            it.clearCache(true)
            it.clearHistory()
            it.clearFormData()
            Logger.info("WebView Cache geleert")
        }
    }

    /**
     * JavaScript in WebView ausführen
     */
    fun evaluateJavaScript(webView: WebView?, script: String, callback: ((String) -> Unit)? = null) {
        webView?.evaluateJavascript(script) { result ->
            callback?.invoke(result ?: "null")
        }
    }
}
