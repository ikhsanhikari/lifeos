package com.lifeos.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.lifeos.app.notification.LifeOSNotificationManager
import com.lifeos.app.ui.screens.DashboardScreen
import com.lifeos.app.ui.screens.LoginScreen
import com.lifeos.app.ui.theme.BackgroundDark
import com.lifeos.app.ui.theme.LifeOSTheme
import com.lifeos.app.ui.viewmodel.LoginViewModel

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        // Permission result handled silently
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Notification Channel
        LifeOSNotificationManager.createNotificationChannel(this)

        // Request POST_NOTIFICATIONS on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        setContent {
            LifeOSTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BackgroundDark
                ) {
                    val loginViewModel: LoginViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
                    val loginState by loginViewModel.uiState.collectAsState()

                    if (loginState.isLoggedIn) {
                        DashboardScreen(
                            onLoggedOut = {
                                finish()
                                startActivity(intent)
                            }
                        )
                    } else {
                        LoginScreen(
                            viewModel = loginViewModel,
                            onLoginSuccess = {}
                        )
                    }
                }
            }
        }
    }
}
