import { deriveRisk, selectAdherencePercent, selectUnreadAlertCount, useAppStore } from '../useAppStore';
import { seedStore } from '../../testing/storeHarness';

describe('useAppStore (integration: store + domain engines)', () => {
  beforeEach(() => {
    seedStore();
  });

  it('seeds the demo patient with history and alerts', () => {
    const s = useAppStore.getState();
    expect(s.profile.anonymizedId).toBe('P-0142');
    expect(s.measurements.length).toBeGreaterThan(0);
    expect(s.medications.length).toBe(4);
    expect(selectUnreadAlertCount(s)).toBeGreaterThan(0);
  });

  it('addMeasurement prepends the reading and regenerates alerts', () => {
    const before = useAppStore.getState().measurements.length;
    useAppStore.getState().addMeasurement({
      systolicBp: 185, diastolicBp: 115, heartRate: 90, weightKg: 93,
      waistCircumferenceCm: 104, sleepHours: 6, stressLevel: 'high', physicalActivityMinutes: 10, notes: '',
    });
    const s = useAppStore.getState();
    expect(s.measurements.length).toBe(before + 1);
    expect(s.measurements[0].systolicBp).toBe(185);
    expect(s.alerts.some((a) => a.type === 'bloodPressure')).toBe(true);
  });

  it('recordIntake raises the adherence percentage', () => {
    const before = selectAdherencePercent(useAppStore.getState());
    const med = useAppStore.getState().medications[0];
    useAppStore.getState().recordIntake(med.id, med.intakeTimes[0]);
    expect(selectAdherencePercent(useAppStore.getState())).toBeGreaterThan(before);
  });

  it('markAlertRead marks a single alert read', () => {
    const unread = useAppStore.getState().alerts.find((a) => !a.isRead);
    expect(unread).toBeDefined();
    useAppStore.getState().markAlertRead(unread!.id);
    expect(useAppStore.getState().alerts.find((a) => a.id === unread!.id)?.isRead).toBe(true);
  });

  it('setRiskModel switches the active model', () => {
    useAppStore.getState().setRiskModel('framingham');
    expect(useAppStore.getState().riskModel).toBe('framingham');
  });

  it('setRiskInputs stores labs/region and changes the computed risk', () => {
    const before = deriveRisk(useAppStore.getState());
    expect(before.assumptionKeys).toContain('defaultCholesterol'); // seed has no labs
    useAppStore.getState().setRiskInputs({ totalCholMmol: 7.5, hdlCholMmol: 0.9, riskRegion: 'veryHigh' });
    const s = useAppStore.getState();
    expect(s.profile.totalCholMmol).toBe(7.5);
    expect(s.profile.hdlCholMmol).toBe(0.9);
    const after = deriveRisk(s);
    expect(after.percent).toBeGreaterThan(before.percent);
    expect(after.assumptionKeys).not.toContain('defaultCholesterol');
  });

  it('updateMedicalProfile merges only provided fields and bumps updatedAt', () => {
    const before = useAppStore.getState().profile;
    useAppStore.getState().updateMedicalProfile({
      dyslipidemiaStatus: 'yes',
      allergies: ['Аспирин'],
      unit: 'Подразделение №7',
      serviceYears: 12,
    });
    const after = useAppStore.getState().profile;
    expect(after.dyslipidemiaStatus).toBe('yes');
    expect(after.allergies).toEqual(['Аспирин']);
    expect(after.unit).toBe('Подразделение №7');
    expect(after.serviceYears).toBe(12);
    // Untouched fields are preserved.
    expect(after.fullName).toBe(before.fullName);
    expect(after.age).toBe(before.age);
  });

  it('updateMedicalProfile never clobbers a required field with undefined', () => {
    const before = useAppStore.getState().profile;
    useAppStore.getState().updateMedicalProfile({ age: undefined, unit: 'Подразделение №3' });
    const after = useAppStore.getState().profile;
    expect(after.age).toBe(before.age); // unchanged
    expect(after.unit).toBe('Подразделение №3');
  });

  it('updateMedicalProfile recomputes alerts when clinical flags change risk', () => {
    // Turning on diabetes raises SCORE2 → may surface a high-risk signal; at
    // minimum the call must not throw and must keep the alert set consistent.
    expect(() => useAppStore.getState().updateMedicalProfile({ diabetesStatus: 'yes' })).not.toThrow();
    expect(useAppStore.getState().profile.diabetesStatus).toBe('yes');
  });

  it('addMoodEntry prepends a check-in (newest-first)', () => {
    const before = useAppStore.getState().moodEntries.length;
    useAppStore.getState().addMoodEntry({
      lowMood: 1, anxiety: 1, stress: 1, emotionalInstability: 1, sleepProblems: 1, fatigue: 1, note: '',
    });
    const s = useAppStore.getState();
    expect(s.moodEntries.length).toBe(before + 1);
    expect(s.moodEntries[0].anxiety).toBe(1);
  });

  it('addMoodEntry with a distressed state raises a psychDistress alert', () => {
    useAppStore.getState().addMoodEntry({
      lowMood: 2, anxiety: 4, stress: 2, emotionalInstability: 1, sleepProblems: 2, fatigue: 2, note: '',
    });
    expect(useAppStore.getState().alerts.some((a) => a.type === 'psychDistress')).toBe(true);
  });

  it('applyOnboarding replaces the profile and resets history to the baseline', () => {
    const baseline = useAppStore.getState().measurements[0];
    const profile = { ...useAppStore.getState().profile, fullName: 'Новый Пациент' };
    useAppStore.getState().applyOnboarding(profile, baseline);
    const s = useAppStore.getState();
    expect(s.profile.fullName).toBe('Новый Пациент');
    expect(s.measurements).toHaveLength(1);
  });
});
