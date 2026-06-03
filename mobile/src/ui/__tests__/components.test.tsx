import { fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { renderWithProviders } from '../../testing/renderWithProviders';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';
import { MetricCard } from '../MetricCard';
import { Progress } from '../Progress';
import { SegmentedControl } from '../SegmentedControl';
import { TextField } from '../TextField';
import { Toggle } from '../Toggle';

describe('Button', () => {
  it('GIVEN a label THEN renders it and fires onPress', () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="Войти" onPress={onPress} />);
    fireEvent.press(screen.getByText('Войти'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('GIVEN disabled THEN does not fire', () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="Войти" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Войти'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('GIVEN loading THEN ignores presses', () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="X" onPress={onPress} loading />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('calls onChangeText on input', () => {
    const onChange = jest.fn();
    renderWithProviders(<TextField label="ID" value="" onChangeText={onChange} placeholder="ph" />);
    fireEvent.changeText(screen.getByPlaceholderText('ph'), 'P-1');
    expect(onChange).toHaveBeenCalledWith('P-1');
  });

  it('shows an error message', () => {
    renderWithProviders(<TextField label="ID" value="" onChangeText={() => {}} error="Ошибка" />);
    expect(screen.getByText('Ошибка')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    function Wrapper() {
      const [v, setV] = useState('secret');
      return <TextField label="P" value={v} onChangeText={setV} secure showPasswordLabel="show" hidePasswordLabel="hide" />;
    }
    renderWithProviders(<Wrapper />);
    fireEvent.press(screen.getByLabelText('show'));
    expect(screen.getByLabelText('hide')).toBeTruthy();
  });
});

describe('SegmentedControl', () => {
  it('fires onChange with the chosen value', () => {
    const onChange = jest.fn();
    renderWithProviders(
      <SegmentedControl
        value="a"
        onChange={onChange}
        options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
      />,
    );
    fireEvent.press(screen.getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('Badge & Progress', () => {
  it('Badge renders its label', () => {
    renderWithProviders(<Badge label="Норма" tone="ok" />);
    expect(screen.getByText('Норма')).toBeTruthy();
  });

  it('Progress renders without crashing for any value', () => {
    expect(() => renderWithProviders(<Progress value={1.5} tone="ok" />)).not.toThrow();
  });
});

describe('MetricCard', () => {
  it('renders value, unit and badge, and is pressable', () => {
    const onPress = jest.fn();
    renderWithProviders(
      <MetricCard icon="heart" label="АД" value="138/86" unit="мм" badge={{ label: 'Норма', tone: 'ok' }} onPress={onPress} />,
    );
    expect(screen.getByText('138/86')).toBeTruthy();
    expect(screen.getByText('Норма')).toBeTruthy();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes a combined accessibility label for screen readers', () => {
    renderWithProviders(
      <MetricCard icon="heart" label="АД" value="138/86" unit="мм" badge={{ label: 'Норма', tone: 'ok' }} />,
    );
    expect(screen.getByLabelText('АД: 138/86 мм, Норма')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders the title and hint', () => {
    renderWithProviders(<EmptyState icon="check" title="Нет сигналов" hint="Всё спокойно" />);
    expect(screen.getByText('Нет сигналов')).toBeTruthy();
    expect(screen.getByText('Всё спокойно')).toBeTruthy();
  });
});

describe('Toggle', () => {
  it('renders a switch and fires onValueChange', () => {
    const onValueChange = jest.fn();
    renderWithProviders(<Toggle value={false} onValueChange={onValueChange} accessibilityLabel="Напоминания" />);
    fireEvent(screen.getByRole('switch'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
