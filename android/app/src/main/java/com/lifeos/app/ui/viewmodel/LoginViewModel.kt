package com.lifeos.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.lifeos.app.data.local.DataStoreManager
import com.lifeos.app.data.remote.RetrofitInstance
import com.lifeos.app.data.repository.LifeOSRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val otpCode: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isLoggedIn: Boolean = false
)

class LoginViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = LifeOSRepository()
    private val dataStoreManager = DataStoreManager(application)

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    init {
        checkExistingSession()
    }

    private fun checkExistingSession() {
        viewModelScope.launch {
            dataStoreManager.authToken.collect { token ->
                if (!token.isNullOrEmpty()) {
                    RetrofitInstance.authToken = token
                    _uiState.value = _uiState.value.copy(isLoggedIn = true)
                }
            }
        }
    }

    fun onOtpChanged(newCode: String) {
        if (newCode.length <= 6) {
            _uiState.value = _uiState.value.copy(otpCode = newCode, errorMessage = null)
        }
    }

    fun performLoginWithOtp() {
        val code = _uiState.value.otpCode.trim()
        if (code.length != 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Kode OTP 6-digit harus diisi lengkap.")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val result = repository.verifyTelegramOtp(code)
            result.onSuccess { authData ->
                val token = authData.token ?: ""
                val user = authData.user
                dataStoreManager.saveUserSession(
                    token = token,
                    id = user?.id ?: "",
                    name = user?.name ?: "User Life OS",
                    email = user?.email ?: ""
                )
                _uiState.value = _uiState.value.copy(isLoading = false, isLoggedIn = true)
            }.onFailure { exception ->
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = exception.message ?: "Gagal memverifikasi kode OTP."
                )
            }
        }
    }
}
