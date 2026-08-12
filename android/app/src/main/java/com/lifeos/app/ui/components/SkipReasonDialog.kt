package com.lifeos.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.lifeos.app.ui.theme.*

@Composable
fun SkipReasonDialog(
    habitName: String,
    onDismiss: () -> Unit,
    onConfirmSkip: (String) -> Unit
) {
    var customReason by remember { mutableStateOf("") }
    var selectedQuickReason by remember { mutableStateOf("Istirahat / Recovery") }

    val quickReasons = listOf(
        "🛌 Istirahat / Recovery",
        "🤒 Sakit / Kurang Fit",
        "💼 Sibuk / Tugas Urgen",
        "✈️ Sedang Dalam Perjalanan"
    )

    Dialog(onDismissRequest = onDismiss) {
        GlassmorphicCard(
            modifier = Modifier.fillMaxWidth(),
            borderColor = AccentAmber.copy(alpha = 0.5f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp)
            ) {
                Text(
                    text = "LEWATI HABIT HARI INI",
                    style = MaterialTheme.typography.labelSmall,
                    color = AccentAmber,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = habitName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Pilih Alasan Cepat:",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )

                Spacer(modifier = Modifier.height(8.dp))

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    quickReasons.forEach { reason ->
                        val isSelected = selectedQuickReason == reason && customReason.isBlank()
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSelected) PrimaryIndigo.copy(alpha = 0.25f) else SurfaceDark)
                                .border(1.dp, if (isSelected) PrimaryIndigo else GlassBorderDark, RoundedCornerShape(10.dp))
                                .clickable {
                                    selectedQuickReason = reason
                                    customReason = ""
                                }
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = reason,
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (isSelected) TextWhite else TextMuted,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = customReason,
                    onValueChange = { customReason = it },
                    label = { Text("Atau Ketik Alasan Sendiri") },
                    placeholder = { Text("contoh: Ada acara keluarga") },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = SurfaceDark,
                        unfocusedContainerColor = SurfaceDark,
                        focusedBorderColor = PrimaryIndigo,
                        unfocusedBorderColor = GlassBorderDark,
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text(text = "Batal", color = TextMuted)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Button(
                        onClick = {
                            val finalNote = if (customReason.isNotBlank()) customReason.trim() else selectedQuickReason
                            onConfirmSkip(finalNote)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentAmber),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(text = "Lewati Habit ⏭️", fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                }
            }
        }
    }
}
