package net.prasco.tv.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import net.prasco.tv.MainActivity
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.util.Logger

/**
 * Boot-Receiver: Startet die App automatisch nach dem Geräte-Boot
 * Funktioniert auf Android TV, Fire TV und Standard-Android
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            Logger.info("Boot abgeschlossen – prüfe Auto-Start Einstellung")

            val prefs = PreferencesManager(context)

            if (prefs.isAutoStartEnabled && prefs.isSetupCompleted) {
                Logger.info("Auto-Start aktiviert – PRASCO TV wird gestartet")

                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                }

                try {
                    context.startActivity(launchIntent)
                    Logger.info("PRASCO TV erfolgreich nach Boot gestartet")
                } catch (e: Exception) {
                    Logger.error("Fehler beim Auto-Start nach Boot", throwable = e)
                }
            } else {
                Logger.info("Auto-Start deaktiviert oder Setup nicht abgeschlossen")
            }
        }
    }
}
