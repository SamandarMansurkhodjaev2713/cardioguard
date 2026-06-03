package com.example.ui

import androidx.lifecycle.ViewModel
import com.example.data.*
import com.example.utils.MedicalCalculators
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.*
import kotlin.math.abs

enum class AppScreen {
    AUTH, ONBOARDING, DASHBOARD, HEALTH_MONITORING, MEDICATIONS, RISK_ASSESSMENT, RECOMMENDATIONS, EDUCATION, ALERTS, DOCTOR_PANEL, SETTINGS, ABOUT_PROJECT
}

class MainViewModel : ViewModel() {

    // Current app screen
    private val _currentScreen = MutableStateFlow(AppScreen.AUTH)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    // Current authorized role: "Пользователь" (Patient), "Врач / исследователь" (Doctor)
    private val _userRole = MutableStateFlow("Пользователь")
    val userRole: StateFlow<String> = _userRole.asStateFlow()

    // Active patient profile state
    private val _userProfile = MutableStateFlow<UserProfile>(MockData.primaryUser)
    val userProfile: StateFlow<UserProfile> = _userProfile.asStateFlow()

    // Self-monitoring physiological track
    private val _measurements = MutableStateFlow<List<HealthMeasurement>>(MockData.initialMeasurements)
    val measurements: StateFlow<List<HealthMeasurement>> = _measurements.asStateFlow()

    // Medication schedules state
    private val _medications = MutableStateFlow<List<Medication>>(MockData.initialMedications)
    val medications: StateFlow<List<Medication>> = _medications.asStateFlow()

    // Medications intake daily checklist (for today's schedule)
    private val _medicationLogs = MutableStateFlow<List<MedicationLog>>(MockData.initialMedicationLogs)
    val medicationLogs: StateFlow<List<MedicationLog>> = _medicationLogs.asStateFlow()

    // Dynamic warning alert triggers state
    private val _alerts = MutableStateFlow<List<Alert>>(MockData.initialAlerts)
    val alerts: StateFlow<List<Alert>> = _alerts.asStateFlow()

    // Selected article for deep reading view
    private val _selectedArticleId = MutableStateFlow<String?>(null)
    val selectedArticleId: StateFlow<String?> = _selectedArticleId.asStateFlow()

    // Current risk model selected
    private val _selectedRiskModel = MutableStateFlow("SCORE2_PROTOTYPE")
    val selectedRiskModel: StateFlow<String> = _selectedRiskModel.asStateFlow()

    // Measurements filter: "7 дней", "30 дней", "90 дней"
    private val _timeFilter = MutableStateFlow("7 дней")
    val timeFilter: StateFlow<String> = _timeFilter.asStateFlow()

    // Active CVD Risk Assessment state
    private val _currentRisk = MutableStateFlow<RiskAssessment?>(null)
    val currentRisk: StateFlow<RiskAssessment?> = _currentRisk.asStateFlow()

    // Personalized recommendations generated engine
    private val _recommendations = MutableStateFlow<List<Recommendation>>(emptyList())
    val recommendations: StateFlow<List<Recommendation>> = _recommendations.asStateFlow()

    // Onboarding form state progress
    private val _onboardingStep = MutableStateFlow(1)
    val onboardingStep: StateFlow<Int> = _onboardingStep.asStateFlow()

    // Draft properties for Onboarding screens
    val onboardName = MutableStateFlow("")
    val onboardAge = MutableStateFlow("45")
    val onboardSex = MutableStateFlow("Мужской")
    val onboardHeight = MutableStateFlow("175")
    val onboardWeight = MutableStateFlow("80")
    val onboardWaist = MutableStateFlow("92")
    
    val onboardSmoking = MutableStateFlow("Никогда не курил")
    val onboardDiabetes = MutableStateFlow("Нет")
    val onboardHypertension = MutableStateFlow("Нет")
    val onboardOnMeds = MutableStateFlow(false)
    val onboardFamilyCvd = MutableStateFlow("Нет")

    val onboardWorkSchedule = MutableStateFlow("Обычный график")
    val onboardRiskGroup = MutableStateFlow("Гражданские лица")
    val onboardActivity = MutableStateFlow("Средняя")
    val onboardSleep = MutableStateFlow("Хороший")
    val onboardStress = MutableStateFlow("Низкий")

    val onboardSystolic = MutableStateFlow("128")
    val onboardDiastolic = MutableStateFlow("82")
    val onboardHeartRate = MutableStateFlow("72")
    val onboardCholesterol = MutableStateFlow("5.2")
    val onboardHdl = MutableStateFlow("1.3")

