/**
 * Button primitive. Variants and sizes mirror `.cg-btn` in the design. Uses
 * Pressable for an active press scale + color shift (matches the CSS :active).
 */

import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { Theme } from '../theme/tokens';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'teal' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  readonly label: string;
  readonly onPress?: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly block?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly leftIcon?: IconName;
  readonly accessibilityLabel?: string;
}

const SIZE_HEIGHT: Record<ButtonSize, number> = { sm: 38, md: 48, lg: 52 };
const SIZE_FONT: Record<ButtonSize, number> = { sm: 14, md: 15, lg: 16 };
const SIZE_PAD: Record<ButtonSize, number> = { sm: 13, md: 18, lg: 18 };

interface VariantColors {
  readonly bg: string;
  readonly bgActive: string;
  readonly fg: string;
  readonly border?: string;
}

function variantColors(theme: Theme, variant: ButtonVariant): VariantColors {
  const c = theme.colors;
  switch (variant) {
    case 'teal':
      return { bg: c.teal, bgActive: c.teal700, fg: '#FFFFFF' };
    case 'secondary':
      return { bg: c.surface, bgActive: c.surface2, fg: c.primary700, border: c.border2 };
    case 'ghost':
      return { bg: 'transparent', bgActive: c.primarySoft, fg: c.primary700 };
    case 'primary':
    default:
      return { bg: c.primary, bgActive: c.primary700, fg: c.onPrimary };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  block,
  disabled,
  loading,
  leftIcon,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const colors = variantColors(theme, variant);
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress ? () => { haptics.light(); onPress(); } : undefined}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isInactive, busy: !!loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }): ViewStyle => ({
        height: SIZE_HEIGHT[size],
        paddingHorizontal: SIZE_PAD[size],
        borderRadius: theme.radius.btn,
        backgroundColor: pressed && !isInactive ? colors.bgActive : colors.bg,
        borderWidth: colors.border ? 1 : 0,
        borderColor: colors.border,
        opacity: isInactive ? 0.45 : 1,
        transform: [{ scale: pressed && !isInactive ? 0.975 : 1 }],
        width: block ? '100%' : undefined,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={18} color={colors.fg} strokeWidth={2} />}
          <View>
            <AppText color={colors.fg} style={{ fontFamily: theme.font.semibold, fontSize: SIZE_FONT[size] }}>
              {label}
            </AppText>
          </View>
        </>
      )}
    </Pressable>
  );
}
