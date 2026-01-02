package com.prasco.mobile.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.prasco.mobile.data.local.datastore.PreferencesManager
import com.prasco.mobile.data.repository.AuthRepository
import com.prasco.mobile.domain.model.Resource
import com.prasco.mobile.domain.model.User
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    private val _loginState = MutableStateFlow<Resource<User>?>(null)
    val loginState: StateFlow<Resource<User>?> = _loginState.asStateFlow()

    val isLoggedIn: StateFlow<Boolean> = preferencesManager.isLoggedIn
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    val userName: StateFlow<String> = preferencesManager.userName
        .map { it ?: "" }
        .stateIn(viewModelScope, SharingStarted.Eagerly, "")

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = Resource.Loading()
            _loginState.value = authRepository.login(email, password)
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    fun clearLoginState() {
        _loginState.value = null
    }
}