    init {
        // Compute initial risk and recommendations based on mock primary user
        updateRiskAndRecommendations()
    }

    fun navigateTo(screen: AppScreen) {
        _currentScreen.value = screen
        _selectedArticleId.value = null // Reset articles reading focus
    }

    fun setUserRole(role: String) {
        _userRole.value = role
        if (role == "Врач / исследователь") {
            navigateTo(AppScreen.DOCTOR_PANEL)
        } else {
            navigateTo(AppScreen.DASHBOARD)
        }
    }

    fun selectArticle(id: String?) {
        _selectedArticleId.value = id
    }

    fun setRiskModel(model: String) {
        _selectedRiskModel.value = model
        updateRiskAndRecommendations()
    }

    fun setTimeFilter(filter: String) {
        _timeFilter.value = filter
    }

    fun onboardingNext() {
        if (_onboardingStep.value < 5) {
            _onboardingStep.value += 1
        } else {
            // Complete onboarding, create primary user
            val height = onboardHeight.value.toDoubleOrNull() ?: 175.0
            val weight = onboardWeight.value.toDoubleOrNull() ?: 80.0
            val bmiVal = MedicalCalculators.calculateBMI(weight, height)

            val newProfile = UserProfile(
                id = "user_01",
                anonymizedId = "CG-${(1000..9999).random()}-N",
                fullName = onboardName.value.ifBlank { "Пациент" },
                age = onboardAge.value.toIntOrNull() ?: 45,
                sex = onboardSex.value,
                heightCm = height,
                weightKg = weight,
                waistCircumferenceCm = onboardWaist.value.toDoubleOrNull() ?: 90.0,
                smokingStatus = onboardSmoking.value,
                diabetesStatus = onboardDiabetes.value,
                hypertensionStatus = onboardHypertension.value,
                onHypertensiveMedication = onboardOnMeds.value,
                familyHistoryCVD = onboardFamilyCvd.value,
                workScheduleType = onboardWorkSchedule.value,
                professionalRiskGroup = onboardRiskGroup.value,
                physicalActivityLevel = onboardActivity.value,
                sleepQuality = onboardSleep.value,
                stressLevel = onboardStress.value,
                createdAt = Date(),
                updatedAt = Date()
            )

            val baseMeasurement = HealthMeasurement(
                id = "m_onboarding",
                userId = "user_01",
                date = Date(),
                systolicBP = onboardSystolic.value.toIntOrNull() ?: 120,
                diastolicBP = onboardDiastolic.value.toIntOrNull() ?: 80,
                heartRate = onboardHeartRate.value.toIntOrNull() ?: 70,
                weightKg = weight,
                bmi = bmiVal,
                waistCircumferenceCm = newProfile.waistCircumferenceCm,
                sleepHours = if (onboardSleep.value == "Хороший") 8.0 else if (onboardSleep.value == "Нарушенный") 6.0 else 5.0,
                stressLevel = onboardStress.value,
                physicalActivityMinutes = if (onboardActivity.value == "Высокая") 45 else if (onboardActivity.value == "Средняя") 20 else 5,
                notes = "Базовые измерения при регистрации"
            )

            _userProfile.value = newProfile
            _measurements.value = listOf(baseMeasurement) + _measurements.value

            updateRiskAndRecommendations()
            evaluateAlertTriggers()
            
            _onboardingStep.value = 1
            navigateTo(AppScreen.DASHBOARD)
        }
    }

    fun onboardingPrev() {
        if (_onboardingStep.value > 1) {
            _onboardingStep.value -= 1
        }
    }

    fun resetOnboardingProgress() {
        onboardName.value = ""
        onboardAge.value = "45"
        onboardSex.value = "Мужской"
        onboardHeight.value = "175"
        onboardWeight.value = "80"
        onboardWaist.value = "92"
        _onboardingStep.value = 1
        navigateTo(AppScreen.ONBOARDING)
    }

    fun skipToDashboard() {
        _userProfile.value = MockData.primaryUser
        _measurements.value = MockData.initialMeasurements
        _medications.value = MockData.initialMedications
        _medicationLogs.value = MockData.initialMedicationLogs
        _alerts.value = MockData.initialAlerts
        updateRiskAndRecommendations()
        navigateTo(AppScreen.DASHBOARD)
    }

