package com.prasco.mobile.data.repository

import com.prasco.mobile.data.local.database.PostDao
import com.prasco.mobile.data.local.database.CategoryDao
import com.prasco.mobile.data.mapper.*
import com.prasco.mobile.data.remote.api.PrascoApi
import com.prasco.mobile.data.remote.dto.CreatePostRequest
import com.prasco.mobile.domain.model.Post
import com.prasco.mobile.domain.model.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.delay

@Singleton
class PostRepository @Inject constructor(
    private val api: PrascoApi,
    private val postDao: PostDao,
    private val categoryDao: CategoryDao,
    private val demoDataProvider: DemoDataProvider
) {

    fun getAllPosts(): Flow<List<Post>> {
        return postDao.getAllPosts().map { posts ->
            posts.map { postEntity ->
                val category = postEntity.categoryId?.let { 
                    categoryDao.getCategoryById(it)?.toDomain() 
                }
                postEntity.toDomain(category)
            }
        }
    }

    fun getPostsByStatus(isActive: Boolean): Flow<List<Post>> {
        return postDao.getPostsByStatus(isActive).map { posts ->
            posts.map { postEntity ->
                val category = postEntity.categoryId?.let { 
                    categoryDao.getCategoryById(it)?.toDomain() 
                }
                postEntity.toDomain(category)
            }
        }
    }

    fun searchPosts(query: String): Flow<List<Post>> {
        return postDao.searchPosts(query).map { posts ->
            posts.map { postEntity ->
                val category = postEntity.categoryId?.let { 
                    categoryDao.getCategoryById(it)?.toDomain() 
                }
                postEntity.toDomain(category)
            }
        }
    }

    suspend fun syncPosts(): Resource<List<Post>> {
        return try {
            val response = api.getPosts()
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    // Save to local database
                    val entities = body.data.map { it.toEntity() }
                    postDao.insertPosts(entities)
                    
                    Resource.Success(body.data.map { it.toDomain() })
                } else {
                    Resource.Error(body.message ?: "Posts laden fehlgeschlagen")
                }
            } else {
                Resource.Error("Server-Fehler: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Sync posts error - loading from local database")
            // Fallback: Lade aus lokaler Datenbank
            val localPosts = postDao.getAllPostsSync()
            if (localPosts.isEmpty()) {
                // Initialisiere mit Demo-Daten
                initializeDemoData()
                Resource.Success(demoDataProvider.getDemoPosts())
            } else {
                Resource.Success(localPosts.map { it.toDomain(null) })
            }
        }
    }
    
    private suspend fun initializeDemoData() {
        Timber.d("Initializing demo data")
        // Initialisiere auch Kategorien
        val demoCategories = demoDataProvider.getDemoCategories()
        val categoryEntities = demoCategories.map { it.toEntity() }
        categoryDao.insertCategories(categoryEntities)
        
        val demoPosts = demoDataProvider.getDemoPosts()
        val entities = demoPosts.map { it.toEntity() }
        postDao.insertPosts(entities)
    }

    suspend fun createPost(
        title: String,
        content: String,
        type: String,
        mediaUrl: String?,
        duration: Int,
        priority: Int,
        categoryId: Int?,
        startDate: String?,
        endDate: String?,
        isActive: Boolean
    ): Resource<Post> {
        // Erstelle zuerst lokal
        val category = categoryId?.let { categoryDao.getCategoryById(it)?.toDomain() }
        val localPost = Post(
            id = System.currentTimeMillis().toInt(), // Temporäre ID
            title = title,
            content = content,
            type = com.prasco.mobile.domain.model.PostType.valueOf(type.uppercase()),
            mediaUrl = mediaUrl,
            duration = duration,
            priority = priority,
            category = category,
            startDate = startDate,
            endDate = endDate,
            isActive = isActive,
            createdAt = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            updatedAt = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
        
        // Speichere lokal
        postDao.insertPost(localPost.toEntity())
        
        // Versuche Server-Sync (optional)
        return try {
            val request = CreatePostRequest(
                title = title,
                content = content,
                type = type,
                mediaUrl = mediaUrl,
                duration = duration,
                priority = priority,
                categoryId = categoryId,
                startDate = startDate,
                endDate = endDate,
                isActive = isActive
            )
            
            val response = api.createPost(request)
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    // Update mit Server-ID
                    postDao.insertPost(body.data.toEntity())
                    Resource.Success(body.data.toDomain())
                } else {
                    // Lokal gespeichert, Server-Fehler ignorieren
                    Resource.Success(localPost)
                }
            } else {
                Resource.Success(localPost)
            }
        } catch (e: Exception) {
            Timber.e(e, "Create post error - saved locally")
            // Offline-Modus: Post wurde lokal gespeichert
            Resource.Success(localPost)
        }
    }

    suspend fun updatePost(
        id: Int,
        title: String,
        content: String,
        type: String,
        mediaUrl: String?,
        duration: Int,
        priority: Int,
        categoryId: Int?,
        startDate: String?,
        endDate: String?,
        isActive: Boolean
    ): Resource<Post> {
        // Update lokal
        val category = categoryId?.let { categoryDao.getCategoryById(it)?.toDomain() }
        val updatedPost = Post(
            id = id,
            title = title,
            content = content,
            type = com.prasco.mobile.domain.model.PostType.valueOf(type.uppercase()),
            mediaUrl = mediaUrl,
            duration = duration,
            priority = priority,
            category = category,
            startDate = startDate,
            endDate = endDate,
            isActive = isActive,
            createdAt = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            updatedAt = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
        
        postDao.insertPost(updatedPost.toEntity())
        
        // Versuche Server-Sync (optional)
        return try {
            val request = CreatePostRequest(
                title = title,
                content = content,
                type = type,
                mediaUrl = mediaUrl,
                duration = duration,
                priority = priority,
                categoryId = categoryId,
                startDate = startDate,
                endDate = endDate,
                isActive = isActive
            )
            
            val response = api.updatePost(id, request)
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    postDao.insertPost(body.data.toEntity())
                    Resource.Success(body.data.toDomain())
                } else {
                    Resource.Success(updatedPost)
                }
            } else {
                Resource.Success(updatedPost)
            }
        } catch (e: Exception) {
            Timber.e(e, "Update post error - saved locally")
            Resource.Success(updatedPost)
        }
    }

    suspend fun deletePost(id: Int): Resource<Boolean> {
        // Lösche lokal
        postDao.deletePostById(id)
        
        // Versuche Server-Sync (optional)
        return try {
            val response = api.deletePost(id)
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    Resource.Success(true)
                } else {
                    // Lokal gelöscht
                    Resource.Success(true)
                }
            } else {
                Resource.Success(true)
            }
        } catch (e: Exception) {
            Timber.e(e, "Delete post error - deleted locally")
            // Offline-Modus: Lokal gelöscht
            Resource.Success(true)
        }
    }
}
