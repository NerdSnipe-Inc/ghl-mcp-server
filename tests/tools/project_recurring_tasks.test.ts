import { describe, it, expect } from 'vitest';
import { projectRecurringTaskTools } from '../../src/tools/project_recurring_tasks.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = projectRecurringTaskTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

const RRULE = { freq: 'WEEKLY', interval: 1, byday: ['MO'] };

// ── ghl_create_recurring_task ─────────────────────────────────────────────────

describe('ghl_create_recurring_task', () => {
  it('calls POST /projects/recurring-tasks without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'rt_1' });
    await getTool('ghl_create_recurring_task').handler(
      {
        title: 'Weekly review',
        rruleOptions: RRULE,
        description: 'Review open items',
        contactIds: ['contact_1'],
        owners: ['user_1'],
        ignoreTaskCreation: false,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/recurring-tasks');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({
      title: 'Weekly review',
      rruleOptions: RRULE,
      description: 'Review open items',
      contactIds: ['contact_1'],
      owners: ['user_1'],
      ignoreTaskCreation: false,
    });
  });

  it('requires title and rruleOptions; other fields optional', () => {
    const schema = getTool('ghl_create_recurring_task').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ title: 'Weekly review' }).success).toBe(false);
    expect(schema.safeParse({ rruleOptions: RRULE }).success).toBe(false);
    expect(schema.safeParse({ title: 'Weekly review', rruleOptions: RRULE }).success).toBe(true);
    expect(schema.safeParse({ title: 'Weekly review', rruleOptions: 'not-an-object' }).success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid rruleOptions' });
    expectError(
      await getTool('ghl_create_recurring_task').handler({ title: 'x', rruleOptions: RRULE }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_get_recurring_task ───────────────────────────────────────────────────

describe('ghl_get_recurring_task', () => {
  it('calls GET /projects/recurring-tasks/:id without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'rt_1' });
    await getTool('ghl_get_recurring_task').handler({ id: 'rt_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/recurring-tasks/rt_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires id', () => {
    const schema = getTool('ghl_get_recurring_task').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ id: 'rt_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Recurring task not found' });
    expectError(await getTool('ghl_get_recurring_task').handler({ id: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_update_recurring_task ────────────────────────────────────────────────

describe('ghl_update_recurring_task', () => {
  it('calls PUT /projects/recurring-tasks/:id without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'rt_1' });
    await getTool('ghl_update_recurring_task').handler(
      {
        id: 'rt_1',
        title: 'Monthly review',
        rruleOptions: { freq: 'MONTHLY', interval: 1 },
        owners: ['user_2'],
        ignoreTaskCreation: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/projects/recurring-tasks/rt_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({
      title: 'Monthly review',
      rruleOptions: { freq: 'MONTHLY', interval: 1 },
      owners: ['user_2'],
      ignoreTaskCreation: true,
    });
  });

  it('requires id; all body fields optional', () => {
    const schema = getTool('ghl_update_recurring_task').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ id: 'rt_1' }).success).toBe(true);
    expect(schema.safeParse({ id: 'rt_1', title: 'New title' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(await getTool('ghl_update_recurring_task').handler({ id: 'rt_1' }, TEST_CONFIG), 400);
  });
});

// ── ghl_delete_recurring_task ────────────────────────────────────────────────

describe('ghl_delete_recurring_task', () => {
  it('calls DELETE /projects/recurring-tasks/:id without locationId', async () => {
    const fetch = mockFetchSuccess({ succeeded: true });
    await getTool('ghl_delete_recurring_task').handler({ id: 'rt_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/recurring-tasks/rt_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires id', () => {
    const schema = getTool('ghl_delete_recurring_task').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ id: 'rt_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Recurring task not found' });
    expectError(await getTool('ghl_delete_recurring_task').handler({ id: 'missing' }, TEST_CONFIG), 404);
  });
});
