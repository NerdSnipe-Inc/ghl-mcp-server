import { describe, it, expect } from 'vitest';
import { projectSpaceTools } from '../../src/tools/project_spaces.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = projectSpaceTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_space ──────────────────────────────────────────────────────────

describe('ghl_create_space', () => {
  it('calls POST /projects/spaces without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'space_1', type: 'space', name: 'Marketing' });
    await getTool('ghl_create_space').handler({ name: 'Marketing' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/spaces');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toMatchObject({ name: 'Marketing' });
  });

  it('passes optional color, isPrivate and userIds in the body', async () => {
    const fetch = mockFetchSuccess({ id: 'space_1' });
    await getTool('ghl_create_space').handler(
      { name: 'Ops', color: '#3B82F6', isPrivate: true, userIds: ['user_1'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body).toMatchObject({ name: 'Ops', color: '#3B82F6', isPrivate: true, userIds: ['user_1'] });
  });

  it('rejects a color outside the allowed swatches', () => {
    const schema = getTool('ghl_create_space').inputSchema;
    expect(schema.safeParse({ name: 'Ops', color: '#000000' }).success).toBe(false);
    expect(schema.safeParse({ name: 'Ops', color: '#3B82F6' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid color' });
    expectError(await getTool('ghl_create_space').handler({ name: 'x' }, TEST_CONFIG), 422);
  });
});

// ── ghl_get_spaces ────────────────────────────────────────────────────────────

describe('ghl_get_spaces', () => {
  it('calls GET /projects/spaces without locationId', async () => {
    const fetch = mockFetchSuccess({ spaces: [] });
    await getTool('ghl_get_spaces').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/spaces');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_spaces').handler({}, TEST_CONFIG), 500);
  });
});

// ── ghl_get_space ─────────────────────────────────────────────────────────────

describe('ghl_get_space', () => {
  it('calls GET /projects/spaces/:spaceId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'space_1' });
    await getTool('ghl_get_space').handler({ spaceId: 'space_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/spaces/space_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Space not found' });
    expectError(await getTool('ghl_get_space').handler({ spaceId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_update_space ──────────────────────────────────────────────────────────

describe('ghl_update_space', () => {
  it('calls PATCH /projects/spaces/:spaceId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'space_1' });
    await getTool('ghl_update_space').handler(
      { spaceId: 'space_1', name: 'Renamed', isPrivate: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/projects/spaces/space_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toMatchObject({ name: 'Renamed', isPrivate: false });
    expect(call.body).not.toHaveProperty('spaceId');
  });

  it('rejects a color outside the allowed swatches', () => {
    const schema = getTool('ghl_update_space').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1', color: '#000000' }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid color' });
    expectError(
      await getTool('ghl_update_space').handler({ spaceId: 'space_1', name: 'x' }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_delete_space ──────────────────────────────────────────────────────────

describe('ghl_delete_space', () => {
  it('calls DELETE /projects/spaces/:spaceId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_space').handler({ spaceId: 'space_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/spaces/space_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Space not found' });
    expectError(await getTool('ghl_delete_space').handler({ spaceId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_get_space_users ───────────────────────────────────────────────────────

describe('ghl_get_space_users', () => {
  it('calls GET /projects/spaces/:spaceId/users with skip and limit without locationId', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_get_space_users').handler({ spaceId: 'space_1', skip: 10, limit: 25 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/spaces/space_1/users');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.skip).toBe('10');
    expect(call.params.limit).toBe('25');
  });

  it('rejects a limit above 50', () => {
    const schema = getTool('ghl_get_space_users').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1', limit: 51 }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', limit: 50 }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_space_users').handler({ spaceId: 'space_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_revoke_space_member ───────────────────────────────────────────────────

describe('ghl_revoke_space_member', () => {
  it('calls DELETE /projects/spaces/:spaceId/users/:userId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_revoke_space_member').handler({ spaceId: 'space_1', userId: 'user_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/spaces/space_1/users/user_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Member not found' });
    expectError(
      await getTool('ghl_revoke_space_member').handler({ spaceId: 'space_1', userId: 'user_1' }, TEST_CONFIG),
      404
    );
  });
});
