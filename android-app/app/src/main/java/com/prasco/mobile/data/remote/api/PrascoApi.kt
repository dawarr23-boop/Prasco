package com.prasco.mobile.data.remote.api

import com.prasco.mobile.data.remote.dto.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface PrascoApi {
    
    // Posts
    @GET("posts")
    suspend fun getPosts(
        @Query("isActive") isActive: Boolean? = null,
        @Query("categoryId") categoryId: Int? = null
    ): Response<PostListResponse>
    
    @GET("posts/{id}")
    suspend fun getPost(
        @Path("id") id: Int
    ): Response<PostResponse>
    
    @POST("posts")
    suspend fun createPost(
        @Body request: CreatePostRequest
    ): Response<PostResponse>
    
    @PUT("posts/{id}")
    suspend fun updatePost(
        @Path("id") id: Int,
        @Body request: CreatePostRequest
    ): Response<PostResponse>
    
    @DELETE("posts/{id}")
    suspend fun deletePost(
        @Path("id") id: Int
    ): Response<PostResponse>
    
    // Categories
    @GET("categories")
    suspend fun getCategories(): Response<CategoryListResponse>
    
    @GET("categories/{id}")
    suspend fun getCategory(
        @Path("id") id: Int
    ): Response<CategoryResponse>
    
    @POST("categories")
    suspend fun createCategory(
        @Body category: CategoryDto
    ): Response<CategoryResponse>
    
    @PUT("categories/{id}")
    suspend fun updateCategory(
        @Path("id") id: Int,
        @Body category: CategoryDto
    ): Response<CategoryResponse>
    
    @DELETE("categories/{id}")
    suspend fun deleteCategory(
        @Path("id") id: Int
    ): Response<CategoryResponse>
    
    // Media Upload
    @Multipart
    @POST("media/upload")
    suspend fun uploadMedia(
        @Part file: MultipartBody.Part,
        @Part("type") type: RequestBody
    ): Response<MediaUploadResponse>
}
