import { describe, it, expect } from 'vitest';
import { templateTools } from '../../src/tools/templates.js';
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
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expectSuccess(result, { templates: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_templates').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_create_template ────────────────────────────────────────────────────────

describe('ghl_create_template', () => {
  it('calls POST /locations/:locationId/templates with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_template').handler(
      { name: 'Welcome SMS', type: 'sms', body: 'Hello there' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/templates`);
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.name).toBe('Welcome SMS');
    expect(call.body?.type).toBe('sms');
    expect(call.body?.body).toBe('Hello there');
  });

  it('handles 422 validation error', async () => {
    mockFetchError(422, { message: 'Invalid template' });
    expectError(
      await getTool('ghl_create_template').handler(
        { name: '', type: 'sms', body: '' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_update_template ────────────────────────────────────────────────────────

describe('ghl_update_template', () => {
  it('calls PUT /locations/:locationId/templates/:templateId with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_template').handler(
      { templateId: 'tmpl-1', name: 'Updated Name' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/templates/tmpl-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.name).toBe('Updated Name');
    expect(call.body?.templateId).toBeUndefined();
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_update_template').handler({ templateId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

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
