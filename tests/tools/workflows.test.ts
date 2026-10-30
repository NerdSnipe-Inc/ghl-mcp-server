import { describe, it, expect } from 'vitest';
import { workflowTools } from '../../src/tools/workflows.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = workflowTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_workflows ─────────────────────────────────────────────────────────

describe('ghl_get_workflows', () => {
  it('calls GET /workflows/ with locationId', async () => {
    const fetch = mockFetchSuccess({ workflows: [] });
    await getTool('ghl_get_workflows').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/workflows/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_workflows').handler({}, TEST_CONFIG), 500);
  });
});

// ── ghl_get_campaigns ─────────────────────────────────────────────────────────

describe('ghl_get_campaigns', () => {
  it('calls GET /campaigns/ with locationId', async () => {
    const fetch = mockFetchSuccess({ campaigns: [] });
    await getTool('ghl_get_campaigns').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/campaigns/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes status filter when provided', async () => {
    const fetch = mockFetchSuccess({ campaigns: [] });
    await getTool('ghl_get_campaigns').handler({ status: 'active' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.status).toBe('active');
  });
});

// ── ghl_get_workflow_definition ───────────────────────────────────────────────

describe('ghl_get_workflow_definition', () => {
  it('calls GET /workflows/:workflowId/definition with locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'wf_1', steps: [] });
    await getTool('ghl_get_workflow_definition').handler({ workflowId: 'wf_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/workflows/wf_1/definition');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_workflow_definition').handler({ workflowId: 'wf_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_update_workflow_definition ────────────────────────────────────────────

describe('ghl_update_workflow_definition', () => {
  it('calls PUT /workflows/:workflowId/definition with version and steps in body', async () => {
    const fetch = mockFetchSuccess({ id: 'wf_1' });
    await getTool('ghl_update_workflow_definition').handler(
      { workflowId: 'wf_1', version: 3, steps: [{ type: 'wait' }] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/workflows/wf_1/definition');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body).toMatchObject({ version: 3, steps: [{ type: 'wait' }] });
    expect(call.body).not.toHaveProperty('workflowId');
  });

  it('states that it fully overwrites the definition', () => {
    expect(getTool('ghl_update_workflow_definition').description).toContain(
      'This replaces the entire workflow definition — any step not included in this request will be deleted.'
    );
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_update_workflow_definition').handler({ workflowId: 'wf_1', version: 3 }, TEST_CONFIG),
      500
    );
  });
});

// ── ghl_update_workflow_status ───────────────────────────────────────────────

describe('ghl_update_workflow_status', () => {
  it('calls PUT /workflows/:workflowId/status with status in body', async () => {
    const fetch = mockFetchSuccess({ id: 'wf_1', status: 'published' });
    await getTool('ghl_update_workflow_status').handler(
      { workflowId: 'wf_1', status: 'published' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/workflows/wf_1/status');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body).toEqual({ status: 'published' });
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_update_workflow_status').handler({ workflowId: 'wf_1', status: 'draft' }, TEST_CONFIG),
      500
    );
  });
});

// ── ghl_delete_workflow ──────────────────────────────────────────────────────

describe('ghl_delete_workflow', () => {
  it('calls DELETE /workflows/:workflowId with locationId and no body', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_workflow').handler({ workflowId: 'wf_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/workflows/wf_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_delete_workflow').handler({ workflowId: 'wf_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_search_workflows ─────────────────────────────────────────────────────

describe('ghl_search_workflows', () => {
  it('calls POST /workflows/search with locationId and filter body passed through', async () => {
    const fetch = mockFetchSuccess({ workflows: [] });
    await getTool('ghl_search_workflows').handler(
      { filters: [{ field: 'name', value: 'Welcome' }], offset: 20 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/workflows/search');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body).toMatchObject({
      filters: [{ field: 'name', value: 'Welcome' }],
      offset: 20,
    });
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_search_workflows').handler({}, TEST_CONFIG), 500);
  });
});

// ── ghl_get_workflow_step_types ──────────────────────────────────────────────

describe('ghl_get_workflow_step_types', () => {
  it('calls GET /workflows/step-types with locationId and filter query params', async () => {
    const fetch = mockFetchSuccess({ stepTypes: [] });
    await getTool('ghl_get_workflow_step_types').handler(
      { types: 'action', kind: 'sms', query: 'send', limit: 10, skip: 5 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/workflows/step-types');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.types).toBe('action');
    expect(call.params.kind).toBe('sms');
    expect(call.params.query).toBe('send');
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('5');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_workflow_step_types').handler({}, TEST_CONFIG), 500);
  });
});

// ── ghl_validate_workflow_definition ─────────────────────────────────────────

describe('ghl_validate_workflow_definition', () => {
  it('calls POST /workflows/definition/validate with locationId and body passed through', async () => {
    const fetch = mockFetchSuccess({ valid: true });
    await getTool('ghl_validate_workflow_definition').handler(
      { workflowId: 'wf_1', steps: [{ type: 'wait' }] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/workflows/definition/validate');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body).toMatchObject({ workflowId: 'wf_1', steps: [{ type: 'wait' }] });
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_validate_workflow_definition').handler({ steps: [] }, TEST_CONFIG), 500);
  });
});

// ── ghl_get_workflow_logs ────────────────────────────────────────────────────

describe('ghl_get_workflow_logs', () => {
  it('calls GET /workflows/:workflowId/logs with locationId and pagination params', async () => {
    const fetch = mockFetchSuccess({ logs: [] });
    await getTool('ghl_get_workflow_logs').handler({ workflowId: 'wf_1', limit: 25, skip: 50 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/workflows/wf_1/logs');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.limit).toBe('25');
    expect(call.params.skip).toBe('50');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(await getTool('ghl_get_workflow_logs').handler({ workflowId: 'wf_1' }, TEST_CONFIG), 500);
  });
});

// ── ghl_get_workflow_log_statistics ──────────────────────────────────────────

describe('ghl_get_workflow_log_statistics', () => {
  it('calls GET /workflows/:workflowId/logs/aggregate with locationId and groupBy/time-range params', async () => {
    const fetch = mockFetchSuccess({ stats: [] });
    await getTool('ghl_get_workflow_log_statistics').handler(
      { workflowId: 'wf_1', groupBy: 'day', startDate: '2026-10-01', endDate: '2026-10-30' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/workflows/wf_1/logs/aggregate');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.groupBy).toBe('day');
    expect(call.params.startDate).toBe('2026-10-01');
    expect(call.params.endDate).toBe('2026-10-30');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_get_workflow_log_statistics').handler({ workflowId: 'wf_1' }, TEST_CONFIG),
      500
    );
  });
});
