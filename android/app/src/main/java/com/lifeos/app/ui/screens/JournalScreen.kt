package com.lifeos.app.ui.screens

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.app.ui.components.GlassmorphicCard
import com.lifeos.app.ui.theme.*

@Composable
fun JournalScreenContent(
    onSubmitLog: (String, String, Int) -> Unit
) {
    var content by remember { mutableStateOf("") }
    var selectedMood by remember { mutableStateOf("GREAT") }
    var energyLevel by remember { mutableFloatStateOf(80f) }
    var isSubmitted by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Column {
            Text(
                text = "Jurnal Harian & Mood Tracker",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Refleksikan pikiran dan tingkat energi kamu hari ini",
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
                Text(
                    text = "BAGAIMANA MOOD KAMU HARI INI?",
                    style = MaterialTheme.typography.labelSmall,
                    color = PrimaryIndigo,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    val moods = listOf(
                        Triple("GREAT", "🤩", "Luar Biasa"),
                        Triple("GOOD", "😊", "Senang"),
                        Triple("NEUTRAL", "😐", "Biasa"),
                        Triple("LOW", "😔", "Lelah"),
                        Triple("BAD", "😫", "Buruk")
                    )

                    moods.forEach { (key, emoji, label) ->
                        val isSelected = selectedMood == key
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .background(if (isSelected) PrimaryIndigo.copy(alpha = 0.3f) else SurfaceDark)
                                .border(1.dp, if (isSelected) PrimaryIndigo else GlassBorderDark, RoundedCornerShape(14.dp))
                                .clickable { selectedMood = key }
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(text = emoji, fontSize = 24.sp)
                                Text(text = label, style = MaterialTheme.typography.labelSmall, color = if (isSelected) TextWhite else TextMuted, fontSize = 9.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = "TINGKAT ENERGI HARIAN: ${energyLevel.toInt()}%",
                    style = MaterialTheme.typography.labelSmall,
                    color = AccentAmber,
                    fontWeight = FontWeight.Bold
                )

                Slider(
                    value = energyLevel,
                    onValueChange = { energyLevel = it },
                    valueRange = 0f..100f,
                    colors = SliderDefaults.colors(
                        thumbColor = AccentAmber,
                        activeTrackColor = AccentAmber,
                        inactiveTrackColor = SurfaceDark
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    label = { Text("Catatan Refleksi Jurnal") },
                    placeholder = { Text("Apa hal terbaik atau pencapaian kamu hari ini?") },
                    minLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = SurfaceDark,
                        unfocusedContainerColor = SurfaceDark,
                        focusedBorderColor = PrimaryIndigo,
                        unfocusedBorderColor = GlassBorderDark,
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        if (content.isNotBlank()) {
                            onSubmitLog(content, selectedMood, energyLevel.toInt())
                            isSubmitted = true
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
                ) {
                    Text(
                        text = if (isSubmitted) "✅ Jurnal Tersimpan!" else "Simpan Catatan Jurnal ✍️",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
