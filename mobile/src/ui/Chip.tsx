/**
 * Chip (`.cg-chip`) — pill button for quick actions / filters. Optional leading
 * icon; `selected` fills it with the primary color.
 */

import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface ChipProps {
  readonly label: string;
  readonly icon?: IconName;
  readonly selected?: boolean;
  readonly onPress?: () => void;
}

export function Chip({ label, icon, selected, onPress }: ChipProps) {
  const theme = useTheme();
  const { colors, radius } = theme;
  const fg = selected ? '#FFFFFF' : colors.textOnSoft;

  return (
    <Pressable
      onPress={onPress ? () => { haptics.selection(); onPress(); } : undefined}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 7,
        height: 38,
        paddingHorizontal: 14,
        borderRadius: radius.chip,
        backgroundColor: selected ? colors.primary : pressed ? colors.surface2 : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      })}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? '#FFFFFF' : colors.primary} /> : null}
      <AppText
        color={fg}
        style={{ fontFamily: theme.font.semibold, fontSize: 13 }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
