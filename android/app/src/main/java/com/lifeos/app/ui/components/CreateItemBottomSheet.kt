package com.lifeos.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lifeos.app.ui.theme.*
import com.lifeos.app.ui.viewmodel.DashboardViewModel

@Composable
fun CreateItemBottomSheetContent(
    viewModel: DashboardViewModel,
    onDismiss: () -> Unit
) {
    var selectedCreateTab by remember { mutableIntStateOf(0) }

    var habitName by remember { mutableStateOf("") }
    var habitReminderTime by remember { mutableStateOf("07:00") }

    var taskTitle by remember { mutableStateOf("") }
    var taskPriority by remember { mutableStateOf("HIGH") }
    var taskDueTime by remember { mutableStateOf("14:00") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            FilterChipPill(
                label = "🔄 Habit Baru",
                isSelected = selectedCreateTab == 0,
                onClick = { selectedCreateTab = 0 }
            )
            FilterChipPill(
                label = "📋 Task Baru",
                isSelected = selectedCreateTab == 1,
                onClick = { selectedCreateTab = 1 }
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        if (selectedCreateTab == 0) {
            Text(
                text = "BUAT HABIT HARIAN BARU",
                style = MaterialTheme.typography.labelSmall,
                color = PrimaryIndigo,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = habitName,
                onValueChange = { habitName = it },
                label = { Text("Nama Habit") },
                placeholder = { Text("contoh: Olahraga Pagi 15 Menit") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = BackgroundDark,
                    unfocusedContainerColor = BackgroundDark,
                    focusedBorderColor = PrimaryIndigo,
                    unfocusedBorderColor = GlassBorderDark,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = habitReminderTime,
                onValueChange = { habitReminderTime = it },
                label = { Text("Jam Pengingat (HH:MM)") },
                placeholder = { Text("07:00") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = BackgroundDark,
                    unfocusedContainerColor = BackgroundDark,
                    focusedBorderColor = PrimaryIndigo,
                    unfocusedBorderColor = GlassBorderDark,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = {
                    if (habitName.isNotBlank()) {
                        viewModel.createNewHabit(habitName, habitReminderTime, onDismiss)
                    }
                },
                enabled = habitName.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
            ) {
                Text(text = "Simpan Habit Baru 🚀", fontWeight = FontWeight.Bold)
            }
        } else {
            Text(
                text = "BUAT TASK PRIORITAS BARU",
                style = MaterialTheme.typography.labelSmall,
                color = PrimaryIndigo,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = taskTitle,
                onValueChange = { taskTitle = it },
                label = { Text("Judul Task") },
                placeholder = { Text("contoh: Review PR Code Release") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = BackgroundDark,
                    unfocusedContainerColor = BackgroundDark,
                    focusedBorderColor = PrimaryIndigo,
                    unfocusedBorderColor = GlassBorderDark,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(text = "Tingkat Prioritas:", style = MaterialTheme.typography.labelSmall, color = TextMuted)
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("URGENT", "HIGH", "MEDIUM").forEach { prio ->
                    FilterChipPill(
                        label = prio,
                        isSelected = taskPriority == prio,
                        onClick = { taskPriority = prio }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = taskDueTime,
                onValueChange = { taskDueTime = it },
                label = { Text("Jam Tenggat (HH:MM)") },
                placeholder = { Text("14:00") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = BackgroundDark,
                    unfocusedContainerColor = BackgroundDark,
                    focusedBorderColor = PrimaryIndigo,
                    unfocusedBorderColor = GlassBorderDark,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = {
                    if (taskTitle.isNotBlank()) {
                        viewModel.createNewTask(taskTitle, taskPriority, taskDueTime, onDismiss)
                    }
                },
                enabled = taskTitle.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
            ) {
                Text(text = "Simpan Task Baru 🚀", fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}
