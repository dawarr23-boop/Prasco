package com.prasco.mobile.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LoginRequest(
    @Json(name = "email")
    val email: String,
    @Json(name = "password")
    val password: String
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    @Json(name = "success")
    val success: Boolean,
    @Json(name = "data")
    val data: TokenData,
    @Json(name = "message")
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class TokenData(
    @Json(name = "token")
    val token: String,
    @Json(name = "refreshToken")
    val refreshToken: String? = null,
    @Json(name = "user")
    val user: UserDto
)

@JsonClass(generateAdapter = true)
data class RefreshTokenRequest(
    @Json(name = "refreshToken")
    val refreshToken: String
)
