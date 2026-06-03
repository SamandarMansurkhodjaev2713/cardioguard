/**
 * Circular progress ring (react-native-svg). A static, senior-grade gauge for
 * a 0–1 value with optional centered content (e.g. a score). No animation, so it
 * renders deterministically in tests and never causes act() noise.
 */

import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';

export interface RingProps {
  /** 0–1, clamped. */
  readonly value: number;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly color: string;
  readonly trackColor?: string;
  readonly children?: ReactNode;
}

export function Ring({ value, size = 92, strokeWidth = 9, color, trackColor, children }: RingProps) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor ?? theme.colors.surface2} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          // Start the arc at 12 o'clock.
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {children}
    </View>
  );
}
