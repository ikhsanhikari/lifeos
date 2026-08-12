package com.lifeos.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lifeos.app.data.model.HabitDto
import com.lifeos.app.data.model.TaskDto
import com.lifeos.app.ui.components.*
import com.lifeos.app.ui.theme.AccentEmeraldLight
import com.lifeos.app.ui.viewmodel.DashboardViewModel

fun LazyListScope.homeScreenTabContent(
    userName: String,
    focusScore: Int,
    habits: List<HabitDto>,
    tasks: List<TaskDto>,
    viewModel: DashboardViewModel
) {
    item { HeaderSection(userName = userName) }
    item { FocusScoreHeroCard(score = focusScore) }
    item {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Habit Harian Hari Ini",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "${habits.count { it.isDoneToday }}/${habits.size} Selesai",
                style = MaterialTheme.typography.labelSmall,
                color = AccentEmeraldLight
            )
        }
    }

    if (habits.isEmpty()) {
        item { EmptyStateCard("Belum ada habit harian yang dibuat.") }
    } else {
        items(habits.take(3)) { habit ->
            HabitCardItem(
                habit = habit,
                onToggle = { viewModel.toggleHabit(habit.id) },
                onSkip = { note -> viewModel.skipHabit(habit.id, note) }
            )
        }
    }

    item {
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Fokus Utama & Task",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "${tasks.count { it.status == "DONE" || it.status == "COMPLETED" }}/${tasks.size} Selesai",
                style = MaterialTheme.typography.labelSmall,
                color = AccentEmeraldLight
            )
        }
    }

    if (tasks.isEmpty()) {
        item { EmptyStateCard("Belum ada task aktif saat ini.") }
    } else {
        items(tasks.take(3)) { task ->
            TaskCardItem(
                task = task,
                onToggle = { viewModel.toggleTask(task.id) }
            )
        }
    }
}
