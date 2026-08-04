import { describe, it, expect } from 'vitest';
import { linkedinTools } from '../../src/tools/linkedin.js';
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
  const tool = linkedinTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_linkedin_ad_account ─────────────────────────────────────────────

describe('ghl_get_linkedin_ad_account', () => {
  it('calls GET /ad-publishing/linkedin/ad-account with locationId, adAccountId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_ad_account').handler(
      { adAccountId: 'acct1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/ad-account');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.adAccountId).toBe('acct1');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_linkedin_ad_account').handler(
      { adAccountId: 'acct1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_linkedin_ad_account ──────────────────────────────────────────

describe('ghl_delete_linkedin_ad_account', () => {
  it('calls DELETE /ad-publishing/linkedin/ad-account with locationId, adAccountId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_linkedin_ad_account').handler(
      { adAccountId: 'acct1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/linkedin/ad-account');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.adAccountId).toBe('acct1');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_linkedin_ad_account').handler(
      { adAccountId: 'acct1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_linkedin_ad_accounts ────────────────────────────────────────────

describe('ghl_get_linkedin_ad_accounts', () => {
  it('calls GET /ad-publishing/linkedin/ad-accounts with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_ad_accounts').handler(
      { isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/ad-accounts');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    const result = await getTool('ghl_get_linkedin_ad_accounts').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_create_linkedin_integration ─────────────────────────────────────────

describe('ghl_create_linkedin_integration', () => {
  it('calls POST /ad-publishing/linkedin/integration with all required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_linkedin_integration').handler(
      {
        adAccountId: 'acct1',
        adAccountName: 'My Account',
        currencyCode: 'USD',
        organizationId: 'org1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/linkedin/integration');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.adAccountId).toBe('acct1');
    expect(call.body.adAccountName).toBe('My Account');
    expect(call.body.currencyCode).toBe('USD');
    expect(call.body.organizationId).toBe('org1');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_linkedin_integration').handler(
      { adAccountId: 'acct1', adAccountName: 'My Account', currencyCode: 'USD', organizationId: 'org1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_linkedin_integration ────────────────────────────────────────────

describe('ghl_get_linkedin_integration', () => {
  it('calls GET /ad-publishing/linkedin/integration with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_integration').handler(
      { isDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/integration');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('false');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_linkedin_integration').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_linkedin_me ──────────────────────────────────────────────────────

describe('ghl_get_linkedin_me', () => {
  it('calls GET /ad-publishing/linkedin/me with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_me').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/me');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    const result = await getTool('ghl_get_linkedin_me').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_upsert_linkedin_campaign ────────────────────────────────────────────

describe('ghl_upsert_linkedin_campaign', () => {
  it('calls PUT /ad-publishing/linkedin/ads with locationId and optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_linkedin_campaign').handler(
      {
        name: 'Q1 Lead Gen',
        objectiveType: 'LEAD_GENERATION',
        adBudgetOptimization: 'MAXIMUM_DELIVERY',
        budget: { budgetType: 'DAILY', amount: 10000 },
        adCampaigns: [{ name: 'Campaign 1' }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/linkedin/ads');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.name).toBe('Q1 Lead Gen');
    expect(call.body.objectiveType).toBe('LEAD_GENERATION');
    expect(call.body.adBudgetOptimization).toBe('MAXIMUM_DELIVERY');
    expect(call.body.budget).toEqual({ budgetType: 'DAILY', amount: 10000 });
    expect(call.body.adCampaigns).toEqual([{ name: 'Campaign 1' }]);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_upsert_linkedin_campaign').handler({}, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_get_linkedin_campaign ────────────────────────────────────────────────

describe('ghl_get_linkedin_campaign', () => {
  it('calls GET /ad-publishing/linkedin/ads/:adId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_campaign').handler(
      { adId: 'ad1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/ads/ad1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_linkedin_campaign').handler({ adId: 'ad1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_publish_linkedin_campaign ───────────────────────────────────────────

describe('ghl_publish_linkedin_campaign', () => {
  it('calls POST /ad-publishing/linkedin/ads/:adId/publish with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_publish_linkedin_campaign').handler(
      { adId: 'ad1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/linkedin/ads/ad1/publish');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_publish_linkedin_campaign').handler({ adId: 'ad1' }, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_update_linkedin_ad_status ───────────────────────────────────────────

describe('ghl_update_linkedin_ad_status', () => {
  it('calls PATCH /ad-publishing/linkedin/:adId/status with locationId query, operationType/type body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_linkedin_ad_status').handler(
      { adId: 'ad1', operationType: 'PAUSED', type: 'adCampaign', isDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/ad-publishing/linkedin/ad1/status');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('false');
    expect(call.body.operationType).toBe('PAUSED');
    expect(call.body.type).toBe('adCampaign');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_linkedin_ad_status').handler(
      { adId: 'ad1', operationType: 'PAUSED', type: 'adCampaign' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_create_linkedin_lead_form ───────────────────────────────────────────

describe('ghl_create_linkedin_lead_form', () => {
  it('calls POST /ad-publishing/linkedin/:accountId/form with required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_linkedin_lead_form').handler(
      {
        accountId: 'acct1',
        owner: { sponsoredAccount: 'urn:li:sponsoredAccount:123' },
        creationLocale: { country: 'US', language: 'en' },
        name: 'Contact Us',
        state: 'PUBLISHED',
        content: { headline: { localized: { en_US: 'Get in touch' } } },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/linkedin/acct1/form');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.owner).toEqual({ sponsoredAccount: 'urn:li:sponsoredAccount:123' });
    expect(call.body.creationLocale).toEqual({ country: 'US', language: 'en' });
    expect(call.body.name).toBe('Contact Us');
    expect(call.body.state).toBe('PUBLISHED');
    expect(call.body.content).toEqual({ headline: { localized: { en_US: 'Get in touch' } } });
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_linkedin_lead_form').handler(
      {
        accountId: 'acct1',
        owner: { sponsoredAccount: 'urn:li:sponsoredAccount:123' },
        creationLocale: { country: 'US', language: 'en' },
        name: 'Contact Us',
        state: 'PUBLISHED',
        content: {},
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_linkedin_lead_forms ─────────────────────────────────────────────

describe('ghl_get_linkedin_lead_forms', () => {
  it('calls GET /ad-publishing/linkedin/:accountId/forms with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_lead_forms').handler(
      { accountId: 'acct1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/acct1/forms');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_linkedin_lead_forms').handler({ accountId: 'acct1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_get_linkedin_reporting ──────────────────────────────────────────────

describe('ghl_get_linkedin_reporting', () => {
  it('calls GET /ad-publishing/linkedin/reporting with required and optional params', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_reporting').handler(
      {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        pivot: 'CAMPAIGN',
        groupBy: 'day',
        entityUrns: 'urn:li:sponsoredCampaign:123',
        fields: ['impressions', 'clicks'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/reporting');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.startDate).toBe('2024-01-01');
    expect(call.params.endDate).toBe('2024-01-31');
    expect(call.params.pivot).toBe('CAMPAIGN');
    expect(call.params.groupBy).toBe('day');
    expect(call.params.entityUrns).toBe('urn:li:sponsoredCampaign:123');
    expect(call.params.fields).toBe('impressions,clicks');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_linkedin_reporting').handler(
      { startDate: '2024-01-01', endDate: '2024-01-31' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_linkedin_campaign_group_reporting ───────────────────────────────

describe('ghl_get_linkedin_campaign_group_reporting', () => {
  it('calls GET /ad-publishing/linkedin/reporting/campaign-group/:campaignGroupId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_campaign_group_reporting').handler(
      {
        campaignGroupId: 'cg1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        fields: ['impressions'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/reporting/campaign-group/cg1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.startDate).toBe('2024-01-01');
    expect(call.params.endDate).toBe('2024-01-31');
    expect(call.params.fields).toBe('impressions');
    // Spec quirk: campaignGroupId appears as both a path param and a duplicate
    // optional query param on this operation — verified directly. We pass it
    // via the path only, since the query duplicate is redundant.
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_linkedin_campaign_group_reporting').handler(
      { campaignGroupId: 'cg1', startDate: '2024-01-01', endDate: '2024-01-31' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_linkedin_reporting_list ─────────────────────────────────────────

describe('ghl_get_linkedin_reporting_list', () => {
  it('calls GET /ad-publishing/linkedin/reporting/list with required params', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_linkedin_reporting_list').handler(
      {
        listType: 'campaigns',
        campaignId: 'camp1',
        campaignGroupId: 'cg1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        fields: ['impressions', 'clicks'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/reporting/list');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.listType).toBe('campaigns');
    expect(call.params.campaignId).toBe('camp1');
    expect(call.params.campaignGroupId).toBe('cg1');
    expect(call.params.startDate).toBe('2024-01-01');
    expect(call.params.endDate).toBe('2024-01-31');
    expect(call.params.fields).toBe('impressions,clicks');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_linkedin_reporting_list').handler(
      {
        listType: 'campaigns',
        campaignId: 'camp1',
        campaignGroupId: 'cg1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_search_linkedin_targeting ───────────────────────────────────────────

describe('ghl_search_linkedin_targeting', () => {
  it('calls GET /ad-publishing/linkedin/targeting/search with facet, query, q', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_search_linkedin_targeting').handler(
      { facet: 'locations', query: 'software', q: 'typeahead' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/linkedin/targeting/search');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.facet).toBe('locations');
    expect(call.params.query).toBe('software');
    expect(call.params.q).toBe('typeahead');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_search_linkedin_targeting').handler(
      { facet: 'locations' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
