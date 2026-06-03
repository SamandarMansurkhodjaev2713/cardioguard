/**
 * On web, constrains the app to a phone-width column centered on a neutral
 * backdrop — so the mobile layout previews and deploys faithfully (the design
 * was always presented inside a device frame). On native it is a pass-through.
 * Colors come from the theme so it adapts to light/dark.
 */

import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const FRAME_MAX_WIDTH = 440;

export function AppFrame({ children }: { readonly children: ReactNode }) {
  const theme = useTheme();
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.backdrop, alignItems: 'center' }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: FRAME_MAX_WIDTH,
          backgroundColor: theme.colors.bg,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}
