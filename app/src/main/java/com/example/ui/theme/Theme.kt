package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val ClinicalLightColorScheme = lightColorScheme(
    primary = MedPrimary,
    secondary = MedSecondary,
    background = MedBackground,
    surface = MedSurface,
    onPrimary = MedSurface,
    onSecondary = MedSurface,
    onBackground = MedTextPrimary,
    onSurface = MedTextPrimary,
    outline = MedBorder,
    surfaceVariant = MedSurfaceSoft,
    onSurfaceVariant = MedTextSecondary
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = false, // Always light clinical design
    dynamicColor: Boolean = false, // Stable custom brand color system
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = ClinicalLightColorScheme,
        typography = Typography,
        content = content
    )
}
