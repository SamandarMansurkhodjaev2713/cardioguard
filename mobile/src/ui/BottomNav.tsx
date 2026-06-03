/**
 * Custom bottom navigation (`.cg-bottomnav`) used as the Tabs `tabBar`. Active
 * tab gets the primary color + a pill-backed icon; the alerts tab shows an
 * unread-count badge. Route order is defined by the Tabs layout.
 */

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { selectUnreadAlertCount, useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const ICON_BY_ROUTE: Record<string, IconName> = {
  dashboard: 'home',
  monitoring: 'monitoring',
  medication: 'medication',
  risk: 'risk',
  more: 'more',
  overview: 'home',
  patients: 'users',
  alerts: 'alert',
  signals: 'alert',
};

const LABEL_KEY_BY_ROUTE: Record<string, string> = {
  dashboard: 'nav.home',
  monitoring: 'nav.monitoring',
  medication: 'nav.medication',
  risk: 'nav.risk',
  more: 'nav.more',
  overview: 'nav.overview',
  patients: 'nav.patients',
  alerts: 'nav.alerts',
  signals: 'nav.alerts',
};

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const unread = useAppStore(selectUnreadAlertCount);

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingHorizontal: 6,
        boxShadow: '0px -6px 20px rgba(20,30,50,0.05)',
      }}
    >
      {state.routes.map((route: (typeof state.routes)[number], index: number) => {
        const focused = state.index === index;
        const color = focused ? theme.colors.primary : theme.colors.text3;
        const showBadge = (route.name === 'alerts' || route.name === 'signals') && unread > 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', rowGap: 3, paddingVertical: 2 }}
          >
            <View
              style={{
                width: 46,
                height: 28,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? theme.colors.primarySoft : 'transparent',
              }}
            >
              <Icon
                name={ICON_BY_ROUTE[route.name] ?? 'circle'}
                size={21}
                color={color}
                strokeWidth={focused ? 2 : 1.7}
              />
              {showBadge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: 4,
                    minWidth: 15,
                    height: 15,
                    paddingHorizontal: 3,
                    borderRadius: 999,
                    backgroundColor: theme.colors.high,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: theme.colors.surface,
                  }}
                >
                  <AppText style={{ fontFamily: theme.font.bold, fontSize: 9, color: '#FFFFFF' }}>
                    {unread}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText style={{ fontFamily: theme.font.semibold, fontSize: 10.5, color }}>
              {t(LABEL_KEY_BY_ROUTE[route.name] ?? route.name)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
