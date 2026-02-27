package net.prasco.display.tv

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

/**
 * PRASCO Device Registration Manager
 *
 * Verwaltet die Geräteregistrierung und -autorisierung mit dem PRASCO Server.
 * Speichert den Device-Token in SharedPreferences und prüft den Autorisierungsstatus.
 */
class DeviceRegistrationManager(private val context: Context) {

    companion object {
        private const val TAG = "PrascoDeviceReg"
        private const val PREFS_NAME = "prasco_device_prefs"
        private const val PREF_DEVICE_TOKEN = "device_token"
        private const val PREF_AUTH_STATUS = "auth_status"
        private const val PREF_DISPLAY_ID = "display_id"
        private const val PREF_DISPLAY_IDENTIFIER = "display_identifier"
        private const val APP_VERSION = "2.1.0"

        /** Polling-Intervall für Autorisierungsstatus (ms) */
        const val STATUS_POLL_INTERVAL = 10_000L // 10 Sekunden

        /** Heartbeat-Intervall (ms) */
        const val HEARTBEAT_INTERVAL = 60_000L // 1 Minute
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /**
     * Gespeicherter Device-Token (oder null, wenn noch nicht registriert)
     */
    fun getDeviceToken(): String? {
        return prefs.getString(PREF_DEVICE_TOKEN, null)
    }

    /**
     * Gespeicherter Autorisierungsstatus
     */
    fun getAuthStatus(): String {
        return prefs.getString(PREF_AUTH_STATUS, "unknown") ?: "unknown"
    }

    /**
     * Gespeicherter Display-Identifier (für URL-Konstruktion)
     */
    fun getDisplayIdentifier(): String? {
        return prefs.getString(PREF_DISPLAY_IDENTIFIER, null)
    }

    /**
     * Ist dieses Gerät bereits registriert und autorisiert?
     */
    fun isAuthorized(): Boolean {
        return getDeviceToken() != null && getAuthStatus() == "authorized"
    }

    /**
     * Gerät beim Server registrieren.
     * MUSS in einem Background-Thread aufgerufen werden!
     *
     * @param serverBaseUrl Basis-URL des Servers (z.B. "https://212.227.20.158")
     * @return RegistrationResult mit Token und Status
     */
    fun registerDevice(serverBaseUrl: String): RegistrationResult {
        return try {
            val serial = DeviceIdentifier.getSerialNumber(context)
            val mac = DeviceIdentifier.getMacAddress(context)
            val model = DeviceIdentifier.getDeviceModel()
            val osVersion = DeviceIdentifier.getOsVersion()

            val json = JSONObject().apply {
                put("serialNumber", serial)
                if (mac != null) put("macAddress", mac)
                put("deviceModel", model)
                put("deviceOsVersion", osVersion)
                put("appVersion", APP_VERSION)
            }

            val url = URL("$serverBaseUrl/api/devices/register")
            val connection = openConnection(url)

            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true

            OutputStreamWriter(connection.outputStream).use {
                it.write(json.toString())
                it.flush()
            }

            val responseCode = connection.responseCode
            val responseBody = if (responseCode in 200..299) {
                connection.inputStream.bufferedReader().readText()
            } else {
                connection.errorStream?.bufferedReader()?.readText() ?: "Unknown error"
            }

            connection.disconnect()

            if (responseCode in 200..299) {
                val response = JSONObject(responseBody)
                val data = response.getJSONObject("data")
                val token = data.getString("deviceToken")
                val status = data.getString("authorizationStatus")
                val displayId = data.optInt("displayId", -1)
                val displayIdentifier = data.optString("displayIdentifier", "")

                // Token und Status speichern
                prefs.edit()
                    .putString(PREF_DEVICE_TOKEN, token)
                    .putString(PREF_AUTH_STATUS, status)
                    .putInt(PREF_DISPLAY_ID, displayId)
                    .putString(PREF_DISPLAY_IDENTIFIER, displayIdentifier)
                    .apply()

                Log.i(TAG, "Registrierung erfolgreich: Status=$status, DisplayID=$displayId")
                RegistrationResult(true, status, token, displayIdentifier)
            } else {
                Log.e(TAG, "Registrierung fehlgeschlagen: $responseCode - $responseBody")
                RegistrationResult(false, "error", null, null, "HTTP $responseCode")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Registrierung-Fehler: ${e.message}", e)
            RegistrationResult(false, "error", null, null, e.message)
        }
    }

    /**
     * Autorisierungsstatus beim Server abfragen.
     * MUSS in einem Background-Thread aufgerufen werden!
     *
     * @param serverBaseUrl Basis-URL des Servers
     * @return Aktueller Status ("pending", "authorized", "rejected", "revoked") oder null bei Fehler
     */
    fun checkStatus(serverBaseUrl: String): String? {
        val token = getDeviceToken() ?: return null
        return try {
            val url = URL("$serverBaseUrl/api/devices/status")
            val connection = openConnection(url)

            connection.requestMethod = "GET"
            connection.setRequestProperty("Authorization", "Bearer $token")

            val responseCode = connection.responseCode
            if (responseCode == 200) {
                val responseBody = connection.inputStream.bufferedReader().readText()
                val response = JSONObject(responseBody)
                val data = response.getJSONObject("data")
                val status = data.getString("authorizationStatus")

                // Status aktualisieren
                prefs.edit().putString(PREF_AUTH_STATUS, status).apply()

                // Display-Identifier aktualisieren (falls geändert)
                val identifier = data.optString("displayIdentifier", "")
                if (identifier.isNotEmpty()) {
                    prefs.edit().putString(PREF_DISPLAY_IDENTIFIER, identifier).apply()
                }

                connection.disconnect()
                Log.d(TAG, "Status-Check: $status")
                status
            } else {
                connection.disconnect()
                Log.w(TAG, "Status-Check fehlgeschlagen: $responseCode")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Status-Check Fehler: ${e.message}")
            null
        }
    }

    /**
     * Heartbeat an Server senden (aktualisiert lastSeenAt).
     * MUSS in einem Background-Thread aufgerufen werden!
     */
    fun sendHeartbeat(serverBaseUrl: String): Boolean {
        val token = getDeviceToken() ?: return false
        return try {
            val url = URL("$serverBaseUrl/api/devices/heartbeat")
            val connection = openConnection(url)

            connection.requestMethod = "POST"
            connection.setRequestProperty("Authorization", "Bearer $token")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true

            val json = JSONObject().apply {
                put("appVersion", APP_VERSION)
            }

            OutputStreamWriter(connection.outputStream).use {
                it.write(json.toString())
                it.flush()
            }

            val responseCode = connection.responseCode

            if (responseCode == 200) {
                val responseBody = connection.inputStream.bufferedReader().readText()
                val response = JSONObject(responseBody)
                val data = response.getJSONObject("data")
                val status = data.getString("authorizationStatus")
                prefs.edit().putString(PREF_AUTH_STATUS, status).apply()
            }

            connection.disconnect()
            responseCode == 200
        } catch (e: Exception) {
            Log.e(TAG, "Heartbeat Fehler: ${e.message}")
            false
        }
    }

    /**
     * Registrierung zurücksetzen (z.B. bei Server-Wechsel)
     */
    fun clearRegistration() {
        prefs.edit().clear().apply()
        Log.i(TAG, "Registrierung zurückgesetzt")
    }

    /**
     * HTTPS-Verbindung mit SSL-Vertrauen für IP-basierte Zertifikate
     */
    private fun openConnection(url: URL): HttpURLConnection {
        val connection = url.openConnection() as HttpURLConnection
        connection.connectTimeout = 10_000
        connection.readTimeout = 10_000

        // SSL-Zertifikat akzeptieren (wie im WebView - IP-basierte URL)
        if (connection is HttpsURLConnection) {
            val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
                override fun checkClientTrusted(chain: Array<java.security.cert.X509Certificate>, authType: String) {}
                override fun checkServerTrusted(chain: Array<java.security.cert.X509Certificate>, authType: String) {}
                override fun getAcceptedIssuers(): Array<java.security.cert.X509Certificate> = arrayOf()
            })
            val sslContext = SSLContext.getInstance("TLS")
            sslContext.init(null, trustAllCerts, java.security.SecureRandom())
            connection.sslSocketFactory = sslContext.socketFactory
            connection.hostnameVerifier = javax.net.ssl.HostnameVerifier { _, _ -> true }
        }

        return connection
    }

    /**
     * Ergebnis einer Geräteregistrierung
     */
    data class RegistrationResult(
        val success: Boolean,
        val status: String,
        val token: String?,
        val displayIdentifier: String?,
        val error: String? = null
    )
}
