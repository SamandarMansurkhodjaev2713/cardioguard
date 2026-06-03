import { buildReminderSlots, parseTimeOfDay } from '../reminders';
import type { Medication } from '../types';

function med(overrides: Partial<Medication>): Medication {
  return {
    id: 'm1',
    userId: 'u1',
    name: 'Препарат',
    dosage: '10 мг',
    frequencyPerDay: 1,
    intakeTimes: ['08:00'],
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: null,
    instructions: '',
    isActive: true,
    ...overrides,
  };
}

describe('parseTimeOfDay', () => {
  it.each([
    ['08:00', 8, 0],
    ['23:59', 23, 59],
    ['9:30', 9, 30],
    ['00:00', 0, 0],
  ])('parses %s', (input, hour, minute) => {
    expect(parseTimeOfDay(input)).toEqual({ hour, minute });
  });

  it.each(['24:00', '08:60', '8', '08:0', '', 'abc', '12:5a'])('rejects %s', (input) => {
    expect(parseTimeOfDay(input)).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    expect(parseTimeOfDay('  07:15 ')).toEqual({ hour: 7, minute: 15 });
  });
});

describe('buildReminderSlots', () => {
  it('groups medications sharing an intake time into one slot', () => {
    const slots = buildReminderSlots([
      med({ id: 'a', name: 'Лизиноприл', dosage: '10 мг', intakeTimes: ['08:00'] }),
      med({ id: 'b', name: 'Аспирин', dosage: '75 мг', intakeTimes: ['08:00'] }),
    ]);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ time: '08:00', hour: 8, minute: 0 });
    expect(slots[0].medications).toEqual([
      { name: 'Лизиноприл', dosage: '10 мг' },
      { name: 'Аспирин', dosage: '75 мг' },
    ]);
  });

  it('returns slots sorted chronologically', () => {
    const slots = buildReminderSlots([
      med({ id: 'a', intakeTimes: ['20:00', '08:00', '13:30'] }),
    ]);
    expect(slots.map((s) => s.time)).toEqual(['08:00', '13:30', '20:00']);
  });

  it('ignores inactive medications', () => {
    const slots = buildReminderSlots([med({ id: 'a', isActive: false, intakeTimes: ['08:00'] })]);
    expect(slots).toHaveLength(0);
  });

  it('skips malformed times instead of scheduling them', () => {
    const slots = buildReminderSlots([med({ id: 'a', intakeTimes: ['08:00', '99:99', 'noon'] })]);
    expect(slots.map((s) => s.time)).toEqual(['08:00']);
  });

  it('returns no slots for an empty medication list', () => {
    expect(buildReminderSlots([])).toEqual([]);
  });
});
