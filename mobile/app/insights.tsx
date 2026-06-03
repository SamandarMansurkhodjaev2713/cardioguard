/**
 * Intelligent analytics & prediction screen (TZ Module 6). Presents the
 * on-device engine's output: per-metric trends (with a forward projection),
 * likelihood projections for the four target conditions, and the prioritized
 * headline insights. All computation is the pure domain's
 * ({@link file://../src/domain/insights.ts}); this screen derives via useMemo
 * from stable store slices and renders.
 */

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateAdherencePercent } from '../src/domain/calculators';
import { INSIGHTS, MS_PER_DAY } from '../src/domain/constants';
import {
  analyzeSeries,
  buildMetricTrends,
  generateInsights,
  projectConditions,
  type ConditionProjection,
  type InsightLevel,
  type InsightMetricKey,
  type MetricTrend,
  type ProjectionLikelihood,
  type TrendDirection,
} from '../src/domain/insights';
import { classifyMoodState, latestMoodEntry, wellbeingScore } from '../src/domain/mood';
import { HealthIndexCard } from '../src/features/HealthIndexCard';
import { deriveRisk, useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import type { StatusTone } from '../src/theme/tokens';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Card } from '../src/ui/Card';
import { Chip } from '../src/ui/Chip';
import { EmptyState } from '../src/ui/EmptyState';
import { Icon, type IconName } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';

// Metric display order; units key into the shared `units.*` namespace.
const METRIC_ORDER: readonly InsightMetricKey[] = ['systolicBp', 'weightKg', 'bmi', 'heartRate', 'glucoseMmol'];
const METRIC_UNIT: Record<InsightMetricKey, string> = {
  systolicBp: 'mmHg', weightKg: 'kg', bmi: 'kgm2', heartRate: 'bpm', glucoseMmol: 'glucose', wellbeing: 'percent',
};
// For most metrics a rising trend is unfavourable; for wellbeing it is the good direction.
const HIGHER_IS_BETTER: Partial<Record<InsightMetricKey, boolean>> = { wellbeing: true };

