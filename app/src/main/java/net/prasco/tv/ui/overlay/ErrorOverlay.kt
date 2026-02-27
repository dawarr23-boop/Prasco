package net.prasco.tv.ui.overlay

import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import net.prasco.tv.R
import net.prasco.tv.util.Logger

/**
 * Nativer Fehler-Overlay
 * Wird bei Verbindungsproblemen über dem WebView angezeigt
 */
class ErrorOverlay(private val rootView: View) {

    private val errorOverlay: LinearLayout = rootView.findViewById(R.id.errorOverlay)
    private val errorTitle: TextView = rootView.findViewById(R.id.errorTitle)
    private val errorMessage: TextView = rootView.findViewById(R.id.errorMessage)
    private val errorRetryInfo: TextView = rootView.findViewById(R.id.errorRetryInfo)
    private val btnRetry: Button = rootView.findViewById(R.id.btnRetry)

    /**
     * Fehler anzeigen
     */
    fun show(title: String, message: String, retryInfo: String? = null) {
        Logger.warn("Fehler-Overlay angezeigt: $title – $message")

        errorOverlay.visibility = View.VISIBLE
        errorTitle.text = title
        errorMessage.text = message

        if (retryInfo != null) {
            errorRetryInfo.visibility = View.VISIBLE
            errorRetryInfo.text = retryInfo
        } else {
            errorRetryInfo.visibility = View.GONE
        }
    }

    /**
     * Fehler ausblenden
     */
    fun hide() {
        errorOverlay.visibility = View.GONE
    }

    /**
     * Retry-Button Listener setzen
     */
    fun setOnRetryListener(listener: () -> Unit) {
        btnRetry.setOnClickListener { listener() }
    }

    /**
     * Retry-Info Text aktualisieren (für Countdown)
     */
    fun updateRetryInfo(text: String) {
        errorRetryInfo.visibility = View.VISIBLE
        errorRetryInfo.text = text
    }

    val isVisible: Boolean
        get() = errorOverlay.visibility == View.VISIBLE
}
