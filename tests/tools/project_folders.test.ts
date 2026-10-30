import { describe, it, expect } from 'vitest';
import { projectFolderTools } from '../../src/tools/project_folders.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = projectFolderTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_folders ───────────────────────────────────────────────────────────

describe('ghl_get_folders', () => {
  it('calls GET /projects/spaces/:spaceId/folders with limit, cursor and anchorId without locationId', async () => {
    const fetch = mockFetchSuccess({ folders: [] });
    await getTool('ghl_get_folders').handler(
      { spaceId: 'space_1', limit: 20, cursor: 'abc', anchorId: 'folder_9' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/spaces/space_1/folders');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.limit).toBe('20');
    expect(call.params.cursor).toBe('abc');
    expect(call.params.anchorId).toBe('folder_9');
  });

  it('rejects a limit above 100', () => {
    const schema = getTool('ghl_get_folders').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1', limit: 101 }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', limit: 100 }).success).toBe(true);
  });

  it('rejects a limit of 0', () => {
    const schema = getTool('ghl_get_folders').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1', limit: 0 }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_folders').handler({ spaceId: 'space_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_create_folder ─────────────────────────────────────────────────────────

describe('ghl_create_folder', () => {
  it('calls POST /projects/spaces/:spaceId/folders without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'folder_1', name: 'Campaigns' });
    await getTool('ghl_create_folder').handler({ spaceId: 'space_1', name: 'Campaigns' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/spaces/space_1/folders');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toMatchObject({ name: 'Campaigns' });
    expect(call.body).not.toHaveProperty('spaceId');
  });

  it('passes optional color, isPrivate and userIds in the body', async () => {
    const fetch = mockFetchSuccess({ id: 'folder_1' });
    await getTool('ghl_create_folder').handler(
      { spaceId: 'space_1', name: 'Ops', color: '#3B82F6', isPrivate: true, userIds: ['user_1'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body).toMatchObject({ name: 'Ops', color: '#3B82F6', isPrivate: true, userIds: ['user_1'] });
  });

  it('rejects a color outside the allowed swatches', () => {
    const schema = getTool('ghl_create_folder').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1', name: 'Ops', color: '#000000' }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', name: 'Ops', color: '#3B82F6' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid color' });
    expectError(
      await getTool('ghl_create_folder').handler({ spaceId: 'space_1', name: 'x' }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_get_folder ────────────────────────────────────────────────────────────

describe('ghl_get_folder', () => {
  it('calls GET /projects/folders/:folderId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'folder_1' });
    await getTool('ghl_get_folder').handler({ folderId: 'folder_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/folders/folder_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Folder not found' });
    expectError(await getTool('ghl_get_folder').handler({ folderId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_update_folder ─────────────────────────────────────────────────────────

describe('ghl_update_folder', () => {
  it('calls PATCH /projects/folders/:folderId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'folder_1' });
    await getTool('ghl_update_folder').handler(
      { folderId: 'folder_1', name: 'Renamed', isPrivate: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/projects/folders/folder_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toMatchObject({ name: 'Renamed', isPrivate: false });
    expect(call.body).not.toHaveProperty('folderId');
  });

  it('rejects a color outside the allowed swatches', () => {
    const schema = getTool('ghl_update_folder').inputSchema;
    expect(schema.safeParse({ folderId: 'folder_1', color: '#000000' }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid color' });
    expectError(
      await getTool('ghl_update_folder').handler({ folderId: 'folder_1', name: 'x' }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_delete_folder ─────────────────────────────────────────────────────────

describe('ghl_delete_folder', () => {
  it('calls DELETE /projects/folders/:folderId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_folder').handler({ folderId: 'folder_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/folders/folder_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Folder not found' });
    expectError(await getTool('ghl_delete_folder').handler({ folderId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_get_folder_users ──────────────────────────────────────────────────────

describe('ghl_get_folder_users', () => {
  it('calls GET /projects/folders/:folderId/users with skip and limit without locationId', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_get_folder_users').handler({ folderId: 'folder_1', skip: 5, limit: 10 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/folders/folder_1/users');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.skip).toBe('5');
    expect(call.params.limit).toBe('10');
  });

  it('rejects a limit above 50', () => {
    const schema = getTool('ghl_get_folder_users').inputSchema;
    expect(schema.safeParse({ folderId: 'folder_1', limit: 51 }).success).toBe(false);
    expect(schema.safeParse({ folderId: 'folder_1', limit: 50 }).success).toBe(true);
  });

  it('rejects a limit of 0', () => {
    const schema = getTool('ghl_get_folder_users').inputSchema;
    expect(schema.safeParse({ folderId: 'folder_1', limit: 0 }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_folder_users').handler({ folderId: 'folder_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_revoke_folder_member ──────────────────────────────────────────────────

describe('ghl_revoke_folder_member', () => {
  it('calls DELETE /projects/folders/:folderId/users/:userId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_revoke_folder_member').handler({ folderId: 'folder_1', userId: 'user_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/folders/folder_1/users/user_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Member not found' });
    expectError(
      await getTool('ghl_revoke_folder_member').handler({ folderId: 'folder_1', userId: 'user_1' }, TEST_CONFIG),
      404
    );
  });
});
