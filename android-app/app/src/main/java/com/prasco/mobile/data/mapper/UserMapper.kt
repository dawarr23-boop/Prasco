package com.prasco.mobile.data.mapper

import com.prasco.mobile.data.remote.dto.UserDto
import com.prasco.mobile.domain.model.User
import com.prasco.mobile.domain.model.UserRole

fun UserDto.toDomain(): User {
    return User(
        id = id,
        email = email,
        name = name,
        role = UserRole.fromString(role)
    )
}
