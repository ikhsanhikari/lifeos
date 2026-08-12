package com.lifeos.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifeos.app.R
import com.lifeos.app.ui.theme.GlassBorderDark
import com.lifeos.app.ui.theme.PrimaryIndigo
import com.lifeos.app.ui.theme.SurfaceDark
import com.lifeos.app.ui.theme.TextMuted
import com.lifeos.app.ui.theme.TextWhite

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
            tonalElevation = 0.dp,
            modifier = Modifier.height(76.dp)
        ) {
            val tabs = listOf(
                Nav3DItem("Beranda", R.drawable.nav_3d_home, null),
                Nav3DItem("Habit", R.drawable.nav_3d_habits, null),
                Nav3DItem("Tasks", R.drawable.nav_3d_tasks, null),
                Nav3DItem("Jurnal", R.drawable.nav_3d_journal, null),
                Nav3DItem("Profil", null, Icons.Default.Person)
            )

            tabs.forEachIndexed { index, item ->
                val isSelected = selectedTab == index

                val scale by animateFloatAsState(
                    targetValue = if (isSelected) 1.18f else 0.92f,
                    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
                    label = "tabScale"
                )

                NavigationBarItem(
                    selected = isSelected,
                    onClick = { onTabSelected(index) },
                    colors = NavigationBarItemDefaults.colors(
                        indicatorColor = PrimaryIndigo.copy(alpha = 0.25f)
                    ),
                    icon = {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.scale(scale)
                        ) {
                            if (item.drawableRes != null) {
                                Image(
                                    painter = painterResource(id = item.drawableRes),
                                    contentDescription = item.label,
                                    modifier = Modifier
                                        .size(if (isSelected) 28.dp else 24.dp)
                                        .clip(CircleShape)
                                )
                            } else if (item.vectorIcon != null) {
                                Box(
                                    modifier = Modifier
                                        .size(if (isSelected) 28.dp else 24.dp)
                                        .clip(CircleShape)
                                        .background(if (isSelected) PrimaryIndigo else Color.Transparent),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = item.vectorIcon,
                                        contentDescription = item.label,
                                        tint = if (isSelected) Color.White else TextMuted,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    },
                    label = {
                        Text(
                            text = item.label,
                            fontSize = 10.sp,
                            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Normal,
                            color = if (isSelected) TextWhite else TextMuted
                        )
                    }
                )
            }
        }
    }
}

private data class Nav3DItem(
    val label: String,
    val drawableRes: Int?,
    val vectorIcon: androidx.compose.ui.graphics.vector.ImageVector?
)
