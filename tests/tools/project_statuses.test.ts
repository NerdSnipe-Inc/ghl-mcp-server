import { describe, it, expect } from 'vitest';
import { projectStatusTools } from '../../src/tools/project_statuses.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = projectStatusTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_space_statuses ────────────────────────────────────────────────────

describe('ghl_get_space_statuses', () => {
  it('calls GET /projects/spaces/:spaceId/statuses without locationId', async () => {
    const fetch = mockFetchSuccess({ groups: [] });
    await getTool('ghl_get_space_statuses').handler({ spaceId: 'space_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/spaces/space_1/statuses');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires spaceId', () => {
    const schema = getTool('ghl_get_space_statuses').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Space not found' });
    expectError(await getTool('ghl_get_space_statuses').handler({ spaceId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_update_space_statuses ─────────────────────────────────────────────────

describe('ghl_update_space_statuses', () => {
  const groups = [
    {
      id: 'group_1',
      name: 'Active',
      statuses: [
        { id: 'status_1', name: 'To do', color: '#3B82F6' },
        { id: 'status_2', name: 'Doing', color: '#F59E0B' },
      ],
    },
    {
      id: 'group_2',
      name: 'Closed',
      statuses: [{ id: 'status_3', name: 'Done', color: '#22C55E' }],
    },
  ];

  it('calls PUT /projects/spaces/:spaceId/statuses with groups as the body without locationId', async () => {
    const fetch = mockFetchSuccess({ groups });
    await getTool('ghl_update_space_statuses').handler({ spaceId: 'space_1', groups }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/projects/spaces/space_1/statuses');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({ groups });
  });

  it('round-trips the full groups array verbatim (full replace, not merge)', async () => {
    const fetch = mockFetchSuccess({ groups });
    await getTool('ghl_update_space_statuses').handler({ spaceId: 'space_1', groups }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body).toBeDefined();
    expect((call.body as { groups: unknown }).groups).toEqual(groups);
  });

  it('requires spaceId and a groups array', () => {
    const schema = getTool('ghl_update_space_statuses').inputSchema;
    expect(schema.safeParse({ spaceId: 'space_1' }).success).toBe(false);
    expect(schema.safeParse({ groups: [] }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', groups: 'not-an-array' }).success).toBe(false);
    expect(schema.safeParse({ spaceId: 'space_1', groups: [] }).success).toBe(true);
  });

  it('describes full-replace semantics in the tool description', () => {
    expect(getTool('ghl_update_space_statuses').description).toContain(
      'Replaces the entire status set for this space — omitted groups or statuses are removed.'
    );
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid groups' });
    expectError(
      await getTool('ghl_update_space_statuses').handler({ spaceId: 'space_1', groups: [] }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_get_list_statuses ─────────────────────────────────────────────────────

describe('ghl_get_list_statuses', () => {
  it('calls GET /projects/lists/:listId/statuses without locationId', async () => {
    const fetch = mockFetchSuccess({ groups: [] });
    await getTool('ghl_get_list_statuses').handler({ listId: 'list_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/lists/list_1/statuses');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires listId', () => {
    const schema = getTool('ghl_get_list_statuses').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_list_statuses').handler({ listId: 'list_1' }, TEST_CONFIG), 500);
  });
});
