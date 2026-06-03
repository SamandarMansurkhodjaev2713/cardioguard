/**
 * "More" hub — shared by patient and doctor. Identity card, navigation menu, and
 * in-app preferences (language, density, corner radius) wired to the store /
 * theme provider. Used by both `(patient)/more` and `(doctor)/more`.
 */

import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { useTheme, useThemeControls, type AppearancePreference } from '../theme/ThemeProvider';
import type { DensityPreset, RadiusPreset } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon, type IconName } from '../ui/Icon';
import { PageHeader } from '../ui/PageHeader';
import { RolePill } from '../ui/RolePill';
import { SegmentedControl } from '../ui/SegmentedControl';

export function MoreView() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const role = useAppStore((s) => s.role);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const { preferences, setDensity, setRadius, setAppearance } = useThemeControls();

  const [resetDone, setResetDone] = useState(false);
  const onResetDemo = () => {
    resetDemo();
    setResetDone(true);
  };

  const menu: Array<{ key: IconName; label: string; href: string }> = [
    ...(role === 'patient'
      ? [
          { key: 'heart' as IconName, label: t('profile.title'), href: '/profile' },
          { key: 'sparkles' as IconName, label: t('insights.title'), href: '/insights' },
          { key: 'moon' as IconName, label: t('wellbeing.title'), href: '/wellbeing' },
          { key: 'trendingUp' as IconName, label: t('goals.title'), href: '/goals' },
        ]
      : []),
    { key: 'graduation', label: t('more.menu.recommendations'), href: '/recommendations' },
    { key: 'education', label: t('more.menu.education'), href: '/education' },
    { key: 'info', label: t('more.menu.about'), href: '/about' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('more.title')} right={<RolePill label={t(`roles.${role === 'doctor' ? 'doctorShort' : 'patient'}`)} role={role} />} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {/* Identity */}
        <Card style={{ flexDirection: 'row', alignItems: 'center', columnGap: 13 }}>
          <View
            style={{
              width: 46, height: 46, borderRadius: 14,
              backgroundColor: role === 'doctor' ? theme.colors.tealSoft : theme.colors.primarySoft,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name={role === 'doctor' ? 'stethoscope' : 'user'} size={22} color={role === 'doctor' ? theme.colors.teal : theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title">{profile.fullName}</AppText>
            <AppText variant="help" tabular>ID: {profile.anonymizedId}</AppText>
          </View>
        </Card>

        {/* Menu */}
        <Card bare style={{ paddingHorizontal: theme.space.padCard }}>
          {menu.map((item, i) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 12,
                paddingVertical: theme.space.rowPad + 1,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.colors.hairline,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name={item.key} size={19} color={theme.colors.primary} />
              <AppText variant="body" style={{ flex: 1, fontFamily: theme.font.medium }}>{item.label}</AppText>
              <Icon name="chevronRight" size={18} color={theme.colors.text3} />
            </Pressable>
          ))}
        </Card>

        {/* Settings */}
        <AppText variant="h2" style={{ marginTop: 4 }}>{t('more.settingsTitle')}</AppText>
        <Card style={{ rowGap: theme.space.gap }}>
          <Setting label={t('more.language')}>
            <SegmentedControl<AppLanguage>
              value={language}
              onChange={setLanguage}
              options={[
                { value: 'ru', label: t('more.languageRu') },
                { value: 'uz', label: t('more.languageUz') },
              ]}
            />
          </Setting>
          <Setting label={t('more.density')}>
            <SegmentedControl<DensityPreset>
              value={preferences.density}
              onChange={setDensity}
              options={[
                { value: 'compact', label: t('more.densityCompact') },
                { value: 'comfortable', label: t('more.densityComfortable') },
              ]}
            />
          </Setting>
          <Setting label={t('more.radius')}>
            <SegmentedControl<RadiusPreset>
              value={preferences.radius}
              onChange={setRadius}
              options={[
                { value: 'strict', label: t('more.radiusStrict') },
                { value: 'soft', label: t('more.radiusSoft') },
              ]}
            />
          </Setting>
          <Setting label={t('more.appearance')}>
            <SegmentedControl<AppearancePreference>
              value={preferences.appearance}
              onChange={setAppearance}
              options={[
                { value: 'light', label: t('more.appearanceLight') },
                { value: 'dark', label: t('more.appearanceDark') },
                { value: 'system', label: t('more.appearanceSystem') },
              ]}
            />
          </Setting>
        </Card>

        {/* Data management */}
        <AppText variant="h2" style={{ marginTop: 4 }}>{t('more.dataTitle')}</AppText>
        <Card style={{ rowGap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="label">{t('more.resetDemo')}</AppText>
              <AppText variant="help" color={theme.colors.text3}>{t('more.resetDemoHint')}</AppText>
            </View>
            {resetDone ? <Badge label={t('more.resetDone')} tone="ok" /> : null}
          </View>
          <Button label={t('more.resetDemo')} variant="secondary" leftIcon="trash" block onPress={onResetDemo} />
        </Card>

        <Button label={t('more.switchRole')} variant="secondary" leftIcon="logout" block onPress={() => router.replace('/')} />
      </View>
    </ScrollView>
  );
}

function Setting({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <View style={{ rowGap: 7 }}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}
