import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectLatestMeasurement, useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { PageHeader } from '../src/ui/PageHeader';
import { Progress } from '../src/ui/Progress';
import { TextField } from '../src/ui/TextField';

function defaultWeight(heightCm: number): number {
  const m = heightCm / 100;
  return Math.round(24.9 * m * m);
}
function parseNum(v: string): number | null {
  const n = Number(v.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function GoalsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const latest = useAppStore(selectLatestMeasurement);
  const setGoals = useAppStore((s) => s.setGoals);

  const [bp, setBp] = useState(String(profile.targetSystolicBp ?? 130));
  const [weight, setWeight] = useState(String(profile.targetWeightKg ?? defaultWeight(profile.heightCm)));

  const onSave = () => {
    setGoals({ targetSystolicBp: parseNum(bp) ?? undefined, targetWeightKg: parseNum(weight) ?? undefined });
    router.back();
  };

  const bpTarget = parseNum(bp) ?? 130;
  const weightTarget = parseNum(weight) ?? defaultWeight(profile.heightCm);
  const sysNow = latest?.systolicBp; // undefined until the first measurement exists
  const weightNow = latest?.weightKg ?? profile.weightKg;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('goals.title')} subtitle={t('goals.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <Card style={{ rowGap: theme.space.gap }}>
          <AppText variant="title">{t('goals.cardTitle')}</AppText>
          <GoalRow
            label={t('goals.bp')}
            now={sysNow}
            target={bpTarget}
            unit={t('units.mmHg')}
            fraction={sysNow ? clamp01(bpTarget / sysNow) : 0}
            reached={sysNow != null && sysNow <= bpTarget}
          />
          <GoalRow
            label={t('goals.weight')}
            now={weightNow}
            target={weightTarget}
            unit={t('units.kg')}
            fraction={clamp01(weightTarget / weightNow)}
            reached={weightNow <= weightTarget}
          />
        </Card>

        <Card style={{ rowGap: theme.space.gap }}>
          <TextField label={t('goals.bpTarget')} value={bp} onChangeText={setBp} keyboardType="number-pad" suffix={t('units.mmHg')} />
          <TextField label={t('goals.weightTarget')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix={t('units.kg')} />
        </Card>

        <Button label={t('goals.save')} block size="lg" leftIcon="check" onPress={onSave} />
      </View>
    </ScrollView>
  );
}

function GoalRow({
  label,
  now,
  target,
  unit,
  fraction,
  reached,
}: {
  readonly label: string;
  /** Current value; undefined when there is no measurement yet. */
  readonly now: number | undefined;
  readonly target: number;
  readonly unit: string;
  readonly fraction: number;
  readonly reached: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const hasData = now != null;
  const delta = hasData ? Math.round((now - target) * 10) / 10 : 0;
  return (
    <View style={{ rowGap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="help" tabular style={{ fontFamily: theme.font.semibold }}>
          {hasData ? now : '—'} → {t('goals.targetLabel', { value: `${target} ${unit}` })}
        </AppText>
      </View>
      <Progress value={fraction} tone={!hasData ? 'primary' : reached ? 'ok' : 'warn'} />
      {!hasData ? (
        <AppText variant="help">{t('goals.noData')}</AppText>
      ) : reached ? (
        <Badge label={t('goals.reached')} tone="ok" />
      ) : (
        <AppText variant="help">{t('goals.toGo', { value: delta, unit })}</AppText>
      )}
    </View>
  );
}
