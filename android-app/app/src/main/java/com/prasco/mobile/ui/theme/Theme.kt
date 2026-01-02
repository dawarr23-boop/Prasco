package com.prasco.mobile.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = PrascoPrimaryLight,
    onPrimary = PrascoOnPrimary,
    secondary = PrascoSecondaryLight,
    onSecondary = PrascoOnSecondary,
    tertiary = CategoryPurple,
    background = PrascoBackgroundDark,
    surface = PrascoSurfaceDark,
    onBackground = Color(0xFFE0E0E0),
    onSurface = Color(0xFFE0E0E0),
    error = PrascoError,
    onError = PrascoOnError
)

private val LightColorScheme = lightColorScheme(
    primary = PrascoPrimary,
    onPrimary = PrascoOnPrimary,
    primaryContainer = PrascoPrimaryLight,
    onPrimaryContainer = Color(0xFF001B3D),
    secondary = PrascoSecondary,
    onSecondary = PrascoOnSecondary,
    secondaryContainer = PrascoSecondaryLight,
    onSecondaryContainer = Color(0xFF002018),
    tertiary = CategoryPurple,
    background = PrascoBackgroundLight,
    surface = PrascoSurfaceLight,
    onBackground = PrascoOnBackground,
    onSurface = PrascoOnSurface,
    error = PrascoError,
    onError = PrascoOnError
)

@Composable
fun PrascoMobileTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
