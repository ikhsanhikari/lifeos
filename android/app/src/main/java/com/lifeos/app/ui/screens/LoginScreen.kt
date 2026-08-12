package com.lifeos.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.app.ui.components.GlassmorphicCard
import com.lifeos.app.ui.theme.*
import com.lifeos.app.ui.viewmodel.LoginViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onLoginSuccess: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            onLoginSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 1. Branding Hero Card
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(Brush.linearGradient(listOf(PrimaryIndigo, SecondaryViolet)))
                    .border(1.dp, PrimaryIndigo.copy(alpha = 0.5f), RoundedCornerShape(22.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = "OTP Auth",
                    tint = Color.White,
                    modifier = Modifier.size(38.dp)
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = "Masuk ke Life OS",
                style = MaterialTheme.typography.titleLarge,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = TextWhite
            )

            Text(
                text = "Gunakan Kode Akses 6-Digit dari Telegram Bot",
                style = MaterialTheme.typography.bodyMedium,
                color = TextMuted,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            // 2. Telegram Bot Instruction Card
            GlassmorphicCard(
                modifier = Modifier.fillMaxWidth(),
                borderColor = PrimaryIndigo.copy(alpha = 0.3f)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "💬 LANGKAH MENDAPATKAN KODE:",
                        style = MaterialTheme.typography.labelSmall,
                        color = PrimaryIndigo,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Ketik /login di Telegram Bot kamu untuk mendapatkan 6-Digit Kode OTP.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextWhite,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedButton(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://t.me/HikariLifeOSBot"))
                            context.startActivity(intent)
                        },
                        shape = RoundedCornerShape(12.dp),
                        border = ButtonDefaults.outlinedButtonBorder.copy(brush = Brush.horizontalGradient(listOf(PrimaryIndigo, SecondaryViolet)))
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Telegram", tint = PrimaryIndigo, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Buka Telegram Bot ✈️", color = TextWhite, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 3. OTP Code Input & Submit Card
            GlassmorphicCard(
                modifier = Modifier.fillMaxWidth(),
                borderColor = GlassBorderDark
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {
                    Text(
                        text = "MASUKKAN KODE OTP 6-DIGIT",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextMuted,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // OTP Code Input Field
                    OutlinedTextField(
                        value = uiState.otpCode,
                        onValueChange = { viewModel.onOtpChanged(it) },
                        label = { Text("Kode OTP (6-Digit)") },
                        placeholder = { Text("contoh: 849201") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = SurfaceDark,
                            unfocusedContainerColor = SurfaceDark,
                            focusedBorderColor = PrimaryIndigo,
                            unfocusedBorderColor = GlassBorderDark,
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedLabelColor = PrimaryIndigo,
                            unfocusedLabelColor = TextMuted
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp)
                    )

                    if (uiState.errorMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = uiState.errorMessage!!,
                            style = MaterialTheme.typography.labelSmall,
                            color = AccentRose
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Submit Button
                    Button(
                        onClick = { viewModel.performLoginWithOtp() },
                        enabled = !uiState.isLoading && uiState.otpCode.length == 6,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent
                        ),
                        contentPadding = PaddingValues()
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    if (uiState.otpCode.length == 6) {
                                        Brush.horizontalGradient(listOf(PrimaryIndigo, SecondaryViolet))
                                    } else {
                                        Brush.horizontalGradient(listOf(GlassBorderDark, GlassBorderDark))
                                    }
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (uiState.isLoading) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    modifier = Modifier.size(24.dp),
                                    strokeWidth = 2.5.dp
                                )
                            } else {
                                Text(
                                    text = "Verifikasi Kode & Masuk 🚀",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (uiState.otpCode.length == 6) Color.White else TextMuted
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
