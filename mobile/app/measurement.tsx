import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateBmi, classifyBmi } from '../src/domain/calculators';
import type { StressLevel } from '../src/domain/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';
import { SegmentedControl } from '../src/ui/SegmentedControl';
import { TextField } from '../src/ui/TextField';

/** Plausible clinical input ranges (defensive validation — C-01 edge cases). */
const RANGE = {
  systolic: [60, 260],
  diastolic: [40, 160],
  heartRate: [30, 220],
  weight: [30, 300],
  waist: [40, 200],
  sleep: [0, 16],
  activity: [0, 600],
  glucose: [2, 35],
  spo2: [50, 100],
  steps: [0, 100000],
} as const;

type FieldKey = keyof typeof RANGE;

function parseNumber(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (normalized === '') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function inRange(value: number, key: FieldKey): boolean {
  const [min, max] = RANGE[key];
  return value >= min && value <= max;
}

export default function MeasurementScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const profile = useAppStore((s) => s.profile);
  const addMeasurement = useAppStore((s) => s.addMeasurement);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [waist, setWaist] = useState(String(profile.waistCircumferenceCm));
  const [sleep, setSleep] = useState('7');
  const [activity, setActivity] = useState('30');
  const [stress, setStress] = useState<StressLevel>('low');
  const [glucose, setGlucose] = useState('');
  const [spo2, setSpo2] = useState('');
  const [steps, setSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fieldError = (raw: string, key: FieldKey, required: boolean): string | undefined => {
    if (!submitted) return undefined;
    const value = parseNumber(raw);
    if (value === null) return required ? t('measurement.errorRequired') : undefined;
    return inRange(value, key) ? undefined : t('measurement.errorRange');
  };

  const weightValue = parseNumber(weight);
  const bmiPreview = useMemo(() => {
    if (weightValue === null || !inRange(weightValue, 'weight')) return null;
    const bmi = calculateBmi(weightValue, profile.heightCm);
    return { bmi, category: classifyBmi(bmi) };
  }, [weightValue, profile.heightCm]);

  const onSave = () => {
    setSubmitted(true);
    const sys = parseNumber(systolic);
    const dia = parseNumber(diastolic);
    const hr = parseNumber(heartRate);
    const w = parseNumber(weight);
    const wc = parseNumber(waist);
    const sl = parseNumber(sleep);
    const act = parseNumber(activity);

    const required: Array<[number | null, FieldKey]> = [
      [sys, 'systolic'],
      [dia, 'diastolic'],
      [hr, 'heartRate'],
      [w, 'weight'],
    ];
    const requiredOk = required.every(([v, k]) => v !== null && inRange(v, k));
    const glu = parseNumber(glucose);
    const sat = parseNumber(spo2);
    const stp = parseNumber(steps);
    const optionalOk = ([
      [wc, 'waist'],
      [sl, 'sleep'],
      [act, 'activity'],
      [glu, 'glucose'],
      [sat, 'spo2'],
      [stp, 'steps'],
    ] as Array<[number | null, FieldKey]>).every(([v, k]) => v === null || inRange(v, k));

    if (!requiredOk || !optionalOk || sys === null || dia === null || hr === null || w === null) {
      return;
    }

    addMeasurement({
      systolicBp: Math.round(sys),
      diastolicBp: Math.round(dia),
      heartRate: Math.round(hr),
      weightKg: w,
      waistCircumferenceCm: wc ?? profile.waistCircumferenceCm,
      sleepHours: sl ?? 0,
      stressLevel: stress,
      physicalActivityMinutes: Math.round(act ?? 0),
      glucoseMmol: glu ?? undefined,
      spo2Percent: sat ?? undefined,
      steps: stp !== null ? Math.round(stp) : undefined,
      notes: notes.trim(),
    });
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('measurement.title')} subtitle={t('measurement.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <Card style={{ rowGap: theme.space.gap }}>
          <Row gap={theme.space.gap}>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.systolic')} value={systolic} onChangeText={setSystolic}
                keyboardType="number-pad" suffix={t('units.mmHg')} error={fieldError(systolic, 'systolic', true)} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.diastolic')} value={diastolic} onChangeText={setDiastolic}
                keyboardType="number-pad" suffix={t('units.mmHg')} error={fieldError(diastolic, 'diastolic', true)} />
            </View>
          </Row>
          <Row gap={theme.space.gap}>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.heartRate')} value={heartRate} onChangeText={setHeartRate}
                keyboardType="number-pad" suffix={t('units.bpm')} error={fieldError(heartRate, 'heartRate', true)} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.weight')} value={weight} onChangeText={setWeight}
                keyboardType="decimal-pad" suffix={t('units.kg')} error={fieldError(weight, 'weight', true)} />
            </View>
          </Row>

          {bmiPreview ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 7 }}>
              <Icon name="bmi" size={15} color={theme.colors.primary} />
              <AppText variant="help" color={theme.colors.text2}>
                {t('measurement.bmiPreview', {
                  bmi: bmiPreview.bmi,
                  category: t(`enums.bmiCategory.${bmiPreview.category}`),
                })}
              </AppText>
            </View>
          ) : null}
        </Card>

        <Card style={{ rowGap: theme.space.gap }}>
          <Row gap={theme.space.gap}>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.waist')} value={waist} onChangeText={setWaist}
                keyboardType="decimal-pad" suffix={t('units.cm')} error={fieldError(waist, 'waist', false)} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.sleep')} value={sleep} onChangeText={setSleep}
                keyboardType="decimal-pad" suffix={t('units.hours')} error={fieldError(sleep, 'sleep', false)} />
            </View>
          </Row>
          <TextField label={t('measurement.activity')} value={activity} onChangeText={setActivity}
            keyboardType="number-pad" suffix={t('units.min')} error={fieldError(activity, 'activity', false)} />

          <View style={{ rowGap: 6 }}>
            <AppText variant="label">{t('measurement.stress')}</AppText>
            <SegmentedControl<StressLevel>
              value={stress}
              onChange={setStress}
              options={[
                { value: 'low', label: t('enums.stress.low') },
                { value: 'medium', label: t('enums.stress.medium') },
                { value: 'high', label: t('enums.stress.high') },
              ]}
            />
          </View>

          <TextField label={t('measurement.notes')} value={notes} onChangeText={setNotes}
            placeholder={t('measurement.notesPlaceholder')} />
        </Card>

        <Card style={{ rowGap: theme.space.gap }}>
          <AppText variant="label" color={theme.colors.text3}>{t('measurement.optionalSection')}</AppText>
          <Row gap={theme.space.gap}>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.glucose')} value={glucose} onChangeText={setGlucose}
                keyboardType="decimal-pad" suffix={t('units.glucose')} error={fieldError(glucose, 'glucose', false)} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t('measurement.spo2')} value={spo2} onChangeText={setSpo2}
                keyboardType="number-pad" suffix={t('units.percent')} error={fieldError(spo2, 'spo2', false)} />
            </View>
          </Row>
          <TextField label={t('measurement.steps')} value={steps} onChangeText={setSteps}
            keyboardType="number-pad" suffix={t('units.steps')} error={fieldError(steps, 'steps', false)} />
        </Card>

        <Button label={t('measurement.save')} block size="lg" leftIcon="check" onPress={onSave} />
      </View>
    </ScrollView>
  );
}

function Row({ children, gap }: { readonly children: ReactNode; readonly gap: number }) {
  return <View style={{ flexDirection: 'row', columnGap: gap }}>{children}</View>;
}
