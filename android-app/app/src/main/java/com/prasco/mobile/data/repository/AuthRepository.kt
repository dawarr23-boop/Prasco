package com.prasco.mobile.data.repository

import com.prasco.mobile.data.local.datastore.PreferencesManager
import com.prasco.mobile.data.mapper.toDomain
import com.prasco.mobile.data.remote.api.AuthApi
import com.prasco.mobile.data.remote.dto.LoginRequest
import com.prasco.mobile.data.remote.dto.RefreshTokenRequest
import com.prasco.mobile.domain.model.Resource
import com.prasco.mobile.domain.model.User
import kotlinx.coroutines.flow.first
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.delay

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val preferencesManager: PreferencesManager,
    private val demoDataProvider: DemoDataProvider
) {

    suspend fun login(email: String, password: String): Resource<User> {
        // Prüfe zuerst Demo-Credentials für Offline-Modus
        if (demoDataProvider.isValidDemoCredentials(email, password)) {
            return loginDemoMode()
        }
        
        // Versuche Server-Login
        return try {
            val response = authApi.login(LoginRequest(email, password))
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    // Save tokens
                    preferencesManager.saveAuthTokens(
                        authToken = body.data.token,
                        refreshToken = body.data.refreshToken
                    )
                    
                    // Save user data
                    val user = body.data.user
                    preferencesManager.saveUserData(
                        userId = user.id,
                        email = user.email,
                        name = user.name,
                        role = user.role
                    )
                    
                    Resource.Success(user.toDomain())
                } else {
                    Resource.Error(body.message ?: "Login fehlgeschlagen")
                }
            } else {
                Resource.Error("Server-Fehler: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Login error - falling back to demo mode")
            // Fallback zu Demo-Modus bei Netzwerkfehler
            if (demoDataProvider.isValidDemoCredentials(email, password)) {
                return loginDemoMode()
            }
            Resource.Error("Offline-Modus: Verwende 'demo' / 'demo' für Demo-Login")
        }
    }
    
    private suspend fun loginDemoMode(): Resource<User> {
        Timber.d("Using demo mode login")
        delay(500) // Simuliere Netzwerk-Delay
        
        val demoUser = demoDataProvider.getDemoUser()
        
        // Speichere Demo-User Daten
        preferencesManager.saveAuthTokens(
            authToken = "demo_token_${System.currentTimeMillis()}",
            refreshToken = "demo_refresh_token"
        )
        
        preferencesManager.saveUserData(
            userId = demoUser.id,
            email = demoUser.email,
            name = demoUser.name,
            role = demoUser.role.name
        )
        
        return Resource.Success(demoUser)
    }

    suspend fun refreshToken(): Resource<String> {
        return try {
            val refreshToken = preferencesManager.refreshToken.first()
            
            if (refreshToken == null) {
                return Resource.Error("Kein Refresh Token vorhanden")
            }
            
            val response = authApi.refreshToken(RefreshTokenRequest(refreshToken))
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                
                if (body.success) {
                    preferencesManager.saveAuthTokens(
                        authToken = body.data.token,
                        refreshToken = body.data.refreshToken
                    )
                    Resource.Success(body.data.token)
                } else {
                    Resource.Error(body.message ?: "Token-Refresh fehlgeschlagen")
                }
            } else {
                Resource.Error("Server-Fehler: ${response.code()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Token refresh error")
            Resource.Error("Netzwerkfehler: ${e.localizedMessage}")
        }
    }

    suspend fun logout() {
        preferencesManager.clearAuthData()
    }

    suspend fun isLoggedIn(): Boolean {
        return preferencesManager.isLoggedIn.first()
    }
}
