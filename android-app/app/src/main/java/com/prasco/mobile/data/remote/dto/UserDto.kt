package com.prasco.mobile.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class UserDto(
    @Json(name = "id")
    val id: Int,
    @Json(name = "email")
    val email: String,
    @Json(name = "name")
    val name: String,
    @Json(name = "role")
    val role: String,
    @Json(name = "organizationId")
    val organizationId: Int? = null,
    @Json(name = "isActive")
    val isActive: Boolean = true,
    @Json(name = "createdAt")
    val createdAt: String? = null
)
