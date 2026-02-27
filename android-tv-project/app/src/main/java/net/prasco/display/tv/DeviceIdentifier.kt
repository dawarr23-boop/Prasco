package net.prasco.display.tv

import android.annotation.SuppressLint
import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.provider.Settings

/**
 * PRASCO Device Identifier
 *
 * Ermittelt eine eindeutige Gerätekennung für die Device-Autorisierung.
 * Nutzt Android ID als primäre Seriennummer und optional die WLAN MAC-Adresse.
 */
object DeviceIdentifier {

    /**
     * Eindeutige Seriennummer des Geräts.
     * Nutzt ANDROID_ID (Settings.Secure) - einzigartig pro Gerät + App-Installation.
     */
    @SuppressLint("HardwareIds")
    fun getSerialNumber(context: Context): String {
        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        )
        return androidId ?: "unknown-${System.currentTimeMillis()}"
    }

    /**
     * MAC-Adresse des WLAN-Adapters (falls verfügbar).
     * Ab Android 6+ gibt getHardwareAddress() eine randomisierte MAC zurück.
     * Wird als zusätzliches Identifikationsmerkmal genutzt.
     */
    @SuppressLint("HardwareIds")
    fun getMacAddress(context: Context): String? {
        return try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            @Suppress("DEPRECATION")
            val info = wifiManager?.connectionInfo
            val mac = info?.macAddress
            // Android 6+ gibt "02:00:00:00:00:00" als Dummy zurück
            if (mac != null && mac != "02:00:00:00:00:00") mac else null
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Gerätemodell (z.B. "NVIDIA SHIELD Android TV", "Chromecast with Google TV")
     */
    fun getDeviceModel(): String {
        val manufacturer = Build.MANUFACTURER?.capitalize() ?: "Unknown"
        val model = Build.MODEL ?: "Unknown"
        return if (model.startsWith(manufacturer, ignoreCase = true)) {
            model
        } else {
            "$manufacturer $model"
        }
    }

    /**
     * Android-Version (z.B. "12", "13")
     */
    fun getOsVersion(): String {
        return "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
    }

    /**
     * String-Erweiterung: Ersten Buchstaben großschreiben
     */
    private fun String.capitalize(): String {
        return this.replaceFirstChar {
            if (it.isLowerCase()) it.titlecase() else it.toString()
        }
    }
}
