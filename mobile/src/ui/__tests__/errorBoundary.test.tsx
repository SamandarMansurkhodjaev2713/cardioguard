import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { ErrorBoundary } from '../ErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('GIVEN a child that throws THEN renders the recovery fallback', () => {
    // React logs the caught error to console.error; silence it for a clean run.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Что-то пошло не так')).toBeTruthy();
    expect(screen.getByLabelText('Попробовать снова')).toBeTruthy();
    spy.mockRestore();
  });

  it('GIVEN healthy children THEN renders them unchanged', () => {
    render(
      <ErrorBoundary>
        <Text>ok content</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText('ok content')).toBeTruthy();
  });
});
