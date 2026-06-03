@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.*
import com.example.ui.AppScreen
import com.example.ui.MainViewModel
import com.example.utils.MedicalCalculators
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.roundToInt

// Unified clinical design color palette from Theme
val MedBackground = com.example.ui.theme.MedBackground
val MedSurface = com.example.ui.theme.MedSurface
val MedSurfaceSoft = com.example.ui.theme.MedSurfaceSoft
val MedBorder = com.example.ui.theme.MedBorder

val MedPrimary = com.example.ui.theme.MedPrimary
val MedPrimarySoft = com.example.ui.theme.MedPrimarySoft

val MedSecondary = com.example.ui.theme.MedSecondary
val MedSecondarySoft = com.example.ui.theme.MedSecondarySoft

val MedTextPrimary = com.example.ui.theme.MedTextPrimary
val MedTextSecondary = com.example.ui.theme.MedTextSecondary
val MedTextMuted = com.example.ui.theme.MedTextMuted

val RiskLow = com.example.ui.theme.RiskLow
val RiskLowBg = com.example.ui.theme.RiskLowBg
val RiskModerate = com.example.ui.theme.RiskModerate
val RiskModerateBg = com.example.ui.theme.RiskModerateBg
val RiskHigh = com.example.ui.theme.RiskHigh
val RiskHighBg = com.example.ui.theme.RiskHighBg
val InfoBlue = com.example.ui.theme.InfoBlue
val InfoBlueBg = com.example.ui.theme.InfoBlueBg

val ClinicalBlue = MedPrimary
val ClinicalTeal = MedSecondary
val AlertLowGreen = RiskLow
val AlertModerateOrange = RiskModerate
val AlertHighRed = RiskHigh
val ColorInfo = InfoBlue
val DarkBackground = MedTextPrimary
val SurfaceSlate = MedBackground
val CardBorderColor = MedBorder
val TextSecondary = MedTextSecondary
val MutedText = MedTextMuted

// ----------------------------------------------------------------------------
// MANDATORY REUSABLE CLINICAL COMPONENTS
// ----------------------------------------------------------------------------

/**
 * MedicalCard represents the clinical card container with custom borders and shape.
 */
@Composable
fun MedicalCard(
    modifier: Modifier = Modifier,
    border: BorderStroke? = BorderStroke(1.dp, MedBorder),
    backgroundColor: Color = MedSurface,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        border = border,
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        content = content
    )
}

/**
 * SectionCard wraps views into consistent layouts (acting as an alias/wrapper of MedicalCard).
 */
@Composable
fun SectionCard(
    modifier: Modifier = Modifier,
    border: BorderStroke? = BorderStroke(1.dp, MedBorder),
    content: @Composable ColumnScope.() -> Unit
) {
    MedicalCard(
        modifier = modifier,
        border = border,
        content = content
    )
}

/**
 * MedicalScaffold sets up a clean background canvas.
 */
@Composable
fun MedicalScaffold(
    topBar: @Composable () -> Unit = {},
    bottomBar: @Composable () -> Unit = {},
    content: @Composable (PaddingValues) -> Unit
) {
    Scaffold(
        containerColor = MedBackground,
        topBar = topBar,
        bottomBar = bottomBar,
        content = content
    )
}

/**
 * MedicalTopBar displays a hospital-grade navbar.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicalTopBar(
    title: String,
    navigationIcon: @Composable (() -> Unit)? = null,
    actions: @Composable (RowScope.() -> Unit)? = null
) {
    CenterAlignedTopAppBar(
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Filled.HealthAndSafety,
                    contentDescription = null,
                    tint = MedPrimary,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MedTextPrimary
                )
            }
        },
        navigationIcon = navigationIcon ?: {},
        actions = actions ?: {},
        colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
            containerColor = MedSurface,
            navigationIconContentColor = MedTextPrimary,
            titleContentColor = MedTextPrimary,
            actionIconContentColor = MedTextPrimary
        )
    )
}

/**
 * MedicalBottomNavigation provides clinical navigation bars.
 */
@Composable
fun MedicalBottomNavigation(
    content: @Composable RowScope.() -> Unit
) {
    NavigationBar(
        containerColor = MedSurface,
        tonalElevation = 0.dp,
        modifier = Modifier.border(BorderStroke(1.dp, MedBorder.copy(alpha = 0.5f)))
    ) {
        content()
    }
}

/**
 * StatusBadge represents structured categorical priority/risk badges.
 */
@Composable
fun StatusBadge(
    status: String,
    severity: String, // "LOW", "MODERATE", "HIGH", "INFO"
    modifier: Modifier = Modifier
) {
    val bgColor = when (severity) {
        "LOW" -> RiskLowBg
        "MODERATE" -> RiskModerateBg
        "HIGH" -> RiskHighBg
        "INFO" -> InfoBlueBg
        else -> MedBackground
    }
    val textColor = when (severity) {
        "LOW" -> RiskLow
        "MODERATE" -> RiskModerate
        "HIGH" -> RiskHigh
        "INFO" -> InfoBlue
        else -> MedTextSecondary
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = status,
            fontWeight = FontWeight.SemiBold,
            fontSize = 12.sp, // clear 12-13sp badges
            color = textColor
        )
    }
}

/**
 * RiskBadge wraps CV Risk levels into predefined badges.
 */
@Composable
fun RiskBadge(
    category: String,
    modifier: Modifier = Modifier
) {
    val severity = when (category) {
        "Низкий" -> "LOW"
        "Умеренный" -> "MODERATE"
        "Высокий", "Очень высокий" -> "HIGH"
        else -> "INFO"
    }
    StatusBadge(status = "Кардио-риск: $category", severity = severity, modifier = modifier)
}

/**
 * MedicalDisclaimer represents the verified legal and dissertation disclaimer.
 */
@Composable
fun MedicalDisclaimer(modifier: Modifier = Modifier) {
    MedicalCard(
        backgroundColor = MedSurfaceSoft,
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = Icons.Filled.SafetyCheck,
                contentDescription = "Medical Safety",
                tint = MedSecondary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Приложение предназначено для мониторинга и профилактической поддержки. Оно не устанавливает диагноз, не назначает лечение и не заменяет консультацию врача. Все расчёты риска в прототипе требуют клинической валидации.",
                fontSize = 13.sp, // improved from 11sp
                color = MedTextSecondary,
                lineHeight = 18.sp
            )
        }
    }
}

/**
 * WarningClinicalDisclaimerCard used legacy disclaimer call.
 */
@Composable
fun WarningClinicalDisclaimerCard() {
    MedicalDisclaimer()
}

/**
 * MetricCard represents standardized clinical self-monitoring indicators.
 */
@Composable
fun MetricCard(
    title: String,
    value: String,
    unit: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    categoryLabel: String,
    modifier: Modifier = Modifier
) {
    val severity = when (iconColor) {
        RiskHigh -> "HIGH"
        RiskModerate -> "MODERATE"
        RiskLow -> "LOW"
        else -> "INFO"
    }
    MedicalCard(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = MedTextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(iconColor.copy(alpha = 0.1f), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = icon, contentDescription = title, tint = iconColor, modifier = Modifier.size(16.dp))
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(text = value, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = unit, fontSize = 13.sp, color = MedTextMuted, modifier = Modifier.padding(bottom = 2.dp))
            }
            if (categoryLabel.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                StatusBadge(status = categoryLabel, severity = severity)
            }
        }
    }
}

/**
 * SectionHeader provides clean titles for dashboard modules.
 */
@Composable
fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            fontSize = 18.sp, // Section title 18-20sp
            fontWeight = FontWeight.SemiBold,
            color = MedTextPrimary
        )
        if (action != null) {
            action()
        }
    }
}

/**
 * PrimaryActionButton provides standardized medical buttons.
 */
@Composable
fun PrimaryActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = MedPrimary,
            contentColor = Color.White,
            disabledContainerColor = MedBorder,
            disabledContentColor = MedTextMuted
        ),
        shape = RoundedCornerShape(8.dp),
        modifier = modifier.height(48.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        if (icon != null) {
            Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(text = text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
    }
}

/**
 * SecondaryActionButton provides secondary clear action triggers.
 */
@Composable
fun SecondaryActionButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        border = BorderStroke(1.dp, MedPrimary),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = MedPrimary,
            disabledContentColor = MedTextMuted
        ),
        shape = RoundedCornerShape(8.dp),
        modifier = modifier.height(48.dp),
        contentPadding = PaddingValues(horizontal = 16.dp)
    ) {
        if (icon != null) {
            Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(text = text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
    }
}

/**
 * ResearchKpiCard displays key scientific indicators for clinical research.
 */
@Composable
fun ResearchKpiCard(
    title: String,
    value: String,
    unit: String,
    statusText: String,
    statusSeverity: String, // "LOW", "MODERATE", "HIGH", "INFO"
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    MedicalCard(modifier = modifier) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = MedTextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(iconColor.copy(alpha = 0.1f), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = icon, contentDescription = title, tint = iconColor, modifier = Modifier.size(16.dp))
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(text = value, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = unit, fontSize = 13.sp, color = MedTextMuted, modifier = Modifier.padding(bottom = 2.dp))
            }
            if (statusText.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                StatusBadge(status = statusText, severity = statusSeverity)
            }
        }
    }
}

/**
 * MeasurementInputCard represents clinical check forms for physiological status.
 */
