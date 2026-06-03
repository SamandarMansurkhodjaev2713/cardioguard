import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../src/store/useAppStore';
import { AppText } from '../src/ui/AppText';
import { BrandMark } from '../src/ui/BrandMark';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { TextField } from '../src/ui/TextField';
import { useTheme } from '../src/theme/ThemeProvider';

export default function AuthScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const enterAs = useAppStore((s) => s.enterAs);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const enterPatient = () => {
    enterAs('patient');
    router.replace('/(patient)/dashboard');
  };
  const enterDoctor = () => {
    enterAs('doctor');
    router.replace('/(doctor)/overview');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{
        paddingHorizontal: theme.space.screenPad,
        paddingTop: insets.top + 36,
        paddingBottom: insets.bottom + 24,
        rowGap: theme.space.sectionGap,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Brand */}
      <View style={{ alignItems: 'center', rowGap: 10 }}>
        <BrandMark size={64} />
        <AppText variant="display" center style={{ marginTop: 6 }}>
          {t('common.appName')}
        </AppText>
        <AppText variant="bodyMedium" color={theme.colors.text2} center>
          {t('common.tagline')}
        </AppText>
        <AppText variant="help" center style={{ maxWidth: 300 }}>
          {t('common.subtitle')}
        </AppText>
      </View>

      {/* Login card */}
      <Card style={{ rowGap: theme.space.gap }}>
        <TextField
          label={t('auth.userId')}
          value={userId}
          onChangeText={setUserId}
          placeholder={t('auth.userIdPlaceholder')}
          autoCapitalize="characters"
        />
        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secure
          showPasswordLabel={t('auth.showPassword')}
          hidePasswordLabel={t('auth.hidePassword')}
        />
        <Button label={t('auth.login')} block onPress={enterPatient} />

        <Divider label={t('auth.demoAccess')} />

        <Button
          label={t('auth.asPatient')}
          variant="secondary"
          leftIcon="user"
          block
          onPress={enterPatient}
        />
        <Button
          label={t('auth.asDoctor')}
          variant="teal"
          leftIcon="users"
          block
          onPress={enterDoctor}
        />
      </Card>

      <Button
        label={t('auth.startOnboarding')}
        variant="ghost"
        block
        onPress={() => router.push('/onboarding')}
      />

      {/* Disclaimer */}
      <Card variant="soft" style={{ flexDirection: 'row', columnGap: 9 }}>
        <Icon name="info" size={16} color={theme.colors.text3} />
        <AppText variant="help" style={{ flex: 1 }}>
          {t('auth.footer')}
        </AppText>
      </Card>
    </ScrollView>
  );
}

function Divider({ label }: { readonly label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, marginVertical: 2 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.hairline }} />
      <AppText variant="help" style={{ letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </AppText>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.hairline }} />
    </View>
  );
}
