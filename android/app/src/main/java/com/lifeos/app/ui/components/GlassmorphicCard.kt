package com.lifeos.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.lifeos.app.ui.theme.GlassBorderDark
import com.lifeos.app.ui.theme.GlassSurfaceDark
import com.lifeos.app.ui.theme.SurfaceDark

@Composable
fun GlassmorphicCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 20.dp,
    borderColor: Color = GlassBorderDark,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit
) {
    val shape = RoundedCornerShape(cornerRadius)
    val backgroundGradient = Brush.verticalGradient(
        colors = listOf(
            GlassSurfaceDark,
            SurfaceDark.copy(alpha = 0.85f)
        )
    )

    Box(
        modifier = modifier
            .clip(shape)
            .background(backgroundGradient)
            .border(width = 1.dp, color = borderColor, shape = shape)
            .then(
                if (onClick != null) {
                    Modifier.clickable(onClick = onClick)
                } else Modifier
            )
            .padding(16.dp),
        content = content
    )
}
