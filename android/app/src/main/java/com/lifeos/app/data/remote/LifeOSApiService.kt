package com.lifeos.app.data.remote

import com.lifeos.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface LifeOSApiService {

    @POST("api/auth/verify-otp")
    suspend fun verifyOtp(@Body body: Map<String, String>): Response<AuthResponseDto>

    @POST("api/auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<ApiResponse<UserDto>>

    @GET("api/habits")
    suspend fun getHabits(): Response<ApiResponse<List<HabitDto>>>

    @POST("api/habits/check-in")
    suspend fun checkInHabit(@Body body: Map<String, String>): Response<ApiResponse<Unit>>

    @POST("api/habits/skip")
    suspend fun skipHabit(@Body body: Map<String, String>): Response<ApiResponse<Unit>>

    @GET("api/tasks")
    suspend fun getTasks(): Response<ApiResponse<List<TaskDto>>>

    @POST("api/tasks/{id}/toggle")
    suspend fun toggleTask(@Path("id") taskId: String): Response<ApiResponse<Unit>>

    @GET("api/goals")
    suspend fun getGoals(): Response<ApiResponse<List<GoalDto>>>
}
