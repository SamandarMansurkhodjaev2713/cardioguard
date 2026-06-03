import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { calculateAdherencePercent } from '../src/domain/calculators';
import { generateRecommendations } from '../src/domain/riskEngine';
import type { Recommendation } from '../src/domain/types';
import { deriveRisk, useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';

export default function RecommendationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const measurements = useAppStore((s) => s.measurements);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const riskModel = useAppStore((s) => s.riskModel);

  const recs = useMemo<Recommendation[]>(() => {
    const latest = measurements[0];
    if (!latest) return [];
    const risk = deriveRisk({ profile, measurements, riskModel });
    return generateRecommendations({
      profile,
      latest,
      adherencePercent: calculateAdherencePercent(medicationLogs),
      riskPercent: risk.percent,
      riskCategory: risk.category,
    });
  }, [profile, measurements, medicationLogs, riskModel]);

  const high = recs.filter((r) => r.priority === 'high');
  const medium = recs.filter((r) => r.priority !== 'high');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('recommendations.title')} subtitle={t('recommendations.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {recs.length === 0 ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
            <Icon name="check" size={18} color={theme.colors.ok} />
            <AppText variant="body" color={theme.colors.text2} style={{ flex: 1 }}>{t('recommendations.empty')}</AppText>
          </Card>
        ) : (
          <>
            {high.length > 0 ? <Section title={t('recommendations.priorityHigh')} tone="high" count={high.length} /> : null}
            {high.map((rec) => <RecCard key={rec.id} rec={rec} />)}

            {medium.length > 0 ? <Section title={t('recommendations.priorityMedium')} tone="warn" count={medium.length} /> : null}
            {medium.map((rec) => <RecCard key={rec.id} rec={rec} />)}

            <View
              style={{
                flexDirection: 'row', columnGap: 9, padding: 12, marginTop: 4,
                borderRadius: theme.radius.field,
                backgroundColor: theme.colors.warnBg, borderWidth: 1, borderColor: theme.colors.warnBd,
              }}
            >
              <Icon name="info" size={16} color={theme.colors.warn} />
              <AppText variant="help" color={theme.colors.warn} style={{ flex: 1, lineHeight: 18 }}>
                {t('recommendations.safetyNote')}
              </AppText>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Section({ title, tone, count }: { readonly title: string; readonly tone: 'high' | 'warn'; readonly count: number }) {
  const theme = useTheme();
  const color = tone === 'high' ? theme.colors.high : theme.colors.warn;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, marginTop: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color }} />
      <AppText variant="h2" style={{ flex: 1 }}>{title}</AppText>
      <AppText variant="help">{count}</AppText>
    </View>
  );
}

function RecCard({ rec }: { readonly rec: Recommendation }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const steps = t(`recommendations.items.${rec.id}.steps`, { returnObjects: true }) as string[];
  const accent = rec.priority === 'high' ? theme.colors.high : theme.colors.warn;

  return (
    <Card style={{ rowGap: 10, borderLeftWidth: 3, borderLeftColor: accent }}>
      <AppText variant="title">{t(`recommendations.items.${rec.id}.title`)}</AppText>
      <AppText variant="help" color={theme.colors.text2} style={{ lineHeight: 19 }}>
        {t(`recommendations.items.${rec.id}.why`)}
      </AppText>
      <View style={{ rowGap: 8, marginTop: 2 }}>
        {steps.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', columnGap: 9, alignItems: 'flex-start' }}>
            <Icon name="check" size={16} color={theme.colors.teal} />
            <AppText variant="help" color={theme.colors.text} style={{ flex: 1, lineHeight: 18 }}>{step}</AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}
