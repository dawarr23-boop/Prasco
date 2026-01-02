package com.prasco.mobile.data.repository

import android.content.Context
import android.net.Uri
import com.prasco.mobile.data.remote.api.PrascoApi
import com.prasco.mobile.domain.model.Resource
import dagger.hilt.android.qualifiers.ApplicationContext
import id.zelory.compressor.Compressor
import id.zelory.compressor.constraint.default
import id.zelory.compressor.constraint.destination
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import timber.log.Timber
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MediaRepository @Inject constructor(
    private val api: PrascoApi,
    @ApplicationContext private val context: Context
) {

    suspend fun uploadImage(uri: Uri): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                // Convert URI to File
                val originalFile = uriToFile(uri)
                
                // Compress image
                val compressedFile = Compressor.compress(context, originalFile) {
                    default(width = 1920, height = 1080, quality = 80)
                    destination(File(context.cacheDir, "compressed_${System.currentTimeMillis()}.jpg"))
                }
                
                // Create multipart request
                val requestFile = compressedFile.asRequestBody("image/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", compressedFile.name, requestFile)
                val typeBody = "image".toRequestBody("text/plain".toMediaTypeOrNull())
                
                val response = api.uploadMedia(body, typeBody)
                
                // Cleanup
                originalFile.delete()
                compressedFile.delete()
                
                if (response.isSuccessful && response.body() != null) {
                    val result = response.body()!!
                    if (result.success) {
                        Resource.Success(result.data.url)
                    } else {
                        Resource.Error(result.message ?: "Upload fehlgeschlagen")
                    }
                } else {
                    Resource.Error("Server-Fehler: ${response.code()}")
                }
            } catch (e: Exception) {
                Timber.e(e, "Image upload error")
                Resource.Error("Upload fehlgeschlagen: ${e.localizedMessage}")
            }
        }
    }

    suspend fun uploadVideo(uri: Uri): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val file = uriToFile(uri)
                
                // Check file size (max 50MB)
                val maxSize = 50 * 1024 * 1024 // 50MB
                if (file.length() > maxSize) {
                    file.delete()
                    return@withContext Resource.Error("Video zu groß (max. 50MB)")
                }
                
                val requestFile = file.asRequestBody("video/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
                val typeBody = "video".toRequestBody("text/plain".toMediaTypeOrNull())
                
                val response = api.uploadMedia(body, typeBody)
                
                file.delete()
                
                if (response.isSuccessful && response.body() != null) {
                    val result = response.body()!!
                    if (result.success) {
                        Resource.Success(result.data.url)
                    } else {
                        Resource.Error(result.message ?: "Upload fehlgeschlagen")
                    }
                } else {
                    Resource.Error("Server-Fehler: ${response.code()}")
                }
            } catch (e: Exception) {
                Timber.e(e, "Video upload error")
                Resource.Error("Upload fehlgeschlagen: ${e.localizedMessage}")
            }
        }
    }

    private fun uriToFile(uri: Uri): File {
        val inputStream = context.contentResolver.openInputStream(uri)
            ?: throw IllegalArgumentException("Cannot open URI: $uri")
        
        val tempFile = File(context.cacheDir, "temp_${System.currentTimeMillis()}")
        FileOutputStream(tempFile).use { outputStream ->
            inputStream.copyTo(outputStream)
        }
        inputStream.close()
        
        return tempFile
    }
}
