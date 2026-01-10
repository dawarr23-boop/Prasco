package com.prasco.mobile.data.mapper

import com.prasco.mobile.data.local.entity.CategoryEntity
import com.prasco.mobile.data.remote.dto.CategoryDto
import com.prasco.mobile.domain.model.Category

fun CategoryDto.toEntity(): CategoryEntity {
    return CategoryEntity(
        id = id ?: 0,
        name = name,
        color = color,
        icon = icon,
        organizationId = organizationId,
        createdAt = createdAt
    )
}

fun CategoryEntity.toDomain(): Category {
    return Category(
        id = id,
        name = name,
        color = color,
        icon = icon
    )
}

fun CategoryDto.toDomain(): Category {
    return Category(
        id = id ?: 0,
        name = name,
        color = color,
        icon = icon
    )
}

fun Category.toDto(): CategoryDto {
    return CategoryDto(
        id = id,
        name = name,
        color = color,
        icon = icon
    )
}

fun Category.toEntity(): CategoryEntity {
    return CategoryEntity(
        id = id,
        name = name,
        color = color,
        icon = icon,
        organizationId = null,
        createdAt = null
    )
}
