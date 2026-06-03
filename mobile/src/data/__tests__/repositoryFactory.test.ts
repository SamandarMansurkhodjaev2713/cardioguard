import { createOfflineFirstRepository } from '../repositoryFactory';
import { STATE_VERSION, type PersistedState, type StateRepository } from '../repository';
import { makeProfile } from '../../testing/factories';

function makeState(): PersistedState {
  return {
    version: STATE_VERSION,
    role: 'patient',
    profile: makeProfile(),
    measurements: [],
    medications: [],
    medicationLogs: [],
    alerts: [],
    riskModel: 'score2',
    language: 'ru',
    themePreferences: { radius: 'strict', density: 'comfortable', appearance: 'light' },
  };
}

function mockRepo(loadValue: PersistedState | null): jest.Mocked<StateRepository> {
  return {
    load: jest.fn(async () => loadValue),
    save: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  } as unknown as jest.Mocked<StateRepository>;
}

describe('offlineFirstRepository', () => {
  it('GIVEN remote has state THEN returns it and warms the local cache', async () => {
    const state = makeState();
    const local = mockRepo(null);
    const remote = mockRepo(state);
    const repo = createOfflineFirstRepository(local, remote);

    expect(await repo.load()).toEqual(state);
    expect(remote.load).toHaveBeenCalledTimes(1);
    expect(local.save).toHaveBeenCalledWith(state);
    expect(local.load).not.toHaveBeenCalled();
  });

  it('GIVEN remote is empty THEN falls back to local', async () => {
    const localState = makeState();
    const local = mockRepo(localState);
    const remote = mockRepo(null);
    const repo = createOfflineFirstRepository(local, remote);

    expect(await repo.load()).toEqual(localState);
    expect(local.load).toHaveBeenCalledTimes(1);
  });

  it('GIVEN save THEN writes local first then syncs remote', async () => {
    const local = mockRepo(null);
    const remote = mockRepo(null);
    const repo = createOfflineFirstRepository(local, remote);
    const state = makeState();

    await repo.save(state);
    expect(local.save).toHaveBeenCalledWith(state);
    expect(remote.save).toHaveBeenCalledWith(state);
  });

  it('GIVEN clear THEN clears both', async () => {
    const local = mockRepo(null);
    const remote = mockRepo(null);
    const repo = createOfflineFirstRepository(local, remote);

    await repo.clear();
    expect(local.clear).toHaveBeenCalledTimes(1);
    expect(remote.clear).toHaveBeenCalledTimes(1);
  });
});
