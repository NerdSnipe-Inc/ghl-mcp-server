import { describe, it, expect } from 'vitest';
import { googleCampaignsTools } from '../../src/tools/google_campaigns.js';
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
  const tool = googleCampaignsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_upsert_google_campaign ──────────────────────────────────────────────

describe('ghl_upsert_google_campaign', () => {
  it('calls PUT /ad-publishing/google/ads with locationId, name, advertisingChannelType', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_google_campaign').handler(
      { name: 'Campaign A', advertisingChannelType: 'SEARCH' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/google/ads');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('Campaign A');
    expect(call.body?.advertisingChannelType).toBe('SEARCH');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes id when provided to update an existing campaign', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_google_campaign').handler(
      { id: 'camp_1', name: 'Campaign A', advertisingChannelType: 'SEARCH', publishingStatus: 'DRAFT' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.id).toBe('camp_1');
    expect(call.body?.publishingStatus).toBe('DRAFT');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_google_campaign').handler(
      { name: 'Campaign A', advertisingChannelType: 'SEARCH' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_google_campaign ─────────────────────────────────────────────────

describe('ghl_get_google_campaign', () => {
  it('calls GET /ad-publishing/google/ads/:adId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_campaign').handler(
      { adId: 'ad_1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/ads/ad_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_campaign').handler({ adId: 'ad_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_google_campaign').handler({ adId: 'ad_1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_publish_google_campaign ─────────────────────────────────────────────

describe('ghl_publish_google_campaign', () => {
  it('calls POST /ad-publishing/google/ads/:adId/publish with no body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_publish_google_campaign').handler(
      { adId: 'ad_1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/google/ads/ad_1/publish');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_publish_google_campaign').handler(
      { adId: 'ad_1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_google_assets ───────────────────────────────────────────────────

describe('ghl_get_google_assets', () => {
  it('calls GET /ad-publishing/google/assets with locationId, type, and optional id/advertiserOnly', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_assets').handler(
      { type: 'CALL', id: 'asset_1', advertiserOnly: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/assets');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('CALL');
    expect(call.params.id).toBe('asset_1');
    expect(call.params.advertiserOnly).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_assets').handler({ type: 'IMAGE' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.id).toBeUndefined();
    expect(call.params.advertiserOnly).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_google_assets').handler({ type: 'TEXT' }, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_upsert_google_assets ────────────────────────────────────────────────

describe('ghl_upsert_google_assets', () => {
  it('calls POST /ad-publishing/google/assets with locationId, type, payload', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_google_assets').handler(
      { type: 'CALL', payload: { phoneNumber: '+14155551234', countryCode: 'US' } },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/google/assets');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.type).toBe('CALL');
    expect(call.body?.payload).toEqual({ phoneNumber: '+14155551234', countryCode: 'US' });
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_google_assets').handler(
      { type: 'SITELINK', payload: { linkText: 'Pricing' } },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_google_keyword_ideas ────────────────────────────────────────────

describe('ghl_get_google_keyword_ideas', () => {
  it('calls POST /ad-publishing/google/keyword-ideas with locationId query and url body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_keyword_ideas').handler(
      {
        url: 'https://example.com',
        languageCode: 'en',
        locations: ['US', 'CA'],
        keywords: ['marketing'],
        isDraft: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/google/keyword-ideas');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expect(call.body?.url).toBe('https://example.com');
    expect(call.body?.languageCode).toBe('en');
    expect(call.body?.locations).toEqual(['US', 'CA']);
    expect(call.body?.keywords).toEqual(['marketing']);
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_keyword_ideas').handler(
      { url: 'https://example.com' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
    expect(call.body?.languageCode).toBeUndefined();
    expect(call.body?.locations).toBeUndefined();
    expect(call.body?.keywords).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_google_keyword_ideas').handler(
      { url: 'https://example.com' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
