/**
 * "Export cohort (CSV)" for the researcher panel. Serializes the doctor's real,
 * de-identified patient roster to a readable, Excel-ready CSV and shares /
 * downloads it (restoring the data export the original Kotlin app had).
 * Self-contained: drop in with `<CohortExportButton />`.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { calculateAdherencePercent } from '../domain/calculators';
import { deriveRisk, useAppStore } from '../store/useAppStore';
import { exportCsv, type CsvExportResult } from '../services/cohortExport';
import { useTheme } from '../theme/ThemeProvider';
import { toCsv } from '../utils/csv';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

const COLUMN_KEYS = [
  'id', 'age', 'sex', 'systolic', 'diastolic', 'bmi', 'weight',
  'adherence', 'risk', 'stress', 'hypertension', 'diabetes', 'alerts',
] as const;

export function CohortExportButton() {
  const theme = useTheme();
  const { t } = useTranslation();
  const records = useAppStore((s) => s.records);
  const currentDoctorId = useAppStore((s) => s.currentDoctorId);
  const riskModel = useAppStore((s) => s.riskModel);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CsvExportResult | null>(null);

  const roster = useMemo(
    () => Object.values(records).filter((r) => r.profile.doctorId === currentDoctorId),
    [records, currentDoctorId],
  );

  const buildCsv = (): string => {
    const yn = (value: boolean) => t(`doctor.export.${value ? 'yes' : 'no'}`);
    const headers = COLUMN_KEYS.map((key) => t(`doctor.export.columns.${key}`));
    const rows = roster.map((r) => {
      const latest = r.measurements[0];
      const risk = deriveRisk({ profile: r.profile, measurements: r.measurements, riskModel });
      const adherence = calculateAdherencePercent(r.medicationLogs);
      const unread = r.alerts.filter((a) => !a.isRead).length;
      return [
        r.profile.anonymizedId,
        String(r.profile.age),
        t(`enums.sex.${r.profile.sex}`),
        latest ? String(latest.systolicBp) : '',
        latest ? String(latest.diastolicBp) : '',
        latest ? String(latest.bmi) : '',
        latest ? String(latest.weightKg) : '',
        String(adherence),
        t(`enums.riskCategory.${risk.category}`),
        t(`enums.stress.${r.profile.stressLevel}`),
        yn(r.profile.hypertensionStatus === 'yes'),
        yn(r.profile.diabetesStatus === 'yes'),
        String(unread),
      ];
    });
    return toCsv([headers, ...rows]);
  };

  const onExport = async () => {
    if (busy || roster.length === 0) return;
    setBusy(true);
    setResult(null);
    const outcome = await exportCsv(buildCsv(), 'cardioguard-patients.csv', t('doctor.export.dialogTitle'));
    setResult(outcome);
    setBusy(false);
  };

  return (
    <Card style={{ rowGap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
        <View
          style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: theme.colors.tealSoft, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="download" size={18} color={theme.colors.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title">{t('doctor.export.title')}</AppText>
          <AppText variant="help" color={theme.colors.text3}>
            {t('doctor.export.hint', { count: roster.length })}
          </AppText>
        </View>
      </View>

      <Button
        label={busy ? t('doctor.export.generating') : t('doctor.export.button')}
        variant="teal"
        leftIcon="download"
        block
        loading={busy}
        disabled={roster.length === 0}
        onPress={onExport}
      />

      {result ? (
        <AppText variant="help" color={result === 'failed' ? theme.colors.high : theme.colors.ok}>
          {t(`doctor.export.result.${result}`)}
        </AppText>
      ) : null}
    </Card>
  );
}
