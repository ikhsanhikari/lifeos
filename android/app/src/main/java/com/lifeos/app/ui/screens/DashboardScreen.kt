package com.lifeos.app.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.app.data.model.HabitDto
import com.lifeos.app.data.model.TaskDto
import com.lifeos.app.ui.components.GlassmorphicCard
import com.lifeos.app.ui.theme.*

import androidx.compose.material.icons.automirrored.filled.List
import com.lifeos.app.ui.viewmodel.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    val habits = uiState.habits
    val tasks = uiState.tasks
    val userName = uiState.userName
    val focusScore = uiState.focusScore

    Scaffold(
        containerColor = BackgroundDark,
        bottomBar = {
            GlassmorphicBottomNavigation(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it }
            )
        }
    ) { paddingValues ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = PrimaryIndigo)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                item { Spacer(modifier = Modifier.height(12.dp)) }

                // 1. Top Header (Greeting & Glow Pill)
                item {
                    HeaderSection(userName = userName)
                }

                // 2. Focus Score Hero Glass Card
                item {
                    FocusScoreHeroCard(score = focusScore)
                }

                // 3. Section Title: Habits Harian
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

                // 4. Habit Cards
                items(habits) { habit ->
                    HabitCardItem(
                        habit = habit,
                        onToggle = { viewModel.toggleHabit(habit.id) },
                        onSkip = { note -> viewModel.skipHabit(habit.id, note) }
                    )
                }

                // 5. Section Title: Task Prioritas Utama
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
                    }
                }

                // 6. Task List Cards
                items(tasks) { task ->
                    TaskCardItem(task = task)
                }

                item { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
}

@Composable
fun HeaderSection(userName: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "Selamat Datang 👋",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
            Text(
                text = userName,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .background(Brush.linearGradient(listOf(PrimaryIndigo, SecondaryViolet)))
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Text(
                text = "Life OS Premium",
                style = MaterialTheme.typography.labelSmall,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun FocusScoreHeroCard(score: Int) {
    val animatedProgress by animateFloatAsState(
        targetValue = score / 100f,
        animationSpec = tween(durationMillis = 1200),
        label = "scoreProgress"
    )

    GlassmorphicCard(
        modifier = Modifier.fillMaxWidth(),
        borderColor = PrimaryIndigo.copy(alpha = 0.4f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "RINGKASAN PERFORMANSA",
                    style = MaterialTheme.typography.labelSmall,
                    color = PrimaryIndigo,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Skor Fokus Harian",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Konsistensi habit & tugas kamu berada dalam ritme luar biasa hari ini! 🔥",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Circular Animated Progress Indicator
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(76.dp)
            ) {
                androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.08f),
                        style = Stroke(width = 8.dp.toPx())
                    )
                    drawArc(
                        brush = Brush.sweepGradient(listOf(PrimaryIndigo, SecondaryViolet, AccentEmeraldLight)),
                        startAngle = -90f,
                        sweepAngle = 360f * animatedProgress,
                        useCenter = false,
                        style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "$score%",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite
                    )
                }
            }
        }
    }
}

@Composable
fun HabitCardItem(
    habit: HabitDto,
    onToggle: () -> Unit,
    onSkip: (String?) -> Unit
) {
    GlassmorphicCard(
        modifier = Modifier.fillMaxWidth(),
        borderColor = if (habit.isDoneToday) AccentEmerald.copy(alpha = 0.5f) else GlassBorderDark
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                // Status Checkbox Icon
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (habit.isDoneToday) AccentEmerald else SurfaceDark)
                        .border(1.dp, if (habit.isDoneToday) AccentEmeraldLight else GlassBorderDark, CircleShape)
                        .clickable { onToggle() },
                    contentAlignment = Alignment.Center
                ) {
                    if (habit.isDoneToday) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Done",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column {
                    Text(
                        text = habit.name,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = if (habit.isDoneToday) TextMuted else TextWhite
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (habit.reminderTime != null) {
                            Text(
                                text = "⏰ ${habit.reminderTime}",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextMuted
                            )
                        }
                        Text(
                            text = "🔥 ${habit.streak} Hari Streak",
                            style = MaterialTheme.typography.labelSmall,
                            color = AccentAmber,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Quick Actions (Skip with note trigger)
            IconButton(onClick = { onSkip("Istirahat") }) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "Options",
                    tint = TextMuted
                )
            }
        }
    }
}

@Composable
fun TaskCardItem(task: TaskDto) {
    val (priorityColor, priorityBg) = when (task.priority) {
        "URGENT" -> Pair(AccentRose, PriorityUrgentBg)
        "HIGH" -> Pair(AccentAmber, PriorityHighBg)
        else -> Pair(PrimaryIndigo, PriorityMediumBg)
    }

    GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold
                )

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(priorityBg)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = task.priority,
                        style = MaterialTheme.typography.labelSmall,
                        color = priorityColor,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            if (task.goalTitle != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "🎯 Goal: ${task.goalTitle}",
                    style = MaterialTheme.typography.labelSmall,
                    color = SecondaryViolet
                )
            }
        }
    }
}

@Composable
fun GlassmorphicBottomNavigation(
    selectedTab: Int,
    onTabSelected: (Int) -> Unit
) {
    Surface(
        color = SurfaceDark.copy(alpha = 0.95f),
        tonalElevation = 8.dp,
        modifier = Modifier.border(1.dp, GlassBorderDark, RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
    ) {
        NavigationBar(
            containerColor = Color.Transparent,
            tonalElevation = 0.dp
        ) {
            NavigationBarItem(
                selected = selectedTab == 0,
                onClick = { onTabSelected(0) },
                icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                label = { Text("Home") }
            )
            NavigationBarItem(
                selected = selectedTab == 1,
                onClick = { onTabSelected(1) },
                icon = { Icon(Icons.Default.Refresh, contentDescription = "Habits") },
                label = { Text("Habits") }
            )
            NavigationBarItem(
                selected = selectedTab == 2,
                onClick = { onTabSelected(2) },
                icon = { Icon(Icons.AutoMirrored.Filled.List, contentDescription = "Tasks") },
                label = { Text("Tasks") }
            )
            NavigationBarItem(
                selected = selectedTab == 3,
                onClick = { onTabSelected(3) },
                icon = { Icon(Icons.Default.Star, contentDescription = "Goals") },
                label = { Text("Goals") }
            )
        }
    }
}

fun sampleHabits() = listOf(
    HabitDto(id = "1", name = "Minum 2 Liter Air", streak = 12, isDoneToday = true, reminderTime = "07:00"),
    HabitDto(id = "2", name = "Analisis Makanan Harian", streak = 5, isDoneToday = false, reminderTime = "10:00"),
    HabitDto(id = "3", name = "Koding / Belajar Kotlin", streak = 18, isDoneToday = false, reminderTime = "14:00")
)

fun sampleTasks() = listOf(
    TaskDto(id = "t1", title = "Deploy Life OS Web Push Service Worker", priority = "URGENT", goalTitle = "Production Release"),
    TaskDto(id = "t2", title = "Desain Jetpack Compose Glassmorphism UI", priority = "HIGH", goalTitle = "Android Native App")
)
