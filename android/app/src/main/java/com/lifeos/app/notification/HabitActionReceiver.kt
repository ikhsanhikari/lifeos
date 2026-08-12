package com.lifeos.app.notification

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast
import com.lifeos.app.data.repository.LifeOSRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
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
                when (action) {
                    LifeOSNotificationManager.ACTION_DONE -> {
                        val result = repository.checkInHabit(habitId)
                        withContext(Dispatchers.Main) {
                            if (result.isSuccess) {
                                Toast.makeText(context, "✅ Habit '$habitName' Berhasil Di-checkin!", Toast.LENGTH_SHORT).show()
                            } else {
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
                                Toast.makeText(context, "❌ Gagal me-skip habit", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
