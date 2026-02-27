package net.prasco.tv.util

import android.app.Activity
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.widget.Toast
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Kotlin Extension Functions für die PRASCO TV App
 */

// === Activity Extensions ===

/**
 * Vollbild-Modus aktivieren (Immersive Sticky)
 */
fun Activity.enableFullscreen() {
    // WindowManager Flags funktionieren immer, auch vor setContentView
    @Suppress("DEPRECATION")
    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        // insetsController ist erst nach setContentView verfügbar
        window.decorView?.let {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        }
    } else {
        @Suppress("DEPRECATION")
        window.decorView?.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
    }
}

/**
 * Bildschirm dauerhaft an lassen
 */
fun Activity.keepScreenOn(enabled: Boolean = true) {
    if (enabled) {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    } else {
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
}

// === Context Extensions ===

/**
 * Prüft ob Netzwerk-Verbindung vorhanden ist
 */
fun Context.isNetworkAvailable(): Boolean {
    val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        ?: return false

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    } else {
        @Suppress("DEPRECATION")
        val networkInfo = connectivityManager.activeNetworkInfo
        @Suppress("DEPRECATION")
        return networkInfo?.isConnected == true
    }
}

/**
 * Kurzen Toast anzeigen
 */
fun Context.showToast(message: String) {
    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}

/**
 * Langen Toast anzeigen
 */
fun Context.showLongToast(message: String) {
    Toast.makeText(this, message, Toast.LENGTH_LONG).show()
}

// === View Extensions ===

/**
 * View ein-/ausblenden mit Animation
 */
fun View.fadeIn(duration: Long = 300) {
    alpha = 0f
    visibility = View.VISIBLE
    animate().alpha(1f).setDuration(duration).start()
}

fun View.fadeOut(duration: Long = 300) {
    animate().alpha(0f).setDuration(duration).withEndAction {
        visibility = View.GONE
    }.start()
}

// === String Extensions ===

/**
 * URL validieren (einfache Prüfung)
 */
fun String.isValidUrl(): Boolean {
    return this.matches(Regex("^https?://[\\w.-]+(:\\d+)?(/.*)?$"))
}

/**
 * Server-URL normalisieren (trailing slash entfernen)
 */
fun String.normalizeUrl(): String {
    return this.trimEnd('/')
}

// === Coroutine Extensions ===

/**
 * Exponential Backoff Retry
 */
suspend fun <T> retryWithBackoff(
    maxRetries: Int = 5,
    initialDelayMs: Long = 1_000,
    maxDelayMs: Long = 60_000,
    factor: Double = 2.0,
    block: suspend () -> T
): T {
    var currentDelay = initialDelayMs
    repeat(maxRetries - 1) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            Logger.warn("Retry ${attempt + 1}/$maxRetries fehlgeschlagen: ${e.message}")
        }
        delay(currentDelay)
        currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelayMs)
    }
    return block() // Letzter Versuch – Exception wird weitergegeben
}

/**
 * Periodic Task in CoroutineScope starten
 */
fun CoroutineScope.launchPeriodic(intervalMs: Long, action: suspend () -> Unit) = launch {
    while (true) {
        action()
        delay(intervalMs)
    }
}
