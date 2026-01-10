package com.prasco.mobile.data.mapper

import com.prasco.mobile.data.local.entity.PostEntity
import com.prasco.mobile.data.remote.dto.PostDto
import com.prasco.mobile.domain.model.Post
import com.prasco.mobile.domain.model.PostType

fun PostDto.toEntity(): PostEntity {
    return PostEntity(
        id = id ?: 0,
        title = title,
        content = content,
        type = type,
        mediaUrl = mediaUrl,
        duration = duration,
        priority = priority,
        categoryId = categoryId,
        startDate = startDate,
        endDate = endDate,
        isActive = isActive,
        createdBy = createdBy,
        organizationId = organizationId,
        createdAt = createdAt,
        updatedAt = updatedAt,
        isSynced = true,
        locallyModified = false,
        locallyCreated = false
    )
}

fun PostEntity.toDomain(category: com.prasco.mobile.domain.model.Category?): Post {
    return Post(
        id = id,
        title = title,
        content = content,
        type = PostType.fromString(type),
        mediaUrl = mediaUrl,
        duration = duration,
        priority = priority,
        category = category,
        startDate = startDate,
        endDate = endDate,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun PostDto.toDomain(): Post {
    return Post(
        id = id ?: 0,
        title = title,
        content = content,
        type = PostType.fromString(type),
        mediaUrl = mediaUrl,
        duration = duration,
        priority = priority,
        category = category?.toDomain(),
        startDate = startDate,
        endDate = endDate,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun Post.toDto(): PostDto {
    return PostDto(
        id = id,
        title = title,
        content = content,
        type = type.value,
        mediaUrl = mediaUrl,
        duration = duration,
        priority = priority,
        categoryId = category?.id,
        startDate = startDate,
        endDate = endDate,
        isActive = isActive
    )
}

fun Post.toEntity(): PostEntity {
    return PostEntity(
        id = id,
        title = title,
        content = content,
        type = type.value,
        mediaUrl = mediaUrl,
        duration = duration,
        priority = priority,
        categoryId = category?.id,
        startDate = startDate,
        endDate = endDate,
        isActive = isActive,
        createdBy = null,
        organizationId = null,
        createdAt = createdAt,
        updatedAt = updatedAt,
        isSynced = true,
        locallyModified = false,
        locallyCreated = false
    )
}
