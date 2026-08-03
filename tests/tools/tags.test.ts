import { describe, it, expect } from 'vitest';
import { tagTools } from '../../src/tools/tags.js';
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
  const tool = tagTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_location_tags ──────────────────────────────────────────────────────

describe('ghl_get_location_tags', () => {
  it('calls GET /locations/:locationId/tags', async () => {
    const fetch = mockFetchSuccess({ tags: [] });
    const result = await getTool('ghl_get_location_tags').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/tags`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { tags: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_location_tags').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_create_location_tag ────────────────────────────────────────────────────

describe('ghl_create_location_tag', () => {
  it('calls POST /locations/:locationId/tags with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_location_tag').handler({ name: 'VIP' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/tags`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.name).toBe('VIP');
  });

  it('handles 422 validation error', async () => {
    mockFetchError(422, { message: 'Invalid tag' });
    expectError(
      await getTool('ghl_create_location_tag').handler({ name: '' }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_delete_location_tag ────────────────────────────────────────────────────

describe('ghl_delete_location_tag', () => {
  it('calls DELETE /locations/:locationId/tags/:tagId', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_location_tag').handler({ tagId: 'tag-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/tags/tag-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_delete_location_tag').handler({ tagId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});
