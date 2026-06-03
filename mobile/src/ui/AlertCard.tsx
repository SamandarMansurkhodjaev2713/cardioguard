/**
 * Early-warning alert card (`.cg-alert`). Severity drives the left accent, icon
 * chip and tone. Title/message are resolved from i18n by alert type + params.
 * Tapping marks the alert read.
 */

import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Alert, AlertSeverity } from '../domain/types';
import type { StatusTone } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { shortDate, timeHm } from '../utils/format';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const TONE_BY_SEVERITY: Record<AlertSeverity, StatusTone> = {
  high: 'high',
  warn: 'warn',
  info: 'info',
};

const ICON_BY_SEVERITY: Record<AlertSeverity, IconName> = {
  high: 'alert',
  warn: 'alert',
  info: 'info',
};

export interface AlertCardProps {
  readonly alert: Alert;
  readonly language: string;
  readonly onPress?: () => void;
}

export function AlertCard({ alert, language, onPress }: AlertCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tone = theme.tone(TONE_BY_SEVERITY[alert.severity]);
  const date = new Date(alert.date);

  const a11yLabel = [
    t(`alerts.types.${alert.type}.title`),
    t(`alerts.types.${alert.type}.message`, alert.params),
    alert.isRead ? undefined : t('alerts.unread'),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => ({
        flexDirection: 'row',
        columnGap: 12,
        backgroundColor: pressed && onPress ? theme.colors.surfaceSoft : theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderLeftWidth: 3,
        borderLeftColor: tone.fg,
        borderRadius: theme.radius.card,
        padding: theme.space.padCard,
        ...(alert.isRead ? null : theme.shadows.sm),
      })}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: tone.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={ICON_BY_SEVERITY[alert.severity]} size={18} color={tone.fg} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 7 }}>
          <AppText style={{ fontFamily: theme.font.semibold, fontSize: 14.5, flex: 1 }}>
            {t(`alerts.types.${alert.type}.title`)}
          </AppText>
          {alert.isRead ? null : (
            <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: theme.colors.primary }} />
          )}
        </View>
        <AppText variant="help" color={theme.colors.text2} style={{ marginTop: 3, lineHeight: 18 }}>
          {t(`alerts.types.${alert.type}.message`, alert.params)}
        </AppText>
        <AppText variant="help" color={theme.colors.text3} style={{ marginTop: 6 }}>
          {shortDate(date, language)}, {timeHm(date)}
        </AppText>
      </View>
    </Pressable>
  );
}
