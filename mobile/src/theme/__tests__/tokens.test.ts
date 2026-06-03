import { buildTheme, darkColors, palette } from '../tokens';

const base = { radius: 'strict', density: 'comfortable' } as const;

describe('buildTheme', () => {
  it('GIVEN light scheme THEN uses the light palette', () => {
    const theme = buildTheme({ ...base, scheme: 'light' });
    expect(theme.colors.bg).toBe(palette.bg);
    expect(theme.scheme).toBe('light');
  });

  it('GIVEN dark scheme THEN uses the dark palette', () => {
    const theme = buildTheme({ ...base, scheme: 'dark' });
    expect(theme.colors.bg).toBe(darkColors.bg);
    expect(theme.colors.surface).toBe(darkColors.surface);
    expect(theme.scheme).toBe('dark');
  });

  it('resolves status tones from the active palette', () => {
    expect(buildTheme({ ...base, scheme: 'dark' }).tone('ok').fg).toBe(darkColors.ok);
    expect(buildTheme({ ...base, scheme: 'light' }).tone('high').fg).toBe(palette.high);
  });

  it('light and dark palettes share the exact same token keys', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(palette).sort());
  });
});
