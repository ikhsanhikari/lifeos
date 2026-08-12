package com.lifeos.app.data.repository

import com.lifeos.app.data.model.*
import com.lifeos.app.data.remote.RetrofitInstance

class LifeOSRepository {

    private val api = RetrofitInstance.api

    suspend fun verifyTelegramOtp(otpCode: String): Result<AuthResponseDto> {
        return try {
            val response = api.verifyOtp(mapOf("otpCode" to otpCode))
            val body = response.body()
            if (response.isSuccessful && body?.success == true && !body.token.isNullOrEmpty()) {
                RetrofitInstance.authToken = body.token
                Result.success(body)
            } else {
                Result.failure(Exception(body?.message ?: "Kode OTP tidak valid."))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHabits(): Result<List<HabitDto>> {
        return try {
            val response = api.getHabits()
            val body = response.body()
            if (response.isSuccessful && body?.success == true) {
                Result.success(body.habits)
            } else {
                Result.failure(Exception(body?.message ?: "Gagal memuat habits"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createHabit(name: String, reminderTime: String?): Result<Unit> {
        return try {
            val map = mutableMapOf("name" to name, "frequency" to "DAILY")
            if (!reminderTime.isNullOrBlank()) map["reminderTime"] = reminderTime
            val response = api.createHabit(map)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Gagal membuat habit"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkInHabit(habitId: String): Result<Unit> {
        return try {
            val response = api.checkInHabit(mapOf("habitId" to habitId))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Check-in gagal"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun skipHabit(habitId: String, note: String?): Result<Unit> {
        return try {
            val response = api.skipHabit(mapOf("habitId" to habitId, "note" to (note ?: "")))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Skip habit gagal"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTasks(): Result<List<TaskDto>> {
        return try {
            val response = api.getTasks()
            val body = response.body()
            if (response.isSuccessful && body?.success == true) {
                Result.success(body.tasks)
            } else {
                Result.failure(Exception(body?.message ?: "Gagal memuat task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createTask(title: String, priority: String, dueTime: String?): Result<Unit> {
        return try {
            val map = mutableMapOf("title" to title, "priority" to priority)
            if (!dueTime.isNullOrBlank()) map["dueTime"] = dueTime
            val response = api.createTask(map)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Gagal membuat task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleTask(taskId: String): Result<Unit> {
        return try {
            val response = api.toggleTask(taskId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Toggle task gagal"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getGoals(): Result<List<GoalDto>> {
        return try {
            val response = api.getGoals()
            val body = response.body()
            if (response.isSuccessful && body?.success == true) {
                Result.success(body.goals)
            } else {
                Result.failure(Exception(body?.message ?: "Gagal memuat goal"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun saveDailyLog(content: String, mood: String, energyLevel: Int): Result<Unit> {
        return try {
            val map = mapOf(
                "content" to content,
                "mood" to mood,
                "energyLevel" to energyLevel.toString()
            )
            val response = api.saveDailyLog(map)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Gagal menyimpan jurnal harian"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