const LIKELIHOOD_TONE: Record<ProjectionLikelihood, StatusTone> = {
  present: 'high', high: 'high', moderate: 'warn', low: 'ok',
};
const INSIGHT_TONE: Record<InsightLevel, StatusTone> = { risk: 'high', watch: 'warn', positive: 'ok' };
const INSIGHT_ICON: Record<InsightLevel, IconName> = { risk: 'alert', watch: 'info', positive: 'check' };

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const measurements = useAppStore((s) => s.measurements);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const moodEntries = useAppStore((s) => s.moodEntries);
  const riskModel = useAppStore((s) => s.riskModel);

  const { trends, wellbeingTrend, projections, insights } = useMemo(() => {
    const risk = deriveRisk({ profile, measurements, riskModel });
    const adherencePercent = calculateAdherencePercent(medicationLogs);
    const latestMood = latestMoodEntry(moodEntries);
    const input = {
      measurements,
      profile,
      riskCategory: risk.category,
      riskPercent: risk.percent,
      adherencePercent,
      latestMoodState: latestMood ? classifyMoodState(latestMood) : undefined,
    };

    // Wellbeing trend is sourced from mood entries, not measurements.
    const moodChrono = [...moodEntries].reverse();
    let wb: MetricTrend | undefined;
    if (moodChrono.length >= INSIGHTS.MIN_POINTS) {
      const t0 = new Date(moodChrono[0].date).getTime();
      const points = moodChrono.map((e) => ({ x: (new Date(e.date).getTime() - t0) / MS_PER_DAY, y: wellbeingScore(e) }));
      wb = analyzeSeries(points, INSIGHTS.FLAT_EPS_PER_WEEK.wellbeing);
    }

    return {
      trends: buildMetricTrends(measurements),
      wellbeingTrend: wb,
      projections: projectConditions(input),
      insights: generateInsights(input),
    };
  }, [profile, measurements, medicationLogs, moodEntries, riskModel]);

  const hasData = measurements.length >= INSIGHTS.MIN_POINTS;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('insights.title')} subtitle={t('insights.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {!hasData ? (
          <EmptyState icon="trendingUp" title={t('insights.empty')} />
        ) : (
          <>
            {/* Composite health index with its breakdown */}
            <HealthIndexCard showBreakdown />

            {/* Headline insights */}
            <AppText variant="h2" style={{ marginTop: 4 }}>{t('insights.insightsTitle')}</AppText>
            <View style={{ rowGap: theme.space.gapSm }}>
              {insights.map((ins) => (
                <Card key={ins.id} style={{ flexDirection: 'row', columnGap: 11, borderLeftWidth: 3, borderLeftColor: theme.tone(INSIGHT_TONE[ins.level]).fg }}>
                  <Icon name={INSIGHT_ICON[ins.level]} size={18} color={theme.tone(INSIGHT_TONE[ins.level]).fg} />
                  <AppText variant="help" color={theme.colors.text} style={{ flex: 1, lineHeight: 19 }}>
                    {t(`insights.texts.${ins.id}`, ins.params)}
                  </AppText>
                </Card>
              ))}
            </View>

            {/* Trends */}
            <AppText variant="h2" style={{ marginTop: 4 }}>{t('insights.trendsTitle')}</AppText>
            <Card style={{ rowGap: 4 }}>
              {METRIC_ORDER.filter((k) => trends[k]).map((key, i) => (
                <TrendRow key={key} metric={key} trend={trends[key]!} first={i === 0} />
              ))}
              {wellbeingTrend ? (
                <TrendRow metric="wellbeing" trend={wellbeingTrend} first={METRIC_ORDER.every((k) => !trends[k])} />
              ) : null}
            </Card>

            {/* Condition projections */}
            <AppText variant="h2" style={{ marginTop: 4 }}>{t('insights.projectionsTitle')}</AppText>
            <View style={{ rowGap: theme.space.gapSm }}>
              {projections.map((p) => <ProjectionRow key={p.condition} projection={p} />)}
            </View>

            <AppText variant="help" center style={{ marginTop: 4 }}>{t('insights.note')}</AppText>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function directionTone(direction: TrendDirection, higherIsBetter: boolean): StatusTone {
  if (direction === 'flat') return 'neutral';
  const good = higherIsBetter ? direction === 'up' : direction === 'down';
  return good ? 'ok' : 'warn';
}

function TrendRow({ metric, trend, first }: { readonly metric: InsightMetricKey; readonly trend: MetricTrend; readonly first: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tone = theme.tone(directionTone(trend.direction, !!HIGHER_IS_BETTER[metric]));
  const arrow: IconName | null = trend.direction === 'up' ? 'arrowUp' : trend.direction === 'down' ? 'arrowDown' : null;
  const unit = t(`units.${METRIC_UNIT[metric]}`);

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', columnGap: 10,
        paddingVertical: theme.space.rowPad,
        borderTopWidth: first ? 0 : 1, borderTopColor: theme.colors.hairline,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="label" color={theme.colors.text2}>{t(`insights.metrics.${metric}`)}</AppText>
        <AppText variant="help" color={theme.colors.text3}>
          {t('insights.projected', { value: `${trend.projected} ${unit}` })}
        </AppText>
      </View>
      <AppText tabular style={{ fontFamily: theme.font.semibold, fontSize: 15 }}>{trend.current}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, minWidth: 92, justifyContent: 'flex-end' }}>
        {arrow ? <Icon name={arrow} size={14} color={tone.fg} /> : <View style={{ width: 6, height: 2, borderRadius: 2, backgroundColor: tone.fg }} />}
        <AppText variant="help" tabular color={tone.fg}>
          {trend.direction === 'flat' ? t('insights.direction.flat') : t('insights.perWeek', { value: Math.abs(trend.changePerWeek) })}
        </AppText>
      </View>
    </View>
  );
}

function ProjectionRow({ projection }: { readonly projection: ConditionProjection }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card style={{ rowGap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
        <AppText variant="title" style={{ flex: 1 }}>{t(`insights.conditions.${projection.condition}`)}</AppText>
        <Badge label={t(`insights.likelihood.${projection.likelihood}`)} tone={LIKELIHOOD_TONE[projection.likelihood]} />
      </View>
      {projection.driverKeys.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {projection.driverKeys.map((key) => (
            <Chip key={key} label={t(`insights.drivers.${key}`)} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}
