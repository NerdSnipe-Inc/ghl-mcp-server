import { describe, it, expect, vi } from 'vitest';
import { userTools } from '../../src/tools/users.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectSuccess,
  expectError,
  FetchCall,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = userTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

const COMPANY_ID = 'company-abc';

/** Mock two sequential fetch calls: location lookup, then the real request. */
function mockTwoCalls(secondResponseData: unknown) {
  const fetchMock = vi.fn();
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ location: { companyId: COMPANY_ID } }),
    text: () => Promise.resolve(JSON.stringify({ location: { companyId: COMPANY_ID } })),
  });
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(secondResponseData),
    text: () => Promise.resolve(JSON.stringify(secondResponseData)),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Mock the location lookup succeeding but the second call failing. */
function mockLocationOkThenError(status: number, body: unknown = { message: 'API Error' }) {
  const statusTexts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  const fetchMock = vi.fn();
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ location: { companyId: COMPANY_ID } }),
    text: () => Promise.resolve(JSON.stringify({ location: { companyId: COMPANY_ID } })),
  });
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: statusTexts[status] ?? 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Parse a specific call (by index) from a fetch mock, following helpers.ts's FetchCall shape. */
function parseFetchCall(fetchMock: ReturnType<typeof vi.fn>, index: number): FetchCall {
  const [url, options] = fetchMock.mock.calls[index] as [string, RequestInit];
  const parsedUrl = new URL(url);
  return {
    url: parsedUrl,
    pathname: parsedUrl.pathname,
    params: Object.fromEntries(parsedUrl.searchParams.entries()),
    method: options.method as string,
    headers: options.headers as Record<string, string>,
    body: options.body ? JSON.parse(options.body as string) as Record<string, unknown> : undefined,
  };
}

// ── ghl_get_users ────────────────────────────────────────────────────────────

