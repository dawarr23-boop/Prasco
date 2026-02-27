package net.prasco.tv.ui.overlay

import android.content.Context
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import net.prasco.tv.R
import net.prasco.tv.util.Logger

/**
 * Nativer Status-Overlay (oben rechts)
 * Zeigt den Verbindungsstatus als kleines Icon
 */
class StatusOverlay(
    private val context: Context,
    private val rootView: View
) {
    private val statusOverlay: LinearLayout = rootView.findViewById(R.id.statusOverlay)
    private val statusIcon: ImageView = rootView.findViewById(R.id.statusIcon)
    private val statusText: TextView = rootView.findViewById(R.id.statusText)

    private var isVisible = false

    /**
     * Verbindungsstatus aktualisieren
     */
    fun updateConnectionStatus(connected: Boolean) {
        statusOverlay.visibility = View.VISIBLE
        isVisible = true

        if (connected) {
            statusIcon.setImageResource(android.R.drawable.presence_online)
            statusText.text = context.getString(R.string.status_connected)
        } else {
            statusIcon.setImageResource(android.R.drawable.presence_offline)
            statusText.text = context.getString(R.string.status_disconnected)
        }

        // Status-Overlay nach 5 Sekunden wieder ausblenden (wenn verbunden)
        if (connected) {
            statusOverlay.postDelayed({
                if (isVisible) {
                    statusOverlay.animate()
                        .alpha(0f)
                        .setDuration(500)
                        .withEndAction {
                            statusOverlay.visibility = View.GONE
                            statusOverlay.alpha = 0.7f
                            isVisible = false
                        }
                        .start()
                }
            }, 5000)
        }
    }

    /**
     * Overlay manuell anzeigen
     */
    fun show() {
        statusOverlay.visibility = View.VISIBLE
        statusOverlay.alpha = 0.7f
        isVisible = true
    }

    /**
     * Overlay ausblenden
     */
    fun hide() {
        statusOverlay.visibility = View.GONE
        isVisible = false
    }
}