    /**
     * Appends a newly recorded patient measurement, matching inputs and recalculating targets.
     */
    fun addMeasurement(
        systolic: Int,
        diastolic: Int,
        hr: Int,
        weight: Double,
        waist: Double,
        sleep: Double,
        stress: String,
        activity: Int,
        notes: String
    ) {
        val currentProfile = _userProfile.value
        val calculatedBmi = MedicalCalculators.calculateBMI(weight, currentProfile.heightCm)

        val newMeasurement = HealthMeasurement(
            id = "m_" + System.currentTimeMillis(),
            userId = currentProfile.id,
            date = Date(),
            systolicBP = systolic,
            diastolicBP = diastolic,
            heartRate = hr,
            weightKg = weight,
            bmi = calculatedBmi,
            waistCircumferenceCm = waist,
            sleepHours = sleep,
            stressLevel = stress,
            physicalActivityMinutes = activity,
            notes = notes
        )

        _measurements.value = listOf(newMeasurement) + _measurements.value
        
        // Update user profile current weight for tracking inside Settings / Dashboard
        _userProfile.value = currentProfile.copy(
            weightKg = weight,
            waistCircumferenceCm = waist,
            updatedAt = Date()
        )

        updateRiskAndRecommendations()
        evaluateAlertTriggers()
    }

    /**
     * Appends a newly prescribed therapeutic medication schedule.
     */
    fun addMedication(
        name: String,
        dosage: String,
        frequency: String,
        time: String,
        instructions: String
    ) {
        val newMed = Medication(
            id = "med_" + System.currentTimeMillis(),
            userId = _userProfile.value.id,
            name = name,
            dosage = dosage,
            frequency = frequency,
            intakeTimes = listOf(time),
            startDate = Date(),
            endDate = null,
            instructions = instructions,
            isActive = true
        )
        _medications.value = _medications.value + newMed

        // Immediately add scheduling expectation for today
        val newExpectationLog = MedicationLog(
            id = "log_med_new_" + System.currentTimeMillis(),
            medicationId = newMed.id,
            userId = _userProfile.value.id,
            scheduledTime = time,
            actualTime = null,
            status = "Пропущено" // Starts status as awaiting action / missed until marked
        )
        _medicationLogs.value = _medicationLogs.value + newExpectationLog
        
        evaluateAlertTriggers()
    }

    /**
     * Records or updates medication intake checkboxes.
     */
    fun logMedicationIntake(logId: String, status: String, notes: String = "") {
        _medicationLogs.value = _medicationLogs.value.map { log ->
            if (log.id == logId) {
                log.copy(
                    status = status,
                    actualTime = if (status == "Принято") Date() else null,
                    note = notes
                )
            } else log
        }
        evaluateAlertTriggers()
    }

    fun dismissAlert(alertId: String) {
        _alerts.value = _alerts.value.map { alert ->
            if (alert.id == alertId) alert.copy(isRead = true) else alert
        }
    }

    fun clearAllReadAlerts() {
        _alerts.value = _alerts.value.filter { !it.isRead }
    }

