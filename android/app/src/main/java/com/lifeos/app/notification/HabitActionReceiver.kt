package com.lifeos.app.notification

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import com.lifeos.app.data.local.DataStoreManager
import com.lifeos.app.data.remote.RetrofitInstance
import com.lifeos.app.data.repository.LifeOSRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class HabitActionReceiver : BroadcastReceiver() {

    private val repository = LifeOSRepository()

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        val habitId = intent.getStringExtra(LifeOSNotificationManager.EXTRA_HABIT_ID) ?: return
        val habitName = intent.getStringExtra(LifeOSNotificationManager.EXTRA_HABIT_NAME) ?: "Habit"
        val notificationId = intent.getIntExtra(LifeOSNotificationManager.EXTRA_NOTIFICATION_ID, 0)

        // Dismiss notification
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(notificationId)

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Ensure JWT token is loaded into RetrofitInstance from DataStore in background
                val dataStoreManager = DataStoreManager(context.applicationContext)
                val token = dataStoreManager.authToken.firstOrNull()
                if (!token.isNullOrEmpty()) {
                    RetrofitInstance.authToken = token
                } else {
                    Log.e("HabitActionReceiver", "Auth token is missing in DataStore")
                }

                when (action) {
                    LifeOSNotificationManager.ACTION_DONE -> {
                        val result = repository.checkInHabit(habitId)
                        withContext(Dispatchers.Main) {
                            if (result.isSuccess) {
                                Toast.makeText(context, "✅ Habit '$habitName' Berhasil Di-checkin!", Toast.LENGTH_SHORT).show()
                            } else {
                                Log.e("HabitActionReceiver", "Check-in failed: ${result.exceptionOrNull()?.message}")
                                Toast.makeText(context, "❌ Gagal me-checkin habit", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                    LifeOSNotificationManager.ACTION_SKIP -> {
                        val result = repository.skipHabit(habitId, "Di-skip dari Notifikasi Android")
                        withContext(Dispatchers.Main) {
                            if (result.isSuccess) {
                                Toast.makeText(context, "⏭️ Habit '$habitName' Dilewati", Toast.LENGTH_SHORT).show()
                            } else {
                                Log.e("HabitActionReceiver", "Skip failed: ${result.exceptionOrNull()?.message}")
                                Toast.makeText(context, "❌ Gagal me-skip habit", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("HabitActionReceiver", "Error processing notification action", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "❌ Terjadi kesalahan: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
