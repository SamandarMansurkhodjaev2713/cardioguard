import { fireEvent, screen } from '@testing-library/react-native';

import DashboardScreen from '../app/(patient)/dashboard';
import MedicationScreen from '../app/(patient)/medication';
import { AlertsView } from '../src/features/AlertsView';
import { selectAdherencePercent, useAppStore } from '../src/store/useAppStore';
import { renderWithProviders } from '../src/testing/renderWithProviders';
import { seedStore } from '../src/testing/storeHarness';

describe('DashboardScreen', () => {
  beforeEach(() => seedStore());

  it('renders the greeting and engine-computed metrics', () => {
    renderWithProviders(<DashboardScreen />);
    expect(screen.getByText(/Алишер/)).toBeTruthy();
    expect(screen.getByText('138/86')).toBeTruthy(); // latest blood pressure
    expect(screen.getByText('29.4')).toBeTruthy(); // BMI computed by the calculator
  });
});

describe('MedicationScreen (interaction)', () => {
  beforeEach(() => seedStore());

  it('marking a dose taken raises adherence', () => {
    const before = selectAdherencePercent(useAppStore.getState());
    renderWithProviders(<MedicationScreen />);
    fireEvent.press(screen.getAllByText('Отметить')[0]);
    expect(selectAdherencePercent(useAppStore.getState())).toBeGreaterThan(before);
  });
});

describe('AlertsView (interaction)', () => {
  beforeEach(() => seedStore());

  it('"mark all read" clears the unread alerts', () => {
    expect(useAppStore.getState().alerts.some((a) => !a.isRead)).toBe(true);
    renderWithProviders(<AlertsView />);
    fireEvent.press(screen.getByText('Прочитать все'));
    expect(useAppStore.getState().alerts.every((a) => a.isRead)).toBe(true);
  });
});
