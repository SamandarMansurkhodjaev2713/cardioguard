/**
 * Standard screen header (`.cg-header` / `.cg-page-title`): title + optional
 * subtitle, an optional back button, and an optional right slot (e.g. a role
 * pill or icon button). Applies the top safe-area inset.
 */

import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

export interface PageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly right?: ReactNode;
  readonly backLabel?: string;
}

export function PageHeader({ title, subtitle, onBack, right, backLabel = 'Назад' }: PageHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: theme.space.screenPad,
        paddingTop: insets.top + 14,
        paddingBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', columnGap: 12 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', columnGap: 11 }}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              hitSlop={8}
              style={{
                width: 38,
                height: 38,
                borderRadius: theme.radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Icon name="chevronLeft" size={20} color={theme.colors.text2} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <AppText variant="h1" accessibilityRole="header">{title}</AppText>
            {subtitle ? (
              <AppText variant="help" color={theme.colors.text2} style={{ marginTop: 3 }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>
        {right ?? null}
      </View>
    </View>
  );
}