@Composable
fun MeasurementInputCard(
    userProfile: UserProfile,
    onSave: (Int, Int, Int, Double, Double, Double, String, Int, String) -> Unit,
    modifier: Modifier = Modifier
) {
    var sysIn by remember { mutableStateOf("") }
    var diaIn by remember { mutableStateOf("") }
    var hrIn by remember { mutableStateOf("") }
    var weightIn by remember { mutableStateOf("") }
    var waistIn by remember { mutableStateOf("") }
    var sleepIn by remember { mutableStateOf("7.0") }
    var stressIn by remember { mutableStateOf("Низкий") }
    var actIn by remember { mutableStateOf("30") }
    var notesIn by remember { mutableStateOf("") }
    var formError by remember { mutableStateOf("") }

    MedicalCard(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Клиническое внесение показателей мониторинга",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = MedPrimary
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                FormField(
                    value = sysIn,
                    onValueChange = { sysIn = it },
                    label = "САД (мм рт. ст.)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.weight(1f).padding(end = 4.dp)
                )
                FormField(
                    value = diaIn,
                    onValueChange = { diaIn = it },
                    label = "ДАД (мм рт. ст.)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.weight(1f).padding(horizontal = 4.dp)
                )
                FormField(
                    value = hrIn,
                    onValueChange = { hrIn = it },
                    label = "Пульс (уд/мин)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.weight(1f).padding(start = 4.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                FormField(
                    value = weightIn,
                    onValueChange = { weightIn = it },
                    label = "Вес (кг)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.weight(1f).padding(end = 6.dp)
                )
                FormField(
                    value = waistIn,
                    onValueChange = { waistIn = it },
                    label = "Окружность талии (см)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.weight(1f).padding(start = 6.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth()) {
                FormField(
                    value = sleepIn,
                    onValueChange = { sleepIn = it },
                    label = "Ночной сон (часов)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.weight(1f).padding(end = 6.dp)
                )
                FormField(
                    value = actIn,
                    onValueChange = { actIn = it },
                    label = "Активность (минут)",
                    keyboardType = KeyboardType.Number,
                    modifier = Modifier.weight(1f).padding(start = 6.dp)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Уровень стресса:",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = MedTextSecondary
                )
                Spacer(modifier = Modifier.width(10.dp))
                listOf("Низкий", "Средний", "Высокий").forEach { stressOpt ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clickable { stressIn = stressOpt }
                            .padding(horizontal = 2.dp)
                    ) {
                        RadioButton(
                            selected = stressIn == stressOpt,
                            onClick = { stressIn = stressOpt },
                            colors = RadioButtonDefaults.colors(selectedColor = MedPrimary)
                        )
                        Text(stressOpt, fontSize = 12.sp, color = MedTextPrimary)
                    }
                }
            }
            Spacer(modifier = Modifier.height(10.dp))

            FormField(
                value = notesIn,
                onValueChange = { notesIn = it },
                label = "Асимптоматические заметки или жалобы",
                singleLine = false
            )

            val wVal = weightIn.toDoubleOrNull() ?: 0.0
            if (wVal > 0.0) {
                val computed = MedicalCalculators.calculateBMI(wVal, userProfile.heightCm)
                val interpret = MedicalCalculators.classifyBMI(computed)
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "Интерактивный ИМТ: $computed кг/м² ($interpret)",
                    fontSize = 13.sp,
                    color = MedPrimary,
                    fontWeight = FontWeight.Bold
                )
            }

            if (formError.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = formError, color = RiskHigh, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }

            Spacer(modifier = Modifier.height(16.dp))
            PrimaryActionButton(
                text = "Сохранить параметры замера ТЛМ",
                onClick = {
                    val s = sysIn.toIntOrNull()
                    val d = diaIn.toIntOrNull()
                    val h = hrIn.toIntOrNull()
                    val w = weightIn.toDoubleOrNull()
                    val ws = waistIn.toDoubleOrNull()
                    val sl = sleepIn.toDoubleOrNull()
                    val ac = actIn.toIntOrNull()

                    if (s == null || d == null || h == null || w == null || ws == null || sl == null || ac == null) {
                        formError = "Пожалуйста, укажите численные значения для всех полей приборов."
                    } else {
                        formError = ""
                        onSave(s, d, h, w, ws, sl, stressIn, ac, notesIn)
                        sysIn = ""; diaIn = ""; hrIn = ""; weightIn = ""; waistIn = ""
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

/**
 * MedicationCard tracks intake logs and patient adherence checklist.
 */
@Composable
fun MedicationCard(
    medicationName: String,
    dosage: String,
    scheduledTime: String,
    status: String, // "Принято", "Пропущено", "Ожидание"
    instructions: String = "",
    onAccept: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier
) {
    MedicalCard(modifier = modifier) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                when (status) {
                                    "Принято" -> RiskLowBg
                                    "Пропущено" -> RiskHighBg
                                    else -> MedPrimarySoft
                                },
                                RoundedCornerShape(18.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (status == "Принято") Icons.Filled.CheckCircle else Icons.Filled.Medication,
                            contentDescription = null,
                            tint = when (status) {
                                "Принято" -> RiskLow
                                "Пропущено" -> RiskHigh
                                else -> MedPrimary
                            },
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = medicationName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MedTextPrimary
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Доза: $dosage • Время: $scheduledTime",
                            fontSize = 13.sp,
                            color = MedTextSecondary
                        )
                        if (instructions.isNotBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = instructions,
                                fontSize = 12.sp,
                                color = MedTextMuted,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                StatusBadge(
                    status = status,
                    severity = when (status) {
                        "Принято" -> "LOW"
                        "Пропущено" -> "HIGH"
                        else -> "INFO"
                    }
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(
                    onClick = onSkip,
                    colors = ButtonDefaults.textButtonColors(contentColor = RiskHigh)
                ) {
                    Text("Пропущено", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = onAccept,
                    colors = ButtonDefaults.buttonColors(containerColor = RiskLow),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.height(36.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp)
                ) {
                    Text("Принято", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}

/**
 * AlertCard represents early destabilization and clinical warning card.
 */
@Composable
fun AlertCard(
    alert: Alert,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val containerColor = when (alert.severity) {
        "Высокий приоритет" -> RiskHigh.copy(alpha = 0.03f)
        "Внимание" -> RiskModerate.copy(alpha = 0.03f)
        else -> ColorInfo.copy(alpha = 0.03f)
    }
    val borderCol = when (alert.severity) {
        "Высокий приоритет" -> RiskHigh.copy(alpha = 0.2f)
        "Внимание" -> RiskModerate.copy(alpha = 0.2f)
        else -> ColorInfo.copy(alpha = 0.2f)
    }
    val icon = when (alert.severity) {
        "Высокий приоритет" -> Icons.Filled.Warning
        "Внимание" -> Icons.Filled.PriorityHigh
        else -> Icons.Filled.Info
    }
    val iconColor = when (alert.severity) {
        "Высокий приоритет" -> RiskHigh
        "Внимание" -> RiskModerate
        else -> ColorInfo
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, borderCol),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = icon,
                contentDescription = alert.severity,
                tint = iconColor,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = alert.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MedTextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = alert.message,
                    fontSize = 12.sp,
                    color = MedTextSecondary,
                    lineHeight = 16.sp
                )
                if (alert.recommendedAction.isNotBlank()) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Рекомендуемая тактика: ${alert.recommendedAction}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = iconColor
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Check,
                    contentDescription = "Отметить как прочитанное",
                    tint = MedTextMuted,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}



/**
 * PageHeader provides standard title bars.
 */
@Composable
fun PageHeader(
    category: String,
    title: String,
    modifier: Modifier = Modifier,
    actionButton: (@Composable () -> Unit)? = null
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = category.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = MedTextMuted,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                color = MedTextPrimary
            )
        }
        if (actionButton != null) {
            Spacer(modifier = Modifier.width(12.dp))
            actionButton()
        }
    }
}

/**
 * EmptyState represents helpful list placeholders.
 */
@Composable
fun EmptyState(
    message: String,
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector = Icons.Filled.Inbox
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp, horizontal = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color(0xFFCBD5E1),
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = message,
                fontSize = 12.sp,
                color = MedTextMuted,
                textAlign = TextAlign.Center,
                lineHeight = 16.sp
            )
        }
    }
}

/**
 * ChartCard represents lightweight chart drawing panel.
 */
@Composable
fun ChartCard(
    title: String,
    modifier: Modifier = Modifier,
    legend: (@Composable () -> Unit)? = null,
    chart: @Composable BoxScope.() -> Unit
) {
    SectionCard(modifier = modifier) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = MedTextPrimary
                )
                if (legend != null) {
                    legend()
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp),
                content = chart
            )
        }
    }
}

/**
 * FormField is a standard clinical input wrapping.
 */
@Composable
fun FormField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    placeholder: String? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label, fontSize = 12.sp) },
        placeholder = placeholder?.let { { Text(it, fontSize = 12.sp) } },
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        modifier = modifier.fillMaxWidth(),
        singleLine = singleLine,
        shape = RoundedCornerShape(10.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MedPrimary,
            unfocusedBorderColor = MedBorder
        )
    )
}

/**
 * RecommendationCard details priority action plans.
 */
