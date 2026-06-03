import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Card } from '../src/ui/Card';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';

export interface Article {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly minutes: number;
  readonly summary: string;
  readonly body: string;
  readonly points: readonly string[];
}

export default function EducationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const articles = t('education.list', { returnObjects: true }) as Article[];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('education.title')} subtitle={t('education.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gapSm }}>
        {articles.map((article) => (
          <Pressable
            key={article.id}
            onPress={() => router.push(`/article?id=${article.id}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Card style={{ rowGap: 8 }}>
              <Badge label={article.category} tone="info" dot={false} />
              <AppText variant="title">{article.title}</AppText>
              <AppText variant="help" color={theme.colors.text2} style={{ lineHeight: 18 }}>{article.summary}</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                  <Icon name="clock" size={13} color={theme.colors.text3} />
                  <AppText variant="help">{t('education.minutes', { count: article.minutes })}</AppText>
                </View>
                <Icon name="chevronRight" size={18} color={theme.colors.text3} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
