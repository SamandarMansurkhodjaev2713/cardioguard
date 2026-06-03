package com.example.utils

import com.example.data.UserProfile
import com.example.data.HealthMeasurement
import com.example.data.MedicationLog
import com.example.data.Alert
import com.example.data.Recommendation
import java.util.Date
import kotlin.math.roundToInt

object MedicalCalculators {

    /**
     * Calculates Body Mass Index (BMI).
     * Formula: BMI = weightKg / (heightM * heightM)
     */
    fun calculateBMI(weightKg: Double, heightCm: Double): Double {
        if (heightCm <= 0.0) return 0.0
        val heightM = heightCm / 100.0
        val bmi = weightKg / (heightM * heightM)
        return (bmi * 10.0).roundToInt() / 10.0
    }

    /**
     * Interprets BMI status based on WHO criteria.
     */
    fun classifyBMI(bmi: Double): String {
        return when {
            bmi < 18.5 -> "Недостаточная масса тела"
            bmi in 18.5..24.9 -> "Нормальная масса тела"
            bmi in 25.0..29.9 -> "Избыточная масса тела"
            else -> "Ожирение"
        }
    }

    /**
     * Classified Blood Pressure based on international recommendations.
     * Disclaimer: This is a simplified clinical prototype.
     */
    fun classifyBloodPressure(systolic: Int, diastolic: Int): String {
        return when {
            systolic < 120 && diastolic < 80 -> "Оптимальное АД"
            systolic in 120..129 || diastolic in 80..84 -> "Нормальное АД"
            systolic in 130..139 || diastolic in 85..89 -> "Высокое нормальное АД"
            systolic in 140..159 || diastolic in 90..99 -> "Артериальная гипертензия 1 степени"
            systolic in 160..179 || diastolic in 100..109 -> "Артериальная гипертензия 2 степени"
            else -> "Артериальная гипертензия 3 степени (тяжёлая)"
        }
    }

    /**
     * Calculates medication adherence percent from intake logs.
     * adherencePercent = takenDoses / scheduledDoses * 100
     */
    fun calculateMedicationAdherence(logs: List<MedicationLog>): Double {
        if (logs.isEmpty()) return 100.0
        val taken = logs.count { it.status == "Принято" }
        val pct = (taken.toDouble() / logs.size.toDouble()) * 100.0
        return (pct * 10.0).roundToInt() / 10.0
    }

    /**
     * SCORE2 Prototype Cardiovascular Risk Calculation (10-year risk of fatal/nonfatal CVD events)
     * Prototype only. Requires clinical validation before real clinical use.
     */
    fun calculatePrototypeScore2Risk(
        profile: UserProfile,
        systolicBP: Int,
        totalChol: Double, // in mmol/L
        hdlChol: Double // in mmol/L
    ): Double {
        // Prototype score algorithm with weighted values typical for clinical scoring frameworks
        var basePoints = 0.5 // Default probability base

        // Age factor: older age significantly increases cardiometabolic risk
        val ageFactor = when {
            profile.age < 40 -> 0.2
            profile.age in 40..49 -> 1.5
            profile.age in 50..59 -> 3.2
            profile.age in 60..69 -> 6.8
            else -> 12.5
        }
        basePoints += ageFactor

        // Sex factor
        if (profile.sex == "Мужской") {
            basePoints += 1.8 // Men tend to score higher baseline SCORE2 risk in compact categories
        }

        // Smoking factor
        if (profile.smokingStatus == "Курит") {
            basePoints += 3.5
        } else if (profile.smokingStatus == "Ранее курил") {
            basePoints += 1.2
        }

        // BP impact
        val bpPoints = when {
            systolicBP >= 160 -> 4.5
            systolicBP in 140..159 -> 2.5
            systolicBP in 130..139 -> 1.0
            else -> 0.0
        }
        basePoints += bpPoints

        // Cholesterol fraction (Total Chol / HDL Chol ratio)
        val cholRatio = if (hdlChol > 0.0) totalChol / hdlChol else 3.0
        val cholPoints = when {
            cholRatio >= 6.0 -> 3.0
            cholRatio >= 4.5 -> 1.5
            else -> 0.0
        }
        basePoints += cholPoints

        // Diabetes mellitus increases cardiovascular risk profoundly
        if (profile.diabetesStatus == "Да") {
            basePoints += 4.0
        }

        // Family history of early CVD (Men <55 years, Women <65 years)
        if (profile.familyHistoryCVD == "Да") {
            basePoints += 2.0
        }

        // Bound result between 1.0% and 45.0%
        val finalRisk = basePoints.coerceIn(1.0, 45.0)
        return (finalRisk * 10.0).roundToInt() / 10.0
    }

    /**
     * Framingham Prototype Cardiovascular Risk Calculation
     * Prototype only. Requires clinical validation before real clinical use.
     */
    fun calculatePrototypeFraminghamRisk(
        profile: UserProfile,
        systolicBP: Int,
        totalChol: Double, // in mmol/L
        hdlChol: Double // in mmol/L
    ): Double {
        // Simplified scoring model based on NIH Framingham algorithm points
        var points = 0

        // Age Points
        points += when {
            profile.age in 30..34 -> 1
            profile.age in 35..39 -> 2
            profile.age in 40..44 -> 5
            profile.age in 45..49 -> 7
            profile.age in 50..54 -> 8
            profile.age in 55..59 -> 10
            profile.age in 60..64 -> 11
            profile.age in 65..69 -> 12
            profile.age >= 70 -> 13
            else -> 0
        }

        // Cholesterol Points (estimated in mmol/L)
        points += when {
            totalChol >= 7.2 -> 3
            totalChol in 6.2..7.1 -> 2
            totalChol in 5.2..6.1 -> 1
            else -> 0
        }

        // HDL Points
        points += when {
            hdlChol < 0.9 -> 2
            hdlChol in 0.9..1.19 -> 1
            hdlChol in 1.2..1.59 -> 0
            else -> -1 // High HDL is protective
        }

        // BP Points
        points += when {
            systolicBP >= 160 -> 4
            systolicBP in 140..159 -> 3
            systolicBP in 130..139 -> 2
            systolicBP in 120..129 -> 1
            else -> 0
        }

        // Smoking Status
        if (profile.smokingStatus == "Курит") {
            points += 3
        }

        // Diabetes Status
        if (profile.diabetesStatus == "Да") {
            points += 3
        }

        // Translate points to simple demo risk percentage scale
        val riskScale = when {
            points <= 4 -> 1.5
            points in 5..8 -> 4.0
            points in 9..12 -> 8.5
            points in 13..16 -> 15.0
            points in 17..20 -> 22.5
            else -> 35.0
        }

        return riskScale
    }

    /**
     * Determines the risk category name for UI representation.
     */
    fun classifyRiskCategory(riskPercent: Double): String {
        return when {
            riskPercent < 3.0 -> "Низкий риски"
            riskPercent in 3.0..4.9 -> "Умеренный риски"
            riskPercent in 5.0..9.9 -> "Высокий риск"
            else -> "Очень высокий риск"
        }
    }

    /**
     * Translates category to standard Russian label.
     */
    fun getRiskCategoryLabel(percentage: Double): String {
        return when {
            percentage < 3.0 -> "Низкий"
            percentage in 3.0..4.9 -> "Умеренный"
            percentage in 5.0..9.9 -> "Высокий"
            else -> "Очень высокий"
        }
    }

    /**
     * UI helper to format values with units.
     */
    fun formatMedicalValue(value: Any, unit: String): String {
        return "$value $unit"
    }
}
