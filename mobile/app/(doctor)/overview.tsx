import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { calculateAdherencePercent } from '../../src/domain/calculators';
import type { HealthMeasurement, RiskCategory } from '../../src/domain/types';
import { CohortExportButton } from '../../src/features/CohortExportButton';
import { ReportButton } from '../../src/features/ReportButton';
import { deriveRisk, useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Card } from '../../src/ui/Card';
import { Icon } from '../../src/ui/Icon';
import { PageHeader } from '../../src/ui/PageHeader';
import { RolePill } from '../../src/ui/RolePill';
import { riskTone } from '../../src/utils/format';

const RISK_CATEGORIES: readonly RiskCategory[] = ['low', 'moderate', 'high', 'veryHigh'];
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const avg1 = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);

export default function DoctorOverviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const role = useAppStore((s) => s.role);
  const records = useAppStore((s) => s.records);
  const currentDoctorId = useAppStore((s) => s.currentDoctorId);
  const riskModel = useAppStore((s) => s.riskModel);

  // Aggregate over the doctor's real roster (not a synthetic cohort).
  const summary = useMemo(() => {
    const roster = Object.values(records).filter((r) => r.profile.doctorId === currentDoctorId);
    const latests = roster.map((r) => r.measurements[0]).filter((m): m is HealthMeasurement => !!m);
    const risks = roster.map((r) => deriveRisk({ profile: r.profile, measurements: r.measurements, riskModel }));
    const adherences = roster.map((r) => calculateAdherencePercent(r.medicationLogs));
    return {
      count: roster.length,
      avgSystolic: avg(latests.map((m) => m.systolicBp)),
      avgDiastolic: avg(latests.map((m) => m.diastolicBp)),
      avgBmi: avg1(latests.map((m) => m.bmi)),
      avgAdherence: avg(adherences),
      atRiskCount: risks.filter((r) => r.category === 'high' || r.category === 'veryHigh').length,
      activeAlerts: roster.reduce((s, r) => s + r.alerts.filter((a) => !a.isRead).length, 0),
      riskDistribution: RISK_CATEGORIES.map((c) => ({ category: c, value: risks.filter((r) => r.category === c).length })),
    };
  }, [records, currentDoctorId, riskModel]);

  const kpis = [
    { label: t('doctor.kpi.patients'), value: `${summary.count}` },
    { label: t('doctor.kpi.avgBp'), value: `${summary.avgSystolic}/${summary.avgDiastolic}`, unit: t('units.mmHg') },
    { label: t('doctor.kpi.avgBmi'), value: `${summary.avgBmi}`, unit: t('units.kgm2') },
    { label: t('doctor.kpi.avgAdherence'), value: `${summary.avgAdherence}`, unit: t('units.percent') },
    { label: t('doctor.kpi.highRisk'), value: `${summary.atRiskCount}`, color: theme.colors.high },
    { label: t('doctor.kpi.activeAlerts'), value: `${summary.activeAlerts}`, color: theme.colors.warn },
  ];

  const maxDist = Math.max(1, ...summary.riskDistribution.map((d) => d.value));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t('doctor.title')}
        subtitle={t('doctor.subtitle')}
        right={<RolePill label={t('roles.doctorShort')} role={role} />}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {/* Privacy */}
        <View
          style={{
            flexDirection: 'row',
            columnGap: 9,
            padding: 11,
            borderRadius: theme.radius.field,
            backgroundColor: theme.colors.surfaceSoft,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Icon name="lock" size={15} color={theme.colors.text3} />
          <AppText variant="help" style={{ flex: 1 }}>{t('doctor.privacyNote')}</AppText>
        </View>

        {/* KPI grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.gap }}>
          {kpis.map((kpi) => (
            <Card key={kpi.label} style={{ width: '47%', flexGrow: 1, rowGap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 3 }}>
                <AppText variant="metric" tabular color={kpi.color} style={{ fontSize: 25 }}>
                  {kpi.value}
                </AppText>
                {kpi.unit ? <AppText variant="help">{kpi.unit}</AppText> : null}
              </View>
              <AppText variant="help">{kpi.label}</AppText>
            </Card>
          ))}
        </View>

        {/* Risk distribution */}
        <AppText variant="h2" style={{ marginTop: 6 }}>{t('doctor.riskDistribution')}</AppText>
        <Card style={{ rowGap: 12 }}>
          {summary.riskDistribution.map((d) => (
            <View key={d.category} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
              <AppText variant="help" color={theme.colors.text2} style={{ width: 96 }}>
                {t(`enums.riskCategory.${d.category}`)}
              </AppText>
              <View style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: theme.colors.surface2, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${(d.value / maxDist) * 100}%`,
                    borderRadius: 999,
                    backgroundColor: theme.tone(riskTone(d.category)).fg,
                  }}
                />
              </View>
              <AppText tabular style={{ fontFamily: theme.font.semibold, fontSize: 14, width: 28, textAlign: 'right' }}>
                {d.value}
              </AppText>
            </View>
          ))}
        </Card>

        {/* Cohort data export (CSV) */}
        <AppText variant="h2" style={{ marginTop: 6 }}>{t('doctor.export.title')}</AppText>
        <CohortExportButton />

        {/* Patient report export */}
        <AppText variant="h2" style={{ marginTop: 6 }}>{t('report.button')}</AppText>
        <ReportButton />
      </View>
    </ScrollView>
  );
}