    /**
     * Risk Calculations and Personalization Engines.
     * Generates a detailed risk report and relative action items based on clinical guidelines.
     */
    fun updateRiskAndRecommendations() {
        val profile = _userProfile.value
        val latest = _measurements.value.firstOrNull() ?: return

        // Default medical baseline assumptions for prototype modeling
        val totalChol = 5.2
        val hdlChol = 1.3

        val scoreRisk = MedicalCalculators.calculatePrototypeScore2Risk(profile, latest.systolicBP, totalChol, hdlChol)
        val framinghamRisk = MedicalCalculators.calculatePrototypeFraminghamRisk(profile, latest.systolicBP, totalChol, hdlChol)

        val selectedRiskValue = if (_selectedRiskModel.value == "SCORE2_PROTOTYPE") scoreRisk else framinghamRisk
        val riskCategoryLabel = MedicalCalculators.getRiskCategoryLabel(selectedRiskValue)

        // Building dynamic contributing factors description
        val factors = mutableListOf<String>()
        if (latest.systolicBP >= 140) factors.add("Артериальное давление повышенное (${latest.systolicBP}/${latest.diastolicBP})")
        if (profile.smokingStatus == "Курит") factors.add("Курение")
        if (latest.bmi >= 30.0) factors.add("Ожирение (ИМТ - ${latest.bmi})")
        else if (latest.bmi >= 25.0) factors.add("Избыточная масса тела")
        if (profile.diabetesStatus == "Да") factors.add("Сахарный диабет 2 типа")
        if (profile.familyHistoryCVD == "Да") factors.add("Отягощенный семейный анамнез ССЗ")
        if (profile.workScheduleType == "Сменная работа" || profile.workScheduleType == "Ночные смены") {
            factors.add("Профессиональный десинхроноз (сменный характер труда)")
        }
        if (latest.waistCircumferenceCm > 94.0 && profile.sex == "Мужской") {
            factors.add("Абдоминальное депо висцерального жира")
        }

        _currentRisk.value = RiskAssessment(
            id = "risk_" + System.currentTimeMillis(),
            userId = profile.id,
            date = Date(),
            model = _selectedRiskModel.value,
            estimatedRiskPercent = selectedRiskValue,
            category = riskCategoryLabel,
            factors = factors,
            explanation = "10-летний расчёт вероятности сосудистых инцидентов. Вычислен по клинико-прототипным алгоритмам.",
            disclaimer = "Расчёт является демонстрационным прототипом и требует валидации."
        )

        // RECOMMENDATION ENGINE TRIGGERING CONSTRAINTS
        val recs = mutableListOf<Recommendation>()

        // 1. Blood Pressure Management
        if (latest.systolicBP >= 140 || latest.diastolicBP >= 90) {
            recs.add(
                Recommendation(
                    id = "rec_bp_hi",
                    userId = profile.id,
                    category = "Контроль АД",
                    priority = "Высокий",
                    title = "Стабилизация повышенного кровяного давления",
                    explanation = "Ваши показатели АД (${latest.systolicBP}/${latest.diastolicBP} мм рт. ст.) соответствуют порогу гипертензии. Требуется строгая нормализация.",
                    actionSteps = listOf(
                        "Замеряйте АД дважды в сутки в спокойном сидячем состоянии в одно время.",
                        "Ведите цифровой журнал измерений CardioGuard для демонстрации лечащему врачу.",
                        "Ограничьте поваренную соль во всех блюдах до 4-5 грамм в день (половина чайной ложки)."
                    ),
                    reason = "Обеспечение защиты сосудов головного мозга и почечных клубочков от разрывов и склерозирования.",
                    safetyNote = "При удержании стабильно высоких цифр давления незамедлительно обратитесь к врачу во избежание гипертонического криза."
                )
            )
        }

        // 2. BMI and Weight
        if (latest.bmi >= 30.0) {
            recs.add(
                Recommendation(
                    id = "rec_weight_ob",
                    userId = profile.id,
                    category = "Контроль массы тела",
                    priority = "Высокий",
                    title = "Уменьшение висцеральной жировой массы",
                    explanation = "Показатель Вашего индекса массы тела (${latest.bmi} кг/м²) относится к категории Ожирения. Окружность талии ${latest.waistCircumferenceCm} см указывает на висцеральное накопление жира.",
                    actionSteps = listOf(
                        "Сократите суточное потребление быстрых углеводов и сладких напитков.",
                        "Ведите взвешивание дважды в неделю утром натощак.",
                        "Плавно увеличивайте длительность пеших прогулок, стремясь к 150 минутам двигательной активности в неделю."
                    ),
                    reason = "Снижение системного уровня субклинического цитокинового воспаления сосудов.",
                    safetyNote = "Избегайте экстремальных строгих голоданий, так как они нагружают почки и сердце."
                )
            )
        } else if (latest.bmi >= 25.0) {
            recs.add(
                Recommendation(
                    id = "rec_weight_over",
                    userId = profile.id,
                    category = "Контроль массы тела",
                    priority = "Средний",
                    title = "Коррекция избыточного веса",
                    explanation = "Ваш ИМТ (${latest.bmi} кг/м²) отражает верхний предел нормы или избыточную массу тела. Необходимо предотвратить переход в ожирение.",
                    actionSteps = listOf(
                        "Замените колбасные и рафинированные продукты на нежирные белки и овощи.",
                        "Повышайте бытовую активность: выходите на 1 остановку раньше из транспорта, поднимайтесь пешком по лестнице."
                    ),
                    reason = "Облегчение систолической нагрузки на миокард левого желудочка.",
                    safetyNote = "Снижение веса на 5% уменьшает риск сахарного диабета наполовину."
                )
            )
        }

        // 3. Smoking
        if (profile.smokingStatus == "Курит") {
            recs.add(
                Recommendation(
                    id = "rec_smoking",
                    userId = profile.id,
                    category = "Отказ от курения",
                    priority = "Высокий",
                    title = "Снижение спазма коронарных артерий",
                    explanation = "Курение табачной продукции ускоряет темпы жесткости артерий более чем в 2.5 раза и сужает мелкие ветви.",
                    actionSteps = listOf(
                        "Подумайте об использовании никотинзаместительной терапии по назначению врача.",
                        "Следите за давлением до и после курения, чтобы оценить выраженность острого вазоспазма."
                    ),
                    reason = "Ослабление гиперактивации симпатической регуляции сосудистого тонуса.",
                    safetyNote = "Отказ от курения — самый быстрый способ сократить риск внезапного инфаркта на 50% за первый год."
                )
            )
        }

        // 4. Professional Risk / Shift Work
        if (profile.workScheduleType == "Сменная работа" || profile.workScheduleType == "Ночные смены") {
            recs.add(
                Recommendation(
                    id = "rec_shift_work",
                    userId = profile.id,
                    category = "Борьба с десинхронозом",
                    priority = "Средний",
                    title = "Протекторный режим сна при сменном труде",
                    explanation = "Сменный и ночной характер работы сбивает циркадные ритмы мелатонина и кортизола, увеличивая риск неконтролируемой гипертензии.",
                    actionSteps = listOf(
                        "Обеспечьте плотное затемнение спальни (используйте маску для сна или плотные шторы блэкаут).",
                        "Избегайте плотной соленой пищи непосредственно перед дневным сном после смены."
                    ),
                    reason = "Снижение избыточной ночной возбудимости вегетативной нервной системы.",
                    safetyNote = "При длительной упорной бессоннице рекомендуется обратиться за консультацией к сомнологу."
                )
            )
        }

        // 5. Stress Management
        if (profile.stressLevel == "Высокий" || latest.stressLevel == "Высокий") {
            recs.add(
                Recommendation(
                    id = "rec_stress",
                    userId = profile.id,
                    category = "Стресс-менеджмент",
                    priority = "Средний",
                    title = "Снижение влияния кортизоловых атак",
                    explanation = "Постоянное нервное перенапряжение и удержание внимания на стрессовых новостях повышают утреннее ЧСС и провоцируют стойкий вазоспазм.",
                    actionSteps = listOf(
                        "Внедрите ежедневные короткие 5-минутные практики дыхательного фокуса (вдох 4 сек, выдох 6 сек).",
                        "Соблюдайте четкий цифровой детокс за один час перед засыпанием.",
                        "Старайтесь проводить планирование отдыха с сохранением выходных дней без звонков по работе."
                    ),
                    reason = "Активация парасимпатики и расслабление скелетной мускулатуры грудного каркаса.",
                    safetyNote = "Психологическое благополучие — база клинического контроля давления."
                )
            )
        }

        // 6. Medication Adherence
        val currentAdherence = MedicalCalculators.calculateMedicationAdherence(_medicationLogs.value)
        if (currentAdherence < 80.0) {
            recs.add(
                Recommendation(
                    id = "rec_adherence",
                    userId = profile.id,
                    category = "Приверженность лечению",
                    priority = "Высокий",
                    title = "Восстановление регулярного приема гипотензивных средств",
                    explanation = "Ваш показатель приверженности ($currentAdherence%) находится в уязвимой зоне. Пропуски таблеток провоцируют сосудистый синдром отдачи.",
                    actionSteps = listOf(
                        "Настройте регулярный звуковой сигнал будильника CardioGuard.",
                        "Разложите таблетки в контейнер по суткам заранее на неделю вперед.",
                        "Никогда не удваивайте пропущенную дозу на следующий день во избежание резкого коллапса АД."
                    ),
                    reason = "Обеспечение постоянной терапевтической блокады ренинового или кальциевого русла.",
                    safetyNote = "Если лечение вызывает нежелательные побочные реакции, обсудите альтернативные препараты с врачом."
                )
            )
        }

        // 7. Diabetes Mellitus Management
        if (profile.diabetesStatus == "Да") {
            recs.add(
                Recommendation(
                    id = "rec_diabetes",
                    userId = profile.id,
                    category = "Эндокринологический контроль",
                    priority = "Высокий",
                    title = "Диабетическая ангиопротекция",
                    explanation = "Повышенный уровень глюкозы дестабилизирует гликокаликс сосудов, ускоряя атеросклеротические бляшки в коронарных и мозговых артериях.",
                    actionSteps = listOf(
                        "Поддерживайте уровень гликированного гемоглобина (HbA1c) в соответствии с целевыми границами вашего эндокринолога.",
                        "Регулярно (раз в год) проходите осмотр глазного дна и контроль микроальбуминурии.",
                        "Стремитесь удерживать уровень АД ниже 130/80 мм рт. ст., так как почки при диабете крайне чувствительны к давлению."
                    ),
                    reason = "Предотвращение сочетанного разрушения микрососудистого русла глюкозой и гидростатическим напором.",
                    safetyNote = "Систематический контроль сахара предупреждает диабетическую нефропатию и ретинопатию."
                )
            )
        }

        // 8. Physical Activity Level
        if (profile.physicalActivityLevel == "Низкая" || latest.physicalActivityMinutes < 20) {
            recs.add(
                Recommendation(
                    id = "rec_physical_activity",
                    userId = profile.id,
                    category = "Физическая активность",
                    priority = "Средний",
                    title = "Реабилитационные аэробные нагрузки",
                    explanation = "Уровень Вашей двигательной активности находится ниже физиологического порога (150 минут в неделю), что снижает эластичность артерий.",
                    actionSteps = listOf(
                        "Начните с ежедневной дозированной ходьбы в умеренном темпе по 25-30 минут.",
                        "Следите за пульсом перед началом и на пике нагрузки (не превышайте субмаксимальные возрастные ЧСС).",
                        "Сократите время непрерывного сидения за компьютером: делайте 5-минутную суставную разминку каждый час."
                    ),
                    reason = "Мышечные сокращения стимулируют синтез оксида азота (NO), вызывая стойкую естественную вазодилатацию.",
                    safetyNote = "При возникновении давящих или сжимающих болей за грудиной выполнение упражнений прекращают."
                )
            )
        }

        // 9. Integration Cardiovascular Risk Class
        if (selectedRiskValue >= 5.0) {
            recs.add(
                Recommendation(
                    id = "rec_high_risk_cvd",
                    userId = profile.id,
                    category = "Интегральный риск ССЗ",
                    priority = "Высокий",
                    title = "Снижение суммарной вероятности кардиоваскулярных событий",
                    explanation = "Калькулятор SCORE2/Framingham относит Ваш 10-летний прогноз к повышенной группе риска ($riskCategoryLabel - $selectedRiskValue%).",
                    actionSteps = listOf(
                        "Совместно с терапевтом обсудите необходимость старта или оптимизации липидоснижающей терапии (статины).",
                        "Пройдите дуплексное сканирование брахиоцефальных артерий для раннего обнаружения атеросклеротических бляшек.",
                        "Следите за удержанием целевого холестерина ЛПНП ниже индивидуального клинического предела."
                    ),
                    reason = "Своевременная стабилизация атеросклеротических бляшек предотвращает тромбоэмболические инфаркты и инсульты.",
                    safetyNote = "Высокий риск требует обязательной очной врачебной оценки и планирования ЭКГ с нагрузочной пробой."
                )
            )
        }

        // 10. Poor Sleep Quality & Lack of Rest
        if (profile.sleepQuality != "Хороший" || latest.sleepHours < 6.5) {
            recs.add(
                Recommendation(
                    id = "rec_sleep_hygiene",
                    userId = profile.id,
                    category = "Гигиена сна",
                    priority = "Средний",
                    title = "Оптимизация структуры и глубины сна",
                    explanation = "Ваш сон описывается как недостаточный или нарушенный (${latest.sleepHours} ч). Дефицит сна блокирует физиологическое утреннее снижение тонуса (диппинг).",
                    actionSteps = listOf(
                        "Исключите использование ярких экранов (смартфоны, планшеты) за 60 минут до укладывания.",
                        "Обеспечьте прохладный и свежий воздух в спальне (18-20°C) и полное затемнение.",
                        "Используйте ритуал засыпания в одно и то же время, включая нерабочие дни."
                    ),
                    reason = "Полноценный сон снижает гиперактивность симпатоадреналовой системы, способствуя ночному падению АД.",
                    safetyNote = "При длительной упорной бессоннице с частыми пробуждениями проконсультируйтесь с врачом-сомнологом."
                )
            )
        }

        _recommendations.value = recs
    }

