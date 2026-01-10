package com.prasco.mobile.data.local.database

import androidx.room.*
import com.prasco.mobile.data.local.entity.PostEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PostDao {
    
    @Query("SELECT * FROM posts ORDER BY priority DESC, createdAt DESC")
    fun getAllPosts(): Flow<List<PostEntity>>
    
    @Query("SELECT * FROM posts ORDER BY priority DESC, createdAt DESC")
    suspend fun getAllPostsSync(): List<PostEntity>
    
    @Query("SELECT * FROM posts WHERE id = :id")
    suspend fun getPostById(id: Int): PostEntity?
    
    @Query("SELECT * FROM posts WHERE isActive = :isActive ORDER BY priority DESC, createdAt DESC")
    fun getPostsByStatus(isActive: Boolean): Flow<List<PostEntity>>
    
    @Query("SELECT * FROM posts WHERE categoryId = :categoryId ORDER BY priority DESC, createdAt DESC")
    fun getPostsByCategory(categoryId: Int): Flow<List<PostEntity>>
    
    @Query("SELECT * FROM posts WHERE title LIKE '%' || :query || '%' OR content LIKE '%' || :query || '%'")
    fun searchPosts(query: String): Flow<List<PostEntity>>
    
    @Query("SELECT * FROM posts WHERE isSynced = 0 OR locallyModified = 1")
    suspend fun getUnsyncedPosts(): List<PostEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPost(post: PostEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPosts(posts: List<PostEntity>)
    
    @Update
    suspend fun updatePost(post: PostEntity)
    
    @Delete
    suspend fun deletePost(post: PostEntity)
    
    @Query("DELETE FROM posts WHERE id = :id")
    suspend fun deletePostById(id: Int)
    
    @Query("DELETE FROM posts")
    suspend fun deleteAllPosts()
    
    @Query("UPDATE posts SET isSynced = 1, locallyModified = 0, locallyCreated = 0 WHERE id = :id")
    suspend fun markAsSynced(id: Int)
}
