package com.lifeos.app.ui.viewmodel

import android.app.Application
import android.provider.Settings
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.messaging.FirebaseMessaging
import com.lifeos.app.data.local.DataStoreManager
import com.lifeos.app.data.model.*
import com.lifeos.app.data.remote.RetrofitInstance
import com.lifeos.app.data.repository.LifeOSRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = true,
    val userName: String = "User Life OS",
    val userEmail: String = "user@lifeos.internal",
    val focusScore: Int = 85,
    val habits: List<HabitDto> = emptyList(),
    val tasks: List<TaskDto> = emptyList(),
    val goals: List<GoalDto> = emptyList(),
    val errorMessage: String? = null,
    val actionSuccessMessage: String? = null
)

class DashboardViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = LifeOSRepository()
    private val dataStoreManager = DataStoreManager(application)

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        registerFcmTokenOnLaunch()
        fetchDashboardData()
    }

    private fun registerFcmTokenOnLaunch() {
        viewModelScope.launch {
            try {
                val token = dataStoreManager.authToken.firstOrNull()
                if (!token.isNullOrEmpty()) {
                    RetrofitInstance.authToken = token

                    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                        val fcmToken = if (task.isSuccessful && !task.result.isNullOrEmpty()) {
                            task.result
                        } else {
                            val androidId = Settings.Secure.getString(
                                getApplication<Application>().contentResolver,
                                Settings.Secure.ANDROID_ID
                            ) ?: "device_id"
                            "android_fcm_$androidId"
                        }

                        viewModelScope.launch {
                            try {
                                val res = repository.registerFcmToken(fcmToken)
                                if (res.isSuccess) {
                                    Log.d("FCM_PUSH", "✅ Auto-registered FCM Token to server: $fcmToken")
                                } else {
                                    Log.e("FCM_PUSH", "⚠️ Server returned error registering FCM Token")
                                }
                            } catch (e: Exception) {
                                Log.e("FCM_PUSH", "❌ Error registering FCM Token: ${e.message}")
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("FCM_PUSH", "Error in registerFcmTokenOnLaunch: ${e.message}")
            }
        }
    }

    fun fetchDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val token = dataStoreManager.authToken.firstOrNull()
            if (!token.isNullOrEmpty()) {
                RetrofitInstance.authToken = token
            }

            val name = dataStoreManager.userName.firstOrNull() ?: "User Life OS"

            val habitsResult = repository.getHabits()
            val tasksResult = repository.getTasks()
            val goalsResult = repository.getGoals()

            val habits = habitsResult.getOrDefault(emptyList())
            val tasks = tasksResult.getOrDefault(emptyList())
            val goals = goalsResult.getOrDefault(emptyList())

            val completedHabits = habits.count { it.isDoneToday }
            val calculatedFocusScore = if (habits.isNotEmpty()) {
                ((completedHabits.toFloat() / habits.size.toFloat()) * 100).toInt()
            } else 85

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                userName = name,
                focusScore = calculatedFocusScore,
                habits = habits,
                tasks = tasks,
                goals = goals
            )
        }
    }

    fun createNewHabit(name: String, reminderTime: String?, onComplete: () -> Unit) {
        viewModelScope.launch {
            val result = repository.createHabit(name, reminderTime)
            if (result.isSuccess) {
                fetchDashboardData()
                onComplete()
            }
        }
    }

    fun createNewTask(title: String, priority: String, dueTime: String?, onComplete: () -> Unit) {
        viewModelScope.launch {
            val result = repository.createTask(title, priority, dueTime)
            if (result.isSuccess) {
                fetchDashboardData()
                onComplete()
            }
        }
    }

    fun submitDailyLog(content: String, mood: String, energyLevel: Int, onComplete: () -> Unit) {
        viewModelScope.launch {
            val result = repository.saveDailyLog(content, mood, energyLevel)
            if (result.isSuccess) {
                onComplete()
            }
        }
    }

    fun toggleHabit(habitId: String) {
        viewModelScope.launch {
            val result = repository.checkInHabit(habitId)
            if (result.isSuccess) {
                fetchDashboardData()
            }
        }
    }

    fun skipHabit(habitId: String, note: String?) {
        viewModelScope.launch {
            val result = repository.skipHabit(habitId, note)
            if (result.isSuccess) {
                fetchDashboardData()
            }
        }
    }

    fun toggleTask(taskId: String) {
        viewModelScope.launch {
            val result = repository.toggleTask(taskId)
            if (result.isSuccess) {
                fetchDashboardData()
            }
        }
    }

    fun performLogout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            dataStoreManager.clearSession()
            RetrofitInstance.authToken = null
            onLoggedOut()
        }
    }
}
