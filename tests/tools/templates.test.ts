import { describe, it, expect } from 'vitest';
import { templateTools } from '../../src/tools/templates.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
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
  const tool = templateTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_templates ──────────────────────────────────────────────────────────

describe('ghl_get_templates', () => {
  it('calls GET /locations/:locationId/templates with filters', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    const result = await getTool('ghl_get_templates').handler(
      { type: 'sms', limit: 10, skip: 0 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/templates`);
    expect(call.params.type).toBe('sms');
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('0');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.originId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { templates: [] });
  });

  it('uses an explicit originId override when provided', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    await getTool('ghl_get_templates').handler(
      { originId: 'origin-override' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.originId).toBe('origin-override');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_templates').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ghl_create_template / ghl_update_template were removed during the
// 2026-08-04 remediation: /locations/{locationId}/templates has no POST/PUT
// anywhere in the v3 or legacy spec (only GET/DELETE) — there is no real
// endpoint to build them against. See templates.ts's header comment.

// ── ghl_delete_template ────────────────────────────────────────────────────────

describe('ghl_delete_template', () => {
  it('calls DELETE /locations/:locationId/templates/:templateId', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_template').handler({ templateId: 'tmpl-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/templates/tmpl-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_delete_template').handler({ templateId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});
