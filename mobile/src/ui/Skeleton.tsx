/**
 * Pulsing placeholder block for loading states. Theme-agnostic (takes an
 * explicit `color`) so it can render before the ThemeProvider mounts — e.g. the
 * pre-hydration splash. Animates opacity in a loop; the loop is stopped on
 * unmount so it never leaks.
 */

import { useEffect, useRef } from 'react';
import { Animated, Platform, type DimensionValue, type ViewStyle } from 'react-native';

// Opacity supports the native driver on iOS/Android; on web there is no native
// animation module, so use the JS driver to avoid a console warning.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface SkeletonProps {
  readonly width?: DimensionValue;
  readonly height?: number;
  readonly radius?: number;
  /** Block color — pass a theme surface tone when used inside a themed screen. */
  readonly color?: string;
  readonly style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, radius = 8, color = '#E6EAF0', style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 720, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(opacity, { toValue: 0.55, duration: 720, useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: color, opacity }, style]}
    />
  );
}
