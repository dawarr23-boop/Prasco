package com.prasco.mobile.data.remote.interceptor

import com.prasco.mobile.data.local.datastore.PreferencesManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val preferencesManager: PreferencesManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        
        // Skip auth for login endpoint
        if (request.url.encodedPath.contains("/auth/login")) {
            return chain.proceed(request)
        }
        
        // Get token from preferences
        val token = runBlocking {
            preferencesManager.authToken.first()
        }
        
        // Add Authorization header if token exists
        val authenticatedRequest = if (token != null) {
            request.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            request
        }
        
        return chain.proceed(authenticatedRequest)
    }
}
