/**
 * CardioGuard brand mark — a rounded gradient tile holding the shield + ECG
 * glyph (the exact path from the design's thumbnail). The gradient uses the
 * theme's brand red, so it adapts to light/dark. Used on auth and headers.
 */

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export interface BrandMarkProps {
  readonly size?: number;
}

export function BrandMark({ size = 64 }: BrandMarkProps) {
  const theme = useTheme();
  const glyph = size * 0.56;
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primary800]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 10px 18px rgba(131,29,27,0.30)',
      }}
    >
      <Svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none"
        stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3 4.8 6.1v5.1c0 4.4 3 7.5 7.2 8.6 4.2-1.1 7.2-4.2 7.2-8.6V6.1L12 3z" />
        <Path d="M7.5 12.3h2l1.3-3.4 1.8 5.2 1.1-2.5h2.3" />
      </Svg>
    </LinearGradient>
  );
}
