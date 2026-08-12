package com.lifeos.app.ui.components

import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.lifeos.app.ui.theme.GlassBorderDark
import com.lifeos.app.ui.theme.SurfaceDark

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
                icon = { Icon(Icons.Default.Edit, contentDescription = "Journal") },
                label = { Text("Jurnal") }
            )
            NavigationBarItem(
                selected = selectedTab == 4,
                onClick = { onTabSelected(4) },
                icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                label = { Text("Profil") }
            )
        }
    }
}
