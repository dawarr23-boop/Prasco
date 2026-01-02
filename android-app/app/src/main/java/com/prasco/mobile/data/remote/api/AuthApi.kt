package com.prasco.mobile.data.remote.api

import com.prasco.mobile.data.remote.dto.LoginRequest
import com.prasco.mobile.data.remote.dto.LoginResponse
import com.prasco.mobile.data.remote.dto.RefreshTokenRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    
    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>
    
    @POST("auth/refresh")
    suspend fun refreshToken(
        @Body request: RefreshTokenRequest
    ): Response<LoginResponse>
}
