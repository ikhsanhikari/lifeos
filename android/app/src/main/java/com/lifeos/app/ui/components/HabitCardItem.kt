package com.lifeos.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.lifeos.app.data.model.HabitDto
import com.lifeos.app.ui.theme.*

@Composable
fun HabitCardItem(
    habit: HabitDto,
    onToggle: () -> Unit,
    onSkip: (String?) -> Unit
) {
    val haptics = LocalHapticFeedback.current

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
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (habit.isDoneToday) AccentEmerald else SurfaceDark)
                        .border(1.dp, if (habit.isDoneToday) AccentEmeraldLight else GlassBorderDark, CircleShape)
                        .clickable {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onToggle()
                        },
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
                        color = if (habit.isDoneToday) TextMuted else TextWhite,
                        textDecoration = if (habit.isDoneToday) TextDecoration.LineThrough else TextDecoration.None
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

            IconButton(onClick = {
                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                onSkip("Istirahat")
            }) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "Options",
                    tint = TextMuted
                )
            }
        }
    }
}
