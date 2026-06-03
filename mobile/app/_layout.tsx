import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { i18n, initI18n } from '../src/i18n';
import { useAppStore } from '../src/store/useAppStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { AppFrame } from '../src/ui/AppFrame';
import { AppLoading } from '../src/ui/AppLoading';
import { ErrorBoundary } from '../src/ui/ErrorBoundary';

// Initialize localization once, before any screen reads a translation.
initI18n();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  const hydrated = useAppStore((s) => s.hydrated);
  const themePreferences = useAppStore((s) => s.themePreferences);
  const language = useAppStore((s) => s.language);
  const setThemePreferences = useAppStore((s) => s.setThemePreferences);

  // Load persisted state (or seed the demo) once on startup.
  useEffect(() => {
    void useAppStore.getState().hydrate();
  }, []);

  // Keep i18n in sync with the persisted language preference.
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);

  if (!fontsLoaded || !hydrated) {
    return <AppLoading />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider
          initialPreferences={themePreferences}
          onPreferencesChange={setThemePreferences}
        >
          <ThemedShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

/** Inside the ThemeProvider so the shell (status bar, backdrop, screen bg) adapts to the scheme. */
function ThemedShell() {
  const theme = useTheme();
  return (
    <AppFrame>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: 'fade',
        }}
      />
    </AppFrame>
  );
}
