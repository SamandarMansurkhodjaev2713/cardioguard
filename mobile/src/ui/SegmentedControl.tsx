/**
 * Segmented control (`.cg-seg`) — single-select tab strip. The active segment
 * gets a raised surface; the track is a soft inset.
 */

import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: ReadonlyArray<SegmentOption<T>>;
  readonly value: T;
  readonly onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface2,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.btn,
        padding: 3,
        columnGap: 3,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => { if (!selected) haptics.selection(); onChange(option.value); }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.btn - 3,
              backgroundColor: selected ? theme.colors.surface : 'transparent',
              ...(selected ? theme.shadows.sm : null),
            }}
          >
            <AppText
              numberOfLines={1}
              style={{
                fontFamily: theme.font.semibold,
                fontSize: 13,
                color: selected ? theme.colors.text : theme.colors.text2,
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
