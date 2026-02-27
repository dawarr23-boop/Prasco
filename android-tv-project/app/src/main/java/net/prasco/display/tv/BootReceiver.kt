package net.prasco.display.tv

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Boot Receiver - Startet PRASCO Display TV automatisch beim Booten des Android TV
 *
 * Benötigt android.permission.RECEIVE_BOOT_COMPLETED im Manifest.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(launchIntent)
        }
    }
}
