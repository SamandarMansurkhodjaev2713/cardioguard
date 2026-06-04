/**
 * "Export cohort (CSV)" action for the researcher panel. Serializes the de-identified
 * cohort to a readable, localized CSV and shares/downloads it — restoring the data
 * export the original Kotlin app had. Self-contained: drop in with `<CohortExportButton />`.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DEMO_COHORT } from '../data/cohort';
import { exportCsv, type CsvExportResult } from '../services/cohortExport';
import { useTheme } from '../theme/ThemeProvider';
import { toCsv } from '../utils/csv';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

const COLUMN_KEYS = [
  'id', 'group', 'age', 'sex', 'systolic', 'diastolic', 'bmi', 'weight',
  'adherence', 'risk', 'stress', 'hypertension', 'diabetes', 'alerts',
] as const;

export function CohortExportButton() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CsvExportResult | null>(null);

  const buildCsv = (): string => {
    const yn = (value: boolean) => t(`doctor.export.${value ? 'yes' : 'no'}`);
    const headers = COLUMN_KEYS.map((key) => t(`doctor.export.columns.${key}`));
    const rows = DEMO_COHORT.map((m) => [
      m.id,
      t(`doctor.groupNames.${m.group}`),
      String(m.age),
      t(`enums.sex.${m.sex}`),
      String(m.systolicBp),
      String(m.diastolicBp),
      String(m.bmi),
      String(m.weightKg),
      String(m.adherencePercent),
      t(`enums.riskCategory.${m.riskCategory}`),
      t(`enums.stress.${m.stressLevel}`),
      yn(m.hasHypertension),
      yn(m.hasDiabetes),
      String(m.activeAlerts),
    ]);
    return toCsv([headers, ...rows]);
  };

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    const outcome = await exportCsv(buildCsv(), 'cardioguard-cohort.csv', t('doctor.export.dialogTitle'));
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
            {t('doctor.export.hint', { count: DEMO_COHORT.length })}
          </AppText>
        </View>
      </View>

      <Button
        label={busy ? t('doctor.export.generating') : t('doctor.export.button')}
        variant="teal"
        leftIcon="download"
        block
        loading={busy}
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
