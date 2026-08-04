import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userTools, __resetCompanyIdCacheForTests } from '../../src/tools/users.js';
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

// getCompanyId() memoizes the resolved companyId per locationId in a
// module-level cache. Clear it before every test so each test that expects
// a location lookup (mockTwoCalls / mockLocationOkThenError) actually gets
// one, regardless of test execution order within this file.
beforeEach(() => {
  __resetCompanyIdCacheForTests();
});

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

  it('accepts scopes, scopesAssignedToOnly, profilePhoto, twilioPhone, platformLanguage', async () => {
    const fetch = mockTwoCalls(MOCK_DATA);
    await getTool('ghl_create_user').handler(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Sup3rSecret!Pass',
        type: 'account',
        role: 'user',
        scopes: ['contacts.write', 'campaigns.readonly'],
        scopesAssignedToOnly: ['contacts.write'],
        profilePhoto: 'https://img.png',
        twilioPhone: { 'loc-1': '+18832327657' },
        platformLanguage: 'en_US',
      },
      TEST_CONFIG
    );
    const createCall = parseFetchCall(fetch, 1);
    expect(createCall.body?.scopes).toEqual(['contacts.write', 'campaigns.readonly']);
    expect(createCall.body?.scopesAssignedToOnly).toEqual(['contacts.write']);
    expect(createCall.body?.profilePhoto).toBe('https://img.png');
    expect(createCall.body?.twilioPhone).toEqual({ 'loc-1': '+18832327657' });
    expect(createCall.body?.platformLanguage).toBe('en_US');
  });

  describe('permissions field', () => {
    it('rejects the old misspelled attributionReportEnabled field name', () => {
      const result = getTool('ghl_create_user').inputSchema.safeParse({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'Sup3rSecret!Pass',
        type: 'account',
        role: 'user',
        permissions: { attributionReportEnabled: true },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data.permissions as Record<string, unknown> | undefined)?.attributionReportEnabled).toBeUndefined();
      }
    });

    it('accepts the correct attributionsReportingEnabled field name', async () => {
      const fetch = mockTwoCalls(MOCK_DATA);
      await getTool('ghl_create_user').handler(
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Sup3rSecret!Pass',
          type: 'account',
          role: 'user',
          permissions: { attributionsReportingEnabled: true },
        },
        TEST_CONFIG
      );
      const createCall = parseFetchCall(fetch, 1);
      expect((createCall.body?.permissions as Record<string, unknown>)?.attributionsReportingEnabled).toBe(true);
    });

    it('rejects the fabricated fields not present in the v3 spec', () => {
      const result = getTool('ghl_create_user').inputSchema.safeParse({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'Sup3rSecret!Pass',
        type: 'account',
        role: 'user',
        permissions: {
          userCommsMgmtEnabled: true,
          auditLogsEnabled: true,
          leadSourcesEnabled: true,
          agentLeaderboardEnabled: true,
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const perms = result.data.permissions as Record<string, unknown> | undefined;
        expect(perms?.userCommsMgmtEnabled).toBeUndefined();
        expect(perms?.auditLogsEnabled).toBeUndefined();
        expect(perms?.leadSourcesEnabled).toBeUndefined();
        expect(perms?.agentLeaderboardEnabled).toBeUndefined();
      }
    });

    it('accepts all real permission fields previously missing from the schema', async () => {
      const fetch = mockTwoCalls(MOCK_DATA);
      const newPermissions = {
        campaignsReadOnly: true,
        workflowsReadOnly: true,
        bulkRequestsEnabled: true,
        botService: true,
        socialPlanner: true,
        bloggingEnabled: true,
        invoiceEnabled: true,
        affiliateManagerEnabled: true,
        contentAiEnabled: true,
        refundsEnabled: true,
        recordPaymentEnabled: true,
        cancelSubscriptionEnabled: true,
        paymentsEnabled: true,
        communitiesEnabled: true,
        exportPaymentsEnabled: true,
      };
      await getTool('ghl_create_user').handler(
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Sup3rSecret!Pass',
          type: 'account',
          role: 'user',
          permissions: newPermissions,
        },
        TEST_CONFIG
      );
      const createCall = parseFetchCall(fetch, 1);
      expect(createCall.body?.permissions).toEqual(newPermissions);
    });
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

  it('accepts locationIds, password, companyId, type, scopes, and Minor fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_user').handler(
      {
        userId: 'user-1',
        locationIds: ['loc-1', 'loc-2'],
        password: 'N3wSecret!Pass',
        companyId: 'company-abc',
        type: 'account',
        scopes: ['contacts.write'],
        scopesAssignedToOnly: ['contacts.write'],
        profilePhoto: 'https://img.png',
        twilioPhone: { 'loc-1': '+18832327657' },
        platformLanguage: 'en_US',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.locationIds).toEqual(['loc-1', 'loc-2']);
    expect(call.body?.password).toBe('N3wSecret!Pass');
    expect(call.body?.companyId).toBe('company-abc');
    expect(call.body?.type).toBe('account');
    expect(call.body?.scopes).toEqual(['contacts.write']);
    expect(call.body?.scopesAssignedToOnly).toEqual(['contacts.write']);
    expect(call.body?.profilePhoto).toBe('https://img.png');
    expect(call.body?.twilioPhone).toEqual({ 'loc-1': '+18832327657' });
    expect(call.body?.platformLanguage).toBe('en_US');
    expectSuccess(result, MOCK_DATA);
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
