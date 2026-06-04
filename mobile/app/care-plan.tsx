/**
 * Care-plan editor (doctor action). Sets the active patient's targets and plan
 * note via `setCarePlan`; the targets also reflect into the patient's goal view,
 * so both sides see the same plan. Reached from the patient detail card.
 */

import { useRouter } from 'expo-router';
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
import { TextField } from '../src/ui/TextField';

function parseNum(v: string): number | undefined {
  const n = Number(v.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function CarePlanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const carePlan = useAppStore((s) => s.carePlan);
  const profile = useAppStore((s) => s.profile);
  const setCarePlan = useAppStore((s) => s.setCarePlan);

  const [systolic, setSystolic] = useState(carePlan.targetSystolicBp ? String(carePlan.targetSystolicBp) : '');
  const [weight, setWeight] = useState(carePlan.targetWeightKg ? String(carePlan.targetWeightKg) : '');
  const [alertSys, setAlertSys] = useState(carePlan.alertSystolicBp ? String(carePlan.alertSystolicBp) : '');
  const [note, setNote] = useState(carePlan.note ?? '');

  const onSave = () => {
    setCarePlan({
      targetSystolicBp: parseNum(systolic),
      targetWeightKg: parseNum(weight),
      alertSystolicBp: parseNum(alertSys),
      note: note.trim() || undefined,
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
      <PageHeader title={t('carePlan.title')} subtitle={profile.fullName} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <AppText variant="help">{t('carePlan.intro')}</AppText>

        <Card style={{ rowGap: theme.space.gap }}>
          <TextField label={t('carePlan.targetSystolic')} value={systolic} onChangeText={setSystolic} keyboardType="number-pad" suffix={t('units.mmHg')} placeholder="130" />
          <TextField label={t('carePlan.targetWeight')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix={t('units.kg')} placeholder="85" />
          <TextField label={t('carePlan.alertSystolic')} value={alertSys} onChangeText={setAlertSys} keyboardType="number-pad" suffix={t('units.mmHg')} placeholder="160" />
        </Card>

        <Card style={{ rowGap: theme.space.gap }}>
          <TextField label={t('carePlan.note')} value={note} onChangeText={setNote} multiline placeholder={t('carePlan.notePlaceholder')} />
        </Card>

        <Button label={t('carePlan.save')} block size="lg" leftIcon="check" onPress={onSave} />
      </View>
    </ScrollView>
  );
}