describe('ghl_get_users', () => {
  it('derives companyId via location lookup, then calls GET /users/search', async () => {
    const fetch = mockTwoCalls({ users: [] });
    await getTool('ghl_get_users').handler({}, TEST_CONFIG);

    const locationCall = parseFetchCall(fetch, 0);
    expect(locationCall.method).toBe('GET');
    expect(locationCall.pathname).toBe(`/locations/${TEST_CONFIG.locationId}`);
    expect(locationCall.headers.Version).toBe(GHL_VERSION_V3);

    const searchCall = parseFetchCall(fetch, 1);
    expect(searchCall.method).toBe('GET');
    expect(searchCall.pathname).toBe('/users/search');
    expect(searchCall.headers.Version).toBe(GHL_VERSION_V3);
    expect(searchCall.params.companyId).toBe(COMPANY_ID);
    expect(searchCall.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(searchCall.params.query).toBeUndefined();
  });

  it('passes optional limit and skip params', async () => {
    const fetch = mockTwoCalls({ users: [] });
    await getTool('ghl_get_users').handler({ limit: 10, skip: 5 }, TEST_CONFIG);
    const searchCall = parseFetchCall(fetch, 1);
    expect(searchCall.params.limit).toBe('10');
    expect(searchCall.params.skip).toBe('5');
  });

  it('handles API errors from the location lookup', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_users').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });

  it('handles API errors from the search call', async () => {
    mockLocationOkThenError(500, { message: 'Server Error' });
    const result = await getTool('ghl_get_users').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_search_users ─────────────────────────────────────────────────────────

describe('ghl_search_users', () => {
  it('derives companyId via location lookup, then calls GET /users/search with query', async () => {
    const fetch = mockTwoCalls({ users: [] });
    await getTool('ghl_search_users').handler({ query: 'John' }, TEST_CONFIG);

    const locationCall = parseFetchCall(fetch, 0);
    expect(locationCall.method).toBe('GET');
    expect(locationCall.pathname).toBe(`/locations/${TEST_CONFIG.locationId}`);
    expect(locationCall.headers.Version).toBe(GHL_VERSION_V3);

    const searchCall = parseFetchCall(fetch, 1);
    expect(searchCall.method).toBe('GET');
    expect(searchCall.pathname).toBe('/users/search');
    expect(searchCall.headers.Version).toBe(GHL_VERSION_V3);
    expect(searchCall.params.companyId).toBe(COMPANY_ID);
    expect(searchCall.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(searchCall.params.query).toBe('John');
  });

  it('handles API errors from the location lookup', async () => {
    mockFetchError(500, { message: 'Server Error' });
    const result = await getTool('ghl_search_users').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });

  it('handles API errors from the search call', async () => {
    mockLocationOkThenError(500, { message: 'Server Error' });
    const result = await getTool('ghl_search_users').handler({ query: 'John' }, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_get_user ─────────────────────────────────────────────────────────────

describe('ghl_get_user', () => {
  it('calls GET /users/:userId', async () => {
    const fetch = mockFetchSuccess({ id: 'user-1' });
    const result = await getTool('ghl_get_user').handler({ userId: 'user-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/users/user-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { id: 'user-1' });
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_user').handler({ userId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_create_user ──────────────────────────────────────────────────────────

describe('ghl_create_user', () => {
  it('derives companyId via location lookup, then calls POST /users/ with the full v3 body', async () => {
    const fetch = mockTwoCalls(MOCK_DATA);
    const result = await getTool('ghl_create_user').handler(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Sup3rSecret!Pass',
        type: 'account',
        role: 'user',
        locationIds: [TEST_CONFIG.locationId],
      },
      TEST_CONFIG
    );

    const locationCall = parseFetchCall(fetch, 0);
    expect(locationCall.method).toBe('GET');
    expect(locationCall.pathname).toBe(`/locations/${TEST_CONFIG.locationId}`);
    expect(locationCall.headers.Version).toBe(GHL_VERSION_V3);

    const createCall = parseFetchCall(fetch, 1);
    expect(createCall.method).toBe('POST');
    expect(createCall.pathname).toBe('/users/');
    expect(createCall.headers.Version).toBe(GHL_VERSION_V3);
    expect(createCall.body?.companyId).toBe(COMPANY_ID);
    expect(createCall.body?.firstName).toBe('John');
    expect(createCall.body?.lastName).toBe('Doe');
    expect(createCall.body?.email).toBe('john@example.com');
    expect(createCall.body?.password).toBe('Sup3rSecret!Pass');
    expect(createCall.body?.type).toBe('account');
    expect(createCall.body?.role).toBe('user');
    expect(createCall.body?.locationIds).toEqual([TEST_CONFIG.locationId]);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors from the location lookup', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_create_user').handler(
      { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'Sup3rSecret!Pass', type: 'account', role: 'user' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });

  it('handles API errors from the create call', async () => {
    mockLocationOkThenError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_create_user').handler(
      { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'Sup3rSecret!Pass', type: 'account', role: 'user' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_update_user ──────────────────────────────────────────────────────────

describe('ghl_update_user', () => {
  it('calls PUT /users/:userId with body excluding userId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_user').handler(
      { userId: 'user-1', firstName: 'Jane' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/users/user-1');
    expect(call.body?.firstName).toBe('Jane');
    expect(call.body?.userId).toBeUndefined();
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_update_user').handler(
      { userId: 'bad' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_user ──────────────────────────────────────────────────────────

describe('ghl_delete_user', () => {
  it('calls DELETE /users/:userId', async () => {
    const fetch = mockFetchSuccess({ succeeded: true });
    const result = await getTool('ghl_delete_user').handler({ userId: 'user-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/users/user-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { succeeded: true });
  });

  it('handles API errors', async () => {
    mockFetchError(403, { message: 'Forbidden' });
    const result = await getTool('ghl_delete_user').handler({ userId: 'user-1' }, TEST_CONFIG);
    expectError(result, 403);
  });
});
