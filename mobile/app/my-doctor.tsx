/**
 * "My doctor" — the patient links to a clinician by invite code (`linkToDoctor`)
 * and, once linked, sees the doctor and can open the message thread. The link is
 * what makes the patient appear in that doctor's roster.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectLinkedDoctor, useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';
import { TextField } from '../src/ui/TextField';

export default function MyDoctorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const doctor = useAppStore(selectLinkedDoctor);
  const linkToDoctor = useAppStore((s) => s.linkToDoctor);
  const unlinkDoctor = useAppStore((s) => s.unlinkDoctor);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const onLink = () => {
    if (code.trim() === '') return;
    const ok = linkToDoctor(code);
    if (!ok) {
      setError(t('myDoctor.invalidCode'));
      return;
    }
    setCode('');
    setError('');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('myDoctor.title')} subtitle={t('myDoctor.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {doctor ? (
          <>
            <Card style={{ rowGap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.tealSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="users" size={20} color={theme.colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="title">{doctor.fullName}</AppText>
                  <AppText variant="help" color={theme.colors.text3}>{doctor.specialty}{doctor.organization ? ` · ${doctor.organization}` : ''}</AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                <Icon name="check" size={15} color={theme.colors.ok} />
                <AppText variant="help" color={theme.colors.ok}>{t('myDoctor.linked')}</AppText>
              </View>
            </Card>

            <Button label={t('messages.title')} variant="teal" leftIcon="send" block onPress={() => router.push('/messages')} />
            <Button label={t('myDoctor.unlink')} variant="secondary" leftIcon="logout" block onPress={unlinkDoctor} />
          </>
        ) : (
          <>
            <AppText variant="help">{t('myDoctor.intro')}</AppText>
            <Card style={{ rowGap: theme.space.gap }}>
              <TextField
                label={t('myDoctor.codeLabel')}
                value={code}
                onChangeText={(v) => { setCode(v); setError(''); }}
                placeholder="CARD-4827"
                autoCapitalize="characters"
                error={error || undefined}
              />
              <Button label={t('myDoctor.link')} block leftIcon="check" onPress={onLink} />
            </Card>
            <AppText variant="help" color={theme.colors.text3}>{t('myDoctor.demoHint')}</AppText>
          </>
        )}
      </View>
    </ScrollView>
  );
}
