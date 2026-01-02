package com.prasco.mobile.domain.model

data class Post(
    val id: Int,
    val title: String,
    val content: String,
    val type: PostType,
    val mediaUrl: String?,
    val duration: Int,
    val priority: Int,
    val category: Category?,
    val startDate: String?,
    val endDate: String?,
    val isActive: Boolean,
    val createdAt: String?,
    val updatedAt: String?
)

enum class PostType(val value: String) {
    TEXT("text"),
    IMAGE("image"),
    VIDEO("video"),
    HTML("html");
    
    companion object {
        fun fromString(value: String): PostType {
            return values().find { it.value == value } ?: TEXT
        }
    }
}