@Composable
fun RecommendationCard(
    rec: Recommendation,
    modifier: Modifier = Modifier
) {
    val borderCol = if (rec.priority == "Высокий") RiskHigh.copy(alpha = 0.3f) else MedBorder
    SectionCard(
        modifier = modifier,
        border = BorderStroke(1.dp, borderCol)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatusBadge(
                    status = rec.category,
                    severity = "INFO"
                )
                StatusBadge(
                    status = "Приоритет: ${rec.priority}",
                    severity = when (rec.priority) {
                        "Высокий" -> "HIGH"
                        "Средний" -> "MODERATE"
                        else -> "LOW"
                    }
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = rec.title,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MedTextPrimary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = rec.explanation,
                fontSize = 12.sp,
                color = MedTextSecondary,
                lineHeight = 16.sp
            )
            if (rec.actionSteps.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Практические действия:",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = MedTextMuted
                )
                Spacer(modifier = Modifier.height(4.dp))
                rec.actionSteps.forEach { step ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            tint = RiskLow,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = step,
                            fontSize = 12.sp,
                            color = MedTextPrimary,
                            lineHeight = 15.sp
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            Divider(color = Color(0xFFF1F5F9))
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Filled.VerifiedUser,
                    contentDescription = null,
                    tint = MedSecondary,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Обоснование: ${rec.reason}",
                    fontSize = 11.sp,
                    color = MedTextMuted,
                    fontWeight = FontWeight.Medium
                )
            }
            if (rec.safetyNote.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Предостережение: ${rec.safetyNote}",
                    fontSize = 11.sp,
                    color = RiskModerate,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * EducationArticleCard displays health reference summaries.
 */
@Composable
fun EducationArticleCard(
    article: EducationArticle,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    SectionCard(
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatusBadge(status = article.category, severity = "INFO")
                Text(
                    text = "⏱️ ${article.readingTime} мин",
                    fontSize = 11.sp,
                    color = MedTextMuted,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = article.title,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MedTextPrimary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = article.summary,
                fontSize = 12.sp,
                color = MedTextSecondary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 16.sp
            )
        }
    }
}

// ----------------------------------------------------------------------------
// 1. ONBOARDING SCREEN
// ----------------------------------------------------------------------------

@Composable
fun OnboardingScreen(viewModel: MainViewModel) {
    val step by viewModel.onboardingStep.collectAsState()

    // Form states
    val name by viewModel.onboardName.collectAsState()
    val age by viewModel.onboardAge.collectAsState()
    val sex by viewModel.onboardSex.collectAsState()
    val height by viewModel.onboardHeight.collectAsState()
    val weight by viewModel.onboardWeight.collectAsState()
    val waist by viewModel.onboardWaist.collectAsState()

    val smoking by viewModel.onboardSmoking.collectAsState()
    val diabetes by viewModel.onboardDiabetes.collectAsState()
    val hypertension by viewModel.onboardHypertension.collectAsState()
    val onMeds by viewModel.onboardOnMeds.collectAsState()
    val familyCvd by viewModel.onboardFamilyCvd.collectAsState()

    val workSchedule by viewModel.onboardWorkSchedule.collectAsState()
    val riskGroup by viewModel.onboardRiskGroup.collectAsState()
    val activity by viewModel.onboardActivity.collectAsState()
    val sleep by viewModel.onboardSleep.collectAsState()
    val stress by viewModel.onboardStress.collectAsState()

    val systolic by viewModel.onboardSystolic.collectAsState()
    val diastolic by viewModel.onboardDiastolic.collectAsState()
    val heartRate by viewModel.onboardHeartRate.collectAsState()
    val cholesterol by viewModel.onboardCholesterol.collectAsState()
    val hdl by viewModel.onboardHdl.collectAsState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Панель анкетирования", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.White),
                actions = {
                    TextButton(onClick = { viewModel.skipToDashboard() }) {
                        Text("Использовать демо", color = MedPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .background(SurfaceSlate)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Screen Progress Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                for (i in 1..5) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(6.dp)
                            .padding(horizontal = 4.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .background(if (i <= step) MedPrimary else Color(0xFFCBD5E1))
                    )
                }
            }

            SectionCard(modifier = Modifier.padding(bottom = 20.dp)) {
                Column(modifier = Modifier.padding(18.dp)) {
                    when (step) {
                        1 -> Step1Consent()
                        2 -> Step2Profile(name, age, sex, height, weight, waist, viewModel)
                        3 -> Step3CvdFactors(smoking, diabetes, hypertension, onMeds, familyCvd, viewModel)
                        4 -> Step4Lifestyle(workSchedule, riskGroup, activity, sleep, stress, viewModel)
                        5 -> Step5Baseline(systolic, diastolic, heartRate, cholesterol, hdl, weight, height, viewModel)
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (step > 1) {
                    OutlinedButton(
                        onClick = { viewModel.onboardingPrev() },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .padding(end = 6.dp)
                    ) {
                        Text("Назад", color = MedTextSecondary)
                    }
                }

                Button(
                    onClick = { viewModel.onboardingNext() },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MedPrimary),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .padding(start = if (step > 1) 6.dp else 0.dp)
                ) {
                    Text(if (step == 5) "Завершить и войти" else "Продолжить", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun Step1Consent() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(
            imageVector = Icons.Filled.SafetyCheck,
            contentDescription = "Consent icon",
            modifier = Modifier.size(64.dp),
            tint = MedSecondary
        )
        Spacer(modifier = Modifier.height(14.dp))
        Text(
            "Информированное согласие для исследований",
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            color = MedTextPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            "Добро пожаловать в CardioGuard — демонстрационный прототип системы телемониторинга и профилактического скрининга кардиометаболических рисков для вашей диссертационной работы.",
            fontSize = 13.sp,
            color = MedTextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp
        )
        Spacer(modifier = Modifier.height(16.dp))
        WarningClinicalDisclaimerCard()
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            "Продвигаясь вперед, вы подтверждаете согласие на анонимизированную сверку и обработку ваших демографических и физиологических замерительных параметров.",
            fontSize = 11.sp,
            color = MedTextMuted,
            textAlign = TextAlign.Center,
            lineHeight = 16.sp
        )
    }
}

@Composable
fun Step2Profile(
    name: String,
    age: String,
    sex: String,
    height: String,
    weight: String,
    waist: String,
    viewModel: MainViewModel
) {
    Column {
        Text("Медицинская антропометрия", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MedTextPrimary)
        Text("Основные физиологические константы пациента.", fontSize = 11.sp, color = MedTextMuted)
        Spacer(modifier = Modifier.height(14.dp))

        FormField(
            value = name,
            onValueChange = { viewModel.onboardName.value = it },
            label = "ФИО или Анонимизированный ID пациента"
        )
        Spacer(modifier = Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            FormField(
                value = age,
                onValueChange = { viewModel.onboardAge.value = it },
                label = "Возраст (лет)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(end = 6.dp)
            )

            Column(modifier = Modifier.weight(1f).padding(start = 6.dp)) {
                Text("Биологический пол", fontSize = 11.sp, color = MedTextMuted, fontWeight = FontWeight.Medium)
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = sex == "Мужской",
                        onClick = { viewModel.onboardSex.value = "Мужской" },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text("М", fontSize = 13.sp, color = MedTextPrimary)
                    Spacer(modifier = Modifier.width(10.dp))
                    RadioButton(
                        selected = sex == "Женский",
                        onClick = { viewModel.onboardSex.value = "Женский" },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text("Ж", fontSize = 13.sp, color = MedTextPrimary)
                }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            FormField(
                value = height,
                onValueChange = { viewModel.onboardHeight.value = it },
                label = "Рост (см)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(end = 4.dp)
            )
            FormField(
                value = weight,
                onValueChange = { viewModel.onboardWeight.value = it },
                label = "Вес (кг)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(horizontal = 4.dp)
            )
            FormField(
                value = waist,
                onValueChange = { viewModel.onboardWaist.value = it },
                label = "Талия (см)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(start = 4.dp)
            )
        }

        val wD = weight.toDoubleOrNull() ?: 0.0
        val hD = height.toDoubleOrNull() ?: 0.0
        if (wD > 0 && hD > 0) {
            val bmi = MedicalCalculators.calculateBMI(wD, hD)
            val cat = MedicalCalculators.classifyBMI(bmi)
            Spacer(modifier = Modifier.height(14.dp))
            SectionCard(border = BorderStroke(1.dp, MedPrimary.copy(alpha = 0.2f))) {
                Row(modifier = Modifier.padding(12.dp).background(MedPrimary.copy(alpha = 0.03f)), verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Filled.BarChart, contentDescription = "BMI", tint = MedPrimary)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Расчетный ИМТ: $bmi кг/м²", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MedPrimary)
                        Text("Категория: $cat", fontSize = 12.sp, color = MedTextPrimary)
                    }
                }
            }
        }
    }
}

@Composable
fun Step3CvdFactors(
    smoking: String,
    diabetes: String,
    hypertension: String,
    onMeds: Boolean,
    familyCvd: String,
    viewModel: MainViewModel
) {
    Column {
        Text("Анамнез и Кардиоваскулярные триггеры", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MedTextPrimary)
        Text("Факторы критической тяжести SCORE2.", fontSize = 11.sp, color = MedTextMuted)
        Spacer(modifier = Modifier.height(14.dp))

        Text("Статус табакокурения:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
        val smokingOptions = listOf("Никогда не курил", "Ранее курил", "Курит")
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            smokingOptions.forEach { opt ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardSmoking.value = opt }) {
                    RadioButton(
                        selected = smoking == opt,
                        onClick = { viewModel.onboardSmoking.value = opt },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                }
            }
        }
        Spacer(modifier = Modifier.height(14.dp))

        Text("Наличие Сахарного диабета?", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
        val yesNoUnk = listOf("Да", "Нет", "Неизвестно")
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            yesNoUnk.forEach { opt ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardDiabetes.value = opt }) {
                    RadioButton(
                        selected = diabetes == opt,
                        onClick = { viewModel.onboardDiabetes.value = opt },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                }
            }
        }
        Spacer(modifier = Modifier.height(14.dp))

        Text("Наличие Артериальной Гипертензии?", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            yesNoUnk.forEach { opt ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardHypertension.value = opt }) {
                    RadioButton(
                        selected = hypertension == opt,
                        onClick = { viewModel.onboardHypertension.value = opt },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                }
            }
        }
        Spacer(modifier = Modifier.height(10.dp))

        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardOnMeds.value = !onMeds }) {
            Checkbox(
                checked = onMeds,
                onCheckedChange = { viewModel.onboardOnMeds.value = it },
                colors = CheckboxDefaults.colors(checkedColor = MedPrimary, uncheckedColor = MedBorder)
            )
            Text("Принимаю назначенные гипотензивные лекарственные препараты", fontSize = 11.sp, color = MedTextSecondary)
        }
        Spacer(modifier = Modifier.height(14.dp))

        Text("Семейный анамнез ранней кардиопатологии ССЗ?", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            yesNoUnk.forEach { opt ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardFamilyCvd.value = opt }) {
                    RadioButton(
                        selected = familyCvd == opt,
                        onClick = { viewModel.onboardFamilyCvd.value = opt },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                }
            }
        }
    }
}

