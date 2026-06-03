/**
 * Medical card (TZ Module 1). A grouped, read-first view of the personal +
 * clinical profile with an inline edit mode for the fields a user maintains
 * over time (clinical flags, chronic conditions, allergies, current-meds note,
 * unit, service years). Anthropometric weight/waist/BMI stay read-only here —
 * they are captured through measurements, not edited by hand.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateBmi } from '../src/domain/calculators';
import type { Sex, SmokingStatus, Ternary } from '../src/domain/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { OptionPills } from '../src/ui/OptionPills';
import { PageHeader } from '../src/ui/PageHeader';
import { SegmentedControl } from '../src/ui/SegmentedControl';
import { TextField } from '../src/ui/TextField';
import { ROUND_ONE_DECIMAL } from '../src/domain/constants';

const TERNARY_VALUES: readonly Ternary[] = ['yes', 'no', 'unknown'];
const SMOKING_VALUES: readonly SmokingStatus[] = ['never', 'former', 'current'];

/** Split a comma-separated input into a clean, de-duplicated label list. */
function splitList(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen];
}

/** Parse a positive integer, or undefined for blank/invalid (so it never clobbers). */
function parsePositiveInt(raw: string): number | undefined {
  const n = Number(raw.trim());
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

interface EditForm {
  age: string;
  sex: Sex;
  heightCm: string;
  smokingStatus: SmokingStatus;
  hypertensionStatus: Ternary;
  diabetesStatus: Ternary;
  dyslipidemiaStatus: Ternary;
  familyHistoryCvd: Ternary;
  chronicText: string;
  allergiesText: string;
  medicationNotes: string;
  unit: string;
  serviceYears: string;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const updateMedicalProfile = useAppStore((s) => s.updateMedicalProfile);

  const [editing, setEditing] = useState(false);
  const [savedShown, setSavedShown] = useState(false);
  const [form, setForm] = useState<EditForm>(() => snapshot());

  function snapshot(): EditForm {
    return {
      age: String(profile.age),
      sex: profile.sex,
      heightCm: String(profile.heightCm),
      smokingStatus: profile.smokingStatus,
      hypertensionStatus: profile.hypertensionStatus,
      diabetesStatus: profile.diabetesStatus,
      dyslipidemiaStatus: profile.dyslipidemiaStatus ?? 'unknown',
      familyHistoryCvd: profile.familyHistoryCvd,
      chronicText: (profile.chronicConditions ?? []).join(', '),
      allergiesText: (profile.allergies ?? []).join(', '),
      medicationNotes: profile.medicationNotes ?? '',
      unit: profile.unit ?? '',
      serviceYears: profile.serviceYears != null ? String(profile.serviceYears) : '',
    };
  }

  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const startEdit = () => {
    setForm(snapshot());
    setSavedShown(false);
    setEditing(true);
  };

  const onSave = () => {
    updateMedicalProfile({
      age: parsePositiveInt(form.age),
      sex: form.sex,
      heightCm: parsePositiveInt(form.heightCm),
      smokingStatus: form.smokingStatus,
      hypertensionStatus: form.hypertensionStatus,
      diabetesStatus: form.diabetesStatus,
      dyslipidemiaStatus: form.dyslipidemiaStatus,
      familyHistoryCvd: form.familyHistoryCvd,
      chronicConditions: splitList(form.chronicText),
      allergies: splitList(form.allergiesText),
      medicationNotes: form.medicationNotes.trim(),
      unit: form.unit.trim(),
      serviceYears: parsePositiveInt(form.serviceYears),
    });
    setEditing(false);
    setSavedShown(true);
  };

  const bmi = calculateBmi(profile.weightKg, profile.heightCm);
  const none = t('profile.none');
  const ternaryOptions = TERNARY_VALUES.map((v) => ({ value: v, label: t(`enums.ternary.${v}`) }));
  const list = (items: readonly string[] | undefined) =>
    items && items.length > 0 ? items.join(', ') : none;
  const text = (value: string | undefined) => (value && value.length > 0 ? value : none);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        onBack={() => router.back()}
        right={savedShown && !editing ? <Badge label={t('profile.saved')} tone="ok" /> : undefined}
      />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {/* Personal */}
        <Section title={t('profile.sections.personal')}>
          <ReadRow label={t('profile.fields.fullName')} value={profile.fullName} />
          <ReadRow label={t('profile.fields.anonymizedId')} value={profile.anonymizedId} tabular />
          {editing ? (
            <>
              <EditField label={t('profile.fields.age')}>
                <TextField value={form.age} onChangeText={(v) => set('age', v)} keyboardType="number-pad" suffix={t('units.years')} />
              </EditField>
              <EditField label={t('profile.fields.sex')}>
                <SegmentedControl<Sex>
                  value={form.sex}
                  onChange={(v) => set('sex', v)}
                  options={[
                    { value: 'male', label: t('enums.sex.male') },
                    { value: 'female', label: t('enums.sex.female') },
                  ]}
                />
              </EditField>
            </>
          ) : (
            <>
              <ReadRow label={t('profile.fields.age')} value={`${profile.age} ${t('units.years')}`} />
              <ReadRow label={t('profile.fields.sex')} value={t(`enums.sex.${profile.sex}`)} />
            </>
          )}
        </Section>

        {/* Anthropometry */}
        <Section title={t('profile.sections.anthropometry')}>
          {editing ? (
            <EditField label={t('profile.fields.height')}>
              <TextField value={form.heightCm} onChangeText={(v) => set('heightCm', v)} keyboardType="number-pad" suffix={t('units.cm')} />
            </EditField>
          ) : (
            <ReadRow label={t('profile.fields.height')} value={`${profile.heightCm} ${t('units.cm')}`} />
          )}
          <ReadRow label={t('profile.fields.weight')} value={`${profile.weightKg} ${t('units.kg')}`} />
          <ReadRow label={t('profile.fields.waist')} value={`${profile.waistCircumferenceCm} ${t('units.cm')}`} />
          <ReadRow label={t('profile.fields.bmi')} value={`${bmi} ${t('units.kgm2')}`} tabular />
        </Section>

        {/* Clinical history */}
        <Section title={t('profile.sections.clinical')}>
          {editing ? (
            <>
              <EditField label={t('profile.fields.hypertension')}>
                <OptionPills<Ternary> value={form.hypertensionStatus} onChange={(v) => set('hypertensionStatus', v)} options={ternaryOptions} />
              </EditField>
              <EditField label={t('profile.fields.diabetes')}>
                <OptionPills<Ternary> value={form.diabetesStatus} onChange={(v) => set('diabetesStatus', v)} options={ternaryOptions} />
              </EditField>
              <EditField label={t('profile.fields.dyslipidemia')}>
                <OptionPills<Ternary> value={form.dyslipidemiaStatus} onChange={(v) => set('dyslipidemiaStatus', v)} options={ternaryOptions} />
              </EditField>
              <EditField label={t('profile.fields.familyHistory')}>
                <OptionPills<Ternary> value={form.familyHistoryCvd} onChange={(v) => set('familyHistoryCvd', v)} options={ternaryOptions} />
              </EditField>
              <EditField label={t('profile.fields.smoking')}>
                <OptionPills<SmokingStatus>
                  value={form.smokingStatus}
                  onChange={(v) => set('smokingStatus', v)}
                  options={SMOKING_VALUES.map((v) => ({ value: v, label: t(`enums.smoking.${v}`) }))}
                />
              </EditField>
              <EditField label={t('profile.fields.chronicConditions')}>
                <TextField value={form.chronicText} onChangeText={(v) => set('chronicText', v)} help={t('profile.listHint')} />
              </EditField>
              <EditField label={t('profile.fields.allergies')}>
                <TextField value={form.allergiesText} onChangeText={(v) => set('allergiesText', v)} help={t('profile.listHint')} />
              </EditField>
              <EditField label={t('profile.fields.medicationNotes')}>
                <TextField value={form.medicationNotes} onChangeText={(v) => set('medicationNotes', v)} />
              </EditField>
            </>
          ) : (
            <>
              <ReadRow label={t('profile.fields.hypertension')} value={t(`enums.ternary.${profile.hypertensionStatus}`)} />
              <ReadRow label={t('profile.fields.diabetes')} value={t(`enums.ternary.${profile.diabetesStatus}`)} />
              <ReadRow label={t('profile.fields.dyslipidemia')} value={t(`enums.ternary.${profile.dyslipidemiaStatus ?? 'unknown'}`)} />
              <ReadRow label={t('profile.fields.familyHistory')} value={t(`enums.ternary.${profile.familyHistoryCvd}`)} />
              <ReadRow label={t('profile.fields.smoking')} value={t(`enums.smoking.${profile.smokingStatus}`)} />
              <ReadRow label={t('profile.fields.chronicConditions')} value={list(profile.chronicConditions)} />
              <ReadRow label={t('profile.fields.allergies')} value={list(profile.allergies)} />
              <ReadRow label={t('profile.fields.medicationNotes')} value={text(profile.medicationNotes)} />
            </>
          )}
        </Section>

        {/* Lifestyle (set during onboarding / measurements) */}
        <Section title={t('profile.sections.lifestyle')}>
          <ReadRow label={t('profile.fields.activity')} value={t(`enums.activity.${profile.physicalActivityLevel}`)} />
          <ReadRow label={t('profile.fields.sleep')} value={t(`enums.sleep.${profile.sleepQuality}`)} />
          <ReadRow label={t('profile.fields.stress')} value={t(`enums.stress.${profile.stressLevel}`)} />
          <ReadRow label={t('profile.fields.workSchedule')} value={t(`enums.workSchedule.${profile.workScheduleType}`)} />
        </Section>

        {/* Service */}
        <Section title={t('profile.sections.service')}>
          <ReadRow label={t('profile.fields.riskGroup')} value={t(`enums.riskGroup.${profile.professionalRiskGroup}`)} />
          {editing ? (
            <>
              <EditField label={t('profile.fields.unit')}>
                <TextField value={form.unit} onChangeText={(v) => set('unit', v)} />
              </EditField>
              <EditField label={t('profile.fields.serviceYears')}>
                <TextField value={form.serviceYears} onChangeText={(v) => set('serviceYears', v)} keyboardType="number-pad" suffix={t('units.years')} />
              </EditField>
            </>
          ) : (
            <>
              <ReadRow label={t('profile.fields.unit')} value={text(profile.unit)} />
              <ReadRow
                label={t('profile.fields.serviceYears')}
                value={profile.serviceYears != null ? `${profile.serviceYears} ${t('units.years')}` : none}
              />
            </>
          )}
        </Section>

        {editing ? (
          <View style={{ flexDirection: 'row', columnGap: theme.space.gap }}>
            <View style={{ flex: 1 }}>
              <Button label={t('profile.cancel')} variant="secondary" block onPress={() => setEditing(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={t('profile.save')} leftIcon="check" block onPress={onSave} />
            </View>
          </View>
        ) : (
          <Button label={t('profile.edit')} variant="secondary" leftIcon="edit" block onPress={startEdit} />
        )}
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ rowGap: theme.space.gapSm }}>
      <AppText variant="h2">{title}</AppText>
      <Card style={{ rowGap: theme.space.gap }}>{children}</Card>
    </View>
  );
}

function ReadRow({ label, value, tabular }: { readonly label: string; readonly value: string; readonly tabular?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', columnGap: 14 }}>
      <AppText variant="help" color={theme.colors.text2} style={{ flexShrink: 0, maxWidth: '52%' }}>{label}</AppText>
      <AppText
        tabular={tabular}
        style={{ flex: 1, textAlign: 'right', fontFamily: theme.font.medium, fontSize: 14 }}
      >
        {value}
      </AppText>
    </View>
  );
}

function EditField({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <View style={{ rowGap: 7 }}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}
