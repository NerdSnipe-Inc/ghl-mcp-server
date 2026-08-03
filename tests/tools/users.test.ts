import { describe, it, expect } from 'vitest';
import { userTools } from '../../src/tools/users.js';
import { GHL_VERSION_V3, GHL_VERSION_LEGACY } from '../../src/client.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectSuccess,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = userTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_users ────────────────────────────────────────────────────────────

describe('ghl_get_users', () => {
  it('calls GET /users/ with locationId', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_get_users').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/users/');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
  });

  it('passes optional limit and skip params', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_get_users').handler({ limit: 10, skip: 5 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('5');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_users').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_search_users ─────────────────────────────────────────────────────────

describe('ghl_search_users', () => {
  it('calls GET /users/search with locationId and query', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_search_users').handler({ query: 'John' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/users/search');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.query).toBe('John');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server Error' });
    const result = await getTool('ghl_search_users').handler({}, TEST_CONFIG);
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
  it('calls POST /users/ with body including locationId and default type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_user').handler(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/users/');
    expect(call.body?.firstName).toBe('John');
    expect(call.body?.lastName).toBe('Doe');
    expect(call.body?.email).toBe('john@example.com');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.type).toBe('account');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_create_user').handler(
      { firstName: 'A', lastName: 'B', email: 'a@b.com' },
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
