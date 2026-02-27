package net.prasco.tv.webview

import android.webkit.JavascriptInterface
import net.prasco.tv.config.AppConfig
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.util.DeviceInfo
import net.prasco.tv.util.Logger
import net.prasco.tv.util.isNetworkAvailable
import org.json.JSONObject

/**
 * JavaScript ↔ Kotlin Bridge
 * Ermöglicht der Display-Webseite den Zugriff auf native Funktionen
 *
 * Verwendung in JavaScript:
 *   window.PrascoNative.getAppVersion()
 *   window.PrascoNative.getDeviceInfo()
 *   window.PrascoNative.isOnline()
 *   etc.
 */
class JavaScriptBridge(
    private val preferencesManager: PreferencesManager,
    private val listener: BridgeListener
) {

    interface BridgeListener {
        /** Seite fordert App-Neustart an */
        fun onRestartRequested()

        /** Seite fordert Settings-Öffnung an */
        fun onOpenSettingsRequested()

        /** Seite meldet eigenen Status */
        fun onDisplayReady()

        /** Seite sendet Log-Nachricht */
        fun onLog(level: String, message: String)

        /** Context für DeviceInfo */
        fun getContext(): android.content.Context
    }

    // === Informationen abrufen ===

    @JavascriptInterface
    fun getAppVersion(): String {
        return AppConfig.getVersionName(listener.getContext())
    }

    @JavascriptInterface
    fun getAppVersionCode(): Long {
        return AppConfig.getVersionCode(listener.getContext())
    }

    @JavascriptInterface
    fun getDeviceInfo(): String {
        return DeviceInfo.toJson(listener.getContext())
    }

    @JavascriptInterface
    fun getDisplayIdentifier(): String {
        return preferencesManager.displayIdentifier
    }

    @JavascriptInterface
    fun getDisplayName(): String {
        return preferencesManager.displayName
    }

    @JavascriptInterface
    fun getServerUrl(): String {
        return preferencesManager.serverUrl
    }

    // === Status ===

    @JavascriptInterface
    fun isOnline(): Boolean {
        return listener.getContext().isNetworkAvailable()
    }

    @JavascriptInterface
    fun getCacheStatus(): String {
        val json = JSONObject().apply {
            put("lastUpdate", preferencesManager.lastCacheUpdate)
            put("maxSizeMb", preferencesManager.cacheMaxSizeMb)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun isKioskMode(): Boolean {
        return preferencesManager.isKioskModeEnabled
    }

    // === Aktionen ===

    @JavascriptInterface
    fun openSettings() {
        Logger.info("JavaScript fordert Settings-Öffnung an")
        listener.onOpenSettingsRequested()
    }

    @JavascriptInterface
    fun restartApp() {
        Logger.info("JavaScript fordert App-Neustart an")
        listener.onRestartRequested()
    }

    @JavascriptInterface
    fun displayReady() {
        Logger.info("Display meldet: Bereit")
        listener.onDisplayReady()
    }

    // === Logging ===

    @JavascriptInterface
    fun log(message: String) {
        listener.onLog("INFO", message)
    }

    @JavascriptInterface
    fun logError(message: String) {
        listener.onLog("ERROR", message)
    }

    @JavascriptInterface
    fun logDebug(message: String) {
        listener.onLog("DEBUG", message)
    }

    companion object {
        /** Name des Bridge-Objekts in JavaScript */
        const val INTERFACE_NAME = AppConfig.JS_BRIDGE_NAME
    }
}

/**
 * Hilfsfunktion für Netzwerk-Check aus dem Bridge
 * (da der Bridge-Context eingeschränkt ist)
 */
private fun isNetworkAvailable(context: android.content.Context): Boolean {
    return context.let {
        val cm = it.getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as? android.net.ConnectivityManager
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            val network = cm?.activeNetwork ?: return false
            val capabilities = cm.getNetworkCapabilities(network) ?: return false
            capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            cm?.activeNetworkInfo?.isConnected == true
        }
    }
}
