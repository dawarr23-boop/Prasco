package net.prasco.tv.webview

import android.webkit.ConsoleMessage
import android.webkit.JsResult
import android.webkit.WebChromeClient
import android.webkit.WebView
import net.prasco.tv.util.Logger

/**
 * Custom WebChromeClient für die PRASCO Display-Seite
 * Behandelt Console-Logs, JavaScript-Dialoge und Fullscreen-Video
 */
class PrascoWebChromeClient : WebChromeClient() {

    private var customViewCallback: CustomViewCallback? = null

    /**
     * JavaScript Console-Logs in Android Logcat weiterleiten
     */
    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
        consoleMessage?.let {
            val level = it.messageLevel()
            val message = it.message()
            val source = it.sourceId()
            val line = it.lineNumber()

            when (level) {
                ConsoleMessage.MessageLevel.ERROR -> {
                    Logger.error("[JS] $message", tag = "WebView-Console")
                }
                ConsoleMessage.MessageLevel.WARNING -> {
                    Logger.warn("[JS] $message", tag = "WebView-Console")
                }
                else -> {
                    Logger.webConsole(message, line, source)
                }
            }
        }
        return true
    }

    /**
     * JavaScript alert() Dialoge unterdrücken (Kiosk-Modus)
     */
    override fun onJsAlert(
        view: WebView?,
        url: String?,
        message: String?,
        result: JsResult?
    ): Boolean {
        Logger.warn("JS Alert unterdrückt: $message")
        result?.confirm()
        return true
    }

    /**
     * JavaScript confirm() Dialoge automatisch bestätigen
     */
    override fun onJsConfirm(
        view: WebView?,
        url: String?,
        message: String?,
        result: JsResult?
    ): Boolean {
        Logger.warn("JS Confirm automatisch bestätigt: $message")
        result?.confirm()
        return true
    }

    /**
     * Fullscreen-Video anzeigen (HTML5 Video Fullscreen)
     */
    override fun onShowCustomView(view: android.view.View?, callback: CustomViewCallback?) {
        Logger.debug("Video-Fullscreen aktiviert")
        customViewCallback = callback
        // Wird von MainActivity gehandhabt
    }

    /**
     * Fullscreen-Video beenden
     */
    override fun onHideCustomView() {
        Logger.debug("Video-Fullscreen deaktiviert")
        customViewCallback?.onCustomViewHidden()
        customViewCallback = null
    }

    /**
     * Seitentitel-Änderung loggen
     */
    override fun onReceivedTitle(view: WebView?, title: String?) {
        super.onReceivedTitle(view, title)
        Logger.debug("Seitentitel: $title")
    }

    /**
     * Ladefortschritt
     */
    override fun onProgressChanged(view: WebView?, newProgress: Int) {
        super.onProgressChanged(view, newProgress)
        if (newProgress == 100) {
            Logger.debug("Seite vollständig geladen (100%)")
        }
    }
}
