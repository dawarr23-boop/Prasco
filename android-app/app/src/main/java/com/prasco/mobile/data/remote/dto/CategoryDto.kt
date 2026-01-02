package com.prasco.mobile.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CategoryDto(
    @Json(name = "id")
    val id: Int? = null,
    @Json(name = "name")
    val name: String,
    @Json(name = "color")
    val color: String? = null,
    @Json(name = "icon")
    val icon: String? = null,
    @Json(name = "organizationId")
    val organizationId: Int? = null,
    @Json(name = "createdAt")
    val createdAt: String? = null
)

@JsonClass(generateAdapter = true)
data class CategoryListResponse(
    @Json(name = "success")
    val success: Boolean,
    @Json(name = "data")
    val data: List<CategoryDto>,
    @Json(name = "message")
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class CategoryResponse(
    @Json(name = "success")
    val success: Boolean,
    @Json(name = "data")
    val data: CategoryDto,
    @Json(name = "message")
    val message: String? = null
)
