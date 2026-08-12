package com.lifeos.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val telegramChatId: String? = null
)

@Serializable
data class AuthResponseDto(
    val success: Boolean = false,
    val message: String? = null,
    val token: String? = null,
    val user: UserDto? = null
)

@Serializable
data class HabitDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val frequency: String = "DAILY",
    val color: String = "indigo",
    val reminderTime: String? = null,
    val streak: Int = 0,
    val isDoneToday: Boolean = false,
    val isSkippedToday: Boolean = false,
    val skipNote: String? = null
)

@Serializable
data class HabitListResponse(
    val success: Boolean = false,
    val habits: List<HabitDto> = emptyList(),
    val message: String? = null
)

@Serializable
data class TaskDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val priority: String = "MEDIUM",
    val status: String = "TODO",
    val dueDate: String? = null,
    val dueTime: String? = null,
    val goalTitle: String? = null
)

@Serializable
data class TaskListResponse(
    val success: Boolean = false,
    val tasks: List<TaskDto> = emptyList(),
    val message: String? = null
)

@Serializable
data class GoalDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val progress: Int = 0,
    val color: String = "indigo"
)

@Serializable
data class GoalListResponse(
    val success: Boolean = false,
    val goals: List<GoalDto> = emptyList(),
    val message: String? = null
)

@Serializable
data class AnalyticsSummaryDto(
    val focusScore: Int = 0,
    val habitsCount: Int = 0,
    val completedHabits: Int = 0,
    val tasksCount: Int = 0,
    val completedTasks: Int = 0
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null,
    val data: T? = null
)
