package net.prasco.tv.cache

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import net.prasco.tv.config.AppConfig
import net.prasco.tv.config.PreferencesManager
import net.prasco.tv.network.PostDto
import net.prasco.tv.network.PrascoApiClient
import net.prasco.tv.util.Logger
import java.io.File

/**
 * Offline-Caching-Logik
 * Verwaltet das Zwischenspeichern von Posts und Medien für den Offline-Betrieb
 */
class OfflineCacheManager(private val context: Context) {

    private val database = CacheDatabase.getInstance(context)
    private val postDao = database.postDao()
    private val mediaDao = database.mediaDao()
    private val gson = Gson()
    private val prefs = PreferencesManager(context)

    // === Posts cachen ===

    /**
     * Posts vom Server laden und cachen
     */
    suspend fun refreshPostCache(): Boolean = withContext(Dispatchers.IO) {
        try {
            val api = PrascoApiClient.getApi(prefs.serverUrl)
            val response = api.getPublicPosts()
            val posts = response.data

            if (posts.isNotEmpty()) {
                val cachedPosts = posts.map { post ->
                    CachedPost(
                        id = post.id,
                        jsonData = gson.toJson(post),
                        cachedAt = System.currentTimeMillis()
                    )
                }

                postDao.insertAll(cachedPosts)
                prefs.lastCacheUpdate = System.currentTimeMillis()

                Logger.info("${posts.size} Posts gecacht")
                true
            } else {
                Logger.warn("Keine Posts zum Cachen erhalten")
                false
            }
        } catch (e: Exception) {
            Logger.error("Fehler beim Cachen der Posts", throwable = e)
            false
        }
    }

    /**
     * Gecachte Posts laden
     */
    suspend fun getCachedPosts(): List<PostDto> = withContext(Dispatchers.IO) {
        try {
            val cached = postDao.getAll()
            val type = object : TypeToken<PostDto>() {}.type

            cached.mapNotNull { cachedPost ->
                try {
                    gson.fromJson<PostDto>(cachedPost.jsonData, type)
                } catch (e: Exception) {
                    Logger.warn("Fehlerhafter Cache-Eintrag: Post ${cachedPost.id}")
                    null
                }
            }
        } catch (e: Exception) {
            Logger.error("Fehler beim Laden gecachter Posts", throwable = e)
            emptyList()
        }
    }

    /**
     * Prüfen ob gecachte Posts vorhanden sind
     */
    suspend fun hasCachedPosts(): Boolean = withContext(Dispatchers.IO) {
        try {
            postDao.count() > 0
        } catch (e: Exception) {
            false
        }
    }

    // === Cache-Verwaltung ===

    /**
     * Abgelaufene Cache-Einträge entfernen
     */
    suspend fun cleanExpiredCache() = withContext(Dispatchers.IO) {
        try {
            val ttlMs = AppConfig.CACHE_TTL_HOURS * 3600 * 1000
            val cutoffTime = System.currentTimeMillis() - ttlMs

            postDao.deleteOlderThan(cutoffTime)
            mediaDao.deleteOlderThan(cutoffTime)

            Logger.info("Abgelaufene Cache-Einträge bereinigt (TTL: ${AppConfig.CACHE_TTL_HOURS}h)")
        } catch (e: Exception) {
            Logger.error("Fehler beim Cache-Cleanup", throwable = e)
        }
    }

    /**
     * Gesamten Cache leeren
     */
    suspend fun clearAllCache() = withContext(Dispatchers.IO) {
        try {
            postDao.deleteAll()
            mediaDao.deleteAll()
            clearMediaFiles()
            prefs.lastCacheUpdate = 0

            Logger.info("Gesamter Cache geleert")
        } catch (e: Exception) {
            Logger.error("Fehler beim Leeren des Caches", throwable = e)
        }
    }

    /**
     * Cache-Größe ermitteln (in Bytes)
     */
    suspend fun getCacheSize(): Long = withContext(Dispatchers.IO) {
        try {
            val mediaSize = mediaDao.getTotalSize() ?: 0L
            val cacheDir = File(context.cacheDir, "prasco_media")
            val fileSize = if (cacheDir.exists()) {
                cacheDir.walkTopDown().sumOf { it.length() }
            } else 0L

            mediaSize + fileSize
        } catch (e: Exception) {
            0L
        }
    }

    /**
     * Cache-Statistiken als lesbarer Text
     */
    suspend fun getCacheStats(): String = withContext(Dispatchers.IO) {
        try {
            val postCount = postDao.count()
            val mediaCount = mediaDao.count()
            val totalSize = getCacheSize()
            val sizeMb = totalSize / (1024.0 * 1024.0)
            val lastUpdate = prefs.lastCacheUpdate

            "Posts: $postCount | Medien: $mediaCount | Größe: %.1f MB | Letztes Update: %s".format(
                sizeMb,
                if (lastUpdate > 0) java.text.SimpleDateFormat("dd.MM.yyyy HH:mm", java.util.Locale.GERMANY)
                    .format(java.util.Date(lastUpdate))
                else "Nie"
            )
        } catch (e: Exception) {
            "Cache-Status nicht verfügbar"
        }
    }

    /**
     * Lokale Media-Dateien löschen
     */
    private fun clearMediaFiles() {
        val cacheDir = File(context.cacheDir, "prasco_media")
        if (cacheDir.exists()) {
            cacheDir.deleteRecursively()
            Logger.debug("Media-Cache-Verzeichnis gelöscht")
        }
    }

    /**
     * Offline-HTML generieren mit gecachten Posts
     * Wird verwendet wenn der Server nicht erreichbar ist
     */
    suspend fun generateOfflineHtml(): String = withContext(Dispatchers.IO) {
        val posts = getCachedPosts()
        if (posts.isEmpty()) {
            return@withContext ""
        }

        val postsJson = gson.toJson(posts)

        """
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PRASCO – Offline-Modus</title>
            <style>
                body {
                    margin: 0; padding: 40px;
                    background: #1a1a2e; color: white;
                    font-family: 'Segoe UI', sans-serif;
                }
                .offline-banner {
                    background: #e65100; padding: 12px 24px;
                    border-radius: 8px; margin-bottom: 32px;
                    text-align: center; font-size: 18px;
                }
                .post { margin-bottom: 24px; padding: 20px;
                    background: #16213e; border-radius: 12px; }
                .post-title { font-size: 24px; font-weight: bold;
                    margin-bottom: 8px; }
                .post-content { font-size: 18px; color: #ccc; }
            </style>
        </head>
        <body>
            <div class="offline-banner">
                ⚠ Offline-Modus – Gecachte Inhalte werden angezeigt
            </div>
            <div id="posts"></div>
            <script>
                var posts = $postsJson;
                var container = document.getElementById('posts');
                posts.forEach(function(post) {
                    var div = document.createElement('div');
                    div.className = 'post';
                    div.innerHTML = '<div class="post-title">' +
                        (post.title || '') + '</div>' +
                        '<div class="post-content">' +
                        (post.content || '') + '</div>';
                    container.appendChild(div);
                });
            </script>
        </body>
        </html>
        """.trimIndent()
    }
}
