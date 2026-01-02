package com.prasco.mobile.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PostDto(
    @Json(name = "id")
    val id: Int? = null,
    @Json(name = "title")
    val title: String,
    @Json(name = "content")
    val content: String,
    @Json(name = "type")
    val type: String = "text",
    @Json(name = "mediaUrl")
    val mediaUrl: String? = null,
    @Json(name = "duration")
    val duration: Int = 10,
    @Json(name = "priority")
    val priority: Int = 0,
    @Json(name = "categoryId")
    val categoryId: Int? = null,
    @Json(name = "startDate")
    val startDate: String? = null,
    @Json(name = "endDate")
    val endDate: String? = null,
    @Json(name = "isActive")
    val isActive: Boolean = true,
    @Json(name = "createdBy")
    val createdBy: Int? = null,
    @Json(name = "organizationId")
    val organizationId: Int? = null,
    @Json(name = "category")
    val category: CategoryDto? = null,
    @Json(name = "createdAt")
    val createdAt: String? = null,
    @Json(name = "updatedAt")
    val updatedAt: String? = null
)

@JsonClass(generateAdapter = true)
data class PostListResponse(
    @Json(name = "success")
    val success: Boolean,
    @Json(name = "data")
    val data: List<PostDto>,
    @Json(name = "message")
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class PostResponse(
    @Json(name = "success")
    val success: Boolean,
    @Json(name = "data")
    val data: PostDto,
    @Json(name = "message")
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class CreatePostRequest(
    @Json(name = "title")
    val title: String,
    @Json(name = "content")
    val content: String,
    @Json(name = "type")
    val type: String = "text",
    @Json(name = "mediaUrl")
    val mediaUrl: String? = null,
    @Json(name = "duration")
    val duration: Int = 10,
    @Json(name = "priority")
    val priority: Int = 0,
    @Json(name = "categoryId")
    val categoryId: Int? = null,
    @Json(name = "startDate")
    val startDate: String? = null,
    @Json(name = "endDate")
    val endDate: String? = null,
    @Json(name = "isActive")
    val isActive: Boolean = true
)
