import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { useTheme } from '../src/theme/ThemeProvider';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Card } from '../src/ui/Card';
import { Chip } from '../src/ui/Chip';
import { Icon } from '../src/ui/Icon';
import { PageHeader } from '../src/ui/PageHeader';

export interface Article {
  readonly id: string;
  /** Category key (resolved to a label via `education.categories.<key>`). */
  readonly category: string;
  readonly title: string;
  readonly minutes: number;
  readonly summary: string;
  /** Body as ordered paragraphs. */
  readonly body: readonly string[];
  readonly points: readonly string[];
}

export default function EducationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const articles = t('education.list', { returnObjects: true }) as Article[];
  const categories = t('education.categories', { returnObjects: true }) as Record<string, string>;
  // Preserve first-seen category order from the article list.
  const categoryKeys = useMemo(() => [...new Set(articles.map((a) => a.category))], [articles]);

  const [selected, setSelected] = useState<string | null>(null);
  const visible = selected ? articles.filter((a) => a.category === selected) : articles;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('education.title')} subtitle={t('education.subtitle')} onBack={() => router.back()} />

      {/* Topic filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.space.screenPad, columnGap: 8, paddingBottom: 12 }}
      >
        <Chip label={t('education.all')} selected={selected === null} onPress={() => setSelected(null)} />
        {categoryKeys.map((key) => (
          <Chip key={key} label={categories[key]} selected={selected === key} onPress={() => setSelected(key)} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gapSm }}>
        {visible.map((article) => (
          <Pressable
            key={article.id}
            onPress={() => router.push(`/article?id=${article.id}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Card style={{ rowGap: 8 }}>
              <Badge label={categories[article.category] ?? article.category} tone="info" dot={false} />
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
