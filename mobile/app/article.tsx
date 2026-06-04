import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';
import type { Article } from './education';

export default function ArticleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const articles = t('education.list', { returnObjects: true }) as Article[];
  const categories = t('education.categories', { returnObjects: true }) as Record<string, string>;
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <PageHeader title={t('education.title')} onBack={() => router.back()} />
        <AppText variant="help" center style={{ marginTop: 40 }}>{t('education.notFound')}</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={categories[article.category] ?? article.category} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        <View style={{ rowGap: 8 }}>
          <AppText variant="h1">{article.title}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
            <Icon name="clock" size={13} color={theme.colors.text3} />
            <AppText variant="help">{t('education.minutes', { count: article.minutes })}</AppText>
          </View>
        </View>

        <View style={{ rowGap: 12 }}>
          {article.body.map((paragraph, i) => (
            <AppText key={i} variant="body" color={theme.colors.text} style={{ lineHeight: 23 }}>{paragraph}</AppText>
          ))}
        </View>

        <AppText variant="h2" style={{ marginTop: 4 }}>{t('education.keyPoints')}</AppText>
        <Card style={{ rowGap: 11 }}>
          {article.points.map((point, i) => (
            <View key={i} style={{ flexDirection: 'row', columnGap: 9, alignItems: 'flex-start' }}>
              <Icon name="check" size={16} color={theme.colors.teal} />
              <AppText variant="help" color={theme.colors.text} style={{ flex: 1, lineHeight: 18 }}>{point}</AppText>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
