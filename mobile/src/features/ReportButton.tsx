/**
 * "Doctor report" action. Assembles the current patient's de-identified summary
 * from the store + domain engines, renders it to HTML, and exports it as a
 * shareable PDF. Self-contained so screens can drop it in with `<ReportButton />`.
 * Highlight colors are fixed light-scheme tones — the PDF is always on white,
 * regardless of the app's appearance setting.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { adherenceBand, calculateAdherencePercent } from '../domain/calculators';
import { generateRecommendations } from '../domain/riskEngine';
import type { StatusTone } from '../theme/tokens';
import { renderReportHtml, type ReportInput, type ReportRow } from '../services/reportHtml';
import { exportReport, type ReportExportResult } from '../services/reportExport';
import { deriveRisk, useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeProvider';
import { adherenceTone, formatDateNumeric, riskTone } from '../utils/format';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

/** Light-scheme status colors, so the printed report reads well on white. */
const TONE_HEX: Record<StatusTone, string> = {
  ok: '#2E7150',
  warn: '#97640F',
  high: '#DC3A33',
  vhigh: '#931E1C',
  info: '#1C4E8C',
  neutral: '#10243B',
};

export function ReportButton() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const measurements = useAppStore((s) => s.measurements);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const riskModel = useAppStore((s) => s.riskModel);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReportExportResult | null>(null);

  const latest = measurements[0];

  const buildInput = (): ReportInput => {
    const risk = deriveRisk({ profile, measurements, riskModel });
    const adherence = calculateAdherencePercent(medicationLogs);
    const u = (key: string) => t(`units.${key}`);

    const measurementRows: ReportRow[] = [
      { label: t('report.fields.measuredOn'), value: formatDateNumeric(new Date(latest.date), language) },
      { label: t('report.fields.bp'), value: `${latest.systolicBp}/${latest.diastolicBp} ${u('mmHg')}` },
      { label: t('report.fields.hr'), value: `${latest.heartRate} ${u('bpm')}` },
      { label: t('report.fields.weight'), value: `${latest.weightKg} ${u('kg')}` },
      { label: t('report.fields.waist'), value: `${latest.waistCircumferenceCm} ${u('cm')}` },
    ];
    if (latest.glucoseMmol != null) {
      measurementRows.push({ label: t('report.fields.glucose'), value: `${latest.glucoseMmol} ${u('glucose')}` });
    }
    if (latest.spo2Percent != null) {
      measurementRows.push({ label: t('report.fields.spo2'), value: `${latest.spo2Percent} ${u('percent')}` });
    }
    if (latest.steps != null) {
      measurementRows.push({ label: t('report.fields.steps'), value: `${latest.steps} ${u('steps')}` });
    }

    const factors =
      risk.factorKeys.length > 0
        ? risk.factorKeys.map((key) => t(`risk.factors.${key}`)).join(', ')
        : t('report.fields.noFactors');

    const recommendations = generateRecommendations({
      profile,
      latest,
      adherencePercent: adherence,
      riskPercent: risk.percent,
      riskCategory: risk.category,
    }).map((rec) => ({
      title: t(`recommendations.items.${rec.id}.title`),
      body: t(`recommendations.items.${rec.id}.why`),
      tag: t(rec.priority === 'high' ? 'recommendations.priorityHigh' : 'recommendations.priorityMedium'),
    }));

    return {
      lang: language,
      documentTitle: t('report.documentTitle'),
      appName: t('common.appName'),
      subtitle: t('report.subtitle'),
      metaLine: t('report.meta', { date: formatDateNumeric(new Date(), language), id: profile.anonymizedId }),
      highlights: [
        { label: t('report.highlights.risk'), value: `${risk.percent} ${u('percent')}`, color: TONE_HEX[riskTone(risk.category)] },
        { label: t('report.highlights.bmi'), value: `${latest.bmi}`, color: TONE_HEX.neutral },
        { label: t('report.highlights.adherence'), value: `${adherence} ${u('percent')}`, color: TONE_HEX[adherenceTone(adherenceBand(adherence))] },
      ],
      sections: [
        {
          heading: t('report.sections.patient'),
          rows: [
            { label: t('report.fields.age'), value: `${profile.age} ${u('years')}` },
            { label: t('report.fields.sex'), value: t(`enums.sex.${profile.sex}`) },
            { label: t('report.fields.height'), value: `${profile.heightCm} ${u('cm')}` },
          ],
        },
        { heading: t('report.sections.measurements'), rows: measurementRows },
        {
          heading: t('report.sections.indices'),
          rows: [
            { label: t('report.fields.bmi'), value: `${latest.bmi} ${u('kgm2')}` },
            { label: t('report.fields.adherence'), value: `${adherence} ${u('percent')}` },
            {
              label: t('report.fields.risk', { model: t(`risk.models.${riskModel}`) }),
              value: `${risk.percent} ${u('percent')} · ${t(`enums.riskCategory.${risk.category}`)}`,
            },
            { label: t('report.sections.factors'), value: factors },
          ],
        },
      ],
      recommendationsHeading: t('report.recommendationsHeading'),
      recommendations,
      recommendationsEmpty: t('report.recommendationsEmpty'),
      disclaimer: t('report.disclaimer'),
    };
  };

  const onExport = async () => {
    if (!latest || busy) return;
    setBusy(true);
    setResult(null);
    const html = renderReportHtml(buildInput());
    const outcome = await exportReport(html, { dialogTitle: t('report.documentTitle') });
    setResult(outcome);
    setBusy(false);
  };

  return (
    <Card style={{ rowGap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
        <View
          style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: theme.colors.tealSoft,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="download" size={18} color={theme.colors.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title">{t('report.button')}</AppText>
          <AppText variant="help" color={theme.colors.text3}>{t('report.buttonHint')}</AppText>
        </View>
      </View>

      <Button
        label={busy ? t('report.generating') : t('report.button')}
        variant="teal"
        leftIcon="download"
        block
        loading={busy}
        disabled={!latest}
        onPress={onExport}
      />

      {!latest ? (
        <AppText variant="help" color={theme.colors.text3}>{t('report.noData')}</AppText>
      ) : result ? (
        <AppText variant="help" color={result === 'failed' ? theme.colors.high : theme.colors.ok}>
          {t(`report.result.${result}`)}
        </AppText>
      ) : null}
    </Card>
  );
}
