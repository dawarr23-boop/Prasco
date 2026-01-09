package net.prasco.display

import android.content.Context
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * SettingsActivity - Einstellungen für die App
 * 
 * Ermöglicht das Ändern der Server-URL ohne die App neu zu kompilieren
 */
class SettingsActivity : AppCompatActivity() {
    
    private lateinit var urlInput: EditText
    private lateinit var saveButton: Button
    private lateinit var cancelButton: Button
    
    companion object {
        private const val PREFS_NAME = "prasco_settings"
        private const val KEY_SERVER_URL = "server_url"
        private const val DEFAULT_URL = "http://192.168.1.100:3000"
        
        /**
         * Gespeicherte Server-URL laden
         */
        fun getServerUrl(context: Context): String {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getString(KEY_SERVER_URL, DEFAULT_URL) ?: DEFAULT_URL
        }
        
        /**
         * Server-URL speichern
         */
        fun saveServerUrl(context: Context, url: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_SERVER_URL, url).apply()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // setContentView(R.layout.activity_settings)
        
        // UI-Komponenten initialisieren
        // urlInput = findViewById(R.id.urlInput)
        // saveButton = findViewById(R.id.saveButton)
        // cancelButton = findViewById(R.id.cancelButton)
        
        // Aktuelle URL laden
        val currentUrl = getServerUrl(this)
        // urlInput.setText(currentUrl)
        
        // Buttons konfigurieren
        /*
        saveButton.setOnClickListener {
            val newUrl = urlInput.text.toString().trim()
            if (newUrl.isNotEmpty() && isValidUrl(newUrl)) {
                saveServerUrl(this, newUrl)
                Toast.makeText(this, "URL gespeichert. Bitte App neu starten.", Toast.LENGTH_LONG).show()
                finish()
            } else {
                Toast.makeText(this, "Ungültige URL", Toast.LENGTH_SHORT).show()
            }
        }
        
        cancelButton.setOnClickListener {
            finish()
        }
        */
    }
    
    /**
     * Einfache URL-Validierung
     */
    private fun isValidUrl(url: String): Boolean {
        return url.startsWith("http://") || url.startsWith("https://")
    }
}
