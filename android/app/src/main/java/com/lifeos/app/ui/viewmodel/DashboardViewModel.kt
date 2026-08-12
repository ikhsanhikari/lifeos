package com.lifeos.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifeos.app.data.model.*
import com.lifeos.app.data.repository.LifeOSRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = true,
    val userName: String = "Ikhya",
    val focusScore: Int = 85,
    val habits: List<HabitDto> = emptyList(),
    val tasks: List<TaskDto> = emptyList(),
    val goals: List<GoalDto> = emptyList(),
    val errorMessage: String? = null
)

class DashboardViewModel(
    private val repository: LifeOSRepository = LifeOSRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        fetchDashboardData()
    }

    fun fetchDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            // Perform dev login if token is missing
            repository.autoDevLogin()

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
                focusScore = calculatedFocusScore,
                habits = habits,
                tasks = tasks,
                goals = goals
            )
        }
    }

    fun toggleHabit(habitId: String) {
        viewModelScope.launch {
            val result = repository.checkInHabit(habitId)
            if (result.isSuccess) {
                // Optimistically update or refetch
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
}
