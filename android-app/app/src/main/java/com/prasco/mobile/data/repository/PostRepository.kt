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

@Singleton
class PostRepository @Inject constructor(
    private val api: PrascoApi,
    private val postDao: PostDao,
    private val categoryDao: CategoryDao
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
            Timber.e(e, "Sync posts error")
            Resource.Error("Netzwerkfehler: ${e.localizedMessage}")
        }
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
                    // Save to local database
                    postDao.insertPost(body.data.toEntity())
                    Resource.Success(body.data.toDomain())
                } else {
                    Resource.Error(body.message ?: "Post erstellen fehlgeschlagen")
                }
            } else {
                Resource.Error("Server-Fehler: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Create post error")
            Resource.Error("Netzwerkfehler: ${e.localizedMessage}")
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
                    // Update local database
                    postDao.insertPost(body.data.toEntity())
                    Resource.Success(body.data.toDomain())
                } else {
                    Resource.Error(body.message ?: "Post aktualisieren fehlgeschlagen")
                }
            } else {
                Resource.Error("Server-Fehler: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Update post error")
            Resource.Error("Netzwerkfehler: ${e.localizedMessage}")
        }
    }

    suspend fun deletePost(id: Int): Resource<Boolean> {
        return try {
            val response = api.deletePost(id)
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    // Delete from local database
                    postDao.deletePostById(id)
                    Resource.Success(true)
                } else {
                    Resource.Error(body.message ?: "Post löschen fehlgeschlagen")
                }
            } else {
                Resource.Error("Server-Fehler: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Delete post error")
            Resource.Error("Netzwerkfehler: ${e.localizedMessage}")
        }
    }
}
