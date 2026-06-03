/**
 * Health Index card (TZ Module 11). Self-contained: derives the composite index
 * from the store (latest measurement + adherence + CVD risk + latest wellbeing)
 * and renders the score, band and — optionally — the component breakdown. Used
 * as a dashboard hero (tappable → analytics) and inside the analytics screen
 * (with the breakdown shown).
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { calculateAdherencePercent } from '../domain/calculators';
import { computeHealthIndex, type HealthIndexBand } from '../domain/healthIndex';
import { latestMoodEntry, wellbeingScore } from '../domain/mood';
import { deriveRisk, useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeProvider';
import type { StatusTone } from '../theme/tokens';
import { AppText } from '../ui/AppText';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Ring } from '../ui/Ring';

const BAND_TONE: Record<HealthIndexBand, StatusTone> = { good: 'ok', moderate: 'warn', low: 'high' };

export interface HealthIndexCardProps {
  readonly onPress?: () => void;
  readonly showBreakdown?: boolean;
}

export function HealthIndexCard({ onPress, showBreakdown }: HealthIndexCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const measurements = useAppStore((s) => s.measurements);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const moodEntries = useAppStore((s) => s.moodEntries);
  const riskModel = useAppStore((s) => s.riskModel);

  const index = useMemo(() => {
    const latest = measurements[0];
    if (!latest) return null;
    const risk = deriveRisk({ profile, measurements, riskModel });
    const mood = latestMoodEntry(moodEntries);
    return computeHealthIndex({
      latest,
      adherencePercent: calculateAdherencePercent(medicationLogs),
      riskCategory: risk.category,
      wellbeing: mood ? wellbeingScore(mood) : undefined,
    });
  }, [profile, measurements, medicationLogs, moodEntries, riskModel]);

  if (!index) return null;
  const tone = theme.tone(BAND_TONE[index.band]);

  const body = (
    <Card style={{ rowGap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
        <Ring value={index.overall / 100} color={tone.fg} size={92}>
          <View style={{ alignItems: 'center' }}>
            <AppText tabular style={{ fontFamily: theme.font.bold, fontSize: 28, color: tone.fg, letterSpacing: -0.5 }}>
              {index.overall}
            </AppText>
            <AppText variant="help" color={theme.colors.text3} style={{ fontSize: 10 }}>{t('healthIndex.scoreUnit')}</AppText>
          </View>
        </Ring>
        <View style={{ flex: 1, rowGap: 6 }}>
          <AppText variant="title">{t('healthIndex.title')}</AppText>
          <AppText variant="help" color={theme.colors.text3}>{t('healthIndex.hint')}</AppText>
          <View style={{ flexDirection: 'row' }}>
            <Badge label={t(`healthIndex.band.${index.band}`)} tone={BAND_TONE[index.band]} />
          </View>
        </View>
      </View>

      {showBreakdown ? (
        <View style={{ rowGap: 10, marginTop: 4 }}>
          <AppText variant="label">{t('healthIndex.breakdownTitle')}</AppText>
          {index.components.map((c) => {
            const compTone: StatusTone = c.score >= 75 ? 'ok' : c.score >= 50 ? 'warn' : 'high';
            return (
              <View key={c.key} style={{ rowGap: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="help" color={theme.colors.text2}>{t(`healthIndex.components.${c.key}`)}</AppText>
                  <AppText variant="help" tabular color={theme.colors.text3}>{c.score}</AppText>
                </View>
                <Progress value={c.score / 100} tone={compTone} />
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );

  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('healthIndex.title')}: ${index.overall} ${t('healthIndex.scoreUnit')}, ${t(`healthIndex.band.${index.band}`)}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {body}
    </Pressable>
  );
}
