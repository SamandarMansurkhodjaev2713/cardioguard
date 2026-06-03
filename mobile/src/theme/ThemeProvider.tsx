import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  buildTheme,
  type ColorScheme,
  type DensityPreset,
  type RadiusPreset,
  type Theme,
} from './tokens';

/**
 * Holds the user's visual "tweaks" (corner radius, density, appearance) and
 * exposes the resolved {@link Theme}. Defaults mirror the design screenshots:
 * comfortable spacing, strict corners, light appearance. `appearance: 'system'`
 * follows the OS. Persistence is delegated upward via `onPreferencesChange` so
 * this provider stays free of I/O.
 */

export type AppearancePreference = 'light' | 'dark' | 'system';

export interface ThemePreferences {
  readonly radius: RadiusPreset;
  readonly density: DensityPreset;
  readonly appearance: AppearancePreference;
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  radius: 'strict',
  density: 'comfortable',
  appearance: 'light',
};

interface ThemeContextValue {
  readonly theme: Theme;
  readonly preferences: ThemePreferences;
  readonly setRadius: (radius: RadiusPreset) => void;
  readonly setDensity: (density: DensityPreset) => void;
  readonly setAppearance: (appearance: AppearancePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  readonly children: ReactNode;
  /** Initial tweaks (e.g. hydrated from storage). Merged over defaults. */
  readonly initialPreferences?: Partial<ThemePreferences>;
  /** Called whenever a tweak changes, so the host can persist it. */
  readonly onPreferencesChange?: (next: ThemePreferences) => void;
}

export function ThemeProvider({
  children,
  initialPreferences,
  onPreferencesChange,
}: ThemeProviderProps) {
  const [preferences, setPreferences] = useState<ThemePreferences>(() => ({
    ...DEFAULT_THEME_PREFERENCES,
    ...initialPreferences,
  }));
  const systemScheme = useColorScheme();

  const update = useCallback(
    (patch: Partial<ThemePreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        onPreferencesChange?.(next);
        return next;
      });
    },
    [onPreferencesChange],
  );

  const setRadius = useCallback((radius: RadiusPreset) => update({ radius }), [update]);
  const setDensity = useCallback((density: DensityPreset) => update({ density }), [update]);
  const setAppearance = useCallback((appearance: AppearancePreference) => update({ appearance }), [update]);

  const scheme: ColorScheme =
    preferences.appearance === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preferences.appearance;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: buildTheme({ radius: preferences.radius, density: preferences.density, scheme }),
      preferences,
      setRadius,
      setDensity,
      setAppearance,
    }),
    [preferences, scheme, setRadius, setDensity, setAppearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return ctx;
}

/** The resolved theme (colors, spacing, radii, typography). */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** Tweak controls + current preferences (for the Settings screen). */
export function useThemeControls(): Omit<ThemeContextValue, 'theme'> {
  const { preferences, setRadius, setDensity, setAppearance } = useThemeContext();
  return { preferences, setRadius, setDensity, setAppearance };
}
