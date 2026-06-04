import { fireEvent, screen } from '@testing-library/react-native';

import ProfileScreen from '../app/profile';
import WellbeingScreen from '../app/wellbeing';
import InsightsScreen from '../app/insights';
import GoalsScreen from '../app/goals';
import DoctorOverviewScreen from '../app/(doctor)/overview';
import DoctorPatientsScreen from '../app/(doctor)/patients';
import { useAppStore } from '../src/store/useAppStore';
import { renderWithProviders } from '../src/testing/renderWithProviders';
import { seedStore } from '../src/testing/storeHarness';

describe('ProfileScreen (medical card)', () => {
  beforeEach(() => seedStore());

  it('renders the card with the seeded identity and clinical section', () => {
    renderWithProviders(<ProfileScreen />);
    expect(screen.getByText(/Алишер/)).toBeTruthy();
    expect(screen.getByText('Клинический анамнез')).toBeTruthy();
  });

  it('enters edit mode and exposes Save', () => {
    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Редактировать'));
    expect(screen.getByLabelText('Сохранить')).toBeTruthy();
  });
});

describe('WellbeingScreen (Module 5)', () => {
  beforeEach(() => seedStore());

  it('renders the title and a result from the seeded history', () => {
    renderWithProviders(<WellbeingScreen />);
    expect(screen.getByText('Самочувствие')).toBeTruthy();
    expect(screen.getByText('Результат опроса')).toBeTruthy();
  });

  it('opens the survey and can submit a check-in', () => {
    const before = useAppStore.getState().moodEntries.length;
    renderWithProviders(<WellbeingScreen />);
    fireEvent.press(screen.getByLabelText('Пройти заново'));
    fireEvent.press(screen.getByLabelText('Сохранить ответы'));
    expect(useAppStore.getState().moodEntries.length).toBe(before + 1);
  });
});

describe('InsightsScreen (Module 6)', () => {
  beforeEach(() => seedStore());

  it('renders trends, projections and the health index', () => {
    renderWithProviders(<InsightsScreen />);
    expect(screen.getByText('Прогноз рисков')).toBeTruthy();
    expect(screen.getByText('Тренды показателей')).toBeTruthy();
    expect(screen.getByText('Индекс здоровья')).toBeTruthy();
  });

  it('GIVEN no measurements THEN shows the empty state', () => {
    useAppStore.setState({ measurements: [] });
    renderWithProviders(<InsightsScreen />);
    expect(
      screen.getByText('Недостаточно данных. Добавьте несколько измерений, чтобы увидеть тренды.'),
    ).toBeTruthy();
  });
});

describe('GoalsScreen', () => {
  beforeEach(() => seedStore());

  it('renders and persists targets on save', () => {
    renderWithProviders(<GoalsScreen />);
    expect(screen.getByText('Мои цели')).toBeTruthy();
    fireEvent.press(screen.getByText('Сохранить цели'));
    // The default systolic target (130) is committed to the profile.
    expect(useAppStore.getState().profile.targetSystolicBp).toBe(130);
  });
});

describe('Doctor screens (cohort analytics)', () => {
  beforeEach(() => seedStore());

  it('overview renders KPIs and the per-group breakdown', () => {
    renderWithProviders(<DoctorOverviewScreen />);
    expect(screen.getByText('Панель исследователя')).toBeTruthy();
    expect(screen.getByText('Аналитика по группам')).toBeTruthy();
  });

  it('lists the doctor\'s real enrolled patients', () => {
    renderWithProviders(<DoctorPatientsScreen />);
    expect(screen.getByText('Мои пациенты')).toBeTruthy();
    // Real records: anonymized ids shown for more than one enrolled patient.
    expect(screen.getAllByText(/^P-0\d+$/).length).toBeGreaterThan(1);
  });
});
