package com.example.data

import java.util.Date

/**
 * UserProfile represents the core clinical and socio-occupational metrics of the individual.
 * Prototype only. Requires clinical validation.
 */
data class UserProfile(
    val id: String,
    val anonymizedId: String,
    val fullName: String,
    val age: Int,
    val sex: String, // "Мужской", "Женский"
    val heightCm: Double,
    val weightKg: Double,
    val waistCircumferenceCm: Double,
    val smokingStatus: String, // "Никогда не курил", "Ранее курил", "Курит"
    val diabetesStatus: String, // "Да", "Нет", "Неизвестно"
    val hypertensionStatus: String, // "Да", "Нет", "Неизвестно"
    val onHypertensiveMedication: Boolean,
    val familyHistoryCVD: String, // "Да", "Нет", "Неизвестно"
    val workScheduleType: String, // "Обычный график", "Сменная работа", "Ночные смены"
    val professionalRiskGroup: String, // "Гражданские лица", "Силовые ведомства", "Военная служба", "Другое"
    val physicalActivityLevel: String, // "Низкая", "Средняя", "Высокая"
    val sleepQuality: String, // "Хороший", "Нарушенный", "Недостаточный"
    val stressLevel: String, // "Низкий", "Средний", "Высокий"
    val createdAt: Date = Date(),
    val updatedAt: Date = Date()
)

/**
 * HealthMeasurement holds self-monitoring tracking parameters like BP, HR, BMI, etc.
 */
data class HealthMeasurement(
    val id: String,
    val userId: String,
    val date: Date,
    val systolicBP: Int,
    val diastolicBP: Int,
    val heartRate: Int,
    val weightKg: Double,
    val bmi: Double,
    val waistCircumferenceCm: Double,
    val sleepHours: Double,
    val stressLevel: String, // "Низкий", "Средний", "Высокий"
    val physicalActivityMinutes: Int,
    val notes: String
)

/**
 * Medication represents prescribed cardiometabolic medications.
 */
data class Medication(
    val id: String,
    val userId: String,
    val name: String,
    val dosage: String,
    val frequency: String, // e.g. "1 раз в день", "2 раза в день"
    val intakeTimes: List<String>, // List of times like "08:00", "20:00"
    val startDate: Date,
    val endDate: Date?,
    val instructions: String,
    val isActive: Boolean = true
)

/**
 * MedicationLog represents individual pill intake logs.
 */
data class MedicationLog(
    val id: String,
    val medicationId: String,
    val userId: String,
    val scheduledTime: String,
    val actualTime: Date?,
    val status: String, // "Принято", "Пропущено", "Пропущено осознанно"
    val note: String = ""
)

/**
 * RiskAssessment represents calculated cardiovascular risk levels using SCORE2 or Framingham models.
 * Prototype only. Requires clinical validation.
 */
data class RiskAssessment(
    val id: String,
    val userId: String,
    val date: Date,
    val model: String, // "SCORE2_PROTOTYPE", "FRAMINGHAM_PROTOTYPE"
    val estimatedRiskPercent: Double,
    val category: String, // "Низкий", "Умеренный", "Высокий", "Очень высокий"
    val factors: List<String>,
    val explanation: String,
    val disclaimer: String
)

/**
 * Recommendation represents evidence-based personalized preventive instructions.
 */
data class Recommendation(
    val id: String,
    val userId: String,
    val category: String, // "Питание при АГ", "Контроль массы тела", "Физическая активность", "Сон и сменная работа", "Стресс-менеджмент", "Контроль АД", "Приверженность лечению", "Отказ от курения", "Метаболический синдром"
    val priority: String, // "Низкий", "Средний", "Высокий"
    val title: String,
    val explanation: String,
    val actionSteps: List<String>,
    val reason: String,
    val safetyNote: String
)

/**
 * Alert represents triggered clinical alarms / notifications for early warning.
 */
data class Alert(
    val id: String,
    val userId: String,
    val date: Date,
    val type: String, // "BLOOD_PRESSURE", "RAPID_WEIGHT", "BMI_WORSENING", "MEDICATION_ADHERENCE", "HIGH_CVD_RISK", "INACTIVITY", "NO_MEASUREMENTS"
    val severity: String, // "Информация", "Внимание", "Высокий приоритет"
    val title: String,
    val message: String,
    val recommendedAction: String,
    val isRead: Boolean = false
)

/**
 * EducationArticle holds medical evidence material for patient and researcher references.
 */
data class EducationArticle(
    val id: String,
    val category: String,
    val title: String,
    val summary: String,
    val readingTime: Int, // in minutes
    val content: String,
    val keyPoints: List<String>,
    val medicalDisclaimer: String
)
