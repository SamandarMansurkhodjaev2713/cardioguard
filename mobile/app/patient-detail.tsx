/**
 * Doctor's individual patient card (drill-down). The patient was made active via
 * `openPatient`, so this screen reads the same mirror every patient screen uses —
 * letting it reuse the domain engines + HealthIndexCard for the opened patient.
 * Read-only here (Phase 2); the act-on-patient controls (care plan, meds, notes,
 * messages) are added on top in Phase 3.
 */

import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateAdherencePercent } from '../src/domain/calculators';
import { HealthIndexCard } from '../src/features/HealthIndexCard';
import { deriveRisk, selectUnreadMessageCount, useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';
import { formatLongDate, riskTone } from '../src/utils/format';

export default function PatientDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const profile = useAppStore((s) => s.profile);
  const measurements = useAppStore((s) => s.measurements);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const medications = useAppStore((s) => s.medications);
  const alerts = useAppStore((s) => s.alerts);
  const carePlan = useAppStore((s) => s.carePlan);
  const riskModel = useAppStore((s) => s.riskModel);
  const language = useAppStore((s) => s.language);
  const unreadMessages = useAppStore(selectUnreadMessageCount);

  const risk = useMemo(() => deriveRisk({ profile, measurements, riskModel }), [profile, measurements, riskModel]);
  const adherence = calculateAdherencePercent(medicationLogs);
  const latest = measurements[0];
  const unreadAlerts = alerts.filter((a) => !a.isRead);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={profile.fullName}
        subtitle={`${t('doctor.patient.years', { age: profile.age })} · ${t(`enums.sex.${profile.sex}`)} · ${profile.anonymizedId}`}
        onBack={() => router.back()}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {/* Doctor actions */}
        <View style={{ rowGap: theme.space.gapSm }}>
          <View style={{ flexDirection: 'row', columnGap: theme.space.gapSm }}>
            <View style={{ flex: 1 }}><Button label={t('doctor.detail.editCarePlan')} variant="secondary" leftIcon="shield" block onPress={() => router.push('/care-plan')} /></View>
            <View style={{ flex: 1 }}><Button label={t('doctor.detail.prescribe')} variant="secondary" leftIcon="medication" block onPress={() => router.push('/prescribe')} /></View>
          </View>
          <View style={{ flexDirection: 'row', columnGap: theme.space.gapSm }}>
            <View style={{ flex: 1 }}><Button label={t('notes.title')} variant="secondary" leftIcon="info" block onPress={() => router.push('/patient-notes')} /></View>
            <View style={{ flex: 1 }}><Button label={unreadMessages > 0 ? `${t('messages.title')} (${unreadMessages})` : t('messages.title')} variant="secondary" leftIcon="send" block onPress={() => router.push('/messages')} /></View>
          </View>
        </View>

        {/* Risk + adherence summary */}
        <Card style={{ rowGap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <AppText variant="label" color={theme.colors.text3}>{t('risk.resultTitle')}</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 4 }}>
                <AppText variant="metric" tabular color={theme.tone(riskTone(risk.category)).fg}>{risk.percent}</AppText>
                <AppText variant="help">{t('units.percent')}</AppText>
              </View>
            </View>
            <Badge label={t(`enums.riskCategory.${risk.category}`)} tone={riskTone(risk.category)} />
          </View>
          {risk.factorKeys.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {risk.factorKeys.map((key) => (
                <Badge key={key} label={t(`risk.factors.${key}`)} tone="neutral" dot={false} />
              ))}
            </View>
          ) : null}
        </Card>

        {/* Composite index (reads the active mirror) */}
        <HealthIndexCard />

        {/* Latest vitals */}
        <AppText variant="h2">{t('doctor.detail.latestVitals')}</AppText>
        <Card style={{ rowGap: 0 }}>
          <Stat label={t('dashboard.metrics.bloodPressure')} value={latest ? `${latest.systolicBp}/${latest.diastolicBp} ${t('units.mmHg')}` : '—'} first />
          <Stat label={t('dashboard.metrics.heartRate')} value={latest ? `${latest.heartRate} ${t('units.bpm')}` : '—'} />
          <Stat label={t('dashboard.metrics.bmi')} value={latest ? `${latest.bmi} ${t('units.kgm2')}` : '—'} />
          {latest?.glucoseMmol != null ? <Stat label={t('report.fields.glucose')} value={`${latest.glucoseMmol} ${t('units.glucose')}`} /> : null}
          <Stat label={t('doctor.patient.adherence')} value={`${adherence}%`} />
          <Stat label={t('doctor.detail.lastMeasurement')} value={latest ? formatLongDate(new Date(latest.date), language) : '—'} />
        </Card>

        {/* Care plan (set by doctor in Phase 3; read-only here) */}
        <AppText variant="h2">{t('doctor.detail.carePlan')}</AppText>
        <Card style={{ rowGap: 0 }}>
          <Stat label={t('goals.bpTarget')} value={carePlan.targetSystolicBp ? `${carePlan.targetSystolicBp} ${t('units.mmHg')}` : t('doctor.detail.notSet')} first />
          <Stat label={t('goals.weightTarget')} value={carePlan.targetWeightKg ? `${carePlan.targetWeightKg} ${t('units.kg')}` : t('doctor.detail.notSet')} />
          {carePlan.note ? <Stat label={t('doctor.detail.planNote')} value={carePlan.note} /> : null}
        </Card>

        {/* Medications */}
        <AppText variant="h2">{t('medication.activeTitle')} ({medications.length})</AppText>
        <Card style={{ rowGap: 0 }}>
          {medications.length === 0 ? (
            <AppText variant="help" style={{ paddingVertical: 8 }}>{t('medication.empty')}</AppText>
          ) : (
            medications.map((m, i) => (
              <Pressable key={m.id} onPress={() => router.push(`/prescribe?medId=${m.id}`)} accessibilityRole="button">
                <Stat label={`${m.name} · ${m.dosage}`} value={m.intakeTimes.join(', ')} first={i === 0} chevron />
              </Pressable>
            ))
          )}
        </Card>

        {/* Active alerts */}
        <AppText variant="h2">{t('alerts.title')} ({unreadAlerts.length})</AppText>
        {unreadAlerts.length === 0 ? (
          <Card><AppText variant="help" center style={{ paddingVertical: 8 }}>{t('alerts.empty')}</AppText></Card>
        ) : (
          <View style={{ rowGap: theme.space.gapSm }}>
            {unreadAlerts.map((a) => (
              <Card key={a.id} style={{ flexDirection: 'row', columnGap: 10, borderLeftWidth: 3, borderLeftColor: theme.tone(a.severity === 'high' ? 'high' : a.severity === 'warn' ? 'warn' : 'info').fg }}>
                <Icon name="alert" size={16} color={theme.tone(a.severity === 'high' ? 'high' : 'warn').fg} />
                <AppText variant="help" color={theme.colors.text} style={{ flex: 1, lineHeight: 18 }}>
                  {t(`alerts.types.${a.type}.message`, a.params)}
                </AppText>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, first, chevron }: { readonly label: string; readonly value: string; readonly first?: boolean; readonly chevron?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10,
        paddingVertical: theme.space.rowPad, borderTopWidth: first ? 0 : 1, borderTopColor: theme.colors.hairline,
      }}
    >
      <AppText variant="help" color={theme.colors.text2} style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="help" tabular style={{ fontFamily: theme.font.semibold, textAlign: 'right', flexShrink: 1 }}>{value as ReactNode}</AppText>
      {chevron ? <Icon name="chevronRight" size={16} color={theme.colors.text3} /> : null}
    </View>
  );
}
