/**
 * Integration tests for the multi-user store: the riskiest piece of the
 * patient↔doctor redesign. Exercises the active-record mirror, write isolation
 * between patients, the doctor↔patient data flow, enrollment, and that the
 * persisted snapshot round-trips through the v2 schema guard.
 */

import { useAppStore } from '../useAppStore';
import { isValidPersistedState, STATE_VERSION, type PersistedState } from '../../data/repository';
import { seedStore } from '../../testing/storeHarness';

const get = () => useAppStore.getState();

/** Reconstruct the persisted snapshot shape from current store state. */
function snapshot(): PersistedState {
  const s = get();
  return {
    version: STATE_VERSION,
    role: s.role,
    doctors: s.doctors,
    records: s.records,
    activePatientId: s.activePatientId,
    currentDoctorId: s.currentDoctorId,
    demoPatientId: s.demoPatientId,
    demoDoctorId: s.demoDoctorId,
    riskModel: s.riskModel,
    language: s.language,
    themePreferences: s.themePreferences,
    remindersEnabled: s.remindersEnabled,
  };
}

describe('multi-user store', () => {
  beforeEach(() => seedStore());

  it('seeds a doctor roster of several patients all enrolled under the demo doctor', () => {
    const s = get();
    const roster = Object.values(s.records).filter((r) => r.profile.doctorId === s.demoDoctorId);
    expect(roster.length).toBeGreaterThanOrEqual(6);
    expect(s.records[s.demoPatientId]).toBeDefined();
    expect(s.doctors.length).toBeGreaterThanOrEqual(1);
  });

  it('openPatient switches the active mirror to that patient', () => {
    const s = get();
    const otherId = Object.keys(s.records).find((id) => id !== s.demoPatientId)!;
    s.openPatient(otherId);
    const after = get();
    expect(after.activePatientId).toBe(otherId);
    expect(after.profile.id).toBe(otherId);
    expect(after.measurements).toBe(after.records[otherId].measurements);
    expect(after.medications).toBe(after.records[otherId].medications);
  });

  it('a patient-added medication lands in that patient record (so the doctor sees it)', () => {
    const pid = get().demoPatientId;
    const before = get().records[pid].medications.length;
    get().addMedication({ name: 'ТестПрепарат', dosage: '5 мг', frequencyPerDay: 1, intakeTimes: ['08:00'], instructions: '' });
    const after = get();
    expect(after.records[pid].medications.length).toBe(before + 1);
    expect(after.medications.length).toBe(before + 1); // mirror stays in sync
    expect(after.records[pid].medications.some((m) => m.name === 'ТестПрепарат')).toBe(true);
  });

  it('deleting a medication removes it and its intake logs', () => {
    const pid = get().demoPatientId;
    const med = get().records[pid].medications[0];
    get().deleteMedication(med.id);
    const after = get().records[pid];
    expect(after.medications.some((m) => m.id === med.id)).toBe(false);
    expect(after.medicationLogs.some((l) => l.medicationId === med.id)).toBe(false);
  });

  it('writes are isolated to the active patient', () => {
    const s = get();
    const a = s.demoPatientId;
    const b = Object.keys(s.records).find((id) => id !== a)!;
    const bMedsBefore = s.records[b].medications.length;
    s.openPatient(a);
    get().addSymptom({ type: 'chestPain', severity: 2, note: 'тест' });
    const after = get();
    expect(after.records[a].symptoms.length).toBe(1);
    expect(after.records[b].symptoms.length).toBe(0);
    expect(after.records[b].medications.length).toBe(bMedsBefore);
  });

  it('setCarePlan stores the plan and reflects targets into the patient profile', () => {
    get().setCarePlan({ targetSystolicBp: 125, targetWeightKg: 84, note: 'План лечения' });
    const after = get();
    expect(after.carePlan.targetSystolicBp).toBe(125);
    expect(after.carePlan.note).toBe('План лечения');
    expect(after.profile.targetSystolicBp).toBe(125);
    expect(after.profile.targetWeightKg).toBe(84);
    expect(after.records[after.demoPatientId].carePlan.targetSystolicBp).toBe(125);
  });

  it('linkToDoctor accepts the invite code (case-insensitive) and rejects an unknown one', () => {
    const code = get().doctors[0].inviteCode;
    get().unlinkDoctor();
    expect(get().profile.doctorId).toBeNull();
    expect(get().linkToDoctor('NOPE-0000')).toBe(false);
    expect(get().profile.doctorId).toBeNull();
    expect(get().linkToDoctor(code.toLowerCase())).toBe(true);
    expect(get().profile.doctorId).toBe(get().doctors[0].id);
  });

  it('addNote and sendMessage append to the active record', () => {
    get().addNote('Контроль через 2 недели');
    get().sendMessage('Здравствуйте');
    const after = get();
    expect(after.notes[0].text).toBe('Контроль через 2 недели');
    expect(after.messages[0].text).toBe('Здравствуйте');
    expect(after.messages[0].fromRole).toBe('patient'); // seedStore logs in as patient
  });

  it('persists a valid v2 snapshot that round-trips through the schema guard', () => {
    // Mutate a few things, then validate the full snapshot.
    get().addMedication({ name: 'X', dosage: '1', frequencyPerDay: 2, intakeTimes: ['08:00', '20:00'], instructions: '' });
    get().setCarePlan({ targetSystolicBp: 130 });
    get().addSymptom({ type: 'palpitations', severity: 1, note: '' });
    expect(isValidPersistedState(snapshot())).toBe(true);
  });
});
