package net.prasco.tv.config

import android.content.Context
import android.content.SharedPreferences
import net.prasco.tv.BuildConfig

/**
 * SharedPreferences Wrapper
 * Zentrale Stelle für alle App-Einstellungen
 */
class PreferencesManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // === Server-Konfiguration ===

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, BuildConfig.DEFAULT_SERVER_URL)
            ?: BuildConfig.DEFAULT_SERVER_URL
        set(value) = prefs.edit().putString(KEY_SERVER_URL, value).apply()

    var displayIdentifier: String
        get() = prefs.getString(KEY_DISPLAY_IDENTIFIER, "") ?: ""
        set(value) = prefs.edit().putString(KEY_DISPLAY_IDENTIFIER, value).apply()

    var displayName: String
        get() = prefs.getString(KEY_DISPLAY_NAME, "PRASCO Display") ?: "PRASCO Display"
        set(value) = prefs.edit().putString(KEY_DISPLAY_NAME, value).apply()

    // === App-Zustand ===

    var isFirstLaunch: Boolean
        get() = prefs.getBoolean(KEY_FIRST_LAUNCH, true)
        set(value) = prefs.edit().putBoolean(KEY_FIRST_LAUNCH, value).apply()

    var isSetupCompleted: Boolean
        get() = prefs.getBoolean(KEY_SETUP_COMPLETED, false)
        set(value) = prefs.edit().putBoolean(KEY_SETUP_COMPLETED, value).apply()

    // === Kiosk & Sicherheit ===

    var adminPin: String
        get() = prefs.getString(KEY_ADMIN_PIN, AppConfig.ADMIN_PIN_DEFAULT)
            ?: AppConfig.ADMIN_PIN_DEFAULT
        set(value) = prefs.edit().putString(KEY_ADMIN_PIN, value).apply()

    var isAdminPinEnabled: Boolean
        get() = prefs.getBoolean(KEY_ADMIN_PIN_ENABLED, false)
        set(value) = prefs.edit().putBoolean(KEY_ADMIN_PIN_ENABLED, value).apply()

    var isAutoStartEnabled: Boolean
        get() = prefs.getBoolean(KEY_AUTO_START, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_START, value).apply()

    var isKioskModeEnabled: Boolean
        get() = prefs.getBoolean(KEY_KIOSK_MODE, true)
        set(value) = prefs.edit().putBoolean(KEY_KIOSK_MODE, value).apply()

    // === Cache ===

    var cacheMaxSizeMb: Int
        get() = prefs.getInt(KEY_CACHE_MAX_SIZE, AppConfig.CACHE_MAX_SIZE_MB)
        set(value) = prefs.edit().putInt(KEY_CACHE_MAX_SIZE, value).apply()

    var lastCacheUpdate: Long
        get() = prefs.getLong(KEY_LAST_CACHE_UPDATE, 0)
        set(value) = prefs.edit().putLong(KEY_LAST_CACHE_UPDATE, value).apply()

    // === Display-Einstellungen ===

    var screenAlwaysOn: Boolean
        get() = prefs.getBoolean(KEY_SCREEN_ALWAYS_ON, true)
        set(value) = prefs.edit().putBoolean(KEY_SCREEN_ALWAYS_ON, value).apply()

    var showStatusOverlay: Boolean
        get() = prefs.getBoolean(KEY_SHOW_STATUS_OVERLAY, true)
        set(value) = prefs.edit().putBoolean(KEY_SHOW_STATUS_OVERLAY, value).apply()

    /**
     * Alle Einstellungen zurücksetzen
     */
    fun resetAll() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "prasco_tv_prefs"

        // Keys
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DISPLAY_IDENTIFIER = "display_identifier"
        private const val KEY_DISPLAY_NAME = "display_name"
        private const val KEY_FIRST_LAUNCH = "first_launch"
        private const val KEY_SETUP_COMPLETED = "setup_completed"
        private const val KEY_ADMIN_PIN = "admin_pin"
        private const val KEY_ADMIN_PIN_ENABLED = "admin_pin_enabled"
        private const val KEY_AUTO_START = "auto_start"
        private const val KEY_KIOSK_MODE = "kiosk_mode"
        private const val KEY_CACHE_MAX_SIZE = "cache_max_size"
        private const val KEY_LAST_CACHE_UPDATE = "last_cache_update"
        private const val KEY_SCREEN_ALWAYS_ON = "screen_always_on"
        private const val KEY_SHOW_STATUS_OVERLAY = "show_status_overlay"
    }
}
