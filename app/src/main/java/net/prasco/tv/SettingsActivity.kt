package net.prasco.tv

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Switch
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import net.prasco.tv.config.AppConfig
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.network.PrascoApiClient
import net.prasco.tv.util.DeviceInfo
import net.prasco.tv.util.Logger
import net.prasco.tv.util.enableFullscreen
import net.prasco.tv.util.showToast

/**
 * Einstellungen-Activity
 * TV-optimiertes UI mit D-Pad-Navigation
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var preferencesManager: PreferencesManager

    // Views
    private lateinit var editServerUrl: EditText
    private lateinit var editDisplayName: EditText
    private lateinit var editDisplayIdentifier: EditText
    private lateinit var switchKioskMode: Switch
    private lateinit var switchAutoStart: Switch
    private lateinit var switchScreenAlwaysOn: Switch
    private lateinit var btnTestConnection: Button
    private lateinit var btnClearCache: Button
    private lateinit var btnSave: Button
    private lateinit var btnBack: Button
    private lateinit var textAppInfo: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableFullscreen()
        setContentView(R.layout.activity_settings)

        preferencesManager = (application as PrascoApp).preferencesManager

        Logger.info("Settings-Activity geöffnet")

        initViews()
        loadCurrentSettings()
    }

    private fun initViews() {
        editServerUrl = findViewById(R.id.editServerUrl)
        editDisplayName = findViewById(R.id.editDisplayName)
        editDisplayIdentifier = findViewById(R.id.editDisplayIdentifier)
        switchKioskMode = findViewById(R.id.switchKioskMode)
        switchAutoStart = findViewById(R.id.switchAutoStart)
        switchScreenAlwaysOn = findViewById(R.id.switchScreenAlwaysOn)
        btnTestConnection = findViewById(R.id.btnTestConnection)
        btnClearCache = findViewById(R.id.btnClearCache)
        btnSave = findViewById(R.id.btnSave)
        btnBack = findViewById(R.id.btnBack)
        textAppInfo = findViewById(R.id.textAppInfo)

        btnTestConnection.setOnClickListener { testConnection() }
        btnClearCache.setOnClickListener { clearCache() }
        btnSave.setOnClickListener { saveSettings() }
        btnBack.setOnClickListener { finish() }

        // Initialer Fokus auf Server-URL
        editServerUrl.requestFocus()
    }

    private fun loadCurrentSettings() {
        editServerUrl.setText(preferencesManager.serverUrl)
        editDisplayName.setText(preferencesManager.displayName)
        editDisplayIdentifier.setText(preferencesManager.displayIdentifier)
        switchKioskMode.isChecked = preferencesManager.isKioskModeEnabled
        switchAutoStart.isChecked = preferencesManager.isAutoStartEnabled
        switchScreenAlwaysOn.isChecked = preferencesManager.screenAlwaysOn

        // App-Info anzeigen
        val appVersion = AppConfig.getVersionName(this)
        val deviceSummary = DeviceInfo.getSummary(this)
        val webViewVersion = DeviceInfo.getWebViewVersion(this)
        textAppInfo.text = "PRASCO TV v$appVersion | $deviceSummary | WebView: $webViewVersion"
    }

    private fun saveSettings() {
        val serverUrl = editServerUrl.text.toString().trim()
        val displayName = editDisplayName.text.toString().trim()
        val displayIdentifier = editDisplayIdentifier.text.toString().trim()

        // Validierung
        if (serverUrl.isEmpty()) {
            showToast(getString(R.string.settings_error_url_empty))
            editServerUrl.requestFocus()
            return
        }

        if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
            showToast(getString(R.string.settings_error_url_invalid))
            editServerUrl.requestFocus()
            return
        }

        // Speichern
        val urlChanged = preferencesManager.serverUrl != serverUrl
        preferencesManager.serverUrl = serverUrl.trimEnd('/')
        preferencesManager.displayName = displayName.ifEmpty { "PRASCO Display" }
        preferencesManager.displayIdentifier = displayIdentifier
        preferencesManager.isKioskModeEnabled = switchKioskMode.isChecked
        preferencesManager.isAutoStartEnabled = switchAutoStart.isChecked
        preferencesManager.screenAlwaysOn = switchScreenAlwaysOn.isChecked

        // API Client zurücksetzen bei URL-Änderung
        if (urlChanged) {
            PrascoApiClient.reset()
            Logger.info("Server-URL geändert auf: $serverUrl")
        }

        Logger.info("Einstellungen gespeichert")
        showToast(getString(R.string.settings_saved))
        finish()
    }

    private fun testConnection() {
        val serverUrl = editServerUrl.text.toString().trim()

        if (serverUrl.isEmpty()) {
            showToast(getString(R.string.settings_error_url_empty))
            return
        }

        btnTestConnection.isEnabled = false
        btnTestConnection.text = getString(R.string.settings_testing)

        lifecycleScope.launch {
            val isReachable = withContext(Dispatchers.IO) {
                try {
                    PrascoApiClient.isServerReachable(serverUrl)
                } catch (e: Exception) {
                    Logger.error("Verbindungstest fehlgeschlagen", throwable = e)
                    false
                }
            }

            btnTestConnection.isEnabled = true
            btnTestConnection.text = getString(R.string.settings_test_connection)

            if (isReachable) {
                showToast(getString(R.string.settings_connection_ok))
                Logger.info("Verbindungstest erfolgreich: $serverUrl")
            } else {
                showToast(getString(R.string.settings_connection_failed))
                Logger.warn("Verbindungstest fehlgeschlagen: $serverUrl")
            }
        }
    }

    private fun clearCache() {
        // WebView Cache leeren
        val webView = android.webkit.WebView(this)
        webView.clearCache(true)
        webView.destroy()

        // Cache-Timestamp zurücksetzen
        preferencesManager.lastCacheUpdate = 0

        Logger.info("Cache geleert")
        showToast(getString(R.string.settings_cache_cleared))
    }
}
