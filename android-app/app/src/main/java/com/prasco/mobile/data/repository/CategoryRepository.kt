package com.prasco.mobile.data.repository

import com.prasco.mobile.data.local.database.CategoryDao
import com.prasco.mobile.data.mapper.toDomain
import com.prasco.mobile.data.mapper.toEntity
import com.prasco.mobile.data.remote.api.PrascoApi
import com.prasco.mobile.domain.model.Category
import com.prasco.mobile.domain.model.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CategoryRepository @Inject constructor(
    private val api: PrascoApi,
    private val categoryDao: CategoryDao,
    private val demoDataProvider: DemoDataProvider
) {

    fun getAllCategories(): Flow<List<Category>> {
        return categoryDao.getAllCategories().map { categories ->
            categories.map { it.toDomain() }
        }
    }

    suspend fun syncCategories(): Resource<List<Category>> {
        return try {
            val response = api.getCategories()
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    // Save to local database
                    val entities = body.data.map { it.toEntity() }
                    categoryDao.insertCategories(entities)
                    
                    Resource.Success(body.data.map { it.toDomain() })
                } else {
                    Resource.Error(body.message ?: "Kategorien laden fehlgeschlagen")
                }
            } else {
                Resource.Error("Server-Fehler: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Sync categories error - using demo data")
            // Fallback: Initialisiere mit Demo-Daten
            val demoCategories = demoDataProvider.getDemoCategories()
            try {
                val entities = demoCategories.map { it.toEntity() }
                categoryDao.insertCategories(entities)
            } catch (dbError: Exception) {
                Timber.e(dbError, "Error inserting demo categories")
            }
            Resource.Success(demoCategories)
        }
    }
}
