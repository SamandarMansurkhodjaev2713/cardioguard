/* Jest setup — runs after the test framework is installed, before each suite. */

// AsyncStorage has no native module under jest; use the official in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Safe-area: provider passes children through; insets resolve to zero.
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  const inset = { top: 0, bottom: 0, left: 0, right: 0 };
  const frame = { x: 0, y: 0, width: 412, height: 880 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({ children }: { children: (i: typeof inset) => React.ReactNode }) => children(inset),
    SafeAreaView: View,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

// Device locale → Russian (the source locale) for deterministic i18n in tests.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'ru', languageTag: 'ru-RU' }],
}));

// LinearGradient renders as a plain View in tests.
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// react-native-svg → lightweight host stand-ins so charts/icons render without native code.
jest.mock('react-native-svg', () => {
  const React = require('react');
  const make = (name: string) => (props: Record<string, unknown>) =>
    React.createElement(name, props, props.children as React.ReactNode);
  return new Proxy(
    { __esModule: true, default: make('Svg') },
    { get: (target: Record<string, unknown>, key: string) => target[key] ?? make(key) },
  );
});

// lucide icons → no-op components (tests assert on text, not glyphs).
jest.mock('lucide-react-native', () =>
  new Proxy({ __esModule: true }, { get: () => () => null }),
);

// expo-notifications → no native module under jest; stub the surface the
// notification service touches (permissions, scheduling, channel, enums).
jest.mock('expo-notifications', () => ({
  __esModule: true,
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'notif-id'),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  AndroidImportance: { HIGH: 4, MAX: 5 },
}));

// expo-print / expo-sharing → no native modules under jest; stub the surface
// the report export touches.
jest.mock('expo-print', () => ({
  __esModule: true,
  printAsync: jest.fn(async () => undefined),
  printToFileAsync: jest.fn(async () => ({ uri: 'file:///report.pdf', numberOfPages: 1 })),
}));
jest.mock('expo-sharing', () => ({
  __esModule: true,
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

// expo-router navigation primitives used by screens.
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn() };
  return {
    __esModule: true,
    useRouter: () => router,
    useLocalSearchParams: () => ({}),
    router,
  };
});
