import { describe, it, expect } from 'vitest';
import { googleReportingTools } from '../../src/tools/google_reporting.js';
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
  const tool = googleReportingTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_google_reporting ────────────────────────────────────────────────

describe('ghl_get_google_reporting', () => {
  it('calls GET /ad-publishing/google/reporting with locationId, fields, groupBy, startDate, endDate, type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_reporting').handler(
      {
        fields: ['impressions', 'clicks'],
        groupBy: 'month',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'AD_MANAGER',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/reporting');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.fields).toEqual('impressions,clicks');
    expect(call.params.groupBy).toBe('month');
    expect(call.params.startDate).toBe('2026-01-01');
    expect(call.params.endDate).toBe('2026-01-31');
    expect(call.params.type).toBe('AD_MANAGER');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional groupBy when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_reporting').handler(
      {
        fields: ['impressions'],
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'INTEGRATION',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.groupBy).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_google_reporting').handler(
      {
        fields: ['impressions'],
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'AD_MANAGER',
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_google_campaign_reporting ───────────────────────────────────────

describe('ghl_get_google_campaign_reporting', () => {
  it('calls GET /ad-publishing/google/reporting/campaign/:campaignId with locationId, startDate, endDate', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_campaign_reporting').handler(
      {
        campaignId: 'camp_123',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/reporting/campaign/camp_123');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.startDate).toBe('2026-01-01');
    expect(call.params.endDate).toBe('2026-01-31');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_google_campaign_reporting').handler(
      {
        campaignId: 'camp_123',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_google_reporting_list ───────────────────────────────────────────

describe('ghl_get_google_reporting_list', () => {
  it('calls GET /ad-publishing/google/reporting/list with locationId, listType, startDate, endDate, type, campaignId optional', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_reporting_list').handler(
      {
        listType: 'campaigns',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'AD_MANAGER',
        campaignId: 'camp_123',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/reporting/list');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.listType).toBe('campaigns');
    expect(call.params.startDate).toBe('2026-01-01');
    expect(call.params.endDate).toBe('2026-01-31');
    expect(call.params.type).toBe('AD_MANAGER');
    expect(call.params.campaignId).toBe('camp_123');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional campaignId when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_reporting_list').handler(
      {
        listType: 'campaigns',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'INTEGRATION',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.campaignId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_get_google_reporting_list').handler(
      {
        listType: 'campaigns',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'AD_MANAGER',
      },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_search_google_targeting ─────────────────────────────────────────────

describe('ghl_search_google_targeting', () => {
  it('calls GET /ad-publishing/google/targeting/search with locationId, type, query optional', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_search_google_targeting').handler(
      {
        type: 'geolocation',
        query: 'New York',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/targeting/search');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('geolocation');
    expect(call.params.query).toBe('New York');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional query when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_search_google_targeting').handler(
      {
        type: 'geolocation',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.query).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_search_google_targeting').handler(
      {
        type: 'geolocation',
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
