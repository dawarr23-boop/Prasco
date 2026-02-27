package net.prasco.tv.network

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import net.prasco.tv.config.AppConfig
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.util.Logger
import java.util.concurrent.TimeUnit

/**
 * WorkManager Worker für periodische Health-Checks
 * Prüft regelmäßig ob der PRASCO-Server erreichbar ist
 */
class HealthCheckWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val prefs = PreferencesManager(applicationContext)
        val serverUrl = prefs.serverUrl

        Logger.debug("Health-Check wird ausgeführt: $serverUrl")

        return try {
            val isReachable = PrascoApiClient.isServerReachable(serverUrl)

            if (isReachable) {
                Logger.debug("Health-Check erfolgreich: Server erreichbar")
                Result.success()
            } else {
                Logger.warn("Health-Check: Server nicht erreichbar")
                Result.retry()
            }
        } catch (e: Exception) {
            Logger.error("Health-Check Fehler", throwable = e)
            Result.retry()
        }
    }

    companion object {
        private const val WORK_NAME = "prasco_health_check"

        /**
         * Periodischen Health-Check starten
         * Wird alle X Minuten ausgeführt (konfigurierbar)
         */
        fun schedule(context: Context) {
            val intervalMinutes = AppConfig.HEALTH_CHECK_INTERVAL_MINUTES.toLong()
                .coerceAtLeast(15) // WorkManager Minimum ist 15 Minuten

            Logger.info("Health-Check scheduled: alle $intervalMinutes Minuten")

            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<HealthCheckWorker>(
                intervalMinutes, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    30, TimeUnit.SECONDS
                )
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                workRequest
            )
        }

        /**
         * Health-Check stoppen
         */
        fun cancel(context: Context) {
            Logger.info("Health-Check cancelled")
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
