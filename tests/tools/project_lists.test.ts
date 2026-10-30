import { describe, it, expect } from 'vitest';
import { projectListTools } from '../../src/tools/project_lists.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = projectListTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_lists_in_space ────────────────────────────────────────────────────

describe('ghl_get_lists_in_space', () => {
  it('calls GET /projects/spaces/:spaceId/lists with query params without locationId', async () => {
    const fetch = mockFetchSuccess({ lists: [] });
    await getTool('ghl_get_lists_in_space').handler(
      { spaceId: 'space_1', limit: 20, cursor: 'abc', anchorId: 'list_9' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/spaces/space_1/lists');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.limit).toBe('20');
    expect(call.params.cursor).toBe('abc');
    expect(call.params.anchorId).toBe('list_9');
  });

  it('accepts limit 100 and rejects 101 and 0', () => {
    const schema = getTool('ghl_get_lists_in_space').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1', limit: 100 }).success).toBe(true);
    expect(schema.safeParse({ spaceId: 'space_1', limit: 101 }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', limit: 0 }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Space not found' });
    expectError(await getTool('ghl_get_lists_in_space').handler({ spaceId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_create_list_in_space ──────────────────────────────────────────────────

describe('ghl_create_list_in_space', () => {
  it('calls POST /projects/spaces/:spaceId/lists without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'list_1', name: 'Campaigns' });
    await getTool('ghl_create_list_in_space').handler({ spaceId: 'space_1', name: 'Campaigns' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/spaces/space_1/lists');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toMatchObject({ name: 'Campaigns' });
    expect(call.body).not.toHaveProperty('spaceId');
  });

  it('passes optional color, isPrivate and userIds in the body', async () => {
    const fetch = mockFetchSuccess({ id: 'list_1' });
    await getTool('ghl_create_list_in_space').handler(
      { spaceId: 'space_1', name: 'Ops', color: '#22C55E', isPrivate: false, userIds: ['user_1'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body).toMatchObject({ name: 'Ops', color: '#22C55E', isPrivate: false, userIds: ['user_1'] });
  });

  it('requires name and rejects a color outside the allowed swatches', () => {
    const schema = getTool('ghl_create_list_in_space').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1' }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', name: 'Ops', color: '#000000' }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', name: 'Ops', color: '#22C55E' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid color' });
    expectError(
      await getTool('ghl_create_list_in_space').handler({ spaceId: 'space_1', name: 'x' }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_get_lists_in_folder ───────────────────────────────────────────────────

describe('ghl_get_lists_in_folder', () => {
  it('calls GET /projects/folders/:folderId/lists with query params without locationId', async () => {
    const fetch = mockFetchSuccess({ lists: [] });
    await getTool('ghl_get_lists_in_folder').handler(
      { folderId: 'folder_1', limit: 50, cursor: 'xyz', anchorId: 'list_2' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/folders/folder_1/lists');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.limit).toBe('50');
    expect(call.params.cursor).toBe('xyz');
    expect(call.params.anchorId).toBe('list_2');
  });

  it('accepts limit 100 and rejects 101 and 0', () => {
    const schema = getTool('ghl_get_lists_in_folder').inputSchema;
    expect(schema.safeParse({ folderId: 'folder_1', limit: 100 }).success).toBe(true);
    expect(schema.safeParse({ folderId: 'folder_1', limit: 101 }).success).toBe(false);
    expect(schema.safeParse({ folderId: 'folder_1', limit: 0 }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_lists_in_folder').handler({ folderId: 'folder_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_create_list_in_folder ─────────────────────────────────────────────────

describe('ghl_create_list_in_folder', () => {
  it('calls POST /projects/folders/:folderId/lists without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'list_1' });
    await getTool('ghl_create_list_in_folder').handler({ folderId: 'folder_1', name: 'Leads' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/folders/folder_1/lists');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toMatchObject({ name: 'Leads' });
    expect(call.body).not.toHaveProperty('folderId');
  });

  it('passes optional color, isPrivate and userIds in the body', async () => {
    const fetch = mockFetchSuccess({ id: 'list_1' });
    await getTool('ghl_create_list_in_folder').handler(
      { folderId: 'folder_1', name: 'Leads', color: '#EF4444', isPrivate: true, userIds: ['user_2'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body).toMatchObject({ name: 'Leads', color: '#EF4444', isPrivate: true, userIds: ['user_2'] });
  });

  it('requires name and rejects a color outside the allowed swatches', () => {
    const schema = getTool('ghl_create_list_in_folder').inputSchema;
    expect(schema.safeParse({ folderId: 'folder_1' }).success).toBe(false);
    expect(schema.safeParse({ folderId: 'folder_1', name: 'Leads', color: '#000000' }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Folder not found' });
    expectError(
      await getTool('ghl_create_list_in_folder').handler({ folderId: 'missing', name: 'x' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_get_list ──────────────────────────────────────────────────────────────

describe('ghl_get_list', () => {
  it('calls GET /projects/lists/:listId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'list_1' });
    await getTool('ghl_get_list').handler({ listId: 'list_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/lists/list_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'List not found' });
    expectError(await getTool('ghl_get_list').handler({ listId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_update_list ───────────────────────────────────────────────────────────

describe('ghl_update_list', () => {
  it('calls PATCH /projects/lists/:listId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'list_1' });
    await getTool('ghl_update_list').handler({ listId: 'list_1', name: 'Renamed', isPrivate: true }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/projects/lists/list_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toMatchObject({ name: 'Renamed', isPrivate: true });
    expect(call.body).not.toHaveProperty('listId');
  });

  it('accepts only listId (all other fields optional) and rejects a color outside the swatches', () => {
    const schema = getTool('ghl_update_list').inputSchema;
    expect(schema.safeParse({ listId: 'list_1' }).success).toBe(true);
    expect(schema.safeParse({ listId: 'list_1', color: '#000000' }).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', color: '#22C55E' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid color' });
    expectError(await getTool('ghl_update_list').handler({ listId: 'list_1', name: 'x' }, TEST_CONFIG), 422);
  });
});

// ── ghl_delete_list ───────────────────────────────────────────────────────────

describe('ghl_delete_list', () => {
  it('calls DELETE /projects/lists/:listId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_list').handler({ listId: 'list_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/lists/list_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'List not found' });
    expectError(await getTool('ghl_delete_list').handler({ listId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_get_list_users ────────────────────────────────────────────────────────

describe('ghl_get_list_users', () => {
  it('calls GET /projects/lists/:listId/users with skip and limit without locationId', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_get_list_users').handler({ listId: 'list_1', skip: 10, limit: 25 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/lists/list_1/users');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.skip).toBe('10');
    expect(call.params.limit).toBe('25');
  });

  it('accepts limit 50 and rejects 51 and 0 (capped at 50, not 100)', () => {
    const schema = getTool('ghl_get_list_users').inputSchema;
    expect(schema.safeParse({ listId: 'list_1', limit: 50 }).success).toBe(true);
    expect(schema.safeParse({ listId: 'list_1', limit: 51 }).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', limit: 0 }).success).toBe(false);
  });

  it('accepts skip 0 and rejects a negative skip', () => {
    const schema = getTool('ghl_get_list_users').inputSchema;
    expect(schema.safeParse({ listId: 'list_1', skip: 0 }).success).toBe(true);
    expect(schema.safeParse({ listId: 'list_1', skip: -1 }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_list_users').handler({ listId: 'list_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_revoke_list_member ────────────────────────────────────────────────────

describe('ghl_revoke_list_member', () => {
  it('calls DELETE /projects/lists/:listId/users/:userId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_revoke_list_member').handler({ listId: 'list_1', userId: 'user_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/lists/list_1/users/user_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Member not found' });
    expectError(
      await getTool('ghl_revoke_list_member').handler({ listId: 'list_1', userId: 'user_1' }, TEST_CONFIG),
      404
    );
  });
});
