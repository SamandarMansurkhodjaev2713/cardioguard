import { isValidPersistedState, STATE_VERSION, type PersistedState } from '../repository';
import { makeAlert, makeMeasurement, makeMedication, makeMedicationLog, makeProfile } from '../../testing/factories';

function makeState(overrides: Partial<PersistedState> = {}): PersistedState {
  return {
    version: STATE_VERSION,
    role: 'patient',
    profile: makeProfile(),
    measurements: [makeMeasurement()],
    medications: [makeMedication()],
    medicationLogs: [makeMedicationLog()],
    alerts: [makeAlert()],
    riskModel: 'score2',
    language: 'ru',
    themePreferences: { density: 'comfortable', radius: 'strict', appearance: 'light' },
    ...overrides,
  };
}

describe('isValidPersistedState (Zod boundary guard)', () => {
  it('GIVEN a well-formed snapshot THEN accepts it', () => {
    expect(isValidPersistedState(makeState())).toBe(true);
  });

  it('GIVEN extended medical-card fields THEN still accepts it', () => {
    const state = makeState({
      profile: makeProfile({
        dyslipidemiaStatus: 'yes',
        chronicConditions: ['Гипертония'],
        allergies: ['Пенициллин'],
        medicationNotes: 'Лизиноприл',
        unit: 'Подразделение №2',
        serviceYears: 22,
      }),
    });
    expect(isValidPersistedState(state)).toBe(true);
  });

  it('GIVEN a profile WITHOUT the optional new fields THEN still accepts it (backward compatible)', () => {
    // makeProfile() omits the extended fields → simulates a pre-upgrade blob.
    expect(isValidPersistedState(makeState())).toBe(true);
  });

  it('GIVEN a mismatched version THEN rejects it', () => {
    expect(isValidPersistedState(makeState({ version: STATE_VERSION + 1 }))).toBe(false);
  });

  it('GIVEN an invalid enum value THEN rejects it', () => {
    expect(isValidPersistedState({ ...makeState(), role: 'admin' })).toBe(false);
  });

  it('GIVEN a missing required section THEN rejects it', () => {
    const { profile: _omitted, ...withoutProfile } = makeState();
    expect(isValidPersistedState(withoutProfile)).toBe(false);
  });

  it.each([null, undefined, 42, 'state', { bad: true }, []])(
    'GIVEN structurally unusable input (%p) THEN rejects it',
    (input) => {
      expect(isValidPersistedState(input)).toBe(false);
    },
  );

  it('GIVEN unknown extra keys THEN still accepts (lenient on extras)', () => {
    expect(isValidPersistedState({ ...makeState(), extraFutureField: 123 })).toBe(true);
  });
});
