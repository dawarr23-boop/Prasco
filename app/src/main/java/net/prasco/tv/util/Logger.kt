package net.prasco.tv.util

import android.content.Context
import android.util.Log
import net.prasco.tv.BuildConfig
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Zentraler Logger für die PRASCO TV App
 * Kapselt Android Log und optionales File-Logging
 */
object Logger {

    private const val TAG = "PRASCO-TV"
    private const val MAX_LOG_FILE_SIZE = 5 * 1024 * 1024  // 5 MB
    private var logFile: File? = null
    private var fileLoggingEnabled = false

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.GERMANY)

    /**
     * Logger initialisieren (einmalig in Application.onCreate)
     */
    fun init(context: Context, enableFileLogging: Boolean = BuildConfig.DEBUG) {
        fileLoggingEnabled = enableFileLogging
        if (enableFileLogging) {
            try {
                val logDir = File(context.filesDir, "logs")
                if (!logDir.exists()) logDir.mkdirs()
                logFile = File(logDir, "prasco-tv.log")

                // Log-Datei rotieren wenn zu groß
                logFile?.let {
                    if (it.exists() && it.length() > MAX_LOG_FILE_SIZE) {
                        val backup = File(logDir, "prasco-tv.log.1")
                        it.renameTo(backup)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Fehler beim Initialisieren des File-Loggers", e)
            }
        }
    }

    fun verbose(message: String, tag: String = TAG) {
        if (BuildConfig.DEBUG) {
            Log.v(tag, message)
            writeToFile("V", tag, message)
        }
    }

    fun debug(message: String, tag: String = TAG) {
        if (BuildConfig.DEBUG) {
            Log.d(tag, message)
            writeToFile("D", tag, message)
        }
    }

    fun info(message: String, tag: String = TAG) {
        Log.i(tag, message)
        writeToFile("I", tag, message)
    }

    fun warn(message: String, tag: String = TAG, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.w(tag, message, throwable)
        } else {
            Log.w(tag, message)
        }
        writeToFile("W", tag, "$message ${throwable?.message ?: ""}")
    }

    fun error(message: String, tag: String = TAG, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.e(tag, message, throwable)
        } else {
            Log.e(tag, message)
        }
        writeToFile("E", tag, "$message ${throwable?.message ?: ""}")
    }

    /**
     * WebView Console-Log weiterleiten
     */
    fun webConsole(message: String, lineNumber: Int, sourceId: String) {
        debug("[WebView] $sourceId:$lineNumber → $message")
    }

    private fun writeToFile(level: String, tag: String, message: String) {
        if (!fileLoggingEnabled || logFile == null) return
        try {
            val timestamp = dateFormat.format(Date())
            FileWriter(logFile, true).use { writer ->
                writer.appendLine("$timestamp [$level/$tag] $message")
            }
        } catch (e: Exception) {
            // Stilles Fehlschlagen – Log-Fehler sollen App nicht crashen
        }
    }

    /**
     * Gibt den Inhalt der Log-Datei zurück (für Debug/Upload)
     */
    fun getLogContent(): String {
        return try {
            logFile?.readText() ?: "Kein File-Logging aktiv"
        } catch (e: Exception) {
            "Fehler beim Lesen der Log-Datei: ${e.message}"
        }
    }

    /**
     * Log-Datei leeren
     */
    fun clearLogFile() {
        try {
            logFile?.writeText("")
        } catch (e: Exception) {
            Log.e(TAG, "Fehler beim Leeren der Log-Datei", e)
        }
    }
}
