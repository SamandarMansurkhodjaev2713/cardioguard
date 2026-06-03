import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { adherenceBand, classifyBloodPressure, classifyBmi } from '../../src/domain/calculators';
import {
  deriveRisk,
  selectAdherencePercent,
  selectLatestMeasurement,
  selectUnreadAlertCount,
  useAppStore,
} from '../../src/store/useAppStore';
import { HealthIndexCard } from '../../src/features/HealthIndexCard';
import { useTheme } from '../../src/theme/ThemeProvider';
import { AppText } from '../../src/ui/AppText';
import { Chip } from '../../src/ui/Chip';
import { Icon } from '../../src/ui/Icon';
import { MetricCard } from '../../src/ui/MetricCard';
import { RolePill } from '../../src/ui/RolePill';
import {
  adherenceTone,
  bloodPressureTone,
  bmiTone,
  formatLongDate,
  riskTone,
} from '../../src/utils/format';

const HR_NORMAL_MIN = 60;
const HR_NORMAL_MAX = 90;

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const profile = useAppStore((s) => s.profile);
  const language = useAppStore((s) => s.language);
  const measurements = useAppStore((s) => s.measurements);
  const riskModel = useAppStore((s) => s.riskModel);
  const latest = useAppStore(selectLatestMeasurement);
  const adherence = useAppStore(selectAdherencePercent);
  const unread = useAppStore(selectUnreadAlertCount);

  // Derived risk is computed locally (memoized) — selecting a freshly-built
  // object straight from the store would change identity every render and loop.
  const risk = useMemo(
    () => deriveRisk({ profile, measurements, riskModel }),
    [profile, measurements, riskModel],
  );

  const firstName = profile.fullName.split(' ')[0];

  if (!latest) {
    return null;
  }

  const bpCategory = classifyBloodPressure(latest.systolicBp, latest.diastolicBp);
  const bpNeedsAttention = bpCategory !== 'optimal' && bpCategory !== 'normal';
  const bmiCategory = classifyBmi(latest.bmi);
  const band = adherenceBand(adherence);
  const hrNormal = latest.heartRate >= HR_NORMAL_MIN && latest.heartRate <= HR_NORMAL_MAX;

  const oldest = measurements[measurements.length - 1];
  const sysDelta = latest.systolicBp - oldest.systolicBp;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: theme.space.screenPad, paddingTop: insets.top + 14, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', columnGap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="h1">{t('dashboard.greeting', { name: firstName })}</AppText>
            <AppText variant="help" style={{ marginTop: 4 }}>
              {formatLongDate(new Date(), language)}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
            <RolePill label={t('roles.patient')} />
            <BellButton count={unread} onPress={() => router.push('/alerts')} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: 6, marginTop: 12 }}>
          <Icon name="info" size={14} color={theme.colors.text3} />
          <AppText variant="help" style={{ flex: 1 }}>
            {t('dashboard.monitoringNote')}
          </AppText>
        </View>
      </View>

      {/* Quick actions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.space.screenPad, columnGap: 9, paddingVertical: 4 }}
      >
        <Chip label={t('dashboard.addMeasurement')} icon="plus" onPress={() => router.push('/measurement')} />
        <Chip label={t('dashboard.markIntake')} icon="medication" onPress={() => router.push('/medication')} />
      </ScrollView>

      {/* Metric grid */}
      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap, marginTop: theme.space.gapSm }}>
        <HealthIndexCard onPress={() => router.push('/insights')} />

        <Row gap={theme.space.gap}>
          <MetricCard
            style={{ flex: 1 }}
            icon="heart"
            label={t('dashboard.metrics.bloodPressure')}
            value={`${latest.systolicBp}/${latest.diastolicBp}`}
            unit={t('units.mmHg')}
            badge={{
              label: bpNeedsAttention ? t('dashboard.status.needsAttention') : t('dashboard.status.norm'),
              tone: bloodPressureTone(bpCategory),
            }}
            trend={
              sysDelta !== 0
                ? {
                    label: t('dashboard.weeklyTrend', {
                      sign: sysDelta > 0 ? '+' : '−',
                      value: Math.abs(sysDelta),
                    }),
                    direction: sysDelta > 0 ? 'up' : 'down',
                  }
                : undefined
            }
            onPress={() => router.push('/monitoring')}
          />
          <MetricCard
            style={{ flex: 1 }}
            icon="pulse"
            label={t('dashboard.metrics.heartRate')}
            value={`${latest.heartRate}`}
            unit={t('units.bpm')}
            badge={{
              label: hrNormal ? t('dashboard.status.norm') : t('dashboard.status.needsAttention'),
              tone: hrNormal ? 'ok' : 'warn',
            }}
            onPress={() => router.push('/monitoring')}
          />
        </Row>

        <Row gap={theme.space.gap}>
          <MetricCard
            style={{ flex: 1 }}
            icon="bmi"
            label={t('dashboard.metrics.bmi')}
            value={`${latest.bmi}`}
            unit={t('units.kgm2')}
            badge={{ label: t(`enums.bmiCategory.${bmiCategory}`), tone: bmiTone(bmiCategory) }}
            onPress={() => router.push('/monitoring')}
          />
          <MetricCard
            style={{ flex: 1 }}
            icon="medication"
            label={t('dashboard.metrics.adherence')}
            value={`${adherence}`}
            unit={t('units.percent')}
            badge={{ label: t(`enums.adherenceBand.${band}`), tone: adherenceTone(band) }}
            onPress={() => router.push('/medication')}
          />
        </Row>

        <Row gap={theme.space.gap}>
          <MetricCard
            style={{ flex: 1 }}
            icon="risk"
            label={t('dashboard.metrics.cvdRisk')}
            value={t(`enums.riskCategory.${risk.category}`)}
            badge={{ label: 'SCORE2', tone: riskTone(risk.category) }}
            onPress={() => router.push('/risk')}
          />
          <MetricCard
            style={{ flex: 1 }}
            icon="alert"
            label={t('dashboard.metrics.warnings')}
            value={`${unread}`}
            unit={t('common.active')}
            badge={unread > 0 ? { label: t('dashboard.status.check'), tone: 'high' } : undefined}
            onPress={() => router.push('/alerts')}
          />
        </Row>
      </View>
    </ScrollView>
  );
}

function Row({ children, gap }: { readonly children: ReactNode; readonly gap: number }) {
  return <View style={{ flexDirection: 'row', columnGap: gap }}>{children}</View>;
}

function BellButton({ count, onPress }: { readonly count: number; readonly onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        width: 38,
        height: 38,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Icon name="bell" size={18} color={theme.colors.text2} />
      {count > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
            borderRadius: 999,
            backgroundColor: theme.colors.high,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: theme.colors.surface,
          }}
        >
          <AppText style={{ fontFamily: theme.font.semibold, fontSize: 10, color: '#FFFFFF' }}>{count}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}