    /**
     * CLINICAL EARLY WARNING ENGINE RUNNING TRIGGERS
     * Evaluates parameters dynamically to alarm patient with safety directions.
     */
    fun evaluateAlertTriggers() {
        val profile = _userProfile.value
        val history = _measurements.value
        val latest = history.firstOrNull() ?: return
        val currentAlerts = _alerts.value.toMutableList()

        // 1. Threshold Trigger: Acute High Blood Pressure (>140 or >90)
        if (latest.systolicBP >= 140 || latest.diastolicBP >= 90) {
            val alreadyHasBPAlert = currentAlerts.any { it.type == "BLOOD_PRESSURE" && !it.isRead && abs(it.date.time - Date().time) < 300000 }
            if (!alreadyHasBPAlert) {
                currentAlerts.add(0, Alert(
                    id = "al_" + System.currentTimeMillis() + "_bp",
                    userId = profile.id,
                    date = Date(),
                    type = "BLOOD_PRESSURE",
                    severity = "Внимание",
                    title = "Повышенное артериальное давление",
                    message = "Зарегистрировано значение ${_measurements.value.first().systolicBP}/${_measurements.value.first().diastolicBP} мм рт. ст. Это выше целевого терапевтического диапазона.",
                    recommendedAction = "Повторите измерение через 15 минут в расслабленном сидячем положении. Не употребляйте крепкий чай, кофе. Примите плановые гипотензивные средства, назначенные специалистом."
                ))
            }
        }

        // 2. Trend Trigger: Repeated high blood pressure (2+ readings in last 7 days)
        val last7Days = MockData.getRelativeDate(7)
        val highReadings7DaysCount = history.filter { it.date.after(last7Days) && (it.systolicBP >= 140 || it.diastolicBP >= 90) }.size
        if (highReadings7DaysCount >= 2) {
            val alreadyHasRepeatedBP = currentAlerts.any { it.type == "REPEATED_BP" && !it.isRead }
            if (!alreadyHasRepeatedBP) {
                currentAlerts.add(0, Alert(
                    id = "al_" + System.currentTimeMillis() + "_re_bp",
                    userId = profile.id,
                    date = Date(),
                    type = "REPEATED_BP",
                    severity = "Высокий приоритет",
                    title = "Повторяющаяся артериальная гипертензия",
                    message = "Зафиксировано $highReadings7DaysCount случаев повышения давления выше нормы в течение недели. Данная систематичность указывает на недостаточную стабилизацию сосудов.",
                    recommendedAction = "Рекомендуется обязательно обратиться к медицинскому специалисту для пересмотра гипотензивной схемы или дозировки базовых средств."
                ))
            }
        }

        // 3. Weight Pulse Trigger: Rapid weight gain (>= 2 kg compared to previous reading)
        if (history.size >= 2) {
            val currentW = latest.weightKg
            val previousW = history[1].weightKg
            val diff = currentW - previousW
            if (diff >= 2.0) {
                val hasWeightAlert = currentAlerts.any { it.type == "RAPID_WEIGHT" && !it.isRead }
                if (!hasWeightAlert) {
                    currentAlerts.add(0, Alert(
                        id = "al_" + System.currentTimeMillis() + "_w",
                        userId = profile.id,
                        date = Date(),
                        type = "RAPID_WEIGHT",
                        severity = "Внимание",
                        title = "Быстрый прирост массы тела (+${diff} кг)",
                        message = "Вес вырос быстрыми темпами на ${String.format("%.1f", diff)} кг. Такой подъем за короткий промежуток времени может свидетельствовать о задержке жидкости в организме.",
                        recommendedAction = "Обратите внимание на появление отеков на лодыжках или голенях. Контролируйте суточное количество выпитой и выделенной жидкости, максимально ограничьте соль."
                    ))
                }
            }
        }

        // 4. BMI Category Worsening (Worsened comparing to older records)
        if (history.size >= 2) {
            val currentBMI = latest.bmi
            val previousBMI = history.last().bmi // baseline or older reading
            val curCategory = MedicalCalculators.classifyBMI(currentBMI)
            val prevCategory = MedicalCalculators.classifyBMI(previousBMI)
            if (curCategory != prevCategory && currentBMI > previousBMI) {
                val hasBmiAlert = currentAlerts.any { it.type == "BMI_WORSENING" && !it.isRead }
                if (!hasBmiAlert) {
                    currentAlerts.add(0, Alert(
                        id = "al_" + System.currentTimeMillis() + "_bmi",
                        userId = profile.id,
                        date = Date(),
                        type = "BMI_WORSENING",
                        severity = "Информация",
                        title = "Изменение весовой классификации",
                        message = "Ваша категория массы переместилась на уровень: '$curCategory' (ранее была '$prevCategory'). Это увеличивает гемодинамическое сопротивление системного кровотока.",
                        recommendedAction = "Рекомендуется проанализировать суточный калораж питания, исключить полуфабрикаты и расширить активность до умеренной ходьбы."
                    ))
                }
            }
        }

        // 5. Adherence Low Trigger (Adherence below 70%)
        val adherenceVal = MedicalCalculators.calculateMedicationAdherence(_medicationLogs.value)
        if (adherenceVal < 70.0) {
            val hasLpAlert = currentAlerts.any { it.type == "LOW_ADHERENCE" && !it.isRead }
            if (!hasLpAlert) {
                currentAlerts.add(0, Alert(
                    id = "al_" + System.currentTimeMillis() + "_low_ad",
                    userId = profile.id,
                    date = Date(),
                    type = "LOW_ADHERENCE",
                    severity = "Высокий приоритет",
                    title = "Критически низкая комплаентность",
                    message = "Текущий процент приверженности лечению составляет всего $adherenceVal%. Систематический пропуск таблеток создает смертельную опасность инсультов.",
                    recommendedAction = "Пожалуйста, свяжитесь с близкими для патронажной помощи в приеме таблеток или немедленно проконсультируйтесь с лечащим кардиологом."
                ))
            }
        }

        // 5b. Repetitive Misses Alert (2+ missed/skipped doses in last 7 days)
        val missedCount = _medicationLogs.value.count { it.status == "Пропущено" || it.status == "Пропущено осознанно" }
        if (missedCount >= 2) {
            val hasMisses = currentAlerts.any { it.type == "MEDICATION_ADHERENCE" && !it.isRead }
            if (!hasMisses) {
                currentAlerts.add(0, Alert(
                    id = "al_" + System.currentTimeMillis() + "_misses",
                    userId = profile.id,
                    date = Date(),
                    type = "MEDICATION_ADHERENCE",
                    severity = "Внимание",
                    title = "Множественные пропуски препаратов",
                    message = "Зарегистрировано $missedCount случаев пропуска или осознанного отказа от приема лекарств за отчетный период.",
                    recommendedAction = "Постарайтесь восстановить дисциплину лечения. При плохой субъективной переносимости лекарств обратитесь к кардиологу для замены формулы на другие группы."
                ))
            }
        }

        // 6. High CVD Risk Assessment Trigger
        val currentRiskVal = _currentRisk.value
        if (currentRiskVal != null && (currentRiskVal.category == "Высокий" || currentRiskVal.category == "Очень высокий")) {
            val hasRiskAlert = currentAlerts.any { it.type == "HIGH_CVD_RISK" && !it.isRead }
            if (!hasRiskAlert) {
                currentAlerts.add(0, Alert(
                    id = "al_" + System.currentTimeMillis() + "_cvd",
                    userId = profile.id,
                    date = Date(),
                    type = "HIGH_CVD_RISK",
                    severity = "Высокий приоритет",
                    title = "Критический уровень сердечно-сосудистого риска",
                    message = "Показатель Вашего профилактического 10-летнего риска находится в высокой/очень высокой клинической группе (${currentRiskVal.estimatedRiskPercent}%).",
                    recommendedAction = "Данный уровень риска требует детального клинического обследования, включающего УЗИ сонных артерий для оценки атеросклеротических бляшек и ЭКГ."
                ))
            }
        }

        // 7. No Measurements for 7+ Days Trigger
        val sevenDaysMs = 7 * 24 * 60 * 60 * 1000L
        val elapsed = Date().time - latest.date.time
        if (elapsed > sevenDaysMs) {
            val hasNoMeasAlert = currentAlerts.any { it.type == "NO_MEASUREMENTS" && !it.isRead }
            if (!hasNoMeasAlert) {
                currentAlerts.add(0, Alert(
                    id = "al_" + System.currentTimeMillis() + "_no_meas",
                    userId = profile.id,
                    date = Date(),
                    type = "NO_MEASUREMENTS",
                    severity = "Внимание",
                    title = "Регулярный самоконтроль приостановлен",
                    message = "В базе данных отсутствует пульсовое или систолическое давление за последние 7 дней. Систематические замеры критически важны для подбора дозировок.",
                    recommendedAction = "Пожалуйста, выполните замер уровня давления в покое прямо сейчас и внесите его клавишей «Добавить замер»."
                ))
            }
        }

        _alerts.value = currentAlerts
    }

    // Helper functions for testing or re-filling defaults
    fun resetToDefaults() {
        _userProfile.value = MockData.primaryUser
        _measurements.value = MockData.initialMeasurements
        _medications.value = MockData.initialMedications
        _medicationLogs.value = MockData.initialMedicationLogs
        _alerts.value = MockData.initialAlerts
        updateRiskAndRecommendations()
    }
}