@Composable
fun Step4Lifestyle(
    workSchedule: String,
    riskGroup: String,
    activity: String,
    sleep: String,
    stress: String,
    viewModel: MainViewModel
) {
    Column {
        Text("Режим труда, профессиональный риск и сон", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MedTextPrimary)
        Text("Оценка десинхроноза и уровня повседневного стресса.", fontSize = 11.sp, color = MedTextMuted)
        Spacer(modifier = Modifier.height(14.dp))

        Text("Режим рабочего расписания:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
        val scheduleOpts = listOf("Обычный график", "Сменная работа", "Ночные смены")
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            scheduleOpts.forEach { opt ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardWorkSchedule.value = opt }) {
                    RadioButton(
                        selected = workSchedule == opt,
                        onClick = { viewModel.onboardWorkSchedule.value = opt },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                }
            }
        }
        Spacer(modifier = Modifier.height(14.dp))

        Text("Особые профессиональные риски:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
        val groupOpts = listOf("Гражданские лица", "Силовые ведомства", "Военная служба")
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            groupOpts.forEach { opt ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardRiskGroup.value = opt }) {
                    RadioButton(
                        selected = riskGroup == opt,
                        onClick = { viewModel.onboardRiskGroup.value = opt },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                }
            }
        }
        Spacer(modifier = Modifier.height(14.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.weight(1f).padding(end = 4.dp)) {
                Text("Физическая нагрузка", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
                listOf("Низкая", "Средняя", "Высокая").forEach { opt ->
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardActivity.value = opt }) {
                        RadioButton(
                            selected = activity == opt,
                            onClick = { viewModel.onboardActivity.value = opt },
                            colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                        )
                        Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                    }
                }
            }
            Column(modifier = Modifier.weight(1f).padding(start = 4.dp)) {
                Text("Психогигиена / Стресс", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
                listOf("Низкий", "Средний", "Высокий").forEach { opt ->
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardStress.value = opt }) {
                        RadioButton(
                            selected = stress == opt,
                            onClick = { viewModel.onboardStress.value = opt },
                            colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                        )
                        Text(opt, fontSize = 11.sp, color = MedTextSecondary)
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(14.dp))

        Text("Качество ночного сна пациента:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = MedTextPrimary)
        val sleepOpts = listOf("Хороший", "Нарушенный", "Недостаточный")
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            sleepOpts.forEach { opt ->
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { viewModel.onboardSleep.value = opt }) {
                    RadioButton(
                        selected = sleep == opt,
                        onClick = { viewModel.onboardSleep.value = opt },
                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                    )
                    Text(opt, fontSize = 12.sp, color = MedTextSecondary)
                }
            }
        }
    }
}

