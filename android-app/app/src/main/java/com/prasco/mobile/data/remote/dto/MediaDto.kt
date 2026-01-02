package com.prasco.mobile.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class MediaUploadResponse(
    @Json(name = "success")
    val success: Boolean,
    @Json(name = "data")
    val data: MediaData,
    @Json(name = "message")
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class MediaData(
    @Json(name = "id")
    val id: Int,
    @Json(name = "url")
    val url: String,
    @Json(name = "thumbnailUrl")
    val thumbnailUrl: String? = null,
    @Json(name = "type")
    val type: String,
    @Json(name = "filename")
    val filename: String,
    @Json(name = "size")
    val size: Long
)
