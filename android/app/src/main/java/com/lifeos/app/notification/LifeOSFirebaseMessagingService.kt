package com.lifeos.app.notification

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.lifeos.app.data.remote.RetrofitInstance
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class LifeOSFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM_PUSH", "New FCM Device Token: $token")
        registerFcmTokenToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "Life OS Reminder"
        val body = remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: "Waktunya menyelesaikan habit kamu!"
        val habitId = remoteMessage.data["habitId"] ?: "default_id"

        val notificationId = (System.currentTimeMillis() % 10000).toInt()

        LifeOSNotificationManager.showHabitNotification(
            context = applicationContext,
            notificationId = notificationId,
            habitId = habitId,
            title = title,
            message = body
        )
    }

    private fun registerFcmTokenToServer(fcmToken: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (!RetrofitInstance.authToken.isNullOrEmpty()) {
                    RetrofitInstance.api.registerFcmToken(mapOf("fcmToken" to fcmToken))
                }
            } catch (e: Exception) {
                Log.e("FCM_PUSH", "Failed to register FCM Token to server: ${e.message}")
            }
        }
    }
}
