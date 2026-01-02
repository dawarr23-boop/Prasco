package com.prasco.mobile.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.prasco.mobile.data.local.entity.CategoryEntity
import com.prasco.mobile.data.local.entity.PostEntity

@Database(
    entities = [
        PostEntity::class,
        CategoryEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class PrascoDatabase : RoomDatabase() {
    
    abstract fun postDao(): PostDao
    abstract fun categoryDao(): CategoryDao
}
