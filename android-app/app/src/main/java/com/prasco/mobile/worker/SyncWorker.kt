package com.prasco.mobile.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.prasco.mobile.data.repository.CategoryRepository
import com.prasco.mobile.data.repository.PostRepository
import com.prasco.mobile.data.local.datastore.PreferencesManager
import com.prasco.mobile.domain.model.Resource
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import timber.log.Timber

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val postRepository: PostRepository,
    private val categoryRepository: CategoryRepository,
    private val preferencesManager: PreferencesManager
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            Timber.i("Starting background sync...")
            
            // Sync posts
            when (val postsResult = postRepository.syncPosts()) {
                is Resource.Success -> {
                    Timber.i("Posts synced successfully: ${postsResult.data?.size} posts")
                }
                is Resource.Error -> {
                    Timber.w("Posts sync failed: ${postsResult.message}")
                    return Result.retry()
                }
                is Resource.Loading -> {}
            }
            
            // Sync categories
            when (val categoriesResult = categoryRepository.syncCategories()) {
                is Resource.Success -> {
                    Timber.i("Categories synced successfully: ${categoriesResult.data?.size} categories")
                }
                is Resource.Error -> {
                    Timber.w("Categories sync failed: ${categoriesResult.message}")
                }
                is Resource.Loading -> {}
            }
            
            // Update last sync timestamp
            preferencesManager.updateLastSyncTimestamp(System.currentTimeMillis())
            
            Timber.i("Background sync completed successfully")
            Result.success()
            
        } catch (e: Exception) {
            Timber.e(e, "Background sync failed with exception")
            Result.retry()
        }
    }
}
