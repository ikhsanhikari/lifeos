package com.lifeos.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lifeos.app.data.model.TaskDto
import com.lifeos.app.ui.components.EmptyStateCard
import com.lifeos.app.ui.components.FilterChipPill
import com.lifeos.app.ui.components.TaskCardItem
import com.lifeos.app.ui.theme.TextMuted
import com.lifeos.app.ui.viewmodel.DashboardViewModel

fun LazyListScope.tasksScreenTabContent(
    tasks: List<TaskDto>,
    filteredTasks: List<TaskDto>,
    taskFilter: String,
    onFilterChanged: (String) -> Unit,
    viewModel: DashboardViewModel
) {
    item {
        Column {
            Text(
                text = "Task & Prioritas",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Daftar tugas pekerjaan dan fokus utama kamu",
                style = MaterialTheme.typography.bodyMedium,
                color = TextMuted
            )
        }
    }

    item {
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            item {
                FilterChipPill(
                    label = "Semua (${tasks.size})",
                    isSelected = taskFilter == "ALL",
                    onClick = { onFilterChanged("ALL") }
                )
            }
            item {
                FilterChipPill(
                    label = "🔴 Urgent (${tasks.count { it.priority == "URGENT" }})",
                    isSelected = taskFilter == "URGENT",
                    onClick = { onFilterChanged("URGENT") }
                )
            }
            item {
                FilterChipPill(
                    label = "🟡 High (${tasks.count { it.priority == "HIGH" }})",
                    isSelected = taskFilter == "HIGH",
                    onClick = { onFilterChanged("HIGH") }
                )
            }
            item {
                FilterChipPill(
                    label = "🔵 Medium (${tasks.count { it.priority == "MEDIUM" || it.priority == "LOW" }})",
                    isSelected = taskFilter == "MEDIUM",
                    onClick = { onFilterChanged("MEDIUM") }
                )
            }
            item {
                FilterChipPill(
                    label = "✅ Selesai (${tasks.count { it.status == "DONE" || it.status == "COMPLETED" }})",
                    isSelected = taskFilter == "DONE",
                    onClick = { onFilterChanged("DONE") }
                )
            }
        }
    }

    if (filteredTasks.isEmpty()) {
        item { EmptyStateCard("Tidak ada task dalam kategori ini.") }
    } else {
        items(filteredTasks) { task ->
            TaskCardItem(
                task = task,
                onToggle = { viewModel.toggleTask(task.id) }
            )
        }
    }
}
