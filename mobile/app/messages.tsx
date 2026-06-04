/**
 * Patient ↔ doctor message thread for the active patient. Used by both roles:
 * the current role's messages align right, the other party's left. Marks the
 * other party's messages read on open. Local-only for now (same device), but
 * the shape is ready for a real backend.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Button } from '../src/ui/Button';
import { EmptyState } from '../src/ui/EmptyState';
import { PageHeader } from '../src/ui/PageHeader';
import { TextField } from '../src/ui/TextField';
import { formatLongDate } from '../src/utils/format';

export default function MessagesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const messages = useAppStore((s) => s.messages);
  const role = useAppStore((s) => s.role);
  const profile = useAppStore((s) => s.profile);
  const language = useAppStore((s) => s.language);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const markMessagesRead = useAppStore((s) => s.markMessagesRead);
  const [text, setText] = useState('');

  useEffect(() => {
    markMessagesRead();
  }, [markMessagesRead]);

  const onSend = () => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    sendMessage(trimmed);
    setText('');
  };

  const subtitle = role === 'doctor' ? profile.fullName : t('messages.withDoctor');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('messages.title')} subtitle={subtitle} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {messages.length === 0 ? (
          <EmptyState icon="info" title={t('messages.empty')} hint={t('messages.emptyHint')} />
        ) : (
          <View style={{ rowGap: 10 }}>
            {messages.map((m) => {
              const mine = m.fromRole === role;
              return (
                <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <View
                    style={{
                      maxWidth: '82%',
                      paddingVertical: 9,
                      paddingHorizontal: 13,
                      borderRadius: 14,
                      backgroundColor: mine ? theme.colors.primary : theme.colors.surface,
                      borderWidth: mine ? 0 : 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <AppText variant="body" color={mine ? theme.colors.onPrimary : theme.colors.text} style={{ lineHeight: 20 }}>
                      {m.text}
                    </AppText>
                  </View>
                  <AppText variant="help" color={theme.colors.text3} style={{ marginTop: 3 }}>
                    {(mine ? t('messages.you') : role === 'doctor' ? t('roles.patient') : t('roles.doctorShort'))} · {formatLongDate(new Date(m.date), language)}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ rowGap: theme.space.gapSm }}>
          <TextField label={t('messages.newMessage')} value={text} onChangeText={setText} multiline placeholder={t('messages.placeholder')} />
          <Button label={t('messages.send')} block leftIcon="send" onPress={onSend} />
        </View>
      </View>
    </ScrollView>
  );
}
