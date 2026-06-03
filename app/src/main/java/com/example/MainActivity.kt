@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.AppScreen
import com.example.ui.MainViewModel
import com.example.ui.screens.*
import com.example.ui.theme.MyApplicationTheme
import kotlinx.coroutines.launch

import androidx.compose.foundation.BorderStroke

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                val currentScreen by viewModel.currentScreen.collectAsState()
                val userRole by viewModel.userRole.collectAsState()

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    @OptIn(androidx.compose.animation.ExperimentalAnimationApi::class)
                    AnimatedContent(
                        targetState = currentScreen,
                        transitionSpec = {
                            fadeIn(animationSpec = androidx.compose.animation.core.tween(300)) togetherWith
                                    fadeOut(animationSpec = androidx.compose.animation.core.tween(300))
                        },
                        label = "PrimaryScreenTransit"
                    ) { targetScreen ->
                        when (targetScreen) {
                            AppScreen.AUTH -> AuthScreen(viewModel)
                            AppScreen.ONBOARDING -> OnboardingScreen(viewModel)
                            else -> MainAppScaffolding(viewModel, userRole, targetScreen)
                        }
                    }
                }
            }
        }
    }
}

/**
 * Authentication Screen.
 * Clinically credible gating module.
 */
@Composable
fun AuthScreen(viewModel: MainViewModel) {
    val context = LocalContext.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceSlate),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Heart shield logo mimic
            Icon(
                imageVector = Icons.Filled.HealthAndSafety,
                contentDescription = "CardioGuard Logo",
                tint = MedPrimary,
                modifier = Modifier.size(72.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "CardioGuard",
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                color = MedTextPrimary
            )
            Text(
                text = "Система профилактики кардиометаболических рисков",
                fontSize = 12.sp,
                color = MedTextMuted,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(28.dp))

            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, MedBorder),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Вход в систему замера",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = MedTextPrimary
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Имя пользователя или ID") },
                        placeholder = { Text("doctor_admin или cg_patient") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        leadingIcon = { Icon(imageVector = Icons.Filled.Person, contentDescription = null, tint = MedTextMuted) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MedPrimary,
                            unfocusedBorderColor = MedBorder
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Пароль доступа") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        leadingIcon = { Icon(imageVector = Icons.Filled.Lock, contentDescription = null, tint = MedTextMuted) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MedPrimary,
                            unfocusedBorderColor = MedBorder
                        )
                    )
                    Spacer(modifier = Modifier.height(18.dp))

                    // Simulated Google auth buttons etc.
                    OutlinedButton(
                        onClick = {
                            Toast.makeText(context, "Имитация входа через Google Identity...", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MedTextPrimary),
                        border = BorderStroke(1.dp, MedBorder)
                    ) {
                        Icon(imageVector = Icons.Filled.CloudQueue, contentDescription = null, modifier = Modifier.size(16.dp), tint = MedPrimary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Вход через учётную запись ЕГИСЗ", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text("БЫСТРЫЙ ДЕМО-ДОСТУП ĐЛЯ РЕЦЕНЗЕНТА ДИССЕРТАЦИИ:", fontSize = 10.sp, fontWeight = FontWeight.Black, color = MedTextMuted)
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(modifier = Modifier.fillMaxWidth()) {
                        Button(
                            onClick = {
                                viewModel.setUserRole("Пользователь")
                                viewModel.skipToDashboard()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MedPrimary),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                                .padding(end = 4.dp)
                        ) {
                            Text("Пользователь", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                viewModel.setUserRole("Врач / исследователь")
                                viewModel.navigateTo(AppScreen.DOCTOR_PANEL)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MedSecondary),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                                .padding(start = 4.dp)
                        ) {
                            Text("Врач/Наука", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = { viewModel.navigateTo(AppScreen.ONBOARDING) }) {
                        Text("Пройти анкету анкетного скрининга (Onboarding)", color = MedPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Расчёт риска ССЗ является прототипом СУБД CardioGuard и требует клинической валидации перед реальным использованием. Все данные защищены.",
                fontSize = 11.sp,
                color = MedTextMuted,
                textAlign = TextAlign.Center,
                lineHeight = 16.sp
            )
        }
    }
}

/**
 * Main scaffolding holding side-drawers, responsive grids, and central hubs.
 */
@Composable
fun MainAppScaffolding(
    viewModel: MainViewModel,
    userRole: String,
    currentScreen: AppScreen
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val alerts by viewModel.alerts.collectAsState()
    val unreadCount = alerts.count { !it.isRead }

    val navigationItems = listOf(
        NavigationItem("Главная панель", AppScreen.DASHBOARD, Icons.Filled.Dashboard),
        NavigationItem("Мониторинг здоровья", AppScreen.HEALTH_MONITORING, Icons.Filled.MonitorHeart),
        NavigationItem("Лекарственная терапия", AppScreen.MEDICATIONS, Icons.Filled.Medication),
        NavigationItem("Оценка риска ССЗ", AppScreen.RISK_ASSESSMENT, Icons.Filled.Calculate),
        NavigationItem("Рекомендации врача", AppScreen.RECOMMENDATIONS, Icons.Filled.Verified),
        NavigationItem("База знаний", AppScreen.EDUCATION, Icons.Filled.Book),
        NavigationItem("Сигналы дестабилизации", AppScreen.ALERTS, Icons.Filled.Notifications, badgeCount = unreadCount),
        NavigationItem("Панель когорты врача", AppScreen.DOCTOR_PANEL, Icons.Filled.Group),
        NavigationItem("Настройки и приватность", AppScreen.SETTINGS, Icons.Filled.Settings),
        NavigationItem("Спецификация диссертации", AppScreen.ABOUT_PROJECT, Icons.Filled.Article)
    )

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Spacer(modifier = Modifier.height(12.dp))
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    Text("CardioGuard Pro", fontWeight = FontWeight.Black, fontSize = 18.sp, color = ClinicalBlue)
                    Text("Личный монитор и база исследований", fontSize = 11.sp, color = Color.Gray)
                }
                Divider(modifier = Modifier.padding(vertical = 8.dp))
                navigationItems.forEach { item ->
                    NavigationDrawerItem(
                        icon = { Icon(imageVector = item.icon, contentDescription = item.label) },
                        label = {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(item.label)
                                if (item.badgeCount > 0) {
                                    Badge(containerColor = AlertHighRed) {
                                        Text("${item.badgeCount}", color = Color.White)
                                    }
                                }
                            }
                        },
                        selected = currentScreen == item.screen,
                        onClick = {
                            scope.launch { drawerState.close() }
                            viewModel.navigateTo(item.screen)
                        },
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    text = "Версия прототипа v1.0\nКафедра превентивной патологии и ИТ",
                    fontSize = 10.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        }
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Filled.HealthAndSafety, contentDescription = null, tint = AlertHighRed, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("CardioGuard", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(imageVector = Icons.Filled.Menu, contentDescription = "Меню")
                        }
                    },
                    actions = {
                        // Role selection drop or buttons
                        Box(
                            modifier = Modifier
                                .padding(end = 8.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (userRole == "Пользователь") ClinicalBlue.copy(alpha = 0.1f) else ClinicalTeal.copy(alpha = 0.1f))
                                .clickable {
                                    val nextRole = if (userRole == "Пользователь") "Врач / исследователь" else "Пользователь"
                                    viewModel.setUserRole(nextRole)
                                    Toast.makeText(context, "Роль переключена на: $nextRole", Toast.LENGTH_SHORT).show()
                                }
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (userRole == "Пользователь") "Пациент" else "Врач/Наука",
                                color = if (userRole == "Пользователь") ClinicalBlue else ClinicalTeal,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.White)
                )
            },
            bottomBar = {
                // Bottom navigation bar for handheld quick access
                NavigationBar(
                    containerColor = Color.White,
                    tonalElevation = 8.dp
                ) {
                    val mobileItems = listOf(
                        NavigationItem("Главная", AppScreen.DASHBOARD, Icons.Filled.Dashboard),
                        NavigationItem("Замеры", AppScreen.HEALTH_MONITORING, Icons.Filled.MonitorHeart),
                        NavigationItem("Терапия", AppScreen.MEDICATIONS, Icons.Filled.Medication),
                        NavigationItem("Риск ССЗ", AppScreen.RISK_ASSESSMENT, Icons.Filled.Calculate),
                        NavigationItem("Сигналы", AppScreen.ALERTS, Icons.Filled.Notifications, badgeCount = unreadCount)
                    )
                    mobileItems.forEach { item ->
                        NavigationBarItem(
                            icon = {
                                BadgedBox(
                                    badge = {
                                        if (item.badgeCount > 0) {
                                            Badge(containerColor = AlertHighRed) {
                                                Text("${item.badgeCount}", color = Color.White)
                                            }
                                        }
                                    }
                                ) {
                                    Icon(imageVector = item.icon, contentDescription = item.label)
                                }
                            },
                            label = { Text(item.label, fontSize = 10.sp) },
                            selected = currentScreen == item.screen,
                            onClick = { viewModel.navigateTo(item.screen) }
                        )
                    }
                }
            }
        ) { innerPadding ->
            Box(modifier = Modifier.padding(innerPadding)) {
                AnimatedContent(
                    targetState = currentScreen,
                    transitionSpec = {
                        slideInHorizontally(initialOffsetX = { x -> (x * 0.08f).toInt() }, animationSpec = androidx.compose.animation.core.tween(220)) + fadeIn(animationSpec = androidx.compose.animation.core.tween(220)) togetherWith
                                slideOutHorizontally(targetOffsetX = { x -> (-x * 0.04f).toInt() }, animationSpec = androidx.compose.animation.core.tween(180)) + fadeOut(animationSpec = androidx.compose.animation.core.tween(180))
                    },
                    label = "ScaffoldScreenTransit"
                ) { targetScreen ->
                    when (targetScreen) {
                        AppScreen.DASHBOARD -> DashboardScreen(viewModel) { viewModel.navigateTo(AppScreen.HEALTH_MONITORING) }
                        AppScreen.HEALTH_MONITORING -> HealthMonitoringScreen(viewModel)
                        AppScreen.MEDICATIONS -> MedicationsScreen(viewModel)
                        AppScreen.RISK_ASSESSMENT -> RiskAssessmentScreen(viewModel)
                        AppScreen.RECOMMENDATIONS -> RecommendationsScreen(viewModel)
                        AppScreen.EDUCATION -> EducationScreen(viewModel)
                        AppScreen.ALERTS -> AlertsMonitorScreen(viewModel)
                        AppScreen.DOCTOR_PANEL -> DoctorPanelScreen(viewModel)
                        AppScreen.SETTINGS -> SettingsScreen(viewModel)
                        AppScreen.ABOUT_PROJECT -> AboutProjectScreen()
                        else -> DashboardScreen(viewModel) { viewModel.navigateTo(AppScreen.HEALTH_MONITORING) }
                    }
                }
            }
        }
    }
}

data class NavigationItem(
    val label: String,
    val screen: AppScreen,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val badgeCount: Int = 0
)
