package com.lifeos.app.ui.screens

import java.util.Calendar
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.app.R
import com.lifeos.app.data.model.HabitDto
import com.lifeos.app.data.model.TaskDto
import com.lifeos.app.ui.components.GlassmorphicCard
import com.lifeos.app.ui.theme.*

fun LazyListScope.homeScreenTabContent(
    userName: String,
    focusScore: Int,
    habits: List<HabitDto>,
    tasks: List<TaskDto>,
    onNavigateTab: (Int) -> Unit = {}
) {
    val habitsDone = habits.count { it.isDoneToday }
    val habitsTotal = habits.size
    val tasksDone = tasks.count { it.status == "DONE" || it.status == "COMPLETED" }
    val tasksTotal = tasks.size

    item {
        HomeGreetingHeader(userName = userName)
    }

    item {
        AnimatedHeroFocusRingCard(focusScore = focusScore)
    }

    item {
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "RINGKASAN METRIK HARI INI",
            style = MaterialTheme.typography.labelSmall,
            color = PrimaryIndigo,
            fontWeight = FontWeight.Bold
        )
    }

    item {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AnimatedMetricCard(
                modifier = Modifier.weight(1f),
                title = "Habit Konsistensi",
                value = "$habitsDone / $habitsTotal",
                subtitle = "Selesai Hari Ini 🔥",
                icon = Icons.Default.Refresh,
                accentColor = AccentEmeraldLight,
                onClick = { onNavigateTab(1) }
            )

            AnimatedMetricCard(
                modifier = Modifier.weight(1f),
                title = "Tugas & Prioritas",
                value = "$tasksDone / $tasksTotal",
                subtitle = "Task Selesai 🎯",
                icon = Icons.AutoMirrored.Filled.List,
                accentColor = SecondaryViolet,
                onClick = { onNavigateTab(2) }
            )
        }
    }

    item {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AnimatedMetricCard(
                modifier = Modifier.weight(1f),
                title = "Tingkat Energi",
                value = "85%",
                subtitle = "Optimal & Prima ⚡",
                icon = Icons.Default.Star,
                accentColor = AccentAmber,
                onClick = { onNavigateTab(3) }
            )

            AnimatedMetricCard(
                modifier = Modifier.weight(1f),
                title = "Mood Harian",
                value = "🤩 Harapan",
                subtitle = "Refleksi Jurnal 📝",
                icon = Icons.Default.Edit,
                accentColor = PrimaryIndigo,
                onClick = { onNavigateTab(3) }
            )
        }
    }

    item {
        Spacer(modifier = Modifier.height(8.dp))
        MotivationalQuoteCard()
    }
}

@Composable
fun HomeGreetingHeader(userName: String) {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        hour in 4..11 -> "Selamat Pagi 🌅"
        hour in 12..17 -> "Selamat Siang ☀️"
        hour in 18..21 -> "Selamat Sore 🌆"
        else -> "Selamat Malam 🌙"
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                painter = painterResource(id = R.drawable.ic_lifeos_logo),
                contentDescription = "Life OS Logo",
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, PrimaryIndigo.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = greeting,
                    style = MaterialTheme.typography.labelMedium,
                    color = TextMuted
                )
                Text(
                    text = userName,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextWhite
                )
            }
        }

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(Brush.linearGradient(listOf(PrimaryIndigo, SecondaryViolet)))
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = "VIP",
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Life OS",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun AnimatedHeroFocusRingCard(focusScore: Int) {
    val animatedProgress by animateFloatAsState(
        targetValue = focusScore / 100f,
        animationSpec = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
        label = "heroScoreProgress"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "pulseGlow")
    val glowScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowScale"
    )

    val bobOffsetY by infiniteTransition.animateFloat(
        initialValue = -5f,
        targetValue = 5f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "bobOffsetY"
    )

    GlassmorphicCard(
        modifier = Modifier.fillMaxWidth(),
        borderColor = PrimaryIndigo.copy(alpha = 0.5f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // LEFT SIDE: Clean Bold Typography Metric & Progress Status
                Column(modifier = Modifier.weight(1.2f)) {
                    Text(
                        text = "SKOR FOKUS HARIAN",
                        style = MaterialTheme.typography.labelSmall,
                        color = PrimaryIndigo,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.2.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "$focusScore%",
                        style = MaterialTheme.typography.headlineLarge,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.Black,
                        color = TextWhite
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(AccentEmeraldLight.copy(alpha = 0.15f))
                            .border(1.dp, AccentEmeraldLight.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "⚡ Performa Sangat Prima",
                            style = MaterialTheme.typography.labelSmall,
                            color = AccentEmeraldLight,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // RIGHT SIDE: 3D Floating Glass Orb with Animated Circular Ring Gauge
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(115.dp)
                        .scale(glowScale)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        drawCircle(
                            color = Color.White.copy(alpha = 0.08f),
                            style = Stroke(width = 8.dp.toPx())
                        )
                        drawArc(
                            brush = Brush.sweepGradient(listOf(PrimaryIndigo, SecondaryViolet, AccentEmeraldLight, PrimaryIndigo)),
                            startAngle = -90f,
                            sweepAngle = 360f * animatedProgress,
                            useCenter = false,
                            style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                        )
                    }

                    Image(
                        painter = painterResource(id = R.drawable.orb_3d),
                        contentDescription = "3D Glass Orb",
                        modifier = Modifier
                            .size(80.dp)
                            .offset(y = bobOffsetY.dp)
                            .clip(CircleShape)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = GlassBorderDark)
            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Fokus dan ritme produktivitas kamu berada dalam kondisi sangat tinggi hari ini! ✨",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )
        }
    }
}

@Composable
fun AnimatedMetricCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accentColor: Color,
    onClick: () -> Unit
) {
    GlassmorphicCard(
        modifier = modifier
            .height(125.dp)
            .clickable { onClick() },
        borderColor = accentColor.copy(alpha = 0.35f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = accentColor,
                        modifier = Modifier.size(16.dp)
                    )
                }

                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = accentColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp
                )
            }

            Column {
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextWhite
                )

                Text(
                    text = title,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
fun MotivationalQuoteCard() {
    GlassmorphicCard(
        modifier = Modifier.fillMaxWidth(),
        borderColor = GlassBorderDark
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "💡", fontSize = 28.sp)
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "\"Konsistensi kecil setiap hari akan menghasilkan dampak besar yang tak terhentikan.\"",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextWhite,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "— Life OS Mindset Directive",
                    style = MaterialTheme.typography.labelSmall,
                    color = PrimaryIndigo,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
