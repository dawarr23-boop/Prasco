package net.prasco.tv.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import net.prasco.tv.MainActivity
import net.prasco.tv.R
import net.prasco.tv.config.AppConfig
import net.prasco.tv.util.Logger

/**
 * Foreground Service für den Display-Betrieb
 * Hält die App am Leben und verhindert dass Android sie im Hintergrund beendet
 * Verwaltet WakeLock für Screen-Always-On
 */
class DisplayService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        Logger.info("DisplayService erstellt")

        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Logger.info("DisplayService gestartet")

        val notification = createNotification()
        startForeground(AppConfig.DISPLAY_SERVICE_NOTIFICATION_ID, notification)

        return START_STICKY  // Service wird bei Kill neu gestartet
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        releaseWakeLock()
        Logger.info("DisplayService beendet")
        super.onDestroy()
    }

    /**
     * WakeLock erwerben – hält CPU und optional Screen wach
     */
    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "PrascoTV::DisplayWakeLock"
        ).apply {
            acquire(Long.MAX_VALUE)  // Dauerhaft halten
        }
        Logger.debug("WakeLock erworben")
    }

    /**
     * WakeLock freigeben
     */
    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Logger.debug("WakeLock freigegeben")
            }
        }
        wakeLock = null
    }

    /**
     * Notification Channel erstellen (ab Android O)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                AppConfig.DISPLAY_SERVICE_CHANNEL_ID,
                "PRASCO Display Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Hält die PRASCO Display-Anzeige aktiv"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    /**
     * Foreground Notification erstellen
     */
    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, AppConfig.DISPLAY_SERVICE_CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        return builder
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    companion object {
        /**
         * Service starten
         */
        fun start(context: Context) {
            val intent = Intent(context, DisplayService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            Logger.info("DisplayService Start angefordert")
        }

        /**
         * Service stoppen
         */
        fun stop(context: Context) {
            val intent = Intent(context, DisplayService::class.java)
            context.stopService(intent)
            Logger.info("DisplayService Stop angefordert")
        }
    }
}
