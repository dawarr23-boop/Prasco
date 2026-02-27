package net.prasco.tv.network

import com.google.gson.GsonBuilder
import net.prasco.tv.BuildConfig
import net.prasco.tv.util.Logger
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

/**
 * Retrofit API Interface für den PRASCO Server
 * Server liefert Daten im Format: { "success": true, "data": [...], "count": N }
 */
interface PrascoApi {

    // ============ Display Content (KEIN AUTH) ============

    /** Alle aktiven Posts für die Anzeige */
    @GET("/api/public/posts")
    suspend fun getPublicPosts(
        @Query("organization") organization: String? = null,
        @Query("category") category: String? = null
    ): ApiResponse<List<PostDto>>

    /** Posts für ein spezifisches Display */
    @GET("/api/public/display/{identifier}/posts")
    suspend fun getDisplayPosts(
        @Path("identifier") displayIdentifier: String
    ): ApiResponse<List<PostDto>>

    /** Einzelner aktiver Post */
    @GET("/api/public/posts/{id}")
    suspend fun getPublicPost(@Path("id") id: Int): ApiResponse<PostDto>

    /** Aktive Kategorien */
    @GET("/api/public/categories")
    suspend fun getPublicCategories(
        @Query("organization") organization: String? = null
    ): ApiResponse<List<CategoryDto>>

    // ============ Displays ============

    /** Alle verfügbaren Displays */
    @GET("/api/public/displays")
    suspend fun getDisplays(): ApiResponse<List<DisplayDto>>

    // ============ Server Info ============

    /** App-Info (Version, Name) */
    @GET("/api/public/info")
    suspend fun getServerInfo(): ApiResponse<ServerInfoDto>

    // ============ Settings (KEIN AUTH) ============

    /** Alle System-Einstellungen */
    @GET("/api/settings")
    suspend fun getSettings(@Query("category") category: String? = null): Map<String, Any>

    /** Einzelne Einstellung */
    @GET("/api/settings/{key}")
    suspend fun getSetting(@Path("key") key: String): SettingDto

    // ============ Health ============

    /** Server Health Check */
    @GET("/api/health")
    suspend fun healthCheck(): HealthDto

    // ============ Transit (optional) ============

    @GET("/api/transit/departures/{stationId}")
    suspend fun getDepartures(@Path("stationId") stationId: String): ApiResponse<DepartureDto>

    // ============ Presentations ============

    /** Slides einer Präsentation */
    @GET("/api/media/presentations/{presentationId}/slides")
    suspend fun getPresentationSlides(
        @Path("presentationId") presentationId: String
    ): ApiResponse<List<SlideDto>>
}

/**
 * API Client Singleton
 * Erstellt und verwaltet die Retrofit-Instanz
 */
object PrascoApiClient {

    private var currentBaseUrl: String = ""
    private var retrofit: Retrofit? = null
    private var api: PrascoApi? = null

    private val gson = GsonBuilder()
        .setLenient()
        .create()

    private val loggingInterceptor = HttpLoggingInterceptor { message ->
        Logger.debug("[HTTP] $message", tag = "OkHttp")
    }.apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.BASIC
        }
    }

    /**
     * TrustManager der alle Zertifikate akzeptiert
     * Notwendig für selbstsigniertes SSL-Zertifikat auf dem PRASCO Server
     */
    private val trustAllManager = object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
    }

    private fun createOkHttpClient(): OkHttpClient {
        // SSL-Kontext für selbstsignierte Zertifikate
        val sslContext = SSLContext.getInstance("TLS").apply {
            init(null, arrayOf<TrustManager>(trustAllManager), SecureRandom())
        }

        return OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .sslSocketFactory(sslContext.socketFactory, trustAllManager)
            .hostnameVerifier { _, _ -> true }  // Alle Hostnamen akzeptieren
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                // User-Agent Header hinzufügen
                val request = chain.request().newBuilder()
                    .header("User-Agent", "PrascoTV/${BuildConfig.VERSION_NAME}")
                    .header("Accept", "application/json")
                    .build()
                chain.proceed(request)
            }
            .retryOnConnectionFailure(true)
            .build()
    }

    /**
     * API-Instanz für die gegebene Server-URL holen
     * Erstellt neuen Client wenn sich die URL ändert
     */
    fun getApi(baseUrl: String): PrascoApi {
        val normalizedUrl = baseUrl.trimEnd('/')
        if (normalizedUrl != currentBaseUrl || api == null) {
            Logger.info("API Client wird erstellt für: $normalizedUrl")
            currentBaseUrl = normalizedUrl
            retrofit = Retrofit.Builder()
                .baseUrl("$normalizedUrl/")
                .client(createOkHttpClient())
                .addConverterFactory(GsonConverterFactory.create(gson))
                .build()
            api = retrofit?.create(PrascoApi::class.java)
        }
        return api!!
    }

    /**
     * Schneller Health-Check (nur HTTP GET, kein Parsing)
     * Gibt true zurück wenn der Server erreichbar ist
     */
    suspend fun isServerReachable(baseUrl: String): Boolean {
        return try {
            val result = getApi(baseUrl).healthCheck()
            result.status == "ok"
        } catch (e: Exception) {
            Logger.warn("Health-Check fehlgeschlagen: ${e.message}")
            false
        }
    }

    /**
     * Client zurücksetzen (z.B. bei URL-Änderung)
     */
    fun reset() {
        currentBaseUrl = ""
        retrofit = null
        api = null
        Logger.debug("API Client zurückgesetzt")
    }
}
