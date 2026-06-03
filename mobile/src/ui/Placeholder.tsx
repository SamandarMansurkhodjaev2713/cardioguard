/**
 * Temporary screen scaffold for tabs not yet implemented. Replaced screen by
 * screen; keeps the navigation shell functional and previewable in the meantime.
 */

import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export function Placeholder({ title, icon }: { readonly title: string; readonly icon: IconName }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.bg,
        rowGap: 12,
        padding: 24,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: theme.colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={26} color={theme.colors.text3} />
      </View>
      <AppText variant="h2">{title}</AppText>
    </View>
  );
}
