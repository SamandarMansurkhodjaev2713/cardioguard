import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { BrandMark } from '../src/ui/BrandMark';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const audience = t('about.audience', { returnObjects: true }) as string[];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('about.title')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <Card style={{ alignItems: 'center', rowGap: 10, paddingVertical: 22 }}>
          <BrandMark size={58} />
          <AppText variant="h1">{t('common.appName')}</AppText>
          <AppText variant="help">{t('about.version', { version: APP_VERSION })}</AppText>
        </Card>

        <AppText variant="body" color={theme.colors.text2} style={{ lineHeight: 21 }}>
          {t('about.intro')}
        </AppText>

        <AppText variant="h2" style={{ marginTop: 4 }}>{t('about.audienceTitle')}</AppText>
        <Card style={{ rowGap: 11 }}>
          {audience.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', columnGap: 9, alignItems: 'flex-start' }}>
              <Icon name="check" size={16} color={theme.colors.teal} />
              <AppText variant="help" color={theme.colors.text} style={{ flex: 1, lineHeight: 18 }}>{item}</AppText>
            </View>
          ))}
        </Card>

        <AppText variant="h2" style={{ marginTop: 4 }}>{t('about.techTitle')}</AppText>
        <Card>
          <AppText variant="help" color={theme.colors.text2} style={{ lineHeight: 19 }}>{t('about.tech')}</AppText>
        </Card>

        <View
          style={{
            flexDirection: 'row', columnGap: 9, padding: 12, marginTop: 4,
            borderRadius: theme.radius.field,
            backgroundColor: theme.colors.infoBg, borderWidth: 1, borderColor: theme.colors.infoBd,
          }}
        >
          <Icon name="info" size={16} color={theme.colors.info} />
          <View style={{ flex: 1, rowGap: 3 }}>
            <AppText style={{ fontFamily: theme.font.semibold, fontSize: 13, color: theme.colors.info }}>
              {t('about.disclaimerTitle')}
            </AppText>
            <AppText variant="help" color={theme.colors.info} style={{ lineHeight: 18 }}>{t('about.disclaimer')}</AppText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
