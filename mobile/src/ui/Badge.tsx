/**
 * Status badge (`.cg-badge`). Clinical tone = foreground + tinted background +
 * hairline border, with an optional leading dot.
 */

import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { StatusTone } from '../theme/tokens';
import { AppText } from './AppText';

export interface BadgeProps {
  readonly label: string;
  readonly tone?: StatusTone;
  readonly dot?: boolean;
}

export function Badge({ label, tone = 'neutral', dot = true }: BadgeProps) {
  const theme = useTheme();
  const { fg, bg, bd } = theme.tone(tone);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: theme.radius.badge,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: bd,
      }}
    >
      {dot && (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />
      )}
      <AppText variant="badge" color={fg}>
        {label}
      </AppText>
    </View>
  );
}
