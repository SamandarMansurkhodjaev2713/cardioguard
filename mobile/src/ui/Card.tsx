/**
 * Surface card (`.cg-card`). Border-first elevation with a very soft shadow.
 * Variants: default (white + shadow), flat (no shadow), soft (tinted surface).
 */

import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type CardVariant = 'default' | 'flat' | 'soft';

export interface CardProps extends ViewProps {
  readonly variant?: CardVariant;
  /** Disable inner padding (for cards that manage their own rows). */
  readonly bare?: boolean;
}

export function Card({ variant = 'default', bare, style, children, ...rest }: CardProps) {
  const theme = useTheme();
  const { colors, radius, space, shadows } = theme;

  const base: ViewStyle = {
    backgroundColor: variant === 'soft' ? colors.surfaceSoft : colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: bare ? 0 : space.padCard,
    ...(variant === 'default' ? shadows.sm : shadows.none),
  };

  return (
    <View {...rest} style={[base, style]}>
      {children}
    </View>
  );
}
