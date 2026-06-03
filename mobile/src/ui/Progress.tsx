/**
 * Progress bar (`.cg-progress`). `value` is clamped to [0, 1]; tone selects the
 * fill color.
 */

import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type ProgressTone = 'primary' | 'ok' | 'warn' | 'high' | 'teal';

export function Progress({ value, tone = 'primary' }: { readonly value: number; readonly tone?: ProgressTone }) {
  const theme = useTheme();
  const fill: Record<ProgressTone, string> = {
    primary: theme.colors.primary,
    ok: theme.colors.ok,
    warn: theme.colors.warn,
    high: theme.colors.high,
    teal: theme.colors.teal,
  };
  const pct = Math.max(0, Math.min(1, value));

  return (
    <View style={{ height: 8, borderRadius: 999, backgroundColor: theme.colors.surface2, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 999, backgroundColor: fill[tone] }} />
    </View>
  );
}
