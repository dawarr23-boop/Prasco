package net.prasco.tv

import android.app.Application
import androidx.work.Configuration
import androidx.work.WorkManager
import net.prasco.tv.config.AppConfig
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.util.Logger

/**
 * PRASCO Application-Klasse
 * Initialisiert globale Komponenten beim App-Start
 */
class PrascoApp : Application(), Configuration.Provider {

    lateinit var preferencesManager: PreferencesManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Logger initialisieren
        Logger.init(this)
        Logger.info("PRASCO TV App gestartet (v${AppConfig.getVersionName(this)})")

        // Preferences initialisieren
        preferencesManager = PreferencesManager(this)

        // Erststart prüfen
        if (preferencesManager.isFirstLaunch) {
            Logger.info("Erststart erkannt – Setup Wizard wird geöffnet")
        }
    }

    /**
     * WorkManager-Konfiguration mit benutzerdefiniertem Log-Level
     */
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(
                if (BuildConfig.DEBUG) android.util.Log.DEBUG
                else android.util.Log.INFO
            )
            .build()

    companion object {
        lateinit var instance: PrascoApp
            private set
    }
}
