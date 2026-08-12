package com.lifeos.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lifeos.app.data.remote.RetrofitInstance
import com.lifeos.app.notification.LifeOSNotificationManager
import com.lifeos.app.ui.components.GlassmorphicCard
import com.lifeos.app.ui.theme.*

@Composable
fun SettingsProfileSectionContent(
    userName: String,
    userEmail: String,
    onLogout: () -> Unit
) {
    val context = LocalContext.current

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Column {
            Text(
                text = "Pengaturan & Profil",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Kelola akun dan koneksi server Life OS kamu",
                style = MaterialTheme.typography.bodyMedium,
                color = TextMuted
            )
        }

        GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(PrimaryIndigo, SecondaryViolet))),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = userName.take(1).uppercase(),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text(
                            text = userName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = userEmail,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
                HorizontalDivider(color = GlassBorderDark)
                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "INFORMASI SYSTEM & SERVER",
                    style = MaterialTheme.typography.labelSmall,
                    color = PrimaryIndigo,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Host Server API", style = MaterialTheme.typography.bodyMedium, color = TextMuted)
                    Text(text = RetrofitInstance.baseUrl, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = AccentEmeraldLight)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Status Autentikasi", style = MaterialTheme.typography.bodyMedium, color = TextMuted)
                    Text(text = "JWT Session Active 🟢", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = AccentEmeraldLight)
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Test Notification Button
                OutlinedButton(
                    onClick = {
                        LifeOSNotificationManager.showHabitNotification(
                            context = context,
                            notificationId = 9999,
                            habitId = "test_habit_id",
                            title = "Minum 2 Liter Air 💧",
                            message = "Waktunya minum air putih! Tekan tombol [ ✅ Selesai ] untuk check-in langsung dari notifikasi."
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = ButtonDefaults.outlinedButtonBorder.copy(brush = Brush.horizontalGradient(listOf(PrimaryIndigo, SecondaryViolet)))
                ) {
                    Icon(Icons.Default.Notifications, contentDescription = "Test Notification", tint = PrimaryIndigo)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "🔔 Uji Notifikasi Interaktif HP", fontWeight = FontWeight.Bold, color = TextWhite)
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Logout Button
                Button(
                    onClick = onLogout,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentRose)
                ) {
                    Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Keluar Sesi Akun (Logout)", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}