@Composable
fun Step5Baseline(
    sys: String,
    dia: String,
    hr: String,
    chol: String,
    hdl: String,
    weight: String,
    height: String,
    viewModel: MainViewModel
) {
    Column {
        Text("Физиологические константы замера", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MedTextPrimary)
        Text("Укажите текущие гемодинамические и лабораторные показатели.", fontSize = 11.sp, color = MedTextMuted)
        Spacer(modifier = Modifier.height(14.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            FormField(
                value = sys,
                onValueChange = { viewModel.onboardSystolic.value = it },
                label = "САД (мм рт. ст.)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(end = 4.dp)
            )
            FormField(
                value = dia,
                onValueChange = { viewModel.onboardDiastolic.value = it },
                label = "ДАД (мм рт. ст.)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(horizontal = 4.dp)
            )
            FormField(
                value = hr,
                onValueChange = { viewModel.onboardHeartRate.value = it },
                label = "ЧСС (уд/мин)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(start = 4.dp)
            )
        }
        Spacer(modifier = Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            FormField(
                value = chol,
                onValueChange = { viewModel.onboardCholesterol.value = it },
                label = "Общий холестерин (ммоль/л)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(end = 6.dp)
            )
            FormField(
                value = hdl,
                onValueChange = { viewModel.onboardHdl.value = it },
                label = "ЛПВП-холестерин (ммоль/л)",
                keyboardType = KeyboardType.Number,
                modifier = Modifier.weight(1f).padding(start = 6.dp)
            )
        }
        Spacer(modifier = Modifier.height(14.dp))

        val sInt = sys.toIntOrNull() ?: 120
        val dInt = dia.toIntOrNull() ?: 80
        val bpStatus = MedicalCalculators.classifyBloodPressure(sInt, dInt)
        Text(
            text = "Интерпретация артериального давления: $bpStatus",
            fontWeight = FontWeight.Bold,
            color = if (sInt >= 140) RiskHigh else MedPrimary,
            fontSize = 13.sp
        )
    }
}

// ----------------------------------------------------------------------------
// 2. MAIN APPLICATION DASHBOARD
// ----------------------------------------------------------------------------

@Composable
fun DashboardScreen(viewModel: MainViewModel, onOpenAddMeasure: () -> Unit) {
    val userProfile by viewModel.userProfile.collectAsState()
    val measurements by viewModel.measurements.collectAsState()
    val alerts by viewModel.alerts.collectAsState()
    val riskAssessment by viewModel.currentRisk.collectAsState()
    val recommendations by viewModel.recommendations.collectAsState()
    val logs by viewModel.medicationLogs.collectAsState()

    val latest = remember(measurements) { measurements.firstOrNull() }
    val unreadAlerts = remember(alerts) { alerts.filter { !it.isRead } }
    val activeRiskCategory = remember(riskAssessment) { riskAssessment?.category ?: "Низкий" }
    val estimatedRiskPercent = remember(riskAssessment) { riskAssessment?.estimatedRiskPercent ?: 0.0 }
    val adherencePercent = remember(logs) { MedicalCalculators.calculateMedicationAdherence(logs) }
    val currentDateStr = remember { SimpleDateFormat("dd MMMM yyyy", Locale("ru")).format(Date()) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Clinical Header
        item {
            Column {
                Text(
                    text = "ГЛАВНАЯ ПАНЕЛЬ",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MedPrimary,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Мониторинг сердечно-сосудистого риска",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = MedTextPrimary
                )
                Text(
                    text = "Телемониторинг активен • Сегодня $currentDateStr",
                    fontSize = 13.sp,
                    color = MedSecondary,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                )
                MedicalDisclaimer()
            }
        }

        // 2. Quick Clinical Actions Row
        item {
            MedicalCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Быстрые действия клинических модулей",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = MedTextMuted
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onOpenAddMeasure,
                            colors = ButtonDefaults.buttonColors(containerColor = MedPrimary),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(40.dp),
                            contentPadding = PaddingValues(horizontal = 4.dp)
                        ) {
                            Icon(imageVector = Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Добавить замер", fontSize = 11.sp, maxLines = 1, fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = { viewModel.navigateTo(AppScreen.MEDICATIONS) },
                            colors = ButtonDefaults.buttonColors(containerColor = MedPrimary),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(40.dp),
                            contentPadding = PaddingValues(horizontal = 4.dp)
                        ) {
                            Icon(imageVector = Icons.Filled.Medication, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Отметить приём", fontSize = 11.sp, maxLines = 1, fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = { viewModel.navigateTo(AppScreen.RISK_ASSESSMENT) },
                            colors = ButtonDefaults.buttonColors(containerColor = MedSecondary),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(40.dp),
                            contentPadding = PaddingValues(horizontal = 4.dp)
                        ) {
                            Icon(imageVector = Icons.Filled.Calculate, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Рассчитать риск", fontSize = 11.sp, maxLines = 1, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 3. Metric Clinical Indicator Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Текущие физиологические показатели здоровья",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = MedTextPrimary,
                    modifier = Modifier.padding(bottom = 2.dp)
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MetricCard(
                        title = "Артериальное давление",
                        value = if (latest != null) "${latest.systolicBP}/${latest.diastolicBP}" else "—",
                        unit = "мм рт. ст.",
                        icon = Icons.Outlined.Favorite,
                        iconColor = if (latest != null && latest.systolicBP >= 140) RiskHigh else MedPrimary,
                        categoryLabel = if (latest != null) MedicalCalculators.classifyBloodPressure(latest.systolicBP, latest.diastolicBP) else "Нет данных",
                        modifier = Modifier.weight(1f)
                    )
                    MetricCard(
                        title = "ЧСС (Пульс)",
                        value = if (latest != null) "${latest.heartRate}" else "—",
                        unit = "уд/мин",
                        icon = Icons.Outlined.MonitorHeart,
                        iconColor = if (latest != null && (latest.heartRate > 90 || latest.heartRate < 60)) RiskModerate else MedSecondary,
                        categoryLabel = if (latest != null) "Состояние стабильно" else "Нет данных",
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    val currentBmi = if (latest != null) latest.bmi else 0.0
                    MetricCard(
                        title = "Индекс массы тела (ИМТ)",
                        value = if (latest != null) "$currentBmi" else "—",
                        unit = "кг/м²",
                        icon = Icons.Outlined.BarChart,
                        iconColor = if (latest != null && currentBmi >= 30.0) RiskHigh else if (latest != null && currentBmi >= 25.0) RiskModerate else RiskLow,
                        categoryLabel = if (latest != null) MedicalCalculators.classifyBMI(currentBmi) else "Нет данных",
                        modifier = Modifier.weight(1f)
                    )
                    MetricCard(
                        title = "Приверженность лечению",
                        value = "$adherencePercent%",
                        unit = "комплаенс",
                        icon = Icons.Outlined.Assignment,
                        iconColor = if (adherencePercent >= 80) RiskLow else if (adherencePercent >= 50) RiskModerate else RiskHigh,
                        categoryLabel = if (adherencePercent >= 80) "Высокая" else "Требует внимания",
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MetricCard(
                        title = "Риск ССЗ осложнений",
                        value = "$estimatedRiskPercent%",
                        unit = "SCORE2",
                        icon = Icons.Outlined.Speed,
                        iconColor = when (activeRiskCategory) {
                            "Низкий" -> RiskLow
                            "Умеренный" -> RiskModerate
                            "Высокий", "Очень высокий" -> RiskHigh
                            else -> MedBorder
                        },
                        categoryLabel = "Риск: $activeRiskCategory",
                        modifier = Modifier.weight(1f)
                    )
                    MetricCard(
                        title = "Предупреждения",
                        value = "${unreadAlerts.size}",
                        unit = "сигн.",
                        icon = Icons.Outlined.Warning,
                        iconColor = if (unreadAlerts.isNotEmpty()) RiskHigh else RiskLow,
                        categoryLabel = if (unreadAlerts.isNotEmpty()) "Требуется оценка" else "Жалоб нет",
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // 4. Clinical Trend Chart
        item {
            val bpMeasurements = remember(measurements) { measurements }
            ChartCard(
                title = "Клинический тренд артериального давления (ТЛМ)",
                legend = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(RiskHigh, RoundedCornerShape(4.dp)))
                        Text(" САД", fontSize = 11.sp, color = MedTextSecondary, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.width(12.dp))
                        Box(modifier = Modifier.size(8.dp).background(MedPrimary, RoundedCornerShape(4.dp)))
                        Text(" ДАД", fontSize = 11.sp, color = MedTextSecondary, fontWeight = FontWeight.Medium)
                    }
                }
            ) {
                if (bpMeasurements.isEmpty()) {
                    EmptyState(message = "Сеансы графического анализа заблокированы: введите данные.")
                } else {
                    BloodPressureChartCanvas(bpMeasurements)
                }
            }
        }

        // 5. Active Clinical Warning Card
        if (unreadAlerts.isNotEmpty()) {
            item {
                Column {
                    SectionHeader(
                        title = "Клинические предупреждения",
                        action = {
                            TextButton(
                                onClick = { viewModel.clearAllReadAlerts() },
                                contentPadding = PaddingValues(0.dp),
                                modifier = Modifier.height(24.dp)
                            ) {
                                Text("Очистить все", color = MedPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    unreadAlerts.take(1).forEach { alert ->
                        AlertCard(alert = alert, onDismiss = { viewModel.dismissAlert(alert.id) })
                    }
                }
            }
        }

        // 6. Recommendation Preview
        val topRec = recommendations.firstOrNull()
        if (topRec != null) {
            item {
                Column {
                    SectionHeader(title = "Приоритетная рекомендация")
                    Spacer(modifier = Modifier.height(6.dp))
                    RecommendationCard(rec = topRec)
                }
            }
        }

        // 7. Recent Measurements List (last 3 recent)
        if (measurements.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Последние измерения за период ТЛМ",
                    action = {
                        TextButton(
                            onClick = { viewModel.navigateTo(AppScreen.HEALTH_MONITORING) },
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("Все замеры →", color = MedPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                )
            }
            items(measurements.take(3)) { meas ->
                HistoryMeasurementItem(meas = meas)
                Spacer(modifier = Modifier.height(4.dp))
            }
        }

        // 8. Education Article Preview
        val topArticle = MockData.educationArticles.firstOrNull()
        if (topArticle != null) {
            item {
                Column {
                    SectionHeader(
                        title = "Рекомендуемые материалы",
                        action = {
                            TextButton(
                                onClick = { viewModel.navigateTo(AppScreen.EDUCATION) },
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text("Перейти в библиотеку →", color = MedPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    EducationArticleCard(
                        article = topArticle,
                        onClick = {
                            viewModel.navigateTo(AppScreen.EDUCATION)
                            viewModel.selectArticle(topArticle.id)
                        }
                    )
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// 3. HEALTH MONITORING SCREEN
// ----------------------------------------------------------------------------

@Composable
fun HealthMonitoringScreen(viewModel: MainViewModel) {
    val measurements by viewModel.measurements.collectAsState()
    val userProfile by viewModel.userProfile.collectAsState()
    val filter by viewModel.timeFilter.collectAsState()

    var showForm by remember { mutableStateOf(false) }
    var activeChartTab by remember { mutableStateOf("АД") }
    var measurementLimit by remember { mutableStateOf(5) } // Expandable limit

    // Form inputs
    var sysIn by remember { mutableStateOf("") }
    var diaIn by remember { mutableStateOf("") }
    var hrIn by remember { mutableStateOf("") }
    var weightIn by remember { mutableStateOf("") }
    var waistIn by remember { mutableStateOf("") }
    var sleepIn by remember { mutableStateOf("7.0") }
    var stressIn by remember { mutableStateOf("Низкий") }
    var actIn by remember { mutableStateOf("30") }
    var notesIn by remember { mutableStateOf("") }
    var formError by remember { mutableStateOf("") }

    val latest = measurements.firstOrNull()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PageHeader(
                category = "ПОКАЗАТЕЛИ ЗДОРОВЬЯ",
                title = "Регистрация замера и графический тренд-диагностик",
                actionButton = {
                    Button(
                        onClick = { showForm = !showForm },
                        colors = ButtonDefaults.buttonColors(containerColor = if (showForm) RiskHigh else MedPrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(if (showForm) "Скрыть форму" else "Добавить замер", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }

        // Interactive "Add new measurement" Form Block
        if (showForm) {
            item {
                SectionCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Клиническое внесение показателей мониторинга", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedPrimary)
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(modifier = Modifier.fillMaxWidth()) {
                            FormField(
                                value = sysIn,
                                onValueChange = { sysIn = it },
                                label = "САД (мм)",
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f).padding(end = 4.dp)
                            )
                            FormField(
                                value = diaIn,
                                onValueChange = { diaIn = it },
                                label = "ДАД (мм)",
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f).padding(horizontal = 4.dp)
                            )
                            FormField(
                                value = hrIn,
                                onValueChange = { hrIn = it },
                                label = "Пульс (уд/м)",
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f).padding(start = 4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(modifier = Modifier.fillMaxWidth()) {
                            FormField(
                                value = weightIn,
                                onValueChange = { weightIn = it },
                                label = "Вес (кг)",
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f).padding(end = 6.dp)
                            )
                            FormField(
                                value = waistIn,
                                onValueChange = { waistIn = it },
                                label = "Окружность талии (см)",
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f).padding(start = 6.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(modifier = Modifier.fillMaxWidth()) {
                            FormField(
                                value = sleepIn,
                                onValueChange = { sleepIn = it },
                                label = "Ночной сон (часов)",
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f).padding(end = 6.dp)
                            )
                            FormField(
                                value = actIn,
                                onValueChange = { actIn = it },
                                label = "Активность (минут)",
                                keyboardType = KeyboardType.Number,
                                modifier = Modifier.weight(1f).padding(start = 6.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Уровень напряжения/стресса:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                            Spacer(modifier = Modifier.width(10.dp))
                            listOf("Низкий", "Средний", "Высокий").forEach { stressOpt ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.clickable { stressIn = stressOpt }.padding(horizontal = 2.dp)
                                ) {
                                    RadioButton(
                                        selected = stressIn == stressOpt,
                                        onClick = { stressIn = stressOpt },
                                        colors = RadioButtonDefaults.colors(selectedColor = MedPrimary, unselectedColor = MedBorder)
                                    )
                                    Text(stressOpt, fontSize = 11.sp, color = MedTextSecondary)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))

                        FormField(
                            value = notesIn,
                            onValueChange = { notesIn = it },
                            label = "Асимптоматические заметки, симптоматика или жалобы",
                            singleLine = false
                        )

                        val wVal = weightIn.toDoubleOrNull() ?: 0.0
                        if (wVal > 0.0) {
                            val computed = MedicalCalculators.calculateBMI(wVal, userProfile.heightCm)
                            val interpret = MedicalCalculators.classifyBMI(computed)
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                "Интерактивный ИМТ: $computed кг/м² ($interpret)",
                                fontSize = 12.sp,
                                color = MedPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (formError.isNotBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(formError, color = RiskHigh, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = {
                                val s = sysIn.toIntOrNull()
                                val d = diaIn.toIntOrNull()
                                val h = hrIn.toIntOrNull()
                                val w = weightIn.toDoubleOrNull()
                                val ws = waistIn.toDoubleOrNull()
                                val sl = sleepIn.toDoubleOrNull()
                                val ac = actIn.toIntOrNull()

                                if (s == null || d == null || h == null || w == null || ws == null || sl == null || ac == null) {
                                    formError = "Пожалуйста, укажите численные значения для всех полей приборов."
                                } else {
                                    formError = ""
                                    viewModel.addMeasurement(s, d, h, w, ws, sl, stressIn, ac, notesIn)
                                    sysIn = ""; diaIn = ""; hrIn = ""; weightIn = ""; waistIn = ""
                                    showForm = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MedPrimary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Сохранить параметры замера ТЛМ", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Latest Measurement Summary (Visual Clinical Card)
        item {
            SectionCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Последний зарегистрированный замер ТЛМ", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MedSecondary)
                    Spacer(modifier = Modifier.height(10.dp))
                    if (latest == null) {
                        EmptyState(message = "Данные сеанса телемониторинга отсутствуют.")
                    } else {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Давление", fontSize = 11.sp, color = MedTextMuted)
                                Text("${latest.systolicBP}/${latest.diastolicBP}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                                Text("мм рт. ст.", fontSize = 10.sp, color = MedTextMuted)
                            }
                            Column {
                                Text("Пульс (ЧСС)", fontSize = 11.sp, color = MedTextMuted)
                                Text("${latest.heartRate}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                                Text("уд/мин", fontSize = 10.sp, color = MedTextMuted)
                            }
                            Column {
                                Text("ИМТ", fontSize = 11.sp, color = MedTextMuted)
                                Text("${latest.bmi}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MedPrimary)
                                Text("кг/м²", fontSize = 10.sp, color = MedTextMuted)
                            }
                            Column {
                                Text("Сон", fontSize = 11.sp, color = MedTextMuted)
                                Text("${latest.sleepHours} ч", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                                Text("качество", fontSize = 10.sp, color = MedTextMuted)
                            }
                        }
                    }
                }
            }
        }

        // Time filters switcher
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(10.dp))
                    .border(1.dp, MedBorder, RoundedCornerShape(10.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                listOf("7 дней", "30 дней", "90 дней").forEach { time ->
                    val isSelected = filter == time
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) MedPrimary else Color.Transparent)
                            .clickable { viewModel.setTimeFilter(time) }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = time,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = if (isSelected) Color.White else MedTextSecondary
                        )
                    }
                }
            }
        }

        // Chart tab headers
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                listOf("АД", "ЧСС", "Вес", "ИМТ").forEach { chartTab ->
                    val isTabSelected = activeChartTab == chartTab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isTabSelected) MedSecondary.copy(alpha = 0.15f) else Color.White)
                            .border(1.dp, if (isTabSelected) MedSecondary else MedBorder, RoundedCornerShape(8.dp))
                            .clickable { activeChartTab = chartTab }
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = chartTab,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isTabSelected) MedSecondary else MedTextSecondary
                        )
                    }
                }
            }
        }

        // Dynamic Chart drawing - Only renders active tab chart to prevent rendering lag
        item {
            val chartTitle = when (activeChartTab) {
                "АД" -> "Артериальное давление (САД и ДАД)"
                "ЧСС" -> "Частота сердечных сокращений (уд/мин)"
                "Вес" -> "Динамика веса пациента (кг)"
                else -> "Динамика индекса массы тела (ИМТ)"
            }

            ChartCard(
                title = chartTitle,
                legend = {
                    if (activeChartTab == "АД") {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(8.dp).background(RiskHigh, RoundedCornerShape(4.dp)))
                            Text(" САД", fontSize = 10.sp, color = MedTextMuted)
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(modifier = Modifier.size(8.dp).background(MedPrimary, RoundedCornerShape(4.dp)))
                            Text(" ДАД", fontSize = 10.sp, color = MedTextMuted)
                        }
                    }
                }
            ) {
                if (measurements.isEmpty()) {
                    EmptyState(message = "Сеансы графического анализа заблокированы: ведите данные.")
                } else {
                    val hrPoints = remember(measurements) { measurements.map { it.heartRate.toDouble() } }
                    val weightPoints = remember(measurements) { measurements.map { it.weightKg } }
                    val bmiPoints = remember(measurements) { measurements.map { it.bmi } }

                    when (activeChartTab) {
                        "АД" -> BloodPressureChartCanvas(measurements)
                        "ЧСС" -> SimpleLineChartCanvas(hrPoints, MedSecondary)
                        "Вес" -> SimpleLineChartCanvas(weightPoints, RiskModerate)
                        "ИМТ" -> SimpleLineChartCanvas(bmiPoints, RiskLow)
                    }
                }
            }
        }

        // Measurement History table list
        item {
            Text("История измерений и записей ТЛМ (${measurements.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedTextPrimary)
        }

        val visibleMeasurements = measurements.take(measurementLimit)
        if (measurements.isEmpty()) {
            item {
                EmptyState(message = "Показатели отсутствуют.")
            }
        } else {
            items(visibleMeasurements, key = { it.id }) { meas ->
                HistoryMeasurementItem(meas)
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    if (measurementLimit < measurements.size) {
                        TextButton(onClick = { measurementLimit += 10 }) {
                            Text("Показать еще замеры", fontWeight = FontWeight.Bold, color = MedPrimary, fontSize = 13.sp)
                        }
                    } else if (measurements.size > 5) {
                        TextButton(onClick = { measurementLimit = 5 }) {
                            Text("Свернуть список", fontWeight = FontWeight.Bold, color = MedSecondary, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun HistoryMeasurementItem(meas: HealthMeasurement) {
    SectionCard {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Filled.DateRange, contentDescription = null, tint = MedTextMuted, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale("ru")).format(meas.date),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedTextSecondary
                    )
                }
                StatusBadge(
                    status = if (meas.systolicBP >= 140) "Артериальная Гипертензия" else "Норма",
                    severity = if (meas.systolicBP >= 140) "HIGH" else "LOW"
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("Давление", fontSize = 10.sp, color = MedTextMuted)
                    Text("${meas.systolicBP}/${meas.diastolicBP} мм", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                }
                Column {
                    Text("ЧСС/Пульс", fontSize = 10.sp, color = MedTextMuted)
                    Text("${meas.heartRate} уд/м", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                }
                Column {
                    Text("ИМТ пациента", fontSize = 10.sp, color = MedTextMuted)
                    Text("${meas.bmi} кг/м²", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                }
            }
            if (meas.notes.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceSlate),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Врачебный маркер: " + meas.notes,
                        fontSize = 11.sp,
                        color = MedTextSecondary,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun BloodPressureChartCanvas(measurements: List<HealthMeasurement>) {
    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Transparent)
    ) {
        if (measurements.isEmpty()) return@Canvas

        val data = measurements.take(7).reversed()
        val maxVal = 180f
        val minVal = 50f
        val range = maxVal - minVal

        val paddingLeft = 60f
        val paddingRight = 20f
        val paddingTop = 20f
        val paddingBottom = 40f

        val plotWidth = size.width - paddingLeft - paddingRight
        val plotHeight = size.height - paddingTop - paddingBottom

        // Draw guidelines
        val normalSysY = paddingTop + plotHeight * (1f - (120f - minVal) / range)
        val limitSysY = paddingTop + plotHeight * (1f - (140f - minVal) / range)

        drawLine(
            color = RiskLow.copy(alpha = 0.3f),
            start = Offset(paddingLeft, normalSysY),
            end = Offset(size.width - paddingRight, normalSysY),
            strokeWidth = 2f
        )
        drawLine(
            color = RiskHigh.copy(alpha = 0.3f),
            start = Offset(paddingLeft, limitSysY),
            end = Offset(size.width - paddingRight, limitSysY),
            strokeWidth = 2f
        )

        if (data.size > 1) {
            val stepSize = plotWidth / (data.size - 1)
            val sysPath = Path()
            val diaPath = Path()

            data.forEachIndexed { idx, point ->
                val x = paddingLeft + idx * stepSize
                val sysY = paddingTop + plotHeight * (1f - (point.systolicBP - minVal) / range)
                val diaY = paddingTop + plotHeight * (1f - (point.diastolicBP - minVal) / range)

                if (idx == 0) {
                    sysPath.moveTo(x, sysY)
                    diaPath.moveTo(x, diaY)
                } else {
                    sysPath.lineTo(x, sysY)
                    diaPath.lineTo(x, diaY)
                }

                drawCircle(color = RiskHigh, radius = 6f, center = Offset(x, sysY))
                drawCircle(color = MedPrimary, radius = 6f, center = Offset(x, diaY))
            }

            drawPath(path = sysPath, color = RiskHigh, style = Stroke(width = 4f, cap = StrokeCap.Round))
            drawPath(path = diaPath, color = MedPrimary, style = Stroke(width = 4f, cap = StrokeCap.Round))
        }
    }
}

@Composable
fun SimpleLineChartCanvas(points: List<Double>, color: Color) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        if (points.isEmpty()) return@Canvas
        val data = points.take(7).reversed()
        val maxVal = (data.maxOrNull() ?: 100.0).toFloat() * 1.1f
        val minVal = (data.minOrNull() ?: 0.0).toFloat() * 0.9f
        val range = maxVal - minVal

        val stepX = size.width / (if (data.size > 1) data.size - 1 else 1)

        val path = Path()
        data.forEachIndexed { index, value ->
            val x = index * stepX
            val y = size.height * (1f - ((value.toFloat() - minVal) / if (range == 0f) 1f else range))
            if (index == 0) {
                path.moveTo(x, y)
            } else {
                path.lineTo(x, y)
            }
            drawCircle(color = color, radius = 5f, center = Offset(x, y))
        }

        drawPath(path = path, color = color, style = Stroke(width = 3.5f, cap = StrokeCap.Round))
    }
}

// ----------------------------------------------------------------------------
// 4. MEDICATION SCREEN
// ----------------------------------------------------------------------------

@Composable
fun MedicationsScreen(viewModel: MainViewModel) {
    val medications by viewModel.medications.collectAsState()
    val logs by viewModel.medicationLogs.collectAsState()

    var showAddMedForm by remember { mutableStateOf(false) }

    // Form inputs
    var medName by remember { mutableStateOf("") }
    var medDosage by remember { mutableStateOf("") }
    var medFreq by remember { mutableStateOf("1 раз в день") }
    var medTime by remember { mutableStateOf("08:00") }
    var medInst by remember { mutableStateOf("Принимать натощак") }
    var formError by remember { mutableStateOf("") }

    val adherencePercent = MedicalCalculators.calculateMedicationAdherence(logs)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PageHeader(
                category = "ЛЕКАРСТВЕННАЯ ТЕРАПИЯ",
                title = "Контроль дисциплины приемов фармакотерапии",
                actionButton = {
                    Button(
                        onClick = { showAddMedForm = !showAddMedForm },
                        colors = ButtonDefaults.buttonColors(containerColor = if (showAddMedForm) RiskHigh else MedPrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(if (showAddMedForm) "Скрыть форму" else "Назначить", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }

        // Add prescription form
        if (showAddMedForm) {
            item {
                SectionCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Назначение врачебной фармакотерапии", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedPrimary)
                        Spacer(modifier = Modifier.height(12.dp))

                        FormField(
                            value = medName,
                            onValueChange = { medName = it },
                            label = "Название лекарственного препарата (МНН)"
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(modifier = Modifier.fillMaxWidth()) {
                            FormField(
                                value = medDosage,
                                onValueChange = { medDosage = it },
                                label = "Дозировка препарата (мг/мкг)",
                                modifier = Modifier.weight(1.2f).padding(end = 6.dp)
                            )
                            FormField(
                                value = medTime,
                                onValueChange = { medTime = it },
                                label = "Время приёма",
                                modifier = Modifier.weight(0.8f).padding(start = 6.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        FormField(
                            value = medInst,
                            onValueChange = { medInst = it },
                            label = "Инструкция по употреблению"
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        if (formError.isNotBlank()) {
                            Text(formError, color = RiskHigh, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(8.dp))
                        }

                        Button(
                            onClick = {
                                if (medName.isBlank() || medDosage.isBlank() || medTime.isBlank()) {
                                    formError = "Название, точная дозировка и время обязательны к заполнению."
                                } else {
                                    formError = ""
                                    viewModel.addMedication(medName, medDosage, medFreq, medTime, medInst)
                                    medName = ""; medDosage = ""
                                    showAddMedForm = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MedPrimary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Добавить в расписание лечения", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Checklist today
        item {
            SectionCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Дневник приема лекарственных средств на сегодня", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedTextPrimary)
                    Text("Контролируйте комплаентность фармакотерапии.", fontSize = 12.sp, color = MedTextSecondary)
                    Spacer(modifier = Modifier.height(12.dp))

                    if (logs.isEmpty()) {
                        EmptyState(message = "План терапии на сегодня пуст.")
                    } else {
                        logs.forEach { log ->
                            val med = medications.find { it.id == log.medicationId }
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (log.status == "Принято") Icons.Filled.CheckCircle else Icons.Outlined.Circle,
                                        contentDescription = null,
                                        tint = if (log.status == "Принято") RiskLow else MedBorder,
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(med?.name ?: "Препарат", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedTextPrimary)
                                        Text("Доза: ${med?.dosage ?: ""} • Время: ${log.scheduledTime}", fontSize = 12.sp, color = MedTextSecondary)
                                        if (med?.instructions?.isNotBlank() == true) {
                                            Text(med.instructions, fontSize = 11.sp, color = MedTextMuted)
                                        }
                                    }
                                }

                                Row {
                                    TextButton(
                                        onClick = { viewModel.logMedicationIntake(log.id, "Принято") },
                                        colors = ButtonDefaults.textButtonColors(
                                            contentColor = if (log.status == "Принято") RiskLow else MedTextSecondary
                                        )
                                    ) {
                                        Text("Принято", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                    TextButton(
                                        onClick = { viewModel.logMedicationIntake(log.id, "Пропущено") },
                                        colors = ButtonDefaults.textButtonColors(
                                            contentColor = if (log.status == "Пропущено") RiskHigh else MedTextSecondary
                                        )
                                    ) {
                                        Text("Пропущено", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                            Divider(color = Color(0xFFF1F5F9))
                        }
                    }
                }
            }
        }

        // Compliance Gauge Card
        item {
            SectionCard {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(70.dp)
                            .background(
                                color = if (adherencePercent >= 90) RiskLow.copy(alpha = 0.1f) else RiskHigh.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(35.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${adherencePercent.roundToInt()}%",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (adherencePercent >= 90) RiskLow else RiskHigh
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text("Уровень дисциплины приверженности", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedTextPrimary)
                        Text(
                            text = if (adherencePercent >= 90) "Отличный гемодинамический контроль. Угроза сосудам стабилизирована."
                            else "Зафиксированы пропуски медикаментов! Угроза дестабилизации гипертензии повышена в 1.83 раза.",
                            fontSize = 12.sp,
                            color = MedTextSecondary,
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        }

        // Active appointments pool
        item {
            Text("Текущие врачебные назначения (${medications.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedTextPrimary)
        }

        if (medications.isEmpty()) {
            item {
                EmptyState(message = "Пациент не принимает назначенных кардио-препаратов.")
            }
        } else {
            items(medications) { med ->
                SectionCard {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Filled.MedicalInformation, contentDescription = null, tint = MedPrimary, modifier = Modifier.size(32.dp))
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(med.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = MedTextPrimary)
                            Text("Дозирование: ${med.dosage} (${med.frequency})", fontSize = 12.sp, color = MedTextSecondary)
                            Text("Запланированное время: " + med.intakeTimes.joinToString(", "), fontSize = 11.sp, color = MedTextMuted)
                        }
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// 5. CARDIOVASCULAR RISK ASSESSMENT
// ----------------------------------------------------------------------------

@Composable
fun RiskAssessmentScreen(viewModel: MainViewModel) {
    val model by viewModel.selectedRiskModel.collectAsState()
    val userProfile by viewModel.userProfile.collectAsState()
    val currentRisk by viewModel.currentRisk.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PageHeader(
                category = "КАРДИОВАСКУЛЯРНЫЙ РИСК",
                title = "Клинический калькулятор кардиометаболических рисков"
            )
        }

        // Model selectors
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(10.dp))
                    .border(1.dp, MedBorder, RoundedCornerShape(10.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                listOf("SCORE2_PROTOTYPE", "FRAMINGHAM_PROTOTYPE").forEach { mode ->
                    val isSelected = model == mode
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) MedPrimary else Color.Transparent)
                            .clickable { viewModel.setRiskModel(mode) }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (mode == "SCORE2_PROTOTYPE") "Модель SCORE2" else "Модель Framingham",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = if (isSelected) Color.White else MedTextSecondary
                        )
                    }
                }
            }
        }

        // Clinical safety disclaimers
        item {
            MedicalDisclaimer()
        }

        // Primary assessment Outcomes
        if (currentRisk != null) {
            item {
                SectionCard(border = BorderStroke(2.dp, if (currentRisk!!.estimatedRiskPercent >= 5.0) RiskHigh.copy(alpha = 0.5f) else MedPrimary.copy(alpha = 0.5f))) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = "Расчёт по модели: " + if (model == "SCORE2_PROTOTYPE") "SCORE2 (Эстиматор риска инфаркта/инсульта ESC)" else "Framingham General Cardiovascular Risk",
                            fontSize = 11.sp,
                            color = MedTextMuted,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "${currentRisk!!.estimatedRiskPercent}%",
                                fontSize = 48.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (currentRisk!!.estimatedRiskPercent >= 10.0) RiskHigh else if (currentRisk!!.estimatedRiskPercent >= 5.0) RiskModerate else RiskLow
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Column {
                                Text("Риск ССЗ осложнений на 10 лет", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MedTextPrimary)
                                RiskBadge(category = currentRisk!!.category)
                            }
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Полученные значения кардио-рисков являются симулятивным математическим прототипом и не заменяют реальный клинический диагноз, коронарографию и оценку атеросклероза.",
                            fontSize = 11.sp,
                            color = MedTextSecondary,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // Visual Coordinate Gauge Scale
            item {
                SectionCard {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Кардиоваскулярная шкала тяжести риска", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MedTextPrimary)
                        Spacer(modifier = Modifier.height(8.dp))

                        // Drawing coordinate line scales
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(24.dp)
                                .clip(RoundedCornerShape(6.dp))
                        ) {
                            Row(modifier = Modifier.fillMaxSize()) {
                                Box(modifier = Modifier.weight(5f).fillMaxHeight().background(RiskLow))
                                Box(modifier = Modifier.weight(5f).fillMaxHeight().background(RiskModerate))
                                Box(modifier = Modifier.weight(10f).fillMaxHeight().background(RiskHigh))
                            }

                            // Pointer coordinate
                            val offsetPercentage = (currentRisk!!.estimatedRiskPercent / 25.0).coerceIn(0.0, 1.0).toFloat()
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val pointerX = size.width * offsetPercentage
                                drawLine(
                                    color = Color.White,
                                    start = Offset(pointerX, 0f),
                                    end = Offset(pointerX, size.height),
                                    strokeWidth = 6f
                                )
                                drawCircle(
                                    color = MedTextPrimary,
                                    radius = 10f,
                                    center = Offset(pointerX, size.height / 2)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Низкий риск (0-5%)", fontSize = 10.sp, color = RiskLow, fontWeight = FontWeight.Bold)
                            Text("Умеренный (5-10%)", fontSize = 10.sp, color = RiskModerate, fontWeight = FontWeight.Bold)
                            Text("Высокий/Очень высокий (10%+)", fontSize = 10.sp, color = RiskHigh, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Breakdown of Risk factors
            item {
                SectionCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Установленные отягощающие факторы анамнеза", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedTextPrimary)
                        Spacer(modifier = Modifier.height(10.dp))
                        if (currentRisk?.factors?.isEmpty() == true) {
                            Text("Модифицируемые факторы тяжести не установлены.", fontSize = 12.sp, color = MedTextMuted)
                        } else {
                            currentRisk?.factors?.forEach { factor ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(imageVector = Icons.Filled.Error, contentDescription = null, tint = RiskModerate, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(factor, fontSize = 12.sp, color = MedTextPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// 6. MEDICAL RECOMMENDATIONS
// ----------------------------------------------------------------------------

@Composable
fun RecommendationsScreen(viewModel: MainViewModel) {
    val recommendations by viewModel.recommendations.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PageHeader(
                category = "РЕКОМЕНДАЦИИ ВРАЧА",
                title = "Автоматизированные персонализированные планы профилактики"
            )
        }

        if (recommendations.isEmpty()) {
            item {
                EmptyState(message = "Данные телемониторинга отсутствуют для формирования персонализированных планов профилактики.")
            }
        } else {
            items(recommendations) { rec ->
                RecommendationCard(rec = rec)
            }
        }

        item {
            MedicalDisclaimer()
        }
    }
}

// ----------------------------------------------------------------------------
// 7. EDUCATIONAL CLINICAL LIBRARY
// ----------------------------------------------------------------------------

@Composable
fun EducationScreen(viewModel: MainViewModel) {
    val articles = MockData.educationArticles
    val selectedArticleId by viewModel.selectedArticleId.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("Все") }

    val selected = articles.find { it.id == selectedArticleId }

    if (selected != null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(SurfaceSlate)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            TextButton(
                onClick = { viewModel.selectArticle(null) },
                contentPadding = PaddingValues(0.dp)
            ) {
                Icon(imageVector = Icons.Filled.ArrowBack, contentDescription = "Назад")
                Spacer(modifier = Modifier.width(6.dp))
                Text("Назад к библиотеке статей", color = MedPrimary, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(12.dp))

            SectionCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        StatusBadge(status = selected.category, severity = "INFO")
                        Text(
                            text = "📖 ${selected.readingTime} минут чтения",
                            fontSize = 11.sp,
                            color = MedTextMuted,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(selected.title, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = MedTextPrimary)
                    Spacer(modifier = Modifier.height(16.dp))

                    Text(selected.content, fontSize = 14.sp, color = MedTextPrimary, lineHeight = 22.sp)

                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Ключевые медицинские выводы:", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MedTextPrimary)
                    Spacer(modifier = Modifier.height(6.dp))
                    selected.keyPoints.forEach { pt ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Icon(imageVector = Icons.Filled.Verified, contentDescription = null, tint = MedSecondary, modifier = Modifier.size(16.dp).padding(top = 2.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(pt, fontSize = 12.sp, color = MedTextSecondary, lineHeight = 16.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = MedBorder)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Врачебный дисклеймер: ${selected.medicalDisclaimer}",
                        fontSize = 11.sp,
                        color = RiskModerate,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 15.sp
                    )
                }
            }
        }
    } else {
        // Filter elements
        val categories = listOf("Все", "Давление", "Питание", "Активность")

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(SurfaceSlate)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                PageHeader(
                    category = "БАЗА ЗНАНИЙ ССЗ",
                    title = "Библиотека доказательной кардиологии"
                )
            }

            // Search Bar FormField
            item {
                FormField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = "Поиск медицинских статей и рекомендаций"
                )
            }

            // Filter Pills Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    categories.forEach { cat ->
                        val isCatSelected = selectedCategory == cat
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isCatSelected) MedPrimary else Color.White)
                                .border(1.dp, if (isCatSelected) MedPrimary else MedBorder, RoundedCornerShape(8.dp))
                                .clickable { selectedCategory = cat }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = cat,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isCatSelected) Color.White else MedTextSecondary
                            )
                        }
                    }
                }
            }

            // Articles matching search & filter
            val filteredArticles = articles.filter { art ->
                (selectedCategory == "Все" || art.category.contains(selectedCategory) || (selectedCategory == "Давление" && art.category.contains("АГ"))) &&
                (art.title.contains(searchQuery, ignoreCase = true) || art.summary.contains(searchQuery, ignoreCase = true))
            }

            if (filteredArticles.isEmpty()) {
                item {
                    EmptyState(message = "Статьи соответствующей тематики не найдены.")
                }
            } else {
                items(filteredArticles, key = { it.id }) { article ->
                    EducationArticleCard(article = article, onClick = { viewModel.selectArticle(article.id) })
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// 8. DECESTEBILITY ALERTS ALARMS MONITOR
// ----------------------------------------------------------------------------

@Composable
fun AlertsMonitorScreen(viewModel: MainViewModel) {
    val alerts by viewModel.alerts.collectAsState()
    val unread = alerts.filter { !it.isRead }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PageHeader(
                category = "СИГНАЛЫ ДЕСТАБИЛИЗАЦИИ",
                title = "Клинический монитор ранних аларм-критериев",
                actionButton = {
                    if (unread.isNotEmpty()) {
                        TextButton(onClick = { viewModel.clearAllReadAlerts() }) {
                            Text("Отметить все", color = MedPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            )
        }

        if (unread.isEmpty()) {
            item {
                EmptyState(message = "Все аларм-критерии в норме. Стабильное гемодинамическое состояние.")
            }
        } else {
            items(unread, key = { it.id }) { alert ->
                AlertCard(alert = alert, onDismiss = { viewModel.dismissAlert(alert.id) })
            }
        }

        item {
            MedicalDisclaimer()
        }
    }
}

// ----------------------------------------------------------------------------
// 9. DOCTOR CLINICAL COHORT RESEARCH PANEL
// ----------------------------------------------------------------------------

@Composable
fun DoctorPanelScreen(viewModel: MainViewModel) {
    val cohort = remember { MockData.researcherUsers }
    val cohortMeasurements = remember { MockData.researchMeasurements }

    val averageSys = remember(cohortMeasurements) { cohortMeasurements.map { it.systolicBP }.average().roundToInt() }
    val averageDia = remember(cohortMeasurements) { cohortMeasurements.map { it.diastolicBP }.average().roundToInt() }
    val averageBmi = remember(cohortMeasurements) { ((cohortMeasurements.map { it.bmi }.average() * 10.0).roundToInt() / 10.0) }

    var registryLimit by remember { mutableStateOf(5) }
    val limitedCohort = remember(cohort, registryLimit) { cohort.take(registryLimit) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PageHeader(
                category = "КЛИНИЧЕСКАЯ ПАНЕЛЬ ВРАЧА",
                title = "Телемониторинг когорты и исследовательский реестр"
            )
        }

        // Cohort KPIs
        item {
            Column {
                Text(
                    text = "Статистические индикаторы популяции (Когорта N=${cohort.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MedTextPrimary,
                    modifier = Modifier.padding(bottom = 10.dp)
                )

                Row(modifier = Modifier.fillMaxWidth()) {
                    MetricCard(
                        title = "Реестр пациентов",
                        value = "${cohort.size}",
                        unit = "чел",
                        icon = Icons.Outlined.People,
                        iconColor = MedPrimary,
                        categoryLabel = "Когорта активна",
                        modifier = Modifier.weight(1f).padding(end = 6.dp)
                    )
                    MetricCard(
                        title = "Среднее АД группы",
                        value = "$averageSys/$averageDia",
                        unit = "мм",
                        icon = Icons.Outlined.Favorite,
                        iconColor = if (averageSys >= 135) RiskHigh else RiskLow,
                        categoryLabel = if (averageSys >= 135) "Группа риска по АГ" else "Оптимальное коорд",
                        modifier = Modifier.weight(1.5f).padding(start = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth()) {
                    MetricCard(
                        title = "Медиана ИМТ Cohort",
                        value = "$averageBmi",
                        unit = "ИМТ кг/м²",
                        icon = Icons.Outlined.Scale,
                        iconColor = if (averageBmi >= 27.5) RiskModerate else RiskLow,
                        categoryLabel = if (averageBmi >= 25.0) "Преобладание лишнего веса" else "Норма ИМТ",
                        modifier = Modifier.weight(1.2f).padding(end = 6.dp)
                    )
                    MetricCard(
                        title = "Сигналы алармов",
                        value = "3",
                        unit = "высокоприоритетных",
                        icon = Icons.Outlined.NotificationImportant,
                        iconColor = RiskHigh,
                        categoryLabel = "Критическая нестабильность",
                        modifier = Modifier.weight(1.2f).padding(start = 6.dp)
                    )
                }
            }
        }

        // Registry Table Cohort patients details
        item {
            Text("Пациентский регистр исследовательской когорты", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedTextPrimary)
        }

        items(limitedCohort, key = { it.id }) { pt ->
            // Patient details card
            SectionCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Пациент ID: ${pt.anonymizedId} (${pt.fullName})",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = MedPrimary
                        )
                        StatusBadge(
                            status = if (pt.smokingStatus == "Курит") "Преобладают риски" else "Стабилен",
                            severity = if (pt.smokingStatus == "Курит") "MODERATE" else "LOW"
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("Проф. группа", fontSize = 10.sp, color = MedTextMuted)
                            Text(pt.professionalRiskGroup, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                        }
                        Column {
                            Text("Десинхроноз/Смены", fontSize = 10.sp, color = MedTextMuted)
                            Text(pt.workScheduleType, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                        }
                        Column {
                            Text("Возраст/Биопол", fontSize = 10.sp, color = MedTextMuted)
                            Text("${pt.age} лет / ${pt.sex.take(1)}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                        }
                    }
                }
            }
        }

        if (cohort.size > registryLimit) {
            item {
                Button(
                    onClick = { registryLimit += 5 },
                    colors = ButtonDefaults.buttonColors(containerColor = MedPrimary),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Показать больше пациентов", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// 10. SYSTEM CONFIGURATION & SETTINGS
// ----------------------------------------------------------------------------

@Composable
fun SettingsScreen(viewModel: MainViewModel) {
    val userProfile by viewModel.userProfile.collectAsState()
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            PageHeader(
                category = "НАСТРОЙКИ И ПРИВАТНОСТЬ",
                title = "Клинический профайл пользователя"
            )
        }

        item {
            SectionCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Filled.Person, contentDescription = null, tint = MedPrimary, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(userProfile.fullName, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MedTextPrimary)
                            Text("Анонимизированный СУБД ID: ${userProfile.anonymizedId}", fontSize = 12.sp, color = MedTextMuted)
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("Пациент (Возраст)", fontSize = 11.sp, color = MedTextMuted)
                            Text("${userProfile.age} лет", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                        }
                        Column {
                            Text("Рост", fontSize = 11.sp, color = MedTextMuted)
                            Text("${userProfile.heightCm} см", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                        }
                        Column {
                            Text("Вес", fontSize = 11.sp, color = MedTextMuted)
                            Text("${userProfile.weightKg} кг", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MedTextPrimary)
                        }
                    }
                }
            }
        }

        // Telemetry toggles
        item {
            SectionCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Конфигурация телеметрии локального буфера СУБД", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MedSecondary)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Экспорт сеансов телеметрии в ЕГИСЗ", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MedTextPrimary)
                            Text("Автоматическая синхронизация локальных замеров.", fontSize = 11.sp, color = MedTextMuted)
                        }
                        var syncEgisz by remember { mutableStateOf(true) }
                        Switch(
                            checked = syncEgisz,
                            onCheckedChange = { syncEgisz = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = MedPrimary, checkedTrackColor = MedPrimary.copy(alpha = 0.5f))
                        )
                    }

                    Divider(color = Color(0xFFF1F5F9))

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Псевдоанонимизация при передаче исследователям", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MedTextPrimary)
                            Text("Сокрытие ФИО за заменой на хэш-код.", fontSize = 11.sp, color = MedTextMuted)
                        }
                        var pseudo by remember { mutableStateOf(true) }
                        Switch(
                            checked = pseudo,
                            onCheckedChange = { pseudo = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = MedPrimary, checkedTrackColor = MedPrimary.copy(alpha = 0.5f))
                        )
                    }
                }
            }
        }

        // System operations
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = {
                        viewModel.resetToDefaults()
                        android.widget.Toast.makeText(context, "Локальный СУБД буфер телеметрии сброшен.", android.widget.Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = RiskHigh),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(imageVector = Icons.Filled.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Сбросить телеметрию и очистить базу СУБД", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------
// 11. SCIENTIFIC DISSERTATION SUMMARY
// ----------------------------------------------------------------------------

@Composable
fun AboutProjectScreen() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate)
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        PageHeader(
            category = "СПЕЦИФИКАЦИЯ ДИССЕРТАЦИИ",
            title = "Оригинальный наукоемкий чертеж модулей CardioGuard"
        )

        SectionCard {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Математические и программные модули системы:",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MedPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "1. Математический модуль превентивного SCORE2:\n" +
                            "Калькуляция вероятности ССЗ событий на 10 лет с учетом модифицируемых (холестерин, давление, курение) и немодифицируемых (биопол, возраст) клинических признаков, скорректированная на сменный/ночной труд и особый профессиональный стресс.\n\n" +
                            "2. Фармакотерапевтический модуль комплаенса:\n" +
                            "Расчет математической приверженности лечению (отношение реально принятых доз к запланированным) с индикацией тревожных сценариев снижения дисциплины и триггерами повышения клинической уязвимости.\n\n" +
                            "3. Модуль превентивной рекомендации:\n" +
                            "Генератор персонализированных структурированных медицинских действий по изменению образа жизни и стабилизации артериальной гипертензии на пластах доказательной медицины.",
                    fontSize = 12.sp,
                    color = MedTextSecondary,
                    lineHeight = 18.sp
                )
            }
        }

        MedicalDisclaimer()
    }
}
