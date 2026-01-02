package com.prasco.mobile.di

import android.content.Context
import androidx.room.Room
import com.prasco.mobile.data.local.database.PrascoDatabase
import com.prasco.mobile.data.local.database.PostDao
import com.prasco.mobile.data.local.database.CategoryDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun providePrascoDatabase(
        @ApplicationContext context: Context
    ): PrascoDatabase {
        return Room.databaseBuilder(
            context,
            PrascoDatabase::class.java,
            "prasco_db"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun providePostDao(database: PrascoDatabase): PostDao {
        return database.postDao()
    }

    @Provides
    @Singleton
    fun provideCategoryDao(database: PrascoDatabase): CategoryDao {
        return database.categoryDao()
    }
}
