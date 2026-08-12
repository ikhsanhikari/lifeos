package com.lifeos.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.runtime.*
import com.lifeos.app.ui.screens.DashboardScreen
import com.lifeos.app.ui.screens.LoginScreen
import com.lifeos.app.ui.theme.BackgroundDark
import com.lifeos.app.ui.theme.LifeOSTheme
import com.lifeos.app.ui.viewmodel.LoginViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
