/**
 * Themed on/off switch over RN's `Switch`. Centralises track/thumb colors so
 * toggles match the palette in both light and dark schemes.
 */

import { Platform, Switch } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface ToggleProps {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly disabled?: boolean;
  readonly accessibilityLabel?: string;
}

export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      trackColor={{ false: colors.border2, true: colors.primary }}
      thumbColor={Platform.OS === 'android' ? (value ? colors.onPrimary : colors.surface) : undefined}
      ios_backgroundColor={colors.border2}
    />
  );
}
