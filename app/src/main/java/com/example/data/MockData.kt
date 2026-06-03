package com.example.data

import java.util.Calendar
import java.util.Date

object MockData {

    // Helper to get relative dates
    fun getRelativeDate(daysAgo: Int, hour: Int = 8, minute: Int = 0): Date {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -daysAgo)
        cal.set(Calendar.HOUR_OF_DAY, hour)
        cal.set(Calendar.MINUTE, minute)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.time
    }

    /**
     * Primary demonstrative patient representing a classic CardioGuard monitor record.
     */
    val primaryUser = UserProfile(
        id = "user_01",
        anonymizedId = "CG-9052-A",
        fullName = "Алексей Соловьев",
        age = 52,
        sex = "Мужской",
        heightCm = 176.0,
        weightKg = 91.5,
        waistCircumferenceCm = 104.0,
        smokingStatus = "Курит",
        diabetesStatus = "Нет",
        hypertensionStatus = "Да",
        onHypertensiveMedication = true,
        familyHistoryCVD = "Да",
        workScheduleType = "Сменная работа",
        professionalRiskGroup = "Силовые ведомства",
        physicalActivityLevel = "Низкая",
        sleepQuality = "Нарушенный",
        stressLevel = "Высокий",
        createdAt = getRelativeDate(30),
        updatedAt = getRelativeDate(0)
    )

    /**
     * Set of health self-monitoring parameters collected over the past 14 days.
     * Starts with highly elevated values and stabilizes as medication logs reflect adherence.
     */
    val initialMeasurements = listOf(
        HealthMeasurement(
            id = "m_14",
            userId = "user_01",
            date = getRelativeDate(14, 8, 30),
            systolicBP = 152,
            diastolicBP = 94,
            heartRate = 82,
            weightKg = 92.8,
            bmi = 30.0,
            waistCircumferenceCm = 105.0,
            sleepHours = 5.5,
            stressLevel = "Высокий",
            physicalActivityMinutes = 10,
            notes = "После ночной смены, сильная утомляемость"
        ),
        HealthMeasurement(
            id = "m_12",
            userId = "user_01",
            date = getRelativeDate(12, 19, 0),
            systolicBP = 148,
            diastolicBP = 92,
            heartRate = 78,
            weightKg = 92.4,
            bmi = 29.8,
            waistCircumferenceCm = 105.0,
            sleepHours = 6.0,
            stressLevel = "Средний",
            physicalActivityMinutes = 0,
            notes = "Головная боль в затылке"
        ),
        HealthMeasurement(
            id = "m_10",
            userId = "user_01",
            date = getRelativeDate(10, 8, 0),
            systolicBP = 145,
            diastolicBP = 88,
            heartRate = 75,
            weightKg = 92.0,
            bmi = 29.7,
            waistCircumferenceCm = 104.5,
            sleepHours = 7.0,
            stressLevel = "Низкий",
            physicalActivityMinutes = 20,
            notes = "Выходной, самочувствие удовлетворительное"
        ),
        HealthMeasurement(
            id = "m_8",
            userId = "user_01",
            date = getRelativeDate(8, 20, 30),
            systolicBP = 150,
            diastolicBP = 95,
            heartRate = 85,
            weightKg = 92.2,
            bmi = 29.8,
            waistCircumferenceCm = 104.0,
            sleepHours = 5.0,
            stressLevel = "Высокий",
            physicalActivityMinutes = 15,
            notes = "Высокое психоэмоциональное напряжение по службе"
        ),
        HealthMeasurement(
            id = "m_6",
            userId = "user_01",
            date = getRelativeDate(6, 8, 15),
            systolicBP = 142,
            diastolicBP = 90,
            heartRate = 74,
            weightKg = 91.8,
            bmi = 29.6,
            waistCircumferenceCm = 104.0,
            sleepHours = 7.5,
            stressLevel = "Средний",
            physicalActivityMinutes = 30,
            notes = "Начало стабилизации режима питания, ходьба"
        ),
        HealthMeasurement(
            id = "m_4",
            userId = "user_01",
            date = getRelativeDate(4, 9, 0),
            systolicBP = 138,
            diastolicBP = 87,
            heartRate = 72,
            weightKg = 91.6,
            bmi = 29.6,
            waistCircumferenceCm = 104.0,
            sleepHours = 6.8,
            stressLevel = "Низкий",
            physicalActivityMinutes = 25,
            notes = "Давление нормализуется на фоне регулярного приема АПФ"
        ),
        HealthMeasurement(
            id = "m_2",
            userId = "user_01",
            date = getRelativeDate(2, 8, 30),
            systolicBP = 135,
            diastolicBP = 85,
            heartRate = 71,
            weightKg = 91.5,
            bmi = 29.5,
            waistCircumferenceCm = 104.0,
            sleepHours = 6.2,
            stressLevel = "Средний",
            physicalActivityMinutes = 40,
            notes = "Пешая прогулка 4 км, самочувствие хорошее"
        ),
        HealthMeasurement(
            id = "m_0",
            userId = "user_01",
            date = getRelativeDate(0, 8, 0),
            systolicBP = 134,
            diastolicBP = 84,
            heartRate = 69,
            weightKg = 91.5,
            bmi = 29.5,
            waistCircumferenceCm = 104.0,
            sleepHours = 7.0,
            stressLevel = "Низкий",
            physicalActivityMinutes = 30,
            notes = "Контрольное утреннее измерение. Субъективно здоров"
        )
    )

    /**
     * Prescribed anti-hypertensive combination therapy for hypertension stage 2.
     */
    val initialMedications = listOf(
        Medication(
            id = "med_01",
            userId = "user_01",
            name = "Периндоприл",
            dosage = "10 мг",
            frequency = "1 раз в день",
            intakeTimes = listOf("08:00"),
            startDate = getRelativeDate(30),
            endDate = null,
            instructions = "Принимать утром натощак за 15 минут до еды.",
            isActive = true
        ),
        Medication(
            id = "med_02",
            userId = "user_01",
            name = "Амлодипин",
            dosage = "5 мг",
            frequency = "1 раз в день",
            intakeTimes = listOf("20:00"),
            startDate = getRelativeDate(30),
            endDate = null,
            instructions = "Принимать вечером вне зависимости от приема пищи.",
            isActive = true
        )
    )

    /**
     * Generate daily medication intake log diary for the last 7 days.
     */
    val initialMedicationLogs = mutableListOf<MedicationLog>().apply {
        for (day in 1..7) {
            val date = getRelativeDate(day)
            // LISINOPRIL morning doses
            // Simulate 1 miss on day 5 and 1 skip on day 2
            val isMorningTaken = day != 5 && day != 2
            add(
                MedicationLog(
                    id = "log_med_01_$day",
                    medicationId = "med_01",
                    userId = "user_01",
                    scheduledTime = "08:00",
                    actualTime = if (isMorningTaken) getRelativeDate(day, 8, 15) else null,
                    status = if (isMorningTaken) "Принято" else if (day == 2) "Пропущено осознанно" else "Пропущено",
                    note = if (day == 2) "Забыл дома во время суточного дежурства" else ""
                )
            )

            // AMLODIPINE evening doses
            // Simulate 1 miss on day 4
            val isEveningTaken = day != 4
            add(
                MedicationLog(
                    id = "log_med_02_$day",
                    medicationId = "med_02",
                    userId = "user_01",
                    scheduledTime = "20:00",
                    actualTime = if (isEveningTaken) getRelativeDate(day, 20, 10) else null,
                    status = if (isEveningTaken) "Принято" else "Пропущено",
                    note = ""
                )
            )
        }
    }

    /**
     * Early Warning alerts base logs.
     */
    val initialAlerts = listOf(
        Alert(
            id = "alert_01",
            userId = "user_01",
            date = getRelativeDate(14),
            type = "BLOOD_PRESSURE",
            severity = "Высокий приоритет",
            title = "Артериальная гипертензия 2 степени",
            message = "Последние измерения фиксируют САД выше 150 мм рт. ст. Риск гипертонического криза повышен.",
            recommendedAction = "Рекомендуется принять плановые препараты, исключить физические нагрузки, измерить АД повторно через 30 минут. При сохранении симптомов вызвать врача.",
            isRead = false
        ),
        Alert(
            id = "alert_02",
            userId = "user_01",
            date = getRelativeDate(8),
            type = "MEDICATION_ADHERENCE",
            severity = "Внимание",
            title = "Пропуски приёма препаратов (Периндоприл)",
            message = "Зафиксирован повторный пропуск утренней дозы ингибитора АПФ.",
            recommendedAction = "Постарайтесь использовать персональный будильник или контейнер-органайзер. Пропуски гипотензивного лечения критически дестабилизируют тонус сосудов.",
            isRead = false
        ),
        Alert(
            id = "alert_03",
            userId = "user_01",
            date = getRelativeDate(2),
            type = "BMI_WORSENING",
            severity = "Информация",
            title = "Переход в категорию избыточного веса",
            message = "ИМТ составляет 29.5 кг/м² (Окружность талии 104 см). Фиксируется абдоминальное отложение жира.",
            recommendedAction = "Обратите внимание на снижение потребления поваренной соли (до 5 г/сут) и введите регулярную дозированную ходьбу по 30-40 минут в день.",
            isRead = true
        )
    )

    /**
     * Research pool datasets of other anonymized patients for dissertation doctor view demonstration.
     * Ensure we show that we protect clinical privacy by hiding full names.
     */
    val researcherUsers = listOf(
        UserProfile(
            id = "user_101",
            anonymizedId = "CG-8120-X",
            fullName = "Пациент 8120",
            age = 44,
            sex = "Мужской",
            heightCm = 182.0,
            weightKg = 98.4,
            waistCircumferenceCm = 108.0,
            smokingStatus = "Курит",
            diabetesStatus = "Да",
            hypertensionStatus = "Да",
            onHypertensiveMedication = true,
            familyHistoryCVD = "Да",
            workScheduleType = "Ночные смены",
            professionalRiskGroup = "Силовые ведомства",
            physicalActivityLevel = "Низкая",
            sleepQuality = "Недостаточный",
            stressLevel = "Высокий",
            createdAt = getRelativeDate(60),
            updatedAt = getRelativeDate(1)
        ),
        UserProfile(
            id = "user_102",
            anonymizedId = "CG-3011-B",
            fullName = "Пациент 3011",
            age = 61,
            sex = "Женский",
            heightCm = 162.0,
            weightKg = 74.0,
            waistCircumferenceCm = 92.0,
            smokingStatus = "Никогда не курил",
            diabetesStatus = "Нет",
            hypertensionStatus = "Да",
            onHypertensiveMedication = true,
            familyHistoryCVD = "Нет",
            workScheduleType = "Обычный график",
            professionalRiskGroup = "Гражданские лица",
            physicalActivityLevel = "Средняя",
            sleepQuality = "Хороший",
            stressLevel = "Средний",
            createdAt = getRelativeDate(90),
            updatedAt = getRelativeDate(0)
        ),
        UserProfile(
            id = "user_103",
            anonymizedId = "CG-4491-C",
            fullName = "Пациент 4491",
            age = 37,
            sex = "Мужской",
            heightCm = 178.0,
            weightKg = 82.0,
            waistCircumferenceCm = 89.0,
            smokingStatus = "Никогда не курил",
            diabetesStatus = "Нет",
            hypertensionStatus = "Нет",
            onHypertensiveMedication = false,
            familyHistoryCVD = "Нет",
            workScheduleType = "Обычный график",
            professionalRiskGroup = "Гражданские лица",
            physicalActivityLevel = "Высокая",
            sleepQuality = "Хороший",
            stressLevel = "Низкий",
            createdAt = getRelativeDate(14),
            updatedAt = getRelativeDate(0)
        ),
        UserProfile(
            id = "user_104",
            anonymizedId = "CG-5014-M",
            fullName = "Пациент 5014",
            age = 56,
            sex = "Мужской",
            heightCm = 172.0,
            weightKg = 87.2,
            waistCircumferenceCm = 99.0,
            smokingStatus = "Ранее курил",
            diabetesStatus = "Нет",
            hypertensionStatus = "Да",
            onHypertensiveMedication = true,
            familyHistoryCVD = "Да",
            workScheduleType = "Сменная работа",
            professionalRiskGroup = "Военная служба",
            physicalActivityLevel = "Средняя",
            sleepQuality = "Нарушенный",
            stressLevel = "Высокий",
            createdAt = getRelativeDate(45),
            updatedAt = getRelativeDate(2)
        ),
        UserProfile(
            id = "user_105",
            anonymizedId = "CG-7212-D",
            fullName = "Пациент 7212",
            age = 65,
            sex = "Женский",
            heightCm = 158.0,
            weightKg = 88.0,
            waistCircumferenceCm = 102.0,
            smokingStatus = "Никогда не курил",
            diabetesStatus = "Да",
            hypertensionStatus = "Да",
            onHypertensiveMedication = true,
            familyHistoryCVD = "Да",
            workScheduleType = "Обычный график",
            professionalRiskGroup = "Другое",
            physicalActivityLevel = "Низкая",
            sleepQuality = "Нарушенный",
            stressLevel = "Средний",
            createdAt = getRelativeDate(120),
            updatedAt = getRelativeDate(1)
        )
    )

    /**
     * Research groups aggregate history mock measurements
     */
    val researchMeasurements = listOf(
        // Patient 101: high stress, diabetes, night shifts
        HealthMeasurement("p101_m1", "user_101", getRelativeDate(3), 162, 101, 86, 98.4, 29.7, 108.0, 4.5, "Высокий", 10, "После ночной смены"),
        HealthMeasurement("p101_m2", "user_101", getRelativeDate(0), 158, 98, 82, 98.1, 29.6, 108.0, 5.0, "Высокий", 15, "Суточная нагрузка"),
        
        // Patient 102: classic moderate risk female
        HealthMeasurement("p102_m1", "user_102", getRelativeDate(2), 136, 84, 72, 74.0, 28.2, 92.0, 7.5, "Средний", 30, "Чувствует себя обычно"),
        HealthMeasurement("p102_m2", "user_102", getRelativeDate(0), 134, 82, 70, 73.8, 28.1, 92.0, 7.0, "Низкий", 35, ""),

        // Patient 103: fully healthy civilian athlete
        HealthMeasurement("p103_m1", "user_103", getRelativeDate(5), 118, 76, 62, 82.0, 25.9, 89.0, 8.0, "Низкий", 60, "Регулярный бег"),
        HealthMeasurement("p103_m2", "user_103", getRelativeDate(0), 116, 74, 60, 81.8, 25.8, 89.0, 8.0, "Низкий", 50, "Отличная форма"),

        // Patient 104: military officer, shift work status
        HealthMeasurement("p104_m1", "user_104", getRelativeDate(4), 146, 92, 79, 87.5, 29.6, 99.0, 6.0, "Высокий", 20, "На полигоне"),
        HealthMeasurement("p104_m2", "user_104", getRelativeDate(0), 142, 88, 76, 87.2, 29.5, 99.0, 6.5, "Средний", 30, "После сна в казарме"),

        // Patient 105: elderly female, diabetes
        HealthMeasurement("p105_m1", "user_105", getRelativeDate(3), 148, 89, 74, 88.3, 35.3, 102.0, 6.5, "Средний", 20, "Отеки голеней вечером"),
        HealthMeasurement("p105_m2", "user_105", getRelativeDate(0), 144, 86, 73, 88.0, 35.2, 102.0, 6.8, "Средний", 15, "")
    )

    /**
     * Group baseline parameters to showcase aggregate analyses.
     */
    val researchMedications = listOf(
        Medication("rm_1", "user_101", "Валсартан", "160 мг", "1 раз в день", listOf("08:00"), getRelativeDate(60), null, "Утром"),
        Medication("rm_2", "user_101", "Метформин", "1000 мг", "2 раза в день", listOf("09:00", "21:00"), getRelativeDate(60), null, "Во время еды"),
        Medication("rm_3", "user_102", "Индапамид", "1.5 мг", "1 раз в день", listOf("08:00"), getRelativeDate(90), null, "Утром"),
        Medication("rm_4", "user_104", "Лозартан", "50 мг", "1 раз в день", listOf("20:00"), getRelativeDate(45), null, "Вечером"),
        Medication("rm_5", "user_105", "Метформин", "500 мг", "2 раза в день", listOf("10:00", "20:00"), getRelativeDate(120), null, "После еды")
    )

    val researchMedicationLogs = listOf(
        MedicationLog("rl_1", "rm_1", "user_101", "08:00", getRelativeDate(1, 8, 30), "Принято"),
        MedicationLog("rl_2", "rm_2", "user_101", "09:00", getRelativeDate(1, 9, 30), "Принято"),
        MedicationLog("rl_3", "rm_3", "user_102", "08:00", getRelativeDate(1, 8, 0), "Принято"),
        MedicationLog("rl_4", "rm_4", "user_104", "20:00", null, "Пропущено"),
        MedicationLog("rl_5", "rm_5", "user_105", "10:00", getRelativeDate(1, 10, 15), "Принято")
    )

    /**
     * Evidence-based medical bibliography library compiled for patients.
     */
    val educationArticles = listOf(
        EducationArticle(
            id = "art_01",
            category = "Сердечно-сосудистые заболевания",
            title = "Профилактика ССЗ: принципы доказательной медицины",
            summary = "Каким образом современная кардиология предлагает предупреждать инфаркты и инсульты на этапах доклинических изменений.",
            readingTime = 6,
            content = "Сердечно-сосудистые заболевания (ССЗ) остаются ведущей причиной заболеваемости во всем мире. Доказательная кардиология утверждает: до 80% преждевременных сосудистых катастроф можно предотвратить с помощью своевременной коррекции модифицируемых факторов риска.\n\n" +
                      "Ключевыми модифицируемыми факторами являются артериальная гипертензия, избыточная масса тела (особенно абдоминальное ожирение), курение, высокий уровень холестерина ЛПНП, сахарный диабет, гиподинамия и хронический профессиональный стресс.\n\n" +
                      "Внедрение персонализированного цифрового мониторинга позволяет пациенту в тесном партнерстве с терапевтом увидеть реальный профиль своего здоровья, выявить дестабилизацию АД на раннем этапе и контролировать приверженность назначенной фармакотерапии.",
            keyPoints = listOf(
                "До 80% сосудистых инцидентов предотвратимы через коррекцию образа жизни и контроль давления.",
                "Своевременный старт антигипертензивной терапии снижает вероятность инсульта на 40%.",
                "Медицинский самоконтроль усиливает вовлеченность пациента и повышает безопасность лечения."
            ),
            medicalDisclaimer = "Материал носит ознакомительный характер. Решения об изменении в схеме лечения принимает исключительно лечащий врач."
        ),
        EducationArticle(
            id = "art_02",
            category = "Артериальная гипертензия",
            title = "Артериальная гипертензия: скрытый враг сосудов",
            summary = "Почему высокое давление разрушает мелкие артерии органов-мишеней и как правильно осуществлять домашнее измерение АД.",
            readingTime = 5,
            content = "Артериальную гипертензию (АГ) часто называют «тихим убийцей», поскольку годами она может протекать бессимптомно, подспудно разрушая сосудистое русло.\n\n" +
                      "При хронически повышенном давлении стенки артерий теряют эластичность, подвергаются микроповреждениям и атеросклеротическому ремоделированию. Наиболее уязвимыми «органами-мишенями» являются головной мозг, сердце, почки и сетчатка глаз.\n\n" +
                      "Правила точного измерения АД в домашних условиях:\n" +
                      "1. Исключите физическую активность, кофеин и курение за 30 минут.\n" +
                      "2. Проводите измерение сидя, с опорой для спины и руки, манжета на уровне сердца.\n" +
                      "3. Сохраняйте полное молчание и покой в процессе замера.\n" +
                      "4. Желательно выполнить 2 замера с интервалом в 2 минуты и зафиксировать среднее значение.",
            keyPoints = listOf(
                "Целевое давление у большинства пациентов должно быть ниже 130/80 мм рт. ст.",
                "Повышение систолического АД даже на 20 мм рт. ст. удваивает сердечно-сосудистую смертность.",
                "Домашние измерения АД позволяют избежать эффекта «белого халата»."
            ),
            medicalDisclaimer = "Результаты домашних замеров АД обязательно должны быть обсуждены со специалистом."
        ),
        EducationArticle(
            id = "art_03",
            category = "Приверженность лечению",
            title = "Приверженность фармакотерапии: почему нельзя пропускать таблетки",
            summary = "Понятие комплаентности и физиологические риски прерывистого приема антигипертензивных препаратов.",
            readingTime = 4,
            content = "Многие пациенты с удивлением узнают, что эффективность самого лучшего кардиологического препарата равняется нулю, если таблетка осталась в блистере. Приверженность лечению (комплаентность) — ключевой фактор прогноза при гипертонии.\n\n" +
                      "Современные гипотензивные средства рассчитаны на стабильное 24-часовое поддержание терапевтической концентрации в сыворотке крови. При пропуске очередной дозы запускается компенсаторное сужение сосудов (реакция отскока), что выливается в резкие скачки давления.\n\n" +
                      "Именно перепады и суточные волны АД вызывают перегрузку левого желудочка сердца и создают сдвиговую деформацию на атеросклеротических бляшках, способную спровоцировать их разрыв с образованием тромба.",
            keyPoints = listOf(
                "Регулярность — главный закон антигипертензивного лечения.",
                "Прерывистый прием таблеток опаснее полного отсутствия терапии из-за сосудистых перепадов.",
                "Использование напоминаний и цифровых дневников повышает терапевтический комплаенс на 35-50%."
            ),
            medicalDisclaimer = "Самостоятельное прерывание или коррекция курса дозирования угрожает развитием фатальных кризов."
        ),
        EducationArticle(
            id = "art_04",
            category = "Сон и сменная работа",
            title = "Кардиометаболический риск при сменной работе",
            summary = "Как десинхроноз биоритмов влияет на симпатическую нервную систему и жесткость сосудистой стенки.",
            readingTime = 6,
            content = "У людей с ненормированным рабочим графиком, частыми суточными или ночными дежурствами сбиваются циркадные ритмы сон-бодрствование. Это приводит к развитию хронического десинхроноза.\n\n" +
                      "Физиологически ночное бодрствование подавляет секрецию мелатонина и активирует симпатоадреналовую систему. Гормоны стресса (адреналин и кортизол) вырабатываются в избытке, удерживая сосуды в спазмированном состоянии и повышая частоту сердечных сокращений во время предполагаемого ночного отдыха.\n\n" +
                      "Со временем десинхроноз провоцирует лептинорезистентность и нарушение толерантности к углеводам, ускоряя метаболический синдром и прибавку веса. Лицам со сменной работой критически необходимы жесткая световая гигиена, компенсаторный сон и минимизация поваренной соли.",
            keyPoints = listOf(
                "Сменная работа повышает риск ишемической болезни сердца на 23%.",
                "Медицинские осмотры в группах профессионального риска должны включать суточное мониторирование АД.",
                "Светоизолирующие шторы после дежурства облегчают физиологическое восстановление мелатонина."
            ),
            medicalDisclaimer = "Данные приведены для оптимизации гигиены труда и предупреждения рисков у уязвимых категорий трудящихся."
        ),
        EducationArticle(
            id = "art_05",
            category = "Метаболический синдром",
            title = "Что такое метаболический синдром и абдоминальный жир",
            summary = "Роль окружности талии и висцеральной жировой ткани в системном воспалении и инсулинорезистентности.",
            readingTime = 5,
            content = "Метаболический синдром (МС) — это симптомокомплекс, сочетающий абдоминальное ожирение, инсулинорезистентность, дислипидемию и артериальную гипертонию.\n\n" +
                      "Основным маркером служит избыточная окружность талии (у мужчин >94 см, у женщин >80 см). Висцеральный жир, окружающий внутренние органы брюшной полости, метаболически крайне активен. В отличие от подкожного жира, он секретирует провоспалительные цитокины (ИЛ-6, ФНО-альфа), которые вызывают системное субклиническое воспаление.\n\n" +
                      "Кровь, дренирующая висцеральное депо, устремляется напрямую в воротную вену печени, насыщая ее свободными жирными кислотами, что блокирует инсулиновые рецепторы и ускоряет атеросклероз.",
            keyPoints = listOf(
                "Окружность талии — более точный предсказатель сосудистых осложнений, чем обычный вес.",
                "Метаболический синдром в 5 раз повышает шансы развития диабета 2 типа.",
                "Снижение окружности талии хотя бы на 4 см существенно отодвигает риски сосудистого старения."
            ),
            medicalDisclaimer = "Диагностические критерии синдрома требуют проверки углеводного и липидного профилей в аккредитованных лабораториях."
        )
    )
}
