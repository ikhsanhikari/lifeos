package com.lifeos.app.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.lifeos.app.MainActivity

object LifeOSNotificationManager {

    const val CHANNEL_ID = "lifeos_habit_reminders"
    const val CHANNEL_NAME = "Pengingat Habit & Task"
    const val ACTION_DONE = "com.lifeos.app.ACTION_HABIT_DONE"
    const val ACTION_SKIP = "com.lifeos.app.ACTION_HABIT_SKIP"
    const val EXTRA_HABIT_ID = "extra_habit_id"
    const val EXTRA_HABIT_NAME = "extra_habit_name"
    const val EXTRA_NOTIFICATION_ID = "extra_notification_id"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifikasi pengingat habit harian & task Life OS"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 100, 250)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showHabitNotification(
        context: Context,
        notificationId: Int,
        habitId: String,
        title: String,
        message: String
    ) {
        createNotificationChannel(context)

        // Open App Intent
        val contentIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 1: [ ✅ Selesai ]
        val doneIntent = Intent(context, HabitActionReceiver::class.java).apply {
            action = ACTION_DONE
            putExtra(EXTRA_HABIT_ID, habitId)
            putExtra(EXTRA_HABIT_NAME, title)
            putExtra(EXTRA_NOTIFICATION_ID, notificationId)
        }
        val donePendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId * 10 + 1,
            doneIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 2: [ ⏭️ Skip ]
        val skipIntent = Intent(context, HabitActionReceiver::class.java).apply {
            action = ACTION_SKIP
            putExtra(EXTRA_HABIT_ID, habitId)
            putExtra(EXTRA_HABIT_NAME, title)
            putExtra(EXTRA_NOTIFICATION_ID, notificationId)
        }
        val skipPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId * 10 + 2,
            skipIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("⏰ $title")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .addAction(android.R.drawable.checkbox_on_background, "✅ Selesai", donePendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "⏭️ Skip", skipPendingIntent)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notificationId, notification)
    }
}
