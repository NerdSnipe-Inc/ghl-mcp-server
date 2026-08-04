import { describe, it, expect } from 'vitest';
import { socialPlannerAccountsTools } from '../../src/tools/social_planner_accounts.js';
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
  const tool = socialPlannerAccountsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_start_social_oauth ──────────────────────────────────────────────────

describe('ghl_start_social_oauth', () => {
  it('calls GET /social-media-posting/oauth/{platform}/start with required + optional query', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_start_social_oauth').handler(
      {
        platform: 'facebook',
        userId: 'user1',
        page: 'page1',
        reconnect: 'true',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/social-media-posting/oauth/facebook/start');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.userId).toBe('user1');
    expect(call.params.page).toBe('page1');
    expect(call.params.reconnect).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_start_social_oauth').handler(
      { platform: 'facebook', userId: 'user1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_oauth_accounts ───────────────────────────────────────────

describe('ghl_get_social_oauth_accounts', () => {
  it('calls GET .../oauth/{locationId}/{platform}/accounts/{accountId} with optional search', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_social_oauth_accounts').handler(
      {
        platform: 'facebook',
        accountId: 'acct1',
        search: 'My Page',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/social-media-posting/oauth/${TEST_CONFIG.locationId}/facebook/accounts/acct1`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.search).toBe('My Page');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_social_oauth_accounts').handler(
      { platform: 'facebook', accountId: 'acct1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_connect_social_oauth_account ────────────────────────────────────────

describe('ghl_connect_social_oauth_account', () => {
  it('calls POST .../oauth/{locationId}/{platform}/accounts/{accountId} with platform-specific body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_connect_social_oauth_account').handler(
      {
        platform: 'facebook',
        accountId: 'acct1',
        type: 'page',
        originId: '244405XXXXX11687',
        name: 'My Facebook Page',
        avatar: 'https://example.com/avatar.png',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/oauth/${TEST_CONFIG.locationId}/facebook/accounts/acct1`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.type).toBe('page');
    expect(call.body.originId).toBe('244405XXXXX11687');
    expect(call.body.name).toBe('My Facebook Page');
    expect(call.body.avatar).toBe('https://example.com/avatar.png');
    expectSuccess(result, MOCK_DATA);
  });

  it('supports Google Business Profile location/account body shape', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_connect_social_oauth_account').handler(
      {
        platform: 'google',
        accountId: 'acct1',
        location: { name: 'locations/12345', title: 'My Business Location' },
        account: { name: 'accounts/12345', accountName: 'My Business Account' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.location).toEqual({
      name: 'locations/12345',
      title: 'My Business Location',
    });
    expect(call.body.account).toEqual({
      name: 'accounts/12345',
      accountName: 'My Business Account',
    });
  });

  it('supports Instagram pageId-only body shape', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_connect_social_oauth_account').handler(
      {
        platform: 'instagram',
        accountId: 'acct1',
        pageId: 'fbpage123',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.pathname).toBe(
      `/social-media-posting/oauth/${TEST_CONFIG.locationId}/instagram/accounts/acct1`
    );
    expect(call.body.pageId).toBe('fbpage123');
  });

  it('supports LinkedIn urn-required body shape', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_connect_social_oauth_account').handler(
      {
        platform: 'linkedin',
        accountId: 'acct1',
        type: 'page',
        originId: 'urn:li:organization:12345',
        name: 'My LinkedIn Page',
        urn: 'urn:li:organization:12345',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.pathname).toBe(
      `/social-media-posting/oauth/${TEST_CONFIG.locationId}/linkedin/accounts/acct1`
    );
    expect(call.body.type).toBe('page');
    expect(call.body.originId).toBe('urn:li:organization:12345');
    expect(call.body.name).toBe('My LinkedIn Page');
    expect(call.body.urn).toBe('urn:li:organization:12345');
  });

  it('supports Pinterest originId-only body shape with optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_connect_social_oauth_account').handler(
      {
        platform: 'pinterest',
        accountId: 'acct1',
        originId: '123456789',
        verified: true,
        username: 'mypinterest',
        websiteUrl: 'https://example.com',
        companyId: 'company1',
        originAccountType: 'business',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.originId).toBe('123456789');
    expect(call.body.verified).toBe(true);
    expect(call.body.username).toBe('mypinterest');
    expect(call.body.websiteUrl).toBe('https://example.com');
    expect(call.body.companyId).toBe('company1');
    expect(call.body.originAccountType).toBe('business');
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_connect_social_oauth_account').handler(
      { platform: 'facebook', accountId: 'acct1', type: 'page', originId: 'x', name: 'x' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_social_account ───────────────────────────────────────────────

describe('ghl_delete_social_account', () => {
  it('calls DELETE /social-media-posting/{locationId}/accounts/{id} with optional query', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_social_account').handler(
      {
        id: 'acct1',
        companyId: 'company1',
        userId: 'user1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/accounts/acct1`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.companyId).toBe('company1');
    expect(call.params.userId).toBe('user1');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_social_account').handler(
      { id: 'acct1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_set_social_accounts ─────────────────────────────────────────────────

describe('ghl_set_social_accounts', () => {
  it('calls POST /social-media-posting/{locationId}/set-accounts with required + optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_set_social_accounts').handler(
      {
        accountIds: ['acct1', 'acct2'],
        filePath: '/uploads/csv/import.csv',
        rowsCount: 42,
        fileName: 'import.csv',
        userId: 'user1',
        approver: 'approver1',
        csvFileType: 'posts',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/set-accounts`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.accountIds).toEqual(['acct1', 'acct2']);
    expect(call.body.filePath).toBe('/uploads/csv/import.csv');
    expect(call.body.rowsCount).toBe(42);
    expect(call.body.fileName).toBe('import.csv');
    expect(call.body.userId).toBe('user1');
    expect(call.body.approver).toBe('approver1');
    expect(call.body.csvFileType).toBe('posts');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_set_social_accounts').handler(
      {
        accountIds: ['acct1'],
        filePath: '/uploads/csv/import.csv',
        rowsCount: 1,
        fileName: 'import.csv',
        userId: 'user1',
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_categories ───────────────────────────────────────────────

describe('ghl_get_social_categories', () => {
  it('calls GET /social-media-posting/{locationId}/categories with optional query', async () => {
    const fetch = mockFetchSuccess({ categories: [] });
    const result = await getTool('ghl_get_social_categories').handler(
      { searchText: 'promo', limit: 10, skip: 0 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/categories`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.searchText).toBe('promo');
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('0');
    expectSuccess(result, { categories: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_social_categories').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_social_category ─────────────────────────────────────────────────

describe('ghl_get_social_category', () => {
  it('calls GET /social-media-posting/{locationId}/categories/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_social_category').handler(
      { id: 'cat1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/categories/cat1`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_social_category').handler(
      { id: 'cat1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_social_tags ─────────────────────────────────────────────────────

describe('ghl_get_social_tags', () => {
  it('calls GET /social-media-posting/{locationId}/tags with optional query', async () => {
    const fetch = mockFetchSuccess({ tags: [] });
    const result = await getTool('ghl_get_social_tags').handler(
      { searchText: 'sale', limit: 5, skip: 0 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/social-media-posting/${TEST_CONFIG.locationId}/tags`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.searchText).toBe('sale');
    expect(call.params.limit).toBe('5');
    expect(call.params.skip).toBe('0');
    expectSuccess(result, { tags: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_social_tags').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_social_tags_by_ids ──────────────────────────────────────────────

describe('ghl_get_social_tags_by_ids', () => {
  it('calls POST /social-media-posting/{locationId}/tags/details with tagIds', async () => {
    const fetch = mockFetchSuccess({ tags: [] });
    const result = await getTool('ghl_get_social_tags_by_ids').handler(
      { tagIds: ['tag1', 'tag2'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/tags/details`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.tagIds).toEqual(['tag1', 'tag2']);
    expectSuccess(result, { tags: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_social_tags_by_ids').handler(
      { tagIds: ['tag1'] },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
