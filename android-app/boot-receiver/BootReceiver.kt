package net.prasco.display

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * BootReceiver - Startet die App automatisch beim Booten
 * 
 * Verwendung:
 * 1. In AndroidManifest.xml die Berechtigung hinzufügen:
 *    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
 * 
 * 2. Den Receiver registrieren:
 *    <receiver android:name=".BootReceiver" android:enabled="true" android:exported="true">
 *        <intent-filter>
 *            <action android:name="android.intent.action.BOOT_COMPLETED" />
 *        </intent-filter>
 *    </receiver>
 */
class BootReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // App beim Booten starten
            val startIntent = Intent(context, MainActivity::class.java)
            startIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(startIntent)
        }
    }
}
