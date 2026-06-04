import { createApiRepository } from '../apiRepository';
import { makePersistedState } from '../../testing/factories';

const makeState = makePersistedState;

function res(status: number, body?: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

const noDelay = () => Promise.resolve();

describe('apiRepository', () => {
  it('GIVEN GET 200 with valid state THEN returns it from /state', async () => {
    const state = makeState();
    const fetchMock = jest.fn(async () => res(200, state));
    const repo = createApiRepository({ baseUrl: 'https://x/', fetchImpl: fetchMock as unknown as typeof fetch, delay: noDelay });
    expect(await repo.load()).toEqual(state);
    expect(fetchMock).toHaveBeenCalledWith('https://x/state', expect.objectContaining({ method: 'GET' }));
  });

  it('GIVEN GET 404 THEN returns null', async () => {
    const repo = createApiRepository({ baseUrl: 'https://x', fetchImpl: (async () => res(404)) as unknown as typeof fetch, delay: noDelay });
    expect(await repo.load()).toBeNull();
  });

  it('GIVEN an invalid body THEN returns null (schema guard)', async () => {
    const repo = createApiRepository({ baseUrl: 'https://x', fetchImpl: (async () => res(200, { bad: true })) as unknown as typeof fetch, delay: noDelay });
    expect(await repo.load()).toBeNull();
  });

  it('GIVEN a transient 500 then 200 THEN retries and succeeds', async () => {
    const state = makeState();
    const fetchMock = jest.fn().mockResolvedValueOnce(res(500)).mockResolvedValueOnce(res(200, state));
    const repo = createApiRepository({ baseUrl: 'https://x', retries: 2, fetchImpl: fetchMock as unknown as typeof fetch, delay: noDelay });
    expect(await repo.load()).toEqual(state);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('GIVEN repeated network errors THEN gives up after retries+1 attempts → null', async () => {
    const fetchMock = jest.fn(async () => {
      throw new Error('network down');
    });
    const repo = createApiRepository({ baseUrl: 'https://x', retries: 2, fetchImpl: fetchMock as unknown as typeof fetch, delay: noDelay });
    expect(await repo.load()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('GIVEN save THEN PUTs the serialized state', async () => {
    const state = makeState();
    const fetchMock = jest.fn(async () => res(200));
    const repo = createApiRepository({ baseUrl: 'https://x', fetchImpl: fetchMock as unknown as typeof fetch, delay: noDelay });
    await repo.save(state);
    expect(fetchMock).toHaveBeenCalledWith('https://x/state', expect.objectContaining({ method: 'PUT', body: JSON.stringify(state) }));
  });

  it('GIVEN clear THEN DELETEs', async () => {
    const fetchMock = jest.fn(async () => res(200));
    const repo = createApiRepository({ baseUrl: 'https://x', fetchImpl: fetchMock as unknown as typeof fetch, delay: noDelay });
    await repo.clear();
    expect(fetchMock).toHaveBeenCalledWith('https://x/state', expect.objectContaining({ method: 'DELETE' }));
  });
});
