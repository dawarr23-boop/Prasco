package net.prasco.tv.cache

import android.content.Context
import androidx.room.Database
import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import net.prasco.tv.util.Logger

// === Entities ===

/**
 * Gecachter Post (serialisiert als JSON)
 */
@Entity(tableName = "cached_posts")
data class CachedPost(
    @PrimaryKey val id: Int,
    val jsonData: String,           // Serialisierter PostDto als JSON
    val cachedAt: Long = System.currentTimeMillis()
)

/**
 * Gecachte Media-Datei (Bilder, Videos)
 */
@Entity(tableName = "cached_media")
data class CachedMedia(
    @PrimaryKey val url: String,    // Original-URL der Datei
    val localPath: String,          // Lokaler Dateipfad
    val mimeType: String,
    val size: Long,                 // Dateigröße in Bytes
    val cachedAt: Long = System.currentTimeMillis()
)

// === DAOs ===

@Dao
interface CachedPostDao {
    @Query("SELECT * FROM cached_posts ORDER BY cachedAt DESC")
    suspend fun getAll(): List<CachedPost>

    @Query("SELECT * FROM cached_posts WHERE id = :postId")
    suspend fun getById(postId: Int): CachedPost?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(posts: List<CachedPost>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(post: CachedPost)

    @Query("DELETE FROM cached_posts")
    suspend fun deleteAll()

    @Query("DELETE FROM cached_posts WHERE cachedAt < :olderThan")
    suspend fun deleteOlderThan(olderThan: Long)

    @Query("SELECT COUNT(*) FROM cached_posts")
    suspend fun count(): Int
}

@Dao
interface CachedMediaDao {
    @Query("SELECT * FROM cached_media ORDER BY cachedAt DESC")
    suspend fun getAll(): List<CachedMedia>

    @Query("SELECT * FROM cached_media WHERE url = :url")
    suspend fun getByUrl(url: String): CachedMedia?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(media: CachedMedia)

    @Query("DELETE FROM cached_media")
    suspend fun deleteAll()

    @Query("DELETE FROM cached_media WHERE cachedAt < :olderThan")
    suspend fun deleteOlderThan(olderThan: Long)

    @Query("SELECT SUM(size) FROM cached_media")
    suspend fun getTotalSize(): Long?

    @Query("SELECT COUNT(*) FROM cached_media")
    suspend fun count(): Int
}

// === Database ===

@Database(
    entities = [CachedPost::class, CachedMedia::class],
    version = 1,
    exportSchema = false
)
abstract class CacheDatabase : RoomDatabase() {
    abstract fun postDao(): CachedPostDao
    abstract fun mediaDao(): CachedMediaDao

    companion object {
        private const val DB_NAME = "prasco_cache.db"

        @Volatile
        private var INSTANCE: CacheDatabase? = null

        /**
         * Singleton-Instanz der Datenbank
         */
        fun getInstance(context: Context): CacheDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: buildDatabase(context).also { INSTANCE = it }
            }
        }

        private fun buildDatabase(context: Context): CacheDatabase {
            Logger.info("Cache-Datenbank wird erstellt: $DB_NAME")
            return Room.databaseBuilder(
                context.applicationContext,
                CacheDatabase::class.java,
                DB_NAME
            )
                .fallbackToDestructiveMigration()
                .build()
        }
    }
}
