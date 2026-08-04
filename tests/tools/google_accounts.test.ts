import { describe, it, expect } from 'vitest';
import { googleAccountsTools } from '../../src/tools/google_accounts.js';
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
  const tool = googleAccountsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_google_ad_accounts ──────────────────────────────────────────────

describe('ghl_get_google_ad_accounts', () => {
  it('calls GET /ad-publishing/google/ad-accounts with locationId and optional type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_ad_accounts').handler(
      { type: 'AD_MANAGER' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/ad-accounts');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('AD_MANAGER');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional type when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_ad_accounts').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.type).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_google_ad_accounts').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_google_ad_account ───────────────────────────────────────────────

describe('ghl_get_google_ad_account', () => {
  it('calls GET /ad-publishing/google/ad-accounts/:adAccountId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_ad_account').handler(
      { adAccountId: 'act_1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/ad-accounts/act_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_ad_account').handler({ adAccountId: 'act_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_google_ad_account').handler(
      { adAccountId: 'act_1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_google_ad_account ────────────────────────────────────────────

describe('ghl_delete_google_ad_account', () => {
  it('calls DELETE /ad-publishing/google/ad-accounts/:adAccountId with locationId in body', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_google_ad_account').handler(
      { adAccountId: 'act_1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/google/ad-accounts/act_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_delete_google_ad_account').handler(
      { adAccountId: 'act_1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_create_google_integration ───────────────────────────────────────────

describe('ghl_create_google_integration', () => {
  it('calls POST /ad-publishing/google/integration with locationId, adAccountId, mccId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_google_integration').handler(
      { adAccountId: '123-456-7890', mccId: '987-654-3210' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/google/integration');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.adAccountId).toBe('123-456-7890');
    expect(call.body?.mccId).toBe('987-654-3210');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_google_integration').handler(
      { adAccountId: '123-456-7890', mccId: '987-654-3210' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_google_integration ──────────────────────────────────────────────

describe('ghl_get_google_integration', () => {
  it('calls GET /ad-publishing/google/integration with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_integration').handler(
      { isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/integration');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_integration').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_google_integration').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_google_me ───────────────────────────────────────────────────────

describe('ghl_get_google_me', () => {
  it('calls GET /ad-publishing/google/me with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_me').handler({ isDraft: true }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/me');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_me').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_google_me').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_google_entity ───────────────────────────────────────────────────

describe('ghl_get_google_entity', () => {
  it('calls GET /ad-publishing/google/entity with all fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_entity').handler(
      {
        type: 'AD_MANAGER',
        entityType: 'CAMPAIGN',
        campaignId: 'camp_123',
        adGroupId: 'ag_123',
        searchId: 'search_123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        selectedAdAccountId: '123-456-7890',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/entity');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('AD_MANAGER');
    expect(call.params.entityType).toBe('CAMPAIGN');
    expect(call.params.campaignId).toBe('camp_123');
    expect(call.params.adGroupId).toBe('ag_123');
    expect(call.params.searchId).toBe('search_123');
    expect(call.params.startDate).toBe('2024-01-01');
    expect(call.params.endDate).toBe('2024-12-31');
    expect(call.params.selectedAdAccountId).toBe('123-456-7890');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_google_entity').handler(
      { type: 'INTEGRATION', entityType: 'ADGROUP' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.campaignId).toBeUndefined();
    expect(call.params.adGroupId).toBeUndefined();
    expect(call.params.searchId).toBeUndefined();
    expect(call.params.startDate).toBeUndefined();
    expect(call.params.endDate).toBeUndefined();
    expect(call.params.selectedAdAccountId).toBeUndefined();
    expect(call.params.type).toBe('INTEGRATION');
    expect(call.params.entityType).toBe('ADGROUP');
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_google_entity').handler(
      { type: 'AD_MANAGER', entityType: 'AD' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
