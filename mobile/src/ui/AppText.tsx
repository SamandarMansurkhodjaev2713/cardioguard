/**
 * Typed text primitive. `variant` maps to the design's type scale; weight and
 * letter-spacing are baked per variant so screens never hand-tune typography.
 */

import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { Theme } from '../theme/tokens';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'title'
  | 'metric'
  | 'body'
  | 'bodyMedium'
  | 'help'
  | 'label'
  | 'badge';

export interface AppTextProps extends TextProps {
  readonly variant?: TextVariant;
  /** Overrides the variant's default color (pass a resolved hex from theme). */
  readonly color?: string;
  readonly center?: boolean;
  /** Tabular figures for aligned numbers (BP, metrics). */
  readonly tabular?: boolean;
}

function variantStyle(theme: Theme, variant: TextVariant): TextStyle {
  const { font, fontSize, space, colors } = theme;
  switch (variant) {
    case 'display':
      return { fontFamily: font.bold, fontSize: fontSize.display, letterSpacing: -0.7, color: colors.text };
    case 'h1':
      return { fontFamily: font.semibold, fontSize: fontSize.h1, letterSpacing: -0.45, color: colors.text };
    case 'h2':
      return { fontFamily: font.semibold, fontSize: fontSize.h2, letterSpacing: -0.3, color: colors.text };
    case 'title':
      return { fontFamily: font.semibold, fontSize: fontSize.card, letterSpacing: -0.16, color: colors.text };
    case 'metric':
      return { fontFamily: font.semibold, fontSize: space.metricSize, letterSpacing: -0.6, color: colors.text };
    case 'bodyMedium':
      return { fontFamily: font.medium, fontSize: fontSize.body, color: colors.text };
    case 'help':
      return { fontFamily: font.regular, fontSize: fontSize.help, color: colors.text3 };
    case 'label':
      return { fontFamily: font.semibold, fontSize: fontSize.help, color: colors.text2 };
    case 'badge':
      return { fontFamily: font.semibold, fontSize: fontSize.badge, color: colors.text };
    case 'body':
    default:
      return { fontFamily: font.regular, fontSize: fontSize.body, color: colors.text };
  }
}

export function AppText({
  variant = 'body',
  color,
  center,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const base = variantStyle(theme, variant);
  return (
    <Text
      {...rest}
      style={[
        base,
        center && { textAlign: 'center' },
        color != null && { color },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
