import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { classifyBloodPressure } from '../../src/domain/calculators';
import type { HealthMeasurement } from '../../src/domain/types';
import { useAppStore } from '../../src/store/useAppStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Badge } from '../../src/ui/Badge';
import { Card } from '../../src/ui/Card';
import { EmptyState } from '../../src/ui/EmptyState';
import { LineChart, type ChartSeries, type ReferenceZone } from '../../src/ui/LineChart';
import { PageHeader } from '../../src/ui/PageHeader';
import { RolePill } from '../../src/ui/RolePill';
import { Chip } from '../../src/ui/Chip';
import { bloodPressureTone, shortDate, shortWeekday, timeHm } from '../../src/utils/format';

type MetricTab = 'bp' | 'hr' | 'weight' | 'bmi' | 'glucose' | 'spo2' | 'steps';

function metricValue(m: HealthMeasurement, tab: MetricTab): number | null {
  switch (tab) {
    case 'hr': return m.heartRate;
    case 'weight': return m.weightKg;
    case 'bmi': return m.bmi;
    case 'glucose': return m.glucoseMmol ?? null;
    case 'spo2': return m.spo2Percent ?? null;
    case 'steps': return m.steps ?? null;
    case 'bp':
    default: return m.systolicBp;
  }
}

export default function MonitoringScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const measurements = useAppStore((s) => s.measurements);
  const language = useAppStore((s) => s.language);
  const role = useAppStore((s) => s.role);
  const [tab, setTab] = useState<MetricTab>('bp');

  // Oldest → newest for a left-to-right chart.
  const chronological = useMemo(() => [...measurements].reverse(), [measurements]);

  // Core metrics always; extended metrics appear only once they have data.
  const tabs = useMemo<MetricTab[]>(() => {
    const core: MetricTab[] = ['bp', 'hr', 'weight', 'bmi'];
    const extended = (['glucose', 'spo2', 'steps'] as MetricTab[]).filter((m) =>
      chronological.some((x) => metricValue(x, m) !== null),
    );
    return [...core, ...extended];
  }, [chronological]);

  // Rows that actually carry the selected metric (extended metrics can be sparse).
  const rows = useMemo(() => chronological.filter((m) => metricValue(m, tab) !== null), [chronological, tab]);
  const labels = useMemo(() => rows.map((m) => shortWeekday(new Date(m.date), language)), [rows, language]);
  const dates = useMemo(() => rows.map((m) => shortDate(new Date(m.date), language)), [rows, language]);

  const series = useMemo<ChartSeries[]>(() => {
    if (tab === 'bp') {
      return [
        { points: rows.map((m) => m.systolicBp), color: theme.colors.primary },
        { points: rows.map((m) => m.diastolicBp), color: theme.colors.teal },
      ];
    }
    const color = tab === 'weight' ? theme.colors.teal : theme.colors.primary;
    return [{ points: rows.map((m) => metricValue(m, tab) ?? 0), color, area: true }];
  }, [tab, rows, theme.colors.primary, theme.colors.teal]);

  const unit =
    tab === 'bp' ? t('units.mmHg')
    : tab === 'hr' ? t('units.bpm')
    : tab === 'weight' ? t('units.kg')
    : tab === 'bmi' ? t('units.kgm2')
    : tab === 'glucose' ? t('units.glucose')
    : tab === 'spo2' ? t('units.percent')
    : t('units.steps');

  // Clinical reference overlays (decorative — clamped, never distort the scale).
  const zones = useMemo<ReferenceZone[]>(() => {
    switch (tab) {
      case 'bp':
        return [
          { from: 130, to: 9999, color: 'rgba(151,100,15,0.07)' }, // elevated (systolic ≥130)
          { from: 140, to: 9999, color: 'rgba(169,56,52,0.07)' }, // high (≥140)
        ];
      case 'hr':
        return [{ from: 60, to: 90, color: 'rgba(46,113,80,0.06)' }]; // resting-HR normal band
      case 'glucose':
        return [{ from: 3.9, to: 5.5, color: 'rgba(46,113,80,0.06)' }]; // fasting normal
      case 'spo2':
        return [{ from: 0, to: 94, color: 'rgba(169,56,52,0.07)' }]; // hypoxemia < 94%
      default:
        return [];
    }
  }, [tab]);

  const primaryValues = useMemo(() => rows.map((m) => metricValue(m, tab) ?? 0), [rows, tab]);

  const stats = useMemo(() => {
    if (primaryValues.length === 0) return null;
    const sum = primaryValues.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round((sum / primaryValues.length) * 10) / 10,
      min: Math.min(...primaryValues),
      max: Math.max(...primaryValues),
    };
  }, [primaryValues]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t('monitoring.title')}
        subtitle={t('monitoring.subtitle')}
        right={<RolePill label={t('roles.patient')} role={role} />}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ columnGap: 9, paddingVertical: 2 }}
        >
          {tabs.map((m) => (
            <Chip key={m} label={t(`monitoring.tabs.${m}`)} selected={tab === m} onPress={() => setTab(m)} />
          ))}
        </ScrollView>

        <Card style={{ rowGap: 10 }}>
          {tab === 'bp' ? (
            <View style={{ flexDirection: 'row', columnGap: 16 }}>
              <LegendDot color={theme.colors.primary} label={t('monitoring.series.systolic')} />
              <LegendDot color={theme.colors.teal} label={t('monitoring.series.diastolic')} />
            </View>
          ) : null}

          {rows.length > 0 ? (
            <>
              <LineChart
                series={series}
                labels={labels}
                zones={zones}
                dates={dates}
                unit={unit}
                accessibilityLabel={
                  stats
                    ? t('monitoring.chartA11y', {
                        metric: t(`monitoring.tabs.${tab}`),
                        avg: stats.avg,
                        min: stats.min,
                        max: stats.max,
                        unit,
                      })
                    : t(`monitoring.tabs.${tab}`)
                }
              />
              {stats ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.hairline, paddingTop: 10 }}>
                  <Stat label={t('monitoring.stats.avg')} value={`${stats.avg}`} />
                  <Stat label={t('monitoring.stats.min')} value={`${stats.min}`} />
                  <Stat label={t('monitoring.stats.max')} value={`${stats.max}`} />
                </View>
              ) : null}
              <AppText variant="help" color={theme.colors.text3} center>{t('monitoring.inspectHint')}</AppText>
            </>
          ) : (
            <EmptyState icon="monitoring" title={t('monitoring.empty')} hint={t('monitoring.emptyHint')} />
          )}
        </Card>

        <AppText variant="h2" style={{ marginTop: 6 }}>
          {t('monitoring.recentTitle')}
        </AppText>

        <Card bare style={{ paddingHorizontal: theme.space.padCard }}>
          {measurements.length === 0 ? (
            <EmptyState compact icon="monitoring" title={t('monitoring.empty')} />
          ) : (
            measurements.map((m, i) => (
              <MeasurementRow key={m.id} measurement={m} language={language} isFirst={i === 0} />
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

function LegendDot({ color, label }: { readonly color: string; readonly label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color }} />
      <AppText variant="help">{label}</AppText>
    </View>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', rowGap: 2 }}>
      <AppText variant="help" color={theme.colors.text3}>{label}</AppText>
      <AppText tabular style={{ fontFamily: theme.font.semibold, fontSize: 15 }}>{value}</AppText>
    </View>
  );
}

function MeasurementRow({
  measurement,
  language,
  isFirst,
}: {
  readonly measurement: HealthMeasurement;
  readonly language: string;
  readonly isFirst: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const date = new Date(measurement.date);
  const category = classifyBloodPressure(measurement.systolicBp, measurement.diastolicBp);
  const needsAttention = category !== 'optimal' && category !== 'normal';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 12,
        paddingVertical: theme.space.rowPad,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: theme.colors.hairline,
      }}
    >
      <View style={{ width: 52 }}>
        <AppText variant="help">{shortDate(date, language)}</AppText>
        <AppText variant="help" color={theme.colors.text3}>
          {timeHm(date)}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText tabular style={{ fontFamily: theme.font.semibold, fontSize: 15 }}>
          {measurement.systolicBp}/{measurement.diastolicBp}
        </AppText>
        <AppText variant="help" color={theme.colors.text3}>
          {measurement.heartRate} {t('units.bpm')} · {measurement.weightKg} {t('units.kg')}
        </AppText>
      </View>
      <Badge
        label={needsAttention ? t('dashboard.status.needsAttention') : t('dashboard.status.norm')}
        tone={bloodPressureTone(category)}
      />
    </View>
  );
}

