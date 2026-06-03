import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateBmi } from '../src/domain/calculators';
import type {
  ActivityLevel,
  HealthMeasurement,
  RiskGroup,
  Sex,
  SleepQuality,
  SmokingStatus,
  StressLevel,
  Ternary,
  UserProfile,
  WorkSchedule,
} from '../src/domain/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { OptionPills } from '../src/ui/OptionPills';
import { TextField } from '../src/ui/TextField';

const TOTAL_STEPS = 5;

function parseNumber(value: string, fallback: number): number {
  const n = Number(value.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const applyOnboarding = useAppStore((s) => s.applyOnboarding);

  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('45');
  const [sex, setSex] = useState<Sex>('male');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('80');
  const [waist, setWaist] = useState('92');
  const [smoking, setSmoking] = useState<SmokingStatus>('never');
  const [diabetes, setDiabetes] = useState<Ternary>('no');
  const [hypertension, setHypertension] = useState<Ternary>('no');
  const [familyHistory, setFamilyHistory] = useState<Ternary>('no');
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>('regular');
  const [riskGroup, setRiskGroup] = useState<RiskGroup>('civilian');
  const [activity, setActivity] = useState<ActivityLevel>('medium');
  const [sleep, setSleep] = useState<SleepQuality>('good');
  const [stress, setStress] = useState<StressLevel>('low');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('70');

  const ternaryOptions = (['yes', 'no', 'unknown'] as Ternary[]).map((v) => ({ value: v, label: t(`enums.ternary.${v}`) }));

  const canProceed = step !== 0 || consent;

  const goBack = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const finish = () => {
    const h = parseNumber(height, 175);
    const w = parseNumber(weight, 80);
    const wc = parseNumber(waist, 92);
    const now = new Date().toISOString();
    const profile: UserProfile = {
      id: 'user_01',
      anonymizedId: `P-${1000 + Math.floor(Math.random() * 9000)}`,
      fullName: name.trim() || t('roles.patient'),
      age: Math.round(parseNumber(age, 45)),
      sex,
      heightCm: h,
      weightKg: w,
      waistCircumferenceCm: wc,
      smokingStatus: smoking,
      diabetesStatus: diabetes,
      hypertensionStatus: hypertension,
      onHypertensiveMedication: false,
      familyHistoryCvd: familyHistory,
      workScheduleType: workSchedule,
      professionalRiskGroup: riskGroup,
      physicalActivityLevel: activity,
      sleepQuality: sleep,
      stressLevel: stress,
      createdAt: now,
      updatedAt: now,
    };
    const baseline: HealthMeasurement = {
      id: 'm_onboarding',
      userId: profile.id,
      date: now,
      systolicBp: Math.round(parseNumber(systolic, 120)),
      diastolicBp: Math.round(parseNumber(diastolic, 80)),
      heartRate: Math.round(parseNumber(heartRate, 70)),
      weightKg: w,
      bmi: calculateBmi(w, h),
      waistCircumferenceCm: wc,
      sleepHours: sleep === 'good' ? 8 : sleep === 'disturbed' ? 6 : 5,
      stressLevel: stress,
      physicalActivityMinutes: activity === 'high' ? 45 : activity === 'medium' ? 25 : 5,
      notes: '',
    };
    applyOnboarding(profile, baseline);
    router.replace('/(patient)/dashboard');
  };

  const onNext = () => (step < TOTAL_STEPS - 1 ? setStep((s) => s + 1) : finish());

  const stepTitles = [
    t('onboarding.steps.consent'),
    t('onboarding.steps.profile'),
    t('onboarding.steps.factors'),
    t('onboarding.steps.lifestyle'),
    t('onboarding.steps.baseline'),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {/* Header with progress */}
      <View style={{ paddingHorizontal: theme.space.screenPad, paddingTop: insets.top + 14, paddingBottom: 12, rowGap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 11 }}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            hitSlop={8}
            style={{
              width: 38, height: 38, borderRadius: theme.radius.sm,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
            }}
          >
            <Icon name="chevronLeft" size={20} color={theme.colors.text2} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="help">{t('onboarding.stepLabel', { current: step + 1, total: TOTAL_STEPS })}</AppText>
            <AppText variant="h2">{stepTitles[step]}</AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', columnGap: 5 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 999,
                backgroundColor: i <= step ? theme.colors.primary : theme.colors.surface2,
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: theme.space.screenPad, paddingBottom: 16, rowGap: theme.space.gap }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
          <>
            <Card style={{ flexDirection: 'row', columnGap: 12 }}>
              <Icon name="shield" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1, rowGap: 4 }}>
                <AppText variant="title">{t('onboarding.consent.purposeTitle')}</AppText>
                <AppText variant="help" color={theme.colors.text2} style={{ lineHeight: 19 }}>{t('onboarding.consent.purpose')}</AppText>
              </View>
            </Card>
            <View
              style={{
                flexDirection: 'row', columnGap: 9, padding: 12,
                borderRadius: theme.radius.field,
                backgroundColor: theme.colors.infoBg, borderWidth: 1, borderColor: theme.colors.infoBd,
              }}
            >
              <Icon name="info" size={16} color={theme.colors.info} />
              <AppText variant="help" color={theme.colors.info} style={{ flex: 1, lineHeight: 18 }}>{t('onboarding.consent.disclaimer')}</AppText>
            </View>
            <Pressable onPress={() => setConsent((c) => !c)} style={{ flexDirection: 'row', columnGap: 11, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 22, height: 22, borderRadius: 6, marginTop: 1,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: consent ? theme.colors.primary : theme.colors.surface,
                  borderWidth: 2, borderColor: consent ? theme.colors.primary : theme.colors.border2,
                }}
              >
                {consent ? <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <AppText variant="help" color={theme.colors.text} style={{ flex: 1, lineHeight: 18 }}>{t('onboarding.consent.accept')}</AppText>
            </Pressable>
          </>
        ) : null}

        {step === 1 ? (
          <Card style={{ rowGap: theme.space.gap }}>
            <TextField label={t('onboarding.fields.name')} value={name} onChangeText={setName} placeholder={t('onboarding.fields.namePlaceholder')} />
            <Field label={t('onboarding.fields.sex')}>
              <OptionPills<Sex>
                value={sex}
                onChange={setSex}
                options={[{ value: 'male', label: t('enums.sex.male') }, { value: 'female', label: t('enums.sex.female') }]}
              />
            </Field>
            <Row gap={theme.space.gap}>
              <View style={{ flex: 1 }}><TextField label={t('onboarding.fields.age')} value={age} onChangeText={setAge} keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><TextField label={t('onboarding.fields.height')} value={height} onChangeText={setHeight} keyboardType="number-pad" suffix={t('units.cm')} /></View>
            </Row>
            <Row gap={theme.space.gap}>
              <View style={{ flex: 1 }}><TextField label={t('onboarding.fields.weight')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix={t('units.kg')} /></View>
              <View style={{ flex: 1 }}><TextField label={t('onboarding.fields.waist')} value={waist} onChangeText={setWaist} keyboardType="decimal-pad" suffix={t('units.cm')} /></View>
            </Row>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card style={{ rowGap: theme.space.gap }}>
            <Field label={t('onboarding.fields.smoking')}>
              <OptionPills<SmokingStatus>
                value={smoking}
                onChange={setSmoking}
                options={(['never', 'former', 'current'] as SmokingStatus[]).map((v) => ({ value: v, label: t(`enums.smoking.${v}`) }))}
              />
            </Field>
            <Field label={t('onboarding.fields.diabetes')}><OptionPills<Ternary> value={diabetes} onChange={setDiabetes} options={ternaryOptions} /></Field>
            <Field label={t('onboarding.fields.hypertension')}><OptionPills<Ternary> value={hypertension} onChange={setHypertension} options={ternaryOptions} /></Field>
            <Field label={t('onboarding.fields.familyHistory')}><OptionPills<Ternary> value={familyHistory} onChange={setFamilyHistory} options={ternaryOptions} /></Field>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card style={{ rowGap: theme.space.gap }}>
            <Field label={t('onboarding.fields.workSchedule')}>
              <OptionPills<WorkSchedule>
                value={workSchedule}
                onChange={setWorkSchedule}
                options={(['regular', 'shift', 'night'] as WorkSchedule[]).map((v) => ({ value: v, label: t(`enums.workSchedule.${v}`) }))}
              />
            </Field>
            <Field label={t('onboarding.fields.riskGroup')}>
              <OptionPills<RiskGroup>
                value={riskGroup}
                onChange={setRiskGroup}
                options={(['civilian', 'lawEnforcement', 'military', 'other'] as RiskGroup[]).map((v) => ({ value: v, label: t(`enums.riskGroup.${v}`) }))}
              />
            </Field>
            <Field label={t('onboarding.fields.activity')}>
              <OptionPills<ActivityLevel>
                value={activity}
                onChange={setActivity}
                options={(['low', 'medium', 'high'] as ActivityLevel[]).map((v) => ({ value: v, label: t(`enums.activity.${v}`) }))}
              />
            </Field>
            <Field label={t('onboarding.fields.sleep')}>
              <OptionPills<SleepQuality>
                value={sleep}
                onChange={setSleep}
                options={(['good', 'disturbed', 'insufficient'] as SleepQuality[]).map((v) => ({ value: v, label: t(`enums.sleep.${v}`) }))}
              />
            </Field>
            <Field label={t('onboarding.fields.stress')}>
              <OptionPills<StressLevel>
                value={stress}
                onChange={setStress}
                options={(['low', 'medium', 'high'] as StressLevel[]).map((v) => ({ value: v, label: t(`enums.stress.${v}`) }))}
              />
            </Field>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card style={{ rowGap: theme.space.gap }}>
            <Row gap={theme.space.gap}>
              <View style={{ flex: 1 }}><TextField label={t('onboarding.fields.systolic')} value={systolic} onChangeText={setSystolic} keyboardType="number-pad" suffix={t('units.mmHg')} /></View>
              <View style={{ flex: 1 }}><TextField label={t('onboarding.fields.diastolic')} value={diastolic} onChangeText={setDiastolic} keyboardType="number-pad" suffix={t('units.mmHg')} /></View>
            </Row>
            <TextField label={t('onboarding.fields.heartRate')} value={heartRate} onChangeText={setHeartRate} keyboardType="number-pad" suffix={t('units.bpm')} />
          </Card>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View style={{ paddingHorizontal: theme.space.screenPad, paddingTop: 10, paddingBottom: insets.bottom + 14, backgroundColor: theme.colors.bg, borderTopWidth: 1, borderTopColor: theme.colors.hairline }}>
        <Button
          label={step < TOTAL_STEPS - 1 ? t('onboarding.next') : t('onboarding.finish')}
          block
          size="lg"
          disabled={!canProceed}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <View style={{ rowGap: 8 }}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}

function Row({ children, gap }: { readonly children: ReactNode; readonly gap: number }) {
  return <View style={{ flexDirection: 'row', columnGap: gap }}>{children}</View>;
}
