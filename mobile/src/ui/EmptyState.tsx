/**
 * Shared empty-state block: a soft icon chip, a title, and an optional hint.
 * Used wherever a list or chart has no data yet, so empty screens read
 * consistently instead of each screen rolling its own.
 */

import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  readonly icon: IconName;
  readonly title: string;
  readonly hint?: string;
  /** Icon accent — 'ok' for a positive "all clear" state. */
  readonly tone?: 'neutral' | 'ok';
  /** Tighter vertical padding for in-card empties (vs. full-screen). */
  readonly compact?: boolean;
}

export function EmptyState({ icon, title, hint, tone = 'neutral', compact }: EmptyStateProps) {
  const theme = useTheme();
  const iconColor = tone === 'ok' ? theme.colors.ok : theme.colors.text3;
  return (
    <View style={{ alignItems: 'center', rowGap: 9, paddingVertical: compact ? 24 : 38 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: theme.colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} color={iconColor} />
      </View>
      <AppText variant="title" center>{title}</AppText>
      {hint ? (
        <AppText variant="help" center style={{ maxWidth: 260 }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
