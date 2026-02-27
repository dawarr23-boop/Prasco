package net.prasco.tv.config

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import net.prasco.tv.BuildConfig

/**
 * Zentrale App-Konfiguration
 * Stellt Konstanten und Build-abhängige Werte bereit
 */
object AppConfig {

    // === Server-Einstellungen ===
    const val DEFAULT_SERVER_URL = BuildConfig.DEFAULT_SERVER_URL
    const val DISPLAY_PAGE_PATH = BuildConfig.DISPLAY_PAGE_PATH
    const val HEALTH_ENDPOINT = BuildConfig.HEALTH_ENDPOINT

    // === Timing ===
    const val HEALTH_CHECK_INTERVAL_MINUTES = BuildConfig.HEALTH_CHECK_INTERVAL_MINUTES
    const val RECONNECT_INITIAL_DELAY_MS = 3_000L
    const val RECONNECT_MAX_DELAY_MS = 60_000L
    const val RECONNECT_BACKOFF_MULTIPLIER = 2.0
    const val HEARTBEAT_INTERVAL_MS = 300_000L  // 5 Minuten
    const val PAGE_LOAD_TIMEOUT_MS = 30_000L

    // === Cache ===
    const val CACHE_MAX_SIZE_MB = BuildConfig.CACHE_MAX_SIZE_MB
    const val CACHE_TTL_HOURS = BuildConfig.CACHE_TTL_HOURS

    // === UI ===
    const val SETTINGS_MENU_TAP_COUNT = 5         // 5x Menu-Taste → Settings
    const val SETTINGS_TAP_TIMEOUT_MS = 3_000L    // Innerhalb von 3 Sekunden
    const val ADMIN_PIN_DEFAULT = "1234"
    const val OVERLAY_FADE_DURATION_MS = 500L

    // === WebView ===
    const val WEBVIEW_CACHE_MODE_ONLINE = android.webkit.WebSettings.LOAD_DEFAULT
    const val WEBVIEW_CACHE_MODE_OFFLINE = android.webkit.WebSettings.LOAD_CACHE_ELSE_NETWORK
    const val JS_BRIDGE_NAME = "PrascoNative"

    // === Foreground Service ===
    const val DISPLAY_SERVICE_NOTIFICATION_ID = 1001
    const val DISPLAY_SERVICE_CHANNEL_ID = "prasco_display_service"

    /**
     * Vollständige Display-URL zusammenbauen
     */
    fun getDisplayUrl(serverUrl: String, displayIdentifier: String? = null): String {
        val base = serverUrl.trimEnd('/')
        val path = DISPLAY_PAGE_PATH
        return if (displayIdentifier != null) {
            "$base$path?id=$displayIdentifier"
        } else {
            "$base$path"
        }
    }

    /**
     * Health-Check URL zusammenbauen
     */
    fun getHealthUrl(serverUrl: String): String {
        return "${serverUrl.trimEnd('/')}$HEALTH_ENDPOINT"
    }

    /**
     * App-Version aus PackageInfo lesen
     */
    fun getVersionName(context: Context): String {
        return try {
            val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0)
            }
            pInfo.versionName ?: BuildConfig.VERSION_NAME
        } catch (e: Exception) {
            BuildConfig.VERSION_NAME
        }
    }

    /**
     * App-Version-Code lesen
     */
    fun getVersionCode(context: Context): Long {
        return try {
            val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                pInfo.versionCode.toLong()
            }
        } catch (e: Exception) {
            BuildConfig.VERSION_CODE.toLong()
        }
    }
}
