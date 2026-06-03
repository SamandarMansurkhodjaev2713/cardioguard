/**
 * Wrapping group of single-select pills (`.cg-opt` family). Used for enum fields
 * in onboarding where a segmented control would overflow on narrow screens.
 */

import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';

export interface PillOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface OptionPillsProps<T extends string> {
  readonly options: ReadonlyArray<PillOption<T>>;
  readonly value: T;
  readonly onChange: (value: T) => void;
}

export function OptionPills<T extends string>({ options, value, onChange }: OptionPillsProps<T>) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => { if (!selected) haptics.selection(); onChange(option.value); }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={{
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderRadius: theme.radius.field,
              backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
              borderWidth: 1,
              borderColor: selected ? theme.colors.primary : theme.colors.border,
            }}
          >
            <AppText
              style={{
                fontFamily: selected ? theme.font.semibold : theme.font.medium,
                fontSize: 14,
                color: selected ? theme.colors.primary800 : theme.colors.text,
              }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
