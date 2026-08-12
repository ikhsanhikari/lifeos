package com.lifeos.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.dp
import com.lifeos.app.data.model.HabitDto
import com.lifeos.app.ui.components.*
import com.lifeos.app.ui.theme.*
import com.lifeos.app.ui.viewmodel.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onLoggedOut: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }
    var taskFilter by remember { mutableStateOf("ALL") }
    var showCreateBottomSheet by remember { mutableStateOf(false) }
    var selectedHabitForSkip by remember { mutableStateOf<HabitDto?>(null) }

    val haptics = LocalHapticFeedback.current
    val pullToRefreshState = rememberPullToRefreshState()

    if (pullToRefreshState.isRefreshing) {
        LaunchedEffect(true) {
            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
            viewModel.fetchDashboardData()
            pullToRefreshState.endRefresh()
        }
    }

    val habits = uiState.habits
    val tasks = uiState.tasks
    val userName = uiState.userName
    val focusScore = uiState.focusScore

    val filteredTasks = remember(tasks, taskFilter) {
        when (taskFilter) {
            "URGENT" -> tasks.filter { it.priority == "URGENT" }
            "HIGH" -> tasks.filter { it.priority == "HIGH" }
            "MEDIUM" -> tasks.filter { it.priority == "MEDIUM" || it.priority == "LOW" }
            "DONE" -> tasks.filter { it.status == "DONE" || it.status == "COMPLETED" }
            else -> tasks
        }
    }

    Scaffold(
        containerColor = BackgroundDark,
        bottomBar = {
            GlassmorphicBottomNavigation(
                selectedTab = selectedTab,
                onTabSelected = { tab ->
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    selectedTab = tab
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    showCreateBottomSheet = true
                },
                containerColor = Color.Transparent,
                shape = CircleShape,
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(PrimaryIndigo, SecondaryViolet)))
                    .border(1.dp, Color.White.copy(alpha = 0.4f), CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add Item",
                    tint = Color.White,
                    modifier = Modifier.size(28.dp)
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .nestedScroll(pullToRefreshState.nestedScrollConnection)
        ) {
            if (uiState.isLoading && !pullToRefreshState.isRefreshing) {
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
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item { Spacer(modifier = Modifier.height(12.dp)) }

                    when (selectedTab) {
                        0 -> homeScreenTabContent(userName, focusScore, habits, tasks, onNavigateTab = { tab ->
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            selectedTab = tab
                        })
                        1 -> habitsScreenTabContent(habits, viewModel) { habit ->
                            selectedHabitForSkip = habit
                        }
                        2 -> tasksScreenTabContent(tasks, filteredTasks, taskFilter, { filter ->
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            taskFilter = filter
                        }, viewModel)
                        3 -> item {
                            JournalScreenContent(
                                onSubmitLog = { content, mood, energy ->
                                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                    viewModel.submitDailyLog(content, mood, energy) {
                                        viewModel.fetchDashboardData()
                                    }
                                }
                            )
                        }
                        4 -> item {
                            SettingsProfileSectionContent(
                                userName = userName,
                                userEmail = uiState.userEmail,
                                onLogout = { viewModel.performLogout(onLoggedOut) }
                            )
                        }
                    }

                    item { Spacer(modifier = Modifier.height(24.dp)) }
                }
            }

            PullToRefreshContainer(
                state = pullToRefreshState,
                modifier = Modifier.align(Alignment.TopCenter),
                containerColor = SurfaceDark,
                contentColor = PrimaryIndigo
            )
        }

        if (showCreateBottomSheet) {
            ModalBottomSheet(
                onDismissRequest = { showCreateBottomSheet = false },
                containerColor = SurfaceDark,
                scrimColor = Color.Black.copy(alpha = 0.7f)
            ) {
                CreateItemBottomSheetContent(
                    viewModel = viewModel,
                    onDismiss = { showCreateBottomSheet = false }
                )
            }
        }

        selectedHabitForSkip?.let { habitToSkip ->
            SkipReasonDialog(
                habitName = habitToSkip.name,
                onDismiss = { selectedHabitForSkip = null },
                onConfirmSkip = { note ->
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    viewModel.skipHabit(habitToSkip.id, note)
                    selectedHabitForSkip = null
                }
            )
        }
    }
}
