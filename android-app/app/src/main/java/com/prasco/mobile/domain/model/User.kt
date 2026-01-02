package com.prasco.mobile.domain.model

data class User(
    val id: Int,
    val email: String,
    val name: String,
    val role: UserRole
)

enum class UserRole(val value: String) {
    SUPERADMIN("superadmin"),
    ADMIN("admin"),
    USER("user");
    
    companion object {
        fun fromString(value: String): UserRole {
            return values().find { it.value == value } ?: USER
        }
    }
}
