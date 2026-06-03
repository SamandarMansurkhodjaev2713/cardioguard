/**
 * Minimal structured logger — the single sanctioned console sink. Silenced
 * outside development so no diagnostic output reaches production builds.
 */

declare const __DEV__: boolean;

type Level = 'info' | 'warn' | 'error';
type Meta = Record<string, unknown>;

function emit(level: Level, message: string, meta?: Meta): void {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
  const line = meta ? `[cg] ${message} ${JSON.stringify(meta)}` : `[cg] ${message}`;
  // The one place console.* is allowed; everything else logs through here.
  // eslint-disable-next-line no-console
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  sink(line);
}

export const logger = {
  info: (message: string, meta?: Meta) => emit('info', message, meta),
  warn: (message: string, meta?: Meta) => emit('warn', message, meta),
  error: (message: string, meta?: Meta) => emit('error', message, meta),
};
