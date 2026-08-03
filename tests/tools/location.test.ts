import { describe, it, expect } from 'vitest';
import { locationTools } from '../../src/tools/location.js';
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
  const tool = locationTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_location ──────────────────────────────────────────────────────────

describe('ghl_get_location', () => {
  it('calls GET /locations/{locationId} with v3 version header', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_location').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('returns location data', async () => {
    const locationData = { id: 'loc-123', name: 'Main Location', timezone: 'America/New_York' };
    const fetch = mockFetchSuccess(locationData);
    const result = await getTool('ghl_get_location').handler({}, TEST_CONFIG);
    expectSuccess(result, locationData);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_location').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });

  it('handles 404 location not found', async () => {
    mockFetchError(404, { message: 'Location not found' });
    const result = await getTool('ghl_get_location').handler({}, TEST_CONFIG);
    expectError(result, 404);
  });
});
