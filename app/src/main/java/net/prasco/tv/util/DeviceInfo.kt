package net.prasco.tv.util

import android.content.Context
import android.os.Build
import android.webkit.WebView
import net.prasco.tv.config.AppConfig
import org.json.JSONObject

/**
 * Geräte-Informationen sammeln
 * Wird für Server-Heartbeat und Debug verwendet
 */
object DeviceInfo {

    /**
     * Alle relevanten Gerätedaten als JSON-String
     */
    fun toJson(context: Context): String {
        val json = JSONObject().apply {
            put("manufacturer", Build.MANUFACTURER)
            put("model", Build.MODEL)
            put("device", Build.DEVICE)
            put("product", Build.PRODUCT)
            put("brand", Build.BRAND)
            put("androidVersion", Build.VERSION.RELEASE)
            put("sdkVersion", Build.VERSION.SDK_INT)
            put("appVersion", AppConfig.getVersionName(context))
            put("appVersionCode", AppConfig.getVersionCode(context))
            put("webViewVersion", getWebViewVersion(context))
            put("isFireTV", isFireTV())
            put("isAndroidTV", isAndroidTV(context))
            put("screenDensity", context.resources.displayMetrics.density)
            put("screenWidth", context.resources.displayMetrics.widthPixels)
            put("screenHeight", context.resources.displayMetrics.heightPixels)
        }
        return json.toString()
    }

    /**
     * Kompakte Beschreibung (für Logs)
     */
    fun getSummary(context: Context): String {
        return "${Build.MANUFACTURER} ${Build.MODEL} (Android ${Build.VERSION.RELEASE}, SDK ${Build.VERSION.SDK_INT})"
    }

    /**
     * WebView-Version ermitteln
     */
    fun getWebViewVersion(context: Context): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WebView.getCurrentWebViewPackage()?.versionName ?: "Unbekannt"
            } else {
                "< Android O (nicht ermittelbar)"
            }
        } catch (e: Exception) {
            "Fehler: ${e.message}"
        }
    }

    /**
     * Prüft ob das Gerät ein Amazon Fire TV ist
     */
    fun isFireTV(): Boolean {
        return Build.MANUFACTURER.equals("Amazon", ignoreCase = true) &&
            (Build.MODEL.startsWith("AFT", ignoreCase = true) ||
                Build.MODEL.contains("Fire TV", ignoreCase = true))
    }

    /**
     * Prüft ob Android TV Leanback verfügbar ist
     */
    fun isAndroidTV(context: Context): Boolean {
        return context.packageManager.hasSystemFeature("android.software.leanback")
    }

    /**
     * Prüft ob Hardware-Beschleunigung verfügbar ist
     */
    fun supportsHardwareAcceleration(): Boolean {
        // Auf den meisten TV-Geräten verfügbar ab API 21
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
    }

    /**
     * Eindeutige Geräte-ID (Android ID)
     */
    @Suppress("HardwareIds")
    fun getDeviceId(context: Context): String {
        return android.provider.Settings.Secure.getString(
            context.contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        ) ?: "unknown"
    }
}
