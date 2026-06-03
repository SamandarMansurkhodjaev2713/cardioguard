/**
 * Top-level error boundary. Catches render/runtime errors anywhere in the tree
 * and shows a calm recovery screen instead of a white crash — important for a
 * live demo. The fallback is intentionally theme-free (fixed light palette,
 * system font, hardcoded RU copy): it must render even if the ThemeProvider or
 * font loading is the thing that failed. "Try again" re-mounts the subtree.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { palette } from '../theme/tokens';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled UI error caught by ErrorBoundary', {
      error: String(error),
      componentStack: info.componentStack ?? '',
    });
  }

  private readonly reset = () => this.setState({ hasError: false });

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 28, rowGap: 12 }}>
        <View
          style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>⚠️</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.text, textAlign: 'center' }}>
          Что-то пошло не так
        </Text>
        <Text style={{ fontSize: 14, color: palette.text2, textAlign: 'center', lineHeight: 20, maxWidth: 320 }}>
          Произошла непредвиденная ошибка. Данные сохранены локально — попробуйте продолжить.
        </Text>
        <Pressable
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="Попробовать снова"
          style={{
            marginTop: 6, height: 48, paddingHorizontal: 24, borderRadius: 14,
            backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: palette.onPrimary, fontSize: 15, fontWeight: '600' }}>Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }
}
