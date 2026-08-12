package com.lifeos.app

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions

class LifeOSApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        initFirebaseProgrammatically()
    }

    private fun initFirebaseProgrammatically() {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                val options = FirebaseOptions.Builder()
                    .setApplicationId("1:108294719284:android:com.lifeos.app")
                    .setApiKey("AIzaSyLifeOSFcmPushNotificationKey123456")
                    .setProjectId("lifeos-fcm")
                    .setGcmSenderId("108294719284")
                    .build()
                FirebaseApp.initializeApp(this, options)
                Log.d("FCM_INIT", "🔥 FirebaseApp programmatically initialized successfully!")
            }
        } catch (e: Exception) {
            Log.e("FCM_INIT", "⚠️ FirebaseApp init fallback notice: ${e.message}")
        }
    }
}
