import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { adherenceBand, calculateAdherencePercent } from '../../src/domain/calculators';
import { MS_PER_DAY } from '../../src/domain/constants';
import type { PatientRecord } from '../../src/domain/types';
import { deriveRisk, useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Badge } from '../../src/ui/Badge';
import { Card } from '../../src/ui/Card';
import { Icon } from '../../src/ui/Icon';
import { PageHeader } from '../../src/ui/PageHeader';
import { Progress } from '../../src/ui/Progress';
import { RolePill } from '../../src/ui/RolePill';
import { riskTone } from '../../src/utils/format';

export default function DoctorPatientsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const role = useAppStore((s) => s.role);
  // Select stable slices and derive the roster via useMemo — a selector that
  // builds a fresh array each call would loop (unstable getSnapshot).
  const records = useAppStore((s) => s.records);
  const currentDoctorId = useAppStore((s) => s.currentDoctorId);
  const riskModel = useAppStore((s) => s.riskModel);
  const openPatient = useAppStore((s) => s.openPatient);
  const [query, setQuery] = useState('');

  const patients = useMemo(
    () => Object.values(records).filter((r) => r.profile.doctorId === currentDoctorId),
    [records, currentDoctorId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return patients;
    return patients.filter(
      (p) => p.profile.fullName.toLowerCase().includes(q) || p.profile.anonymizedId.toLowerCase().includes(q),
    );
  }, [patients, query]);

  const onOpen = (id: string) => {
    openPatient(id);
    router.push('/patient-detail');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader
        title={t('doctor.patientsTitle')}
        subtitle={t('doctor.rosterSubtitle', { count: patients.length })}
        right={<RolePill label={t('roles.doctorShort')} role={role} />}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gapSm }}>
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', columnGap: 9, height: 46, paddingHorizontal: 13,
            borderRadius: theme.radius.field, backgroundColor: theme.colors.surface,
            borderWidth: 1, borderColor: theme.colors.border2,
          }}
        >
          <Icon name="search" size={18} color={theme.colors.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('doctor.searchPlaceholderName')}
            placeholderTextColor={theme.colors.text3}
            style={{ flex: 1, fontFamily: theme.font.regular, fontSize: theme.fontSize.body, color: theme.colors.text, paddingVertical: 0, outlineWidth: 0 }}
          />
        </View>

        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <AppText variant="help">{t('doctor.notFound')}</AppText>
          </View>
        ) : (
          filtered.map((record) => (
            <PatientCard key={record.profile.id} record={record} riskModel={riskModel} onOpen={() => onOpen(record.profile.id)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function PatientCard({
  record,
  riskModel,
  onOpen,
}: {
  readonly record: PatientRecord;
  readonly riskModel: 'score2' | 'framingham';
  readonly onOpen: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { profile, measurements, medicationLogs, alerts } = record;
  const latest = measurements[0];
  const risk = deriveRisk({ profile, measurements, riskModel });
  const adherence = calculateAdherencePercent(medicationLogs);
  const band = adherenceBand(adherence);
  const unread = alerts.filter((a) => !a.isRead).length;
  const daysAgo = latest ? Math.round((Date.now() - new Date(latest.date).getTime()) / MS_PER_DAY) : null;
  const lastSeen =
    daysAgo === null ? t('doctor.patient.noData') : daysAgo <= 0 ? t('doctor.patient.today') : t('doctor.patient.daysAgo', { count: daysAgo });

  return (
    <Pressable onPress={onOpen} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Card style={{ rowGap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{profile.fullName}</AppText>
            <AppText variant="help" color={theme.colors.text3} tabular>{profile.anonymizedId}</AppText>
          </View>
          <Badge label={t(`enums.riskCategory.${risk.category}`)} tone={riskTone(risk.category)} />
        </View>

        <AppText variant="help" color={theme.colors.text2}>
          {t('doctor.patient.years', { age: profile.age })} · {t(`enums.sex.${profile.sex}`)}
          {latest ? ` · ${latest.systolicBp}/${latest.diastolicBp} ${t('units.mmHg')} · ${t('units.kgm2')} ${latest.bmi}` : ''}
        </AppText>

        <View style={{ rowGap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="help" color={theme.colors.text3}>{t('doctor.patient.adherence')}</AppText>
            <AppText variant="help" tabular style={{ fontFamily: theme.font.semibold }}>{adherence}%</AppText>
          </View>
          <Progress value={adherence / 100} tone={band === 'good' ? 'ok' : band === 'moderate' ? 'warn' : 'primary'} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {unread > 0 ? <Badge label={t('doctor.patient.alerts', { count: unread })} tone="high" /> : <View />}
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
            <Icon name="clock" size={13} color={theme.colors.text3} />
            <AppText variant="help" color={theme.colors.text3}>{lastSeen}</AppText>
            <Icon name="chevronRight" size={16} color={theme.colors.text3} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
