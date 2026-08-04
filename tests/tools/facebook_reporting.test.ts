import { describe, it, expect } from 'vitest';
import { facebookReportingTools } from '../../src/tools/facebook_reporting.js';
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
  const tool = facebookReportingTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_facebook_reporting ──────────────────────────────────────────────

describe('ghl_get_facebook_reporting', () => {
  it('calls GET /ad-publishing/facebook/reporting with locationId, fields, groupBy, startDate, endDate, type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_reporting').handler(
      {
        fields: ['impressions', 'clicks'],
        groupBy: 'CAMPAIGN',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'CAMPAIGN',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/reporting');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.fields).toEqual('impressions,clicks');
    expect(call.params.groupBy).toBe('CAMPAIGN');
    expect(call.params.startDate).toBe('2026-01-01');
    expect(call.params.endDate).toBe('2026-01-31');
    expect(call.params.type).toBe('CAMPAIGN');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_facebook_reporting').handler(
      {
        fields: ['impressions'],
        groupBy: 'CAMPAIGN',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'CAMPAIGN',
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_facebook_campaign_reporting ─────────────────────────────────────

describe('ghl_get_facebook_campaign_reporting', () => {
  it('calls GET /ad-publishing/facebook/reporting/campaign/:campaignId with locationId, startDate, endDate', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_campaign_reporting').handler(
      {
        campaignId: 'camp_123',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/reporting/campaign/camp_123');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.startDate).toBe('2026-01-01');
    expect(call.params.endDate).toBe('2026-01-31');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_campaign_reporting').handler(
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

// ── ghl_get_facebook_reporting_list ─────────────────────────────────────────

describe('ghl_get_facebook_reporting_list', () => {
  it('calls GET /ad-publishing/facebook/reporting/list with locationId, listType, startDate, endDate, type, campaignId optional', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_reporting_list').handler(
      {
        listType: 'CAMPAIGNS',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'CAMPAIGN',
        campaignId: 'camp_123',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/reporting/list');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.listType).toBe('CAMPAIGNS');
    expect(call.params.startDate).toBe('2026-01-01');
    expect(call.params.endDate).toBe('2026-01-31');
    expect(call.params.type).toBe('CAMPAIGN');
    expect(call.params.campaignId).toBe('camp_123');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional campaignId when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_reporting_list').handler(
      {
        listType: 'CAMPAIGNS',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'CAMPAIGN',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.campaignId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_get_facebook_reporting_list').handler(
      {
        listType: 'CAMPAIGNS',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        type: 'CAMPAIGN',
      },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_search_facebook_targeting ──────────────────────────────────────────

describe('ghl_search_facebook_targeting', () => {
  it('calls GET /ad-publishing/facebook/targeting/search with locationId optional, type, query, searchType optional', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_search_facebook_targeting').handler(
      {
        type: 'INTERESTS',
        query: 'technology',
        searchType: 'KEYWORD',
        locationId: 'loc_override',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/targeting/search');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe('loc_override');
    expect(call.params.type).toBe('INTERESTS');
    expect(call.params.query).toBe('technology');
    expect(call.params.searchType).toBe('KEYWORD');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional locationId and searchType when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_search_facebook_targeting').handler(
      {
        type: 'INTERESTS',
        query: 'technology',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.searchType).toBeUndefined();
    expect(call.params.type).toBe('INTERESTS');
    expect(call.params.query).toBe('technology');
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_search_facebook_targeting').handler(
      {
        type: 'INTERESTS',
        query: 'technology',
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
