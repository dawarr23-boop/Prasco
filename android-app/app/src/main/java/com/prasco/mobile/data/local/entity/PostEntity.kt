package com.prasco.mobile.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "posts")
data class PostEntity(
    @PrimaryKey
    val id: Int,
    val title: String,
    val content: String,
    val type: String,
    val mediaUrl: String?,
    val duration: Int,
    val priority: Int,
    val categoryId: Int?,
    val startDate: String?,
    val endDate: String?,
    val isActive: Boolean,
    val createdBy: Int?,
    val organizationId: Int?,
    val createdAt: String?,
    val updatedAt: String?,
    val isSynced: Boolean = false,
    val locallyModified: Boolean = false,
    val locallyCreated: Boolean = false
)
