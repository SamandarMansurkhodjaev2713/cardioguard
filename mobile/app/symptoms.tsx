/**
 * Symptom self-report (patient). Log a symptom (type · severity · note) via
 * `addSymptom`; the doctor sees the log in the patient card. Reverse-chronological
 * history below the form.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SymptomType } from '../src/domain/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import type { StatusTone } from '../src/theme/tokens';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { Chip } from '../src/ui/Chip';
import { EmptyState } from '../src/ui/EmptyState';
import { PageHeader } from '../src/ui/PageHeader';
import { SegmentedControl } from '../src/ui/SegmentedControl';
import { TextField } from '../src/ui/TextField';
import { formatLongDate } from '../src/utils/format';

const TYPES: readonly SymptomType[] = [
  'chestPain', 'shortnessOfBreath', 'palpitations', 'dizziness', 'headache', 'swelling', 'fatigue', 'other',
];
const SEVERITY_TONE: Record<number, StatusTone> = { 1: 'ok', 2: 'warn', 3: 'high' };

export default function SymptomsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const symptoms = useAppStore((s) => s.symptoms);
  const language = useAppStore((s) => s.language);
  const addSymptom = useAppStore((s) => s.addSymptom);

  const [type, setType] = useState<SymptomType>('chestPain');
  const [severity, setSeverity] = useState('2');
  const [note, setNote] = useState('');

  const onAdd = () => {
    addSymptom({ type, severity: Number(severity), note: note.trim() });
    setNote('');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('symptoms.title')} subtitle={t('symptoms.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <Card style={{ rowGap: theme.space.gap }}>
          <View style={{ rowGap: 8 }}>
            <AppText variant="label">{t('symptoms.type')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {TYPES.map((s) => (
                <Chip key={s} label={t(`symptoms.types.${s}`)} selected={type === s} onPress={() => setType(s)} />
              ))}
            </View>
          </View>
          <View style={{ rowGap: 8 }}>
            <AppText variant="label">{t('symptoms.severity')}</AppText>
            <SegmentedControl
              value={severity}
              onChange={setSeverity}
              options={[
                { value: '1', label: t('symptoms.severityLevels.mild') },
                { value: '2', label: t('symptoms.severityLevels.moderate') },
                { value: '3', label: t('symptoms.severityLevels.severe') },
              ]}
            />
          </View>
          <TextField label={t('symptoms.note')} value={note} onChangeText={setNote} multiline placeholder={t('symptoms.notePlaceholder')} />
          <Button label={t('symptoms.add')} block leftIcon="plus" onPress={onAdd} />
        </Card>

        <AppText variant="h2">{t('symptoms.history')}</AppText>
        {symptoms.length === 0 ? (
          <EmptyState icon="info" title={t('symptoms.empty')} />
        ) : (
          <View style={{ rowGap: theme.space.gapSm }}>
            {symptoms.map((s) => (
              <Card key={s.id} style={{ rowGap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
                  <AppText variant="title">{t(`symptoms.types.${s.type}`)}</AppText>
                  <Badge label={t(`symptoms.severityLevels.${s.severity === 1 ? 'mild' : s.severity === 2 ? 'moderate' : 'severe'}`)} tone={SEVERITY_TONE[s.severity] ?? 'warn'} />
                </View>
                <AppText variant="help" color={theme.colors.text3}>{formatLongDate(new Date(s.date), language)}</AppText>
                {s.note ? <AppText variant="help" color={theme.colors.text2}>{s.note}</AppText> : null}
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
