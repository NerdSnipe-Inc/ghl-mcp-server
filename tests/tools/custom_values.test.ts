import { describe, it, expect } from 'vitest';
import { customValueTools } from '../../src/tools/custom_values.js';
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
  const tool = customValueTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_custom_values ─────────────────────────────────────────────────────

describe('ghl_get_custom_values', () => {
  it('calls GET /locations/:locationId/customValues', async () => {
    const fetch = mockFetchSuccess({ customValues: [] });
    const result = await getTool('ghl_get_custom_values').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customValues`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { customValues: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_custom_values').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_create_custom_value ───────────────────────────────────────────────────

describe('ghl_create_custom_value', () => {
  it('calls POST /locations/:locationId/customValues with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_custom_value').handler(
      { name: 'My Variable', value: 'Some Value' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customValues`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.name).toBe('My Variable');
    expect(call.body?.value).toBe('Some Value');
  });

  it('handles 422 validation error', async () => {
    mockFetchError(422, { message: 'Invalid value' });
    expectError(
      await getTool('ghl_create_custom_value').handler(
        { name: 'Bad', value: '' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_update_custom_value ───────────────────────────────────────────────────

describe('ghl_update_custom_value', () => {
  it('calls PUT /locations/:locationId/customValues/:valueId with both name and value', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_custom_value').handler(
      { valueId: 'value-1', name: 'Updated Name', value: 'Updated Value' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customValues/value-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.name).toBe('Updated Name');
    expect(call.body?.value).toBe('Updated Value');
    expect(call.body?.valueId).toBeUndefined();
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_update_custom_value').handler(
        { valueId: 'bad', name: 'X', value: 'Y' },
        TEST_CONFIG
      ),
      404
    );
  });

  it('requires both name and value — spec uses the same DTO as create, no partial updates', () => {
    const missingValue = getTool('ghl_update_custom_value').inputSchema.safeParse({
      valueId: 'value-1',
      name: 'Updated Name',
    });
    expect(missingValue.success).toBe(false);

    const missingName = getTool('ghl_update_custom_value').inputSchema.safeParse({
      valueId: 'value-1',
      value: 'Updated Value',
    });
    expect(missingName.success).toBe(false);
  });
});

// ── ghl_delete_custom_value ───────────────────────────────────────────────────

describe('ghl_delete_custom_value', () => {
  it('calls DELETE /locations/:locationId/customValues/:valueId', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_custom_value').handler({ valueId: 'value-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customValues/value-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(
      await getTool('ghl_delete_custom_value').handler({ valueId: 'bad' }, TEST_CONFIG),
      400
    );
  });
});
