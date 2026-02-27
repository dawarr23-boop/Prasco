package net.prasco.tv.webview

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.http.SslError
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Base64
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import net.prasco.tv.util.Logger
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

/**
 * Custom WebViewClient für die PRASCO Display-Seite
 * Behandelt Fehler, SSL, URL-Filtering und Lade-Status
 */
class PrascoWebViewClient(
    private val context: Context,
    private val listener: WebViewClientListener,
    private val serverHost: String = ""
) : WebViewClient() {

    interface WebViewClientListener {
        /** Seite hat begonnen zu laden */
        fun onPageStarted(url: String)

        /** Seite wurde vollständig geladen */
        fun onPageFinished(url: String)

        /** Fehler beim Laden der Seite */
        fun onPageError(errorCode: Int, description: String, url: String)

        /** Server ist nicht erreichbar */
        fun onServerUnreachable(url: String)
    }

    private var hasError = false

    /**
     * OkHttp-Client mit Trust-All-SSL für den PRASCO-Server
     * Wird verwendet um Sub-Requests (JS, CSS, API-Calls) zu proxyen,
     * da onReceivedSslError nur für Navigations-Requests greift
     */
    private val sslOkHttpClient: OkHttpClient by lazy {
        val trustAllManager = object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
        }
        val sslContext = SSLContext.getInstance("TLS").apply {
            init(null, arrayOf<TrustManager>(trustAllManager), SecureRandom())
        }
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .sslSocketFactory(sslContext.socketFactory, trustAllManager)
            .hostnameVerifier { _, _ -> true }
            .build()
    }

    /**
     * Sub-Resource-Requests (JS, CSS, Bilder, API-Calls per fetch/XHR)
     * über OkHttp mit Trust-All-SSL proxyen.
     * Nur für Requests an den PRASCO-Server.
     */
    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        val url = request?.url?.toString() ?: return super.shouldInterceptRequest(view, request)

        // Nur HTTPS-Requests an den PRASCO-Server abfangen
        if (!url.startsWith("https://") || (serverHost.isNotEmpty() && !url.contains(serverHost))) {
            return super.shouldInterceptRequest(view, request)
        }

        // PDF-Requests abfangen und als Bilder rendern
        // (Android WebView hat keinen eingebauten PDF-Viewer)
        if (url.lowercase().endsWith(".pdf") || url.lowercase().contains(".pdf#") || url.lowercase().contains(".pdf?")) {
            val pdfUrl = url.split("#")[0].split("?")[0] // Saubere URL ohne Fragment/Query
            val pdfResponse = renderPdfAsHtml(pdfUrl)
            if (pdfResponse != null) return pdfResponse
        }

        return try {
            val okRequest = Request.Builder()
                .url(url)
                .apply {
                    request.requestHeaders?.forEach { (key, value) ->
                        addHeader(key, value)
                    }
                }
                .build()

            val response = sslOkHttpClient.newCall(okRequest).execute()
            val body = response.body
            val contentType = body?.contentType()
            val mimeType = contentType?.let { "${it.type}/${it.subtype}" } ?: "text/plain"
            val encoding = contentType?.charset()?.name() ?: "UTF-8"

            WebResourceResponse(
                mimeType,
                encoding,
                response.code,
                if (response.message.isNotEmpty()) response.message else "OK",
                response.headers.toMultimap().mapValues { it.value.joinToString(", ") },
                body?.byteStream() ?: ByteArrayInputStream(ByteArray(0))
            )
        } catch (e: Exception) {
            Logger.warn("shouldInterceptRequest Fehler für $url: ${e.message}")
            super.shouldInterceptRequest(view, request)
        }
    }

    /**
     * PDF-Datei herunterladen, mit PdfRenderer als Bilder rendern und als HTML zurückgeben.
     * Android WebView hat keinen eingebauten PDF-Viewer — daher rendern wir
     * die PDF-Seiten nativ als Bitmaps und betten sie als Base64-Bilder ein.
     */
    private fun renderPdfAsHtml(pdfUrl: String): WebResourceResponse? {
        var tempFile: File? = null
        return try {
            Logger.info("PDF-Render: Lade PDF von $pdfUrl")

            // PDF herunterladen
            val okRequest = Request.Builder().url(pdfUrl).build()
            val response = sslOkHttpClient.newCall(okRequest).execute()
            if (!response.isSuccessful) {
                Logger.error("PDF-Render: Download fehlgeschlagen (${response.code})")
                return null
            }
            val pdfBytes = response.body?.bytes() ?: return null
            Logger.info("PDF-Render: ${pdfBytes.size} Bytes heruntergeladen")

            // In temporäre Datei speichern (PdfRenderer benötigt ParcelFileDescriptor)
            tempFile = File(context.cacheDir, "prasco_pdf_${System.currentTimeMillis()}.pdf")
            tempFile.writeBytes(pdfBytes)

            // PDF öffnen und rendern
            val fd = ParcelFileDescriptor.open(tempFile, ParcelFileDescriptor.MODE_READ_ONLY)
            val renderer = PdfRenderer(fd)
            val pageCount = renderer.pageCount
            Logger.info("PDF-Render: $pageCount Seiten gefunden")

            val html = StringBuilder()
            html.append("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            background: #2c2c2c;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            min-height: 100vh;
                        }
                        .pdf-page {
                            width: 100%;
                            max-width: 100vw;
                            height: auto;
                            display: block;
                        }
                        .single-page {
                            width: 100vw;
                            height: 100vh;
                            object-fit: contain;
                        }
                    </style>
                </head>
                <body>
            """.trimIndent())

            for (i in 0 until pageCount) {
                val page = renderer.openPage(i)

                // Skalierung: TV-Auflösung ist typisch 1920x1080
                // PDF-Seiten sind in PostScript-Punkten (1/72 Zoll)
                // Skaliere so, dass die Breite ~1920px wird
                val scale = (1920f / page.width).coerceAtMost(3f)
                val bitmapWidth = (page.width * scale).toInt()
                val bitmapHeight = (page.height * scale).toInt()

                val bitmap = Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888)
                bitmap.eraseColor(Color.WHITE)
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                page.close()

                // Als JPEG komprimieren (viel kleiner als PNG)
                val baos = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.JPEG, 85, baos)
                bitmap.recycle()

                val base64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
                val cssClass = if (pageCount == 1) "pdf-page single-page" else "pdf-page"
                html.append("<img class=\"$cssClass\" src=\"data:image/jpeg;base64,$base64\" alt=\"Seite ${i + 1}\" />\n")

                Logger.debug("PDF-Render: Seite ${i + 1}/$pageCount gerendert (${bitmapWidth}x${bitmapHeight})")
            }

            renderer.close()
            fd.close()

            html.append("</body></html>")

            val htmlBytes = html.toString().toByteArray(Charsets.UTF_8)
            Logger.info("PDF-Render: HTML erstellt (${htmlBytes.size} Bytes)")

            WebResourceResponse(
                "text/html",
                "UTF-8",
                ByteArrayInputStream(htmlBytes)
            )
        } catch (e: Exception) {
            Logger.error("PDF-Render Fehler: ${e.message}")
            null
        } finally {
            tempFile?.delete()
        }
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        hasError = false
        url?.let {
            Logger.debug("Seite wird geladen: $it")
            listener.onPageStarted(it)
        }
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        if (!hasError) {
            url?.let {
                Logger.debug("Seite geladen: $it")
                listener.onPageFinished(it)
            }
        }
    }

    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
    ) {
        super.onReceivedError(view, request, error)

        // Nur Hauptframe-Fehler behandeln
        if (request?.isForMainFrame == true) {
            hasError = true
            val errorCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                error?.errorCode ?: ERROR_UNKNOWN
            } else {
                ERROR_UNKNOWN
            }
            val description = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                error?.description?.toString() ?: "Unbekannter Fehler"
            } else {
                "Unbekannter Fehler"
            }
            val url = request?.url?.toString() ?: "unknown"

            Logger.error("WebView Fehler: $errorCode - $description ($url)")

            when (errorCode) {
                ERROR_HOST_LOOKUP, ERROR_CONNECT, ERROR_TIMEOUT -> {
                    listener.onServerUnreachable(url)
                }
                else -> {
                    listener.onPageError(errorCode, description, url)
                }
            }
        }
    }

    @Suppress("DEPRECATION")
    override fun onReceivedError(
        view: WebView?,
        errorCode: Int,
        description: String?,
        failingUrl: String?
    ) {
        // Fallback für API < 23
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            hasError = true
            val url = failingUrl ?: "unknown"
            Logger.error("WebView Fehler (legacy): $errorCode - $description ($url)")

            when (errorCode) {
                ERROR_HOST_LOOKUP, ERROR_CONNECT, ERROR_TIMEOUT -> {
                    listener.onServerUnreachable(url)
                }
                else -> {
                    listener.onPageError(errorCode, description ?: "Unbekannt", url)
                }
            }
        }
    }

    override fun onReceivedSslError(
        view: WebView?,
        handler: SslErrorHandler?,
        error: SslError?
    ) {
        Logger.warn("SSL Fehler: ${error?.primaryError} - URL: ${error?.url}")

        // Selbstsignierte Zertifikate akzeptieren (PRASCO Server mit Self-Signed SSL)
        Logger.warn("SSL-Fehler wird ignoriert (selbstsigniertes Zertifikat)")
        handler?.proceed()
    }

    override fun shouldOverrideUrlLoading(
        view: WebView?,
        request: WebResourceRequest?
    ): Boolean {
        val url = request?.url?.toString() ?: return false

        // Nur URLs zum PRASCO-Server erlauben
        // Externe Links werden blockiert (Kiosk-Modus)
        Logger.debug("URL-Navigation: $url")

        // Alle Navigationen im WebView bleiben
        return false
    }
}
