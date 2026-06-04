/**
 * Clinical notes for the active patient (doctor action). A reverse-chronological
 * list plus an input to add a note (`addNote`).
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
import { EmptyState } from '../src/ui/EmptyState';
import { PageHeader } from '../src/ui/PageHeader';
import { TextField } from '../src/ui/TextField';
import { formatLongDate } from '../src/utils/format';

export default function PatientNotesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const notes = useAppStore((s) => s.notes);
  const profile = useAppStore((s) => s.profile);
  const language = useAppStore((s) => s.language);
  const addNote = useAppStore((s) => s.addNote);
  const [text, setText] = useState('');

  const onAdd = () => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    addNote(trimmed);
    setText('');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('notes.title')} subtitle={profile.fullName} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <Card style={{ rowGap: theme.space.gap }}>
          <TextField label={t('notes.newNote')} value={text} onChangeText={setText} multiline placeholder={t('notes.placeholder')} />
          <Button label={t('notes.add')} block leftIcon="plus" onPress={onAdd} />
        </Card>

        {notes.length === 0 ? (
          <EmptyState icon="info" title={t('notes.empty')} />
        ) : (
          <View style={{ rowGap: theme.space.gapSm }}>
            {notes.map((note) => (
              <Card key={note.id} style={{ rowGap: 5 }}>
                <AppText variant="help" color={theme.colors.text3}>{formatLongDate(new Date(note.date), language)}</AppText>
                <AppText variant="body" color={theme.colors.text} style={{ lineHeight: 21 }}>{note.text}</AppText>
              </Card>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
