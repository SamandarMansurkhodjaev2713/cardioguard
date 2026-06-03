/**
 * Renders a component tree inside the app's real providers (theme + safe area)
 * with i18n initialized to Russian, for component/integration tests.
 */

import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '../i18n';
import { ThemeProvider, type ThemePreferences } from '../theme/ThemeProvider';

export function renderWithProviders(ui: ReactElement, preferences?: ThemePreferences) {
  initI18n('ru');
  return render(
    <SafeAreaProvider>
      <ThemeProvider initialPreferences={preferences}>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );
}
