/**
 * Wellbeing / psycho-emotional monitoring (TZ Module 5). A weekly 6-item
 * check-in (each scored 0–4), an interpreted result (wellbeing score + one of
 * four states), a per-dimension breakdown, and the check-in history with a
 * trend. Scoring/classification/cadence are the pure domain's job
 * ({@link file://../src/domain/mood.ts}); this screen only collects and presents.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOOD } from '../src/domain/constants';
import {
  MOOD_DIMENSIONS,
  classifyMoodState,
  daysUntilNextMoodSurvey,
  isMoodSurveyDue,
  wellbeingBand,
  wellbeingScore,
} from '../src/domain/mood';
import type { MoodDimension, MoodEntry, MoodState } from '../src/domain/types';
import { selectMoodEntries, useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeProvider';
import type { StatusTone } from '../src/theme/tokens';
import { AppText } from '../src/ui/AppText';
import { Badge } from '../src/ui/Badge';
import { Button } from '../src/ui/Button';
import { Card } from '../src/ui/Card';
import { EmptyState } from '../src/ui/EmptyState';
import { LineChart, type ChartSeries } from '../src/ui/LineChart';
import { PageHeader } from '../src/ui/PageHeader';
import { Progress } from '../src/ui/Progress';
import { haptics } from '../src/utils/haptics';
import { shortDate } from '../src/utils/format';

const SCALE_POINTS = [0, 1, 2, 3, 4] as const;

const STATE_TONE: Record<MoodState, StatusTone> = {
  normal: 'ok',
  elevatedAnxiety: 'warn',
  chronicStress: 'warn',
  burnout: 'high',
};

const BAND_TONE = { good: 'ok', moderate: 'warn', low: 'high' } as const;

type Answers = Record<MoodDimension, number>;
const ZERO_ANSWERS: Answers = {
  lowMood: 0, anxiety: 0, stress: 0, emotionalInstability: 0, sleepProblems: 0, fatigue: 0,
};

export default function WellbeingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const moodEntries = useAppStore(selectMoodEntries);
  const addMoodEntry = useAppStore((s) => s.addMoodEntry);

  const due = useMemo(() => isMoodSurveyDue(moodEntries, new Date()), [moodEntries]);
  const daysLeft = useMemo(() => daysUntilNextMoodSurvey(moodEntries, new Date()), [moodEntries]);
  const latest = moodEntries[0];

  const [surveying, setSurveying] = useState(due && moodEntries.length === 0);
  const [answers, setAnswers] = useState<Answers>(ZERO_ANSWERS);

  const startSurvey = () => {
    setAnswers(ZERO_ANSWERS);
    setSurveying(true);
  };

  const submit = () => {
    addMoodEntry({ ...answers, note: '' });
    haptics.success();
    setSurveying(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageHeader title={t('wellbeing.title')} subtitle={t('wellbeing.subtitle')} onBack={() => router.back()} />

      <View style={{ paddingHorizontal: theme.space.screenPad, rowGap: theme.space.gap }}>
        {surveying ? (
          <SurveyForm answers={answers} onChange={setAnswers} onSubmit={submit} onCancel={() => setSurveying(false)} />
        ) : (
          <>
            <CadenceCard due={due} daysLeft={daysLeft} hasHistory={moodEntries.length > 0} onStart={startSurvey} />
            {latest ? <ResultCard entry={latest} /> : null}
            <HistorySection entries={moodEntries} language={language} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function CadenceCard({
  due, daysLeft, hasHistory, onStart,
}: {
  readonly due: boolean;
  readonly daysLeft: number;
  readonly hasHistory: boolean;
  readonly onStart: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card style={{ rowGap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
        <AppText variant="title" style={{ flex: 1 }}>
          {due ? t('wellbeing.dueNow') : t('wellbeing.upToDate')}
        </AppText>
        <Badge label={due ? t('wellbeing.dueNow') : t('wellbeing.nextIn', { count: daysLeft })} tone={due ? 'warn' : 'ok'} />
      </View>
      <AppText variant="help" color={theme.colors.text2}>{t('wellbeing.dueHint')}</AppText>
      <Button
        label={hasHistory ? t('wellbeing.retake') : t('wellbeing.start')}
        leftIcon="moon"
        block
        onPress={onStart}
      />
    </Card>
  );
}

function SurveyForm({
  answers, onChange, onSubmit, onCancel,
}: {
  readonly answers: Answers;
  readonly onChange: (next: Answers) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Card style={{ rowGap: theme.space.sectionGap }}>
        {MOOD_DIMENSIONS.map((dim) => (
          <ScaleSelector
            key={dim}
            label={t(`wellbeing.questions.${dim}`)}
            value={answers[dim]}
            onChange={(v) => onChange({ ...answers, [dim]: v })}
          />
        ))}
      </Card>
      <AppText variant="help" center>{t('wellbeing.note')}</AppText>
      <View style={{ flexDirection: 'row', columnGap: theme.space.gap }}>
        <View style={{ flex: 1 }}>
          <Button label={t('wellbeing.cancel')} variant="secondary" block onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={t('wellbeing.submit')} leftIcon="check" block onPress={onSubmit} />
        </View>
      </View>
    </>
  );
}

function ScaleSelector({
  label, value, onChange,
}: {
  readonly label: string;
  readonly value: number;
  readonly onChange: (value: number) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ rowGap: 8 }} accessibilityLabel={label}>
      <AppText variant="label">{label}</AppText>
      <View style={{ flexDirection: 'row', columnGap: 6 }}>
        {SCALE_POINTS.map((point) => {
          const selected = point === value;
          return (
            <Pressable
              key={point}
              onPress={() => { haptics.selection(); onChange(point); }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(`wellbeing.scale.${point}`)}
              style={{
                flex: 1,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radius.field,
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
              }}
            >
              <AppText
                style={{
                  fontFamily: theme.font.semibold,
                  fontSize: 15,
                  color: selected ? theme.colors.onPrimary : theme.colors.text2,
                }}
              >
                {point}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="help" color={theme.colors.text3}>{t('wellbeing.scale.0')}</AppText>
        <AppText variant="help" color={theme.colors.text3}>{t(`wellbeing.scale.${MOOD.ITEM_MAX}`)}</AppText>
      </View>
    </View>
  );
}

function ResultCard({ entry }: { readonly entry: MoodEntry }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const score = wellbeingScore(entry);
  const band = wellbeingBand(score);
  const state = classifyMoodState(entry);
  const tone = theme.tone(STATE_TONE[state]);

  return (
    <Card style={{ rowGap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 10 }}>
        <AppText variant="title">{t('wellbeing.resultTitle')}</AppText>
        <Badge label={t(`wellbeing.states.${state}.title`)} tone={STATE_TONE[state]} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 6 }}>
        <AppText variant="metric" tabular color={theme.tone(BAND_TONE[band]).fg}>{score}</AppText>
        <AppText variant="help">{t('wellbeing.scoreUnit')}</AppText>
        <AppText variant="help" style={{ marginLeft: 4 }}>· {t(`wellbeing.band.${band}`)}</AppText>
      </View>

      <AppText variant="help" color={theme.colors.text2} style={{ lineHeight: 19 }}>
        {t(`wellbeing.states.${state}.description`)}
      </AppText>

      {/* Per-dimension breakdown (higher bar = stronger negative) */}
      <View style={{ rowGap: 10, marginTop: 2 }}>
        <AppText variant="label">{t('wellbeing.breakdownTitle')}</AppText>
        {MOOD_DIMENSIONS.map((dim) => {
          const severity = entry[dim];
          const dimTone: StatusTone = severity >= MOOD.SEVERE ? 'high' : severity >= MOOD.ELEVATED ? 'warn' : 'ok';
          return (
            <View key={dim} style={{ rowGap: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="help" color={theme.colors.text2}>{t(`wellbeing.dimensions.${dim}`)}</AppText>
                <AppText variant="help" tabular color={theme.colors.text3}>{severity}/{MOOD.ITEM_MAX}</AppText>
              </View>
              <Progress value={severity / MOOD.ITEM_MAX} tone={dimTone} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function HistorySection({ entries, language }: { readonly entries: readonly MoodEntry[]; readonly language: string }) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Oldest → newest for a left-to-right trend.
  const chronological = useMemo(() => [...entries].reverse(), [entries]);
  const series = useMemo<ChartSeries[]>(
    () => [{ points: chronological.map(wellbeingScore), color: theme.colors.primary, area: true }],
    [chronological, theme.colors.primary],
  );
  const labels = useMemo(
    () => chronological.map((e) => shortDate(new Date(e.date), language)),
    [chronological, language],
  );

  if (entries.length === 0) {
    return <EmptyState icon="moon" title={t('wellbeing.historyEmpty')} />;
  }

  return (
    <>
      <AppText variant="h2" style={{ marginTop: 4 }}>{t('wellbeing.historyTitle')}</AppText>
      {entries.length >= 2 ? (
        <Card>
          <LineChart
            series={series}
            labels={labels}
            dates={labels}
            unit={t('wellbeing.scoreUnit')}
            accessibilityLabel={`${t('wellbeing.scoreTitle')}: ${series[0].points.join(', ')}`}
          />
        </Card>
      ) : null}
      <Card bare style={{ paddingHorizontal: theme.space.padCard }}>
        {entries.map((entry, i) => {
          const state = classifyMoodState(entry);
          return (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row', alignItems: 'center', columnGap: 12,
                paddingVertical: theme.space.rowPad,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.colors.hairline,
              }}
            >
              <View style={{ width: 52 }}>
                <AppText variant="help">{shortDate(new Date(entry.date), language)}</AppText>
              </View>
              <AppText tabular style={{ fontFamily: theme.font.semibold, fontSize: 15, width: 40 }}>
                {wellbeingScore(entry)}
              </AppText>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Badge label={t(`wellbeing.states.${state}.title`)} tone={STATE_TONE[state]} />
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}
