import { describe, it, expect } from 'vitest';
import { customFieldTools } from '../../src/tools/custom_fields.js';
import { GHL_VERSION_LEGACY } from '../../src/client.js';
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
  const tool = customFieldTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_custom_fields ─────────────────────────────────────────────────────

describe('ghl_get_custom_fields', () => {
  it('calls GET /locations/:locationId/customFields', async () => {
    const fetch = mockFetchSuccess({ customFields: [] });
    const result = await getTool('ghl_get_custom_fields').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields`);
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expectSuccess(result, { customFields: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_custom_fields').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_create_custom_field ───────────────────────────────────────────────────

describe('ghl_create_custom_field', () => {
  it('calls POST /locations/:locationId/customFields with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_custom_field').handler(
      { name: 'Favorite Color', dataType: 'TEXT' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields`);
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.name).toBe('Favorite Color');
    expect(call.body?.dataType).toBe('TEXT');
  });

  it('handles 422 validation error', async () => {
    mockFetchError(422, { message: 'Invalid dataType' });
    expectError(
      await getTool('ghl_create_custom_field').handler(
        { name: 'Bad Field', dataType: 'TEXT' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_update_custom_field ───────────────────────────────────────────────────

describe('ghl_update_custom_field', () => {
  it('calls PUT /locations/:locationId/customFields/:fieldId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_custom_field').handler(
      { fieldId: 'field-1', name: 'Updated Name' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields/field-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.name).toBe('Updated Name');
    expect(call.body?.fieldId).toBeUndefined();
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_update_custom_field').handler(
        { fieldId: 'bad', name: 'X' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_delete_custom_field ───────────────────────────────────────────────────

describe('ghl_delete_custom_field', () => {
  it('calls DELETE /locations/:locationId/customFields/:fieldId', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_custom_field').handler({ fieldId: 'field-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields/field-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(
      await getTool('ghl_delete_custom_field').handler({ fieldId: 'bad' }, TEST_CONFIG),
      400
    );
  });
});
