import { describe, it, expect } from 'vitest';
import { workflowTools } from '../../src/tools/workflows.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

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
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes status filter when provided', async () => {
    const fetch = mockFetchSuccess({ workflows: [] });
    await getTool('ghl_get_workflows').handler({ status: 'published' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.status).toBe('published');
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
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes status filter when provided', async () => {
    const fetch = mockFetchSuccess({ campaigns: [] });
    await getTool('ghl_get_campaigns').handler({ status: 'active' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.status).toBe('active');
  });
});
