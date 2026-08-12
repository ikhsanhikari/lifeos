package com.lifeos.app.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.text.font.FontWeight
import com.lifeos.app.data.model.HabitDto
import com.lifeos.app.ui.components.EmptyStateCard
import com.lifeos.app.ui.components.HabitCardItem
import com.lifeos.app.ui.theme.TextMuted
import com.lifeos.app.ui.viewmodel.DashboardViewModel

fun LazyListScope.habitsScreenTabContent(
    habits: List<HabitDto>,
    viewModel: DashboardViewModel
) {
    item {
        Column {
            Text(
                text = "Habits & Rutinitas",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Kelola dan lacak konsistensi harian kamu",
                style = MaterialTheme.typography.bodyMedium,
                color = TextMuted
            )
        }
    }

    if (habits.isEmpty()) {
        item { EmptyStateCard("Belum ada habit harian di database.") }
    } else {
        items(habits) { habit ->
            HabitCardItem(
                habit = habit,
                onToggle = { viewModel.toggleHabit(habit.id) },
                onSkip = { note -> viewModel.skipHabit(habit.id, note) }
            )
        }
    }
}
