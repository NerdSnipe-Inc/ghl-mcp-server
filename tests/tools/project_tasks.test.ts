import { describe, it, expect } from 'vitest';
import { projectTaskTools } from '../../src/tools/project_tasks.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = projectTaskTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_tasks ──────────────────────────────────────────────────────────────

describe('ghl_get_tasks', () => {
  it('calls GET /projects/lists/:listId/tasks without locationId', async () => {
    const fetch = mockFetchSuccess({ tasks: [] });
    await getTool('ghl_get_tasks').handler({ listId: 'list_1', limit: 20 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/lists/list_1/tasks');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.limit).toBe('20');
  });

  it('passes searchAfter cursor through as a query param', async () => {
    const fetch = mockFetchSuccess({ tasks: [] });
    await getTool('ghl_get_tasks').handler({ listId: 'list_1', limit: 20, searchAfter: 'cursor_abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.searchAfter).toBe('cursor_abc');
  });

  it('requires listId; limit bounded 1-100', () => {
    const schema = getTool('ghl_get_tasks').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1' }).success).toBe(true);
    expect(schema.safeParse({ listId: 'list_1', limit: 0 }).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', limit: 101 }).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', limit: 100 }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'List not found' });
    expectError(await getTool('ghl_get_tasks').handler({ listId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_create_task ───────────────────────────────────────────────────────────

describe('ghl_create_task', () => {
  it('calls POST /projects/lists/:listId/tasks without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'task_1' });
    await getTool('ghl_create_task').handler(
      { listId: 'list_1', title: 'My task', dueDate: '2026-11-01T00:00:00Z' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/lists/list_1/tasks');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({ title: 'My task', dueDate: '2026-11-01T00:00:00Z' });
  });

  it('succeeds with only title and dueDate (no other fields required)', () => {
    const schema = getTool('ghl_create_task').inputSchema;
    expect(
      schema.safeParse({ listId: 'list_1', title: 'My task', dueDate: '2026-11-01T00:00:00Z' }).success
    ).toBe(true);
  });

  it('requires listId, title and dueDate', () => {
    const schema = getTool('ghl_create_task').inputSchema;
    expect(schema.safeParse({ listId: 'list_1' }).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', title: 'My task' }).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', dueDate: '2026-11-01T00:00:00Z' }).success).toBe(false);
  });

  it('limits assignees to a max of 1 item', () => {
    const schema = getTool('ghl_create_task').inputSchema;
    expect(
      schema.safeParse({
        listId: 'list_1',
        title: 'My task',
        dueDate: '2026-11-01T00:00:00Z',
        assignees: ['user_1'],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        listId: 'list_1',
        title: 'My task',
        dueDate: '2026-11-01T00:00:00Z',
        assignees: ['user_1', 'user_2'],
      }).success
    ).toBe(false);
  });

  it('accepts all optional fields', async () => {
    const fetch = mockFetchSuccess({ id: 'task_1' });
    await getTool('ghl_create_task').handler(
      {
        listId: 'list_1',
        title: 'My task',
        dueDate: '2026-11-01T00:00:00Z',
        body: 'Task description',
        startDate: '2026-10-30T00:00:00Z',
        status: 'open',
        priority: 1,
        parentTaskId: 'task_parent',
        assignees: ['user_1'],
        contactId: 'contact_1',
        businessId: 'business_1',
        customFields: { foo: 'bar' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body).toEqual({
      title: 'My task',
      dueDate: '2026-11-01T00:00:00Z',
      body: 'Task description',
      startDate: '2026-10-30T00:00:00Z',
      status: 'open',
      priority: 1,
      parentTaskId: 'task_parent',
      assignees: ['user_1'],
      contactId: 'contact_1',
      businessId: 'business_1',
      customFields: { foo: 'bar' },
    });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid task' });
    expectError(
      await getTool('ghl_create_task').handler(
        { listId: 'list_1', title: 'My task', dueDate: '2026-11-01T00:00:00Z' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_get_task ───────────────────────────────────────────────────────────────

describe('ghl_get_task', () => {
  it('calls GET /projects/tasks/:taskId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'task_1' });
    await getTool('ghl_get_task').handler({ taskId: 'task_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/tasks/task_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires taskId', () => {
    const schema = getTool('ghl_get_task').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Task not found' });
    expectError(await getTool('ghl_get_task').handler({ taskId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_update_task ──────────────────────────────────────────────────────────────

describe('ghl_update_task', () => {
  it('calls PATCH /projects/tasks/:taskId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'task_1' });
    await getTool('ghl_update_task').handler({ taskId: 'task_1', status: 'done' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/projects/tasks/task_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({ status: 'done' });
  });

  it('succeeds with only status, no title/dueDate required', () => {
    const schema = getTool('ghl_update_task').inputSchema;
    expect(schema.safeParse({ taskId: 'task_1', status: 'done' }).success).toBe(true);
  });

  it('requires only taskId; every body field is optional', () => {
    const schema = getTool('ghl_update_task').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid update' });
    expectError(await getTool('ghl_update_task').handler({ taskId: 'task_1', status: 'done' }, TEST_CONFIG), 422);
  });
});

// ── ghl_delete_task ──────────────────────────────────────────────────────────────

describe('ghl_delete_task', () => {
  it('calls DELETE /projects/tasks/:taskId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_task').handler({ taskId: 'task_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/tasks/task_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires taskId', () => {
    const schema = getTool('ghl_delete_task').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Task not found' });
    expectError(await getTool('ghl_delete_task').handler({ taskId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_search_tasks ─────────────────────────────────────────────────────────────

describe('ghl_search_tasks', () => {
  it('calls POST /projects/tasks/search without locationId', async () => {
    const fetch = mockFetchSuccess({ tasks: [] });
    await getTool('ghl_search_tasks').handler({ limit: 20 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/tasks/search');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({ limit: 20 });
  });

  it('requires limit (1-100)', () => {
    const schema = getTool('ghl_search_tasks').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ limit: 0 }).success).toBe(false);
    expect(schema.safeParse({ limit: 101 }).success).toBe(false);
    expect(schema.safeParse({ limit: 100 }).success).toBe(true);
  });

  it('query is capped at 75 chars', () => {
    const schema = getTool('ghl_search_tasks').inputSchema;
    expect(schema.safeParse({ limit: 20, query: 'a'.repeat(75) }).success).toBe(true);
    expect(schema.safeParse({ limit: 20, query: 'a'.repeat(76) }).success).toBe(false);
  });

  it('listIds capped at 10 items', () => {
    const schema = getTool('ghl_search_tasks').inputSchema;
    expect(schema.safeParse({ limit: 20, listIds: Array.from({ length: 10 }, (_, i) => `l${i}`) }).success).toBe(
      true
    );
    expect(schema.safeParse({ limit: 20, listIds: Array.from({ length: 11 }, (_, i) => `l${i}`) }).success).toBe(
      false
    );
  });

  it('subtaskViewMode only accepts the defined enum values', () => {
    const schema = getTool('ghl_search_tasks').inputSchema;
    expect(schema.safeParse({ limit: 20, subtaskViewMode: 'collapsed' }).success).toBe(true);
    expect(schema.safeParse({ limit: 20, subtaskViewMode: 'expanded' }).success).toBe(true);
    expect(schema.safeParse({ limit: 20, subtaskViewMode: 'separate' }).success).toBe(true);
    expect(schema.safeParse({ limit: 20, subtaskViewMode: 'bogus' }).success).toBe(false);
  });

  it('accepts filters and sort as free-form arrays', async () => {
    const fetch = mockFetchSuccess({ tasks: [] });
    const filters = [{ field: 'status', op: 'eq', value: 'open' }];
    const sort = [{ field: 'dueDate', direction: 'asc' }];
    await getTool('ghl_search_tasks').handler(
      { limit: 20, query: 'hello', filters, listIds: ['list_1'], sort, subtaskViewMode: 'expanded' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body).toEqual({
      limit: 20,
      query: 'hello',
      filters,
      listIds: ['list_1'],
      sort,
      subtaskViewMode: 'expanded',
    });
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_search_tasks').handler({ limit: 20 }, TEST_CONFIG), 500);
  });
});

// ── ghl_get_tasks_by_ids ─────────────────────────────────────────────────────────

describe('ghl_get_tasks_by_ids', () => {
  it('calls POST /projects/tasks/batch without locationId', async () => {
    const fetch = mockFetchSuccess({ tasks: [] });
    await getTool('ghl_get_tasks_by_ids').handler({ ids: ['task_1', 'task_2'] }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/tasks/batch');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({ ids: ['task_1', 'task_2'] });
  });

  it('requires ids array between 1 and 100 items', () => {
    const schema = getTool('ghl_get_tasks_by_ids').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ ids: [] }).success).toBe(false);
    expect(schema.safeParse({ ids: ['task_1'] }).success).toBe(true);
    expect(schema.safeParse({ ids: Array.from({ length: 100 }, (_, i) => `t${i}`) }).success).toBe(true);
    expect(schema.safeParse({ ids: Array.from({ length: 101 }, (_, i) => `t${i}`) }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Invalid ids' });
    expectError(await getTool('ghl_get_tasks_by_ids').handler({ ids: ['task_1'] }, TEST_CONFIG), 400);
  });
});

// ── ghl_get_task_lists ───────────────────────────────────────────────────────────

describe('ghl_get_task_lists', () => {
  it('calls GET /projects/tasks/:taskId/lists without locationId', async () => {
    const fetch = mockFetchSuccess({ lists: [] });
    await getTool('ghl_get_task_lists').handler({ taskId: 'task_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/tasks/task_1/lists');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires taskId', () => {
    const schema = getTool('ghl_get_task_lists').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Task not found' });
    expectError(await getTool('ghl_get_task_lists').handler({ taskId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_add_task_to_list ─────────────────────────────────────────────────────────

describe('ghl_add_task_to_list', () => {
  it('calls POST /projects/lists/:listId/tasks/:taskId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_add_task_to_list').handler({ listId: 'list_1', taskId: 'task_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/lists/list_1/tasks/task_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires listId and taskId', () => {
    const schema = getTool('ghl_add_task_to_list').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1' }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', taskId: 'task_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(409, { message: 'Already in list' });
    expectError(
      await getTool('ghl_add_task_to_list').handler({ listId: 'list_1', taskId: 'task_1' }, TEST_CONFIG),
      409
    );
  });
});

// ── ghl_remove_task_from_list ────────────────────────────────────────────────────

describe('ghl_remove_task_from_list', () => {
  it('calls DELETE /projects/lists/:listId/tasks/:taskId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_remove_task_from_list').handler({ listId: 'list_1', taskId: 'task_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/lists/list_1/tasks/task_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires listId and taskId', () => {
    const schema = getTool('ghl_remove_task_from_list').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ listId: 'list_1', taskId: 'task_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not in list' });
    expectError(
      await getTool('ghl_remove_task_from_list').handler({ listId: 'list_1', taskId: 'task_1' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_move_task_home_list ──────────────────────────────────────────────────────

describe('ghl_move_task_home_list', () => {
  it('calls PUT /projects/tasks/:taskId/home-list without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_move_task_home_list').handler({ taskId: 'task_1', listId: 'list_2' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/projects/tasks/task_1/home-list');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({ listId: 'list_2' });
  });

  it('requires taskId and listId', () => {
    const schema = getTool('ghl_move_task_home_list').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', listId: 'list_2' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid list' });
    expectError(
      await getTool('ghl_move_task_home_list').handler({ taskId: 'task_1', listId: 'list_2' }, TEST_CONFIG),
      422
    );
  });
});
