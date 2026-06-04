import { isValidPersistedState, STATE_VERSION } from '../repository';
import { makePatientRecord, makePersistedState, makeProfile } from '../../testing/factories';

describe('isValidPersistedState (Zod boundary guard)', () => {
  it('GIVEN a well-formed snapshot THEN accepts it', () => {
    expect(isValidPersistedState(makePersistedState())).toBe(true);
  });

  it('GIVEN extended medical-card fields THEN still accepts it', () => {
    const record = makePatientRecord({
      profile: makeProfile({
        dyslipidemiaStatus: 'yes',
        chronicConditions: ['Гипертония'],
        allergies: ['Пенициллин'],
        medicationNotes: 'Лизиноприл',
        unit: 'Подразделение №2',
        serviceYears: 22,
        doctorId: 'doc_test',
      }),
    });
    const state = makePersistedState({ records: { [record.profile.id]: record } });
    expect(isValidPersistedState(state)).toBe(true);
  });

  it('GIVEN a record WITHOUT the optional new profile fields THEN still accepts it', () => {
    expect(isValidPersistedState(makePersistedState())).toBe(true);
  });

  it('GIVEN a mismatched version THEN rejects it', () => {
    expect(isValidPersistedState(makePersistedState({ version: STATE_VERSION + 1 }))).toBe(false);
  });

  it('GIVEN an invalid enum value THEN rejects it', () => {
    expect(isValidPersistedState({ ...makePersistedState(), role: 'admin' })).toBe(false);
  });

  it('GIVEN a missing required section THEN rejects it', () => {
    const { records: _omitted, ...withoutRecords } = makePersistedState();
    expect(isValidPersistedState(withoutRecords)).toBe(false);
  });

  it.each([null, undefined, 42, 'state', { bad: true }, []])(
    'GIVEN structurally unusable input (%p) THEN rejects it',
    (input) => {
      expect(isValidPersistedState(input)).toBe(false);
    },
  );

  it('GIVEN unknown extra keys THEN still accepts (lenient on extras)', () => {
    expect(isValidPersistedState({ ...makePersistedState(), extraFutureField: 123 })).toBe(true);
  });
});
