/**
 * Medication form — add / edit / delete a medication for the active patient.
 * Reused by the doctor ("prescribe") and the patient ("my medications", Phase 4).
 * Edit mode is keyed by the `medId` route param. Intake times are derived from
 * the daily frequency (sensible defaults) to keep the form simple.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { PageHeader } from '../src/ui/PageHeader';
import { SegmentedControl } from '../src/ui/SegmentedControl';
import { TextField } from '../src/ui/TextField';

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
};

export default function MedicationFormScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { medId } = useLocalSearchParams<{ medId?: string }>();

  const medications = useAppStore((s) => s.medications);
  const addMedication = useAppStore((s) => s.addMedication);
  const updateMedication = useAppStore((s) => s.updateMedication);
  const deleteMedication = useAppStore((s) => s.deleteMedication);

  const existing = medId ? medications.find((m) => m.id === medId) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [dosage, setDosage] = useState(existing?.dosage ?? '');
  const [freq, setFreq] = useState(String(existing?.frequencyPerDay ?? 1));
  const [instructions, setInstructions] = useState(existing?.instructions ?? '');
  const [error, setError] = useState('');

  const onSave = () => {
    if (name.trim() === '') {
      setError(t('medForm.nameRequired'));
      return;
    }
    const frequencyPerDay = Number(freq);
    const intakeTimes = DEFAULT_TIMES[frequencyPerDay] ?? ['08:00'];
    const payload = { name: name.trim(), dosage: dosage.trim(), frequencyPerDay, intakeTimes, instructions: instructions.trim() };
    if (isEdit && existing) updateMedication(existing.id, payload);
    else addMedication(payload);
    router.back();
  };

  const onDelete = () => {
    if (existing) deleteMedication(existing.id);
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={isEdit ? t('medForm.titleEdit') : t('medForm.titleNew')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <Card style={{ rowGap: theme.space.gap }}>
          <TextField label={t('medForm.name')} value={name} onChangeText={(v) => { setName(v); setError(''); }} placeholder={t('medForm.namePlaceholder')} error={error || undefined} />
          <TextField label={t('medForm.dosage')} value={dosage} onChangeText={setDosage} placeholder="10 мг" />
          <View style={{ rowGap: 6 }}>
            <AppText variant="label">{t('medForm.frequency')}</AppText>
            <SegmentedControl
              value={freq}
              onChange={setFreq}
              options={[
                { value: '1', label: t('medForm.perDayN', { count: 1 }) },
                { value: '2', label: t('medForm.perDayN', { count: 2 }) },
                { value: '3', label: t('medForm.perDayN', { count: 3 }) },
              ]}
            />
            <AppText variant="help" color={theme.colors.text3}>
              {t('medForm.scheduleAt', { times: (DEFAULT_TIMES[Number(freq)] ?? ['08:00']).join(', ') })}
            </AppText>
          </View>
          <TextField label={t('medForm.instructions')} value={instructions} onChangeText={setInstructions} multiline placeholder={t('medForm.instructionsPlaceholder')} />
        </Card>

        <Button label={t('medForm.save')} block size="lg" leftIcon="check" onPress={onSave} />
        {isEdit ? (
          <Button label={t('medForm.delete')} block variant="secondary" leftIcon="trash" onPress={onDelete} />
        ) : null}
      </View>
    </ScrollView>
  );
}
