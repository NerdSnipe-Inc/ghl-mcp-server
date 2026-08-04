import { describe, it, expect } from 'vitest';
import { facebookAccountsTools } from '../../src/tools/facebook_accounts.js';
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
  const tool = facebookAccountsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_facebook_ad_accounts ────────────────────────────────────────────

describe('ghl_get_facebook_ad_accounts', () => {
  it('calls GET /ad-publishing/facebook/ad-accounts with locationId and optional filters', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_ad_accounts').handler(
      { type: 'AD_MANAGER', next: 'cursor1', fetchAll: 'true', limit: '20' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/ad-accounts');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('AD_MANAGER');
    expect(call.params.next).toBe('cursor1');
    expect(call.params.fetchAll).toBe('true');
    expect(call.params.limit).toBe('20');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional filters when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_ad_accounts').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.type).toBeUndefined();
    expect(call.params.next).toBeUndefined();
    expect(call.params.fetchAll).toBeUndefined();
    expect(call.params.limit).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_facebook_ad_accounts').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_facebook_ad_account ─────────────────────────────────────────────

describe('ghl_get_facebook_ad_account', () => {
  it('calls GET /ad-publishing/facebook/ad-accounts/:adAccountId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_ad_account').handler(
      { adAccountId: 'act_1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/ad-accounts/act_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_ad_account').handler(
      { adAccountId: 'act_1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_facebook_ad_account ──────────────────────────────────────────

describe('ghl_delete_facebook_ad_account', () => {
  it('calls DELETE /ad-publishing/facebook/ad-accounts/:adAccountId with locationId in body', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_facebook_ad_account').handler(
      { adAccountId: 'act_1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/ad-accounts/act_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_delete_facebook_ad_account').handler(
      { adAccountId: 'act_1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_create_facebook_integration ─────────────────────────────────────────

describe('ghl_create_facebook_integration', () => {
  it('calls POST /ad-publishing/facebook/integration with locationId, pageId, adAccountId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_facebook_integration').handler(
      { pageId: 'page1', adAccountId: 'act_1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/integration');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.pageId).toBe('page1');
    expect(call.body?.adAccountId).toBe('act_1');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits adAccountId when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_facebook_integration').handler({ pageId: 'page1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.adAccountId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_facebook_integration').handler(
      { pageId: 'page1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_integration ────────────────────────────────────────────

describe('ghl_get_facebook_integration', () => {
  it('calls GET /ad-publishing/facebook/integration with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_integration').handler(
      { isDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/integration');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('false');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_facebook_integration').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_delete_facebook_integration ─────────────────────────────────────────

describe('ghl_delete_facebook_integration', () => {
  it('calls DELETE /ad-publishing/facebook/integration with locationId in body', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_facebook_integration').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/integration');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_delete_facebook_integration').handler({}, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_get_facebook_me ─────────────────────────────────────────────────────

describe('ghl_get_facebook_me', () => {
  it('calls GET /ad-publishing/facebook/me with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_me').handler({ isDraft: true }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/me');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_facebook_me').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_facebook_entity ──────────────────────────────────────────────────

describe('ghl_get_facebook_entity', () => {
  it('calls GET /ad-publishing/facebook/entity with locationId, type, entityType, and optional filters', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_entity').handler(
      {
        type: 'AD_MANAGER',
        entityType: 'CAMPAIGN',
        next: 'cursor1',
        fetchAll: 'true',
        campaignId: 'camp1',
        adSetId: 'set1',
        searchId: 'search1',
        selectedAdAccountId: 'act_1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/entity');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('AD_MANAGER');
    expect(call.params.entityType).toBe('CAMPAIGN');
    expect(call.params.next).toBe('cursor1');
    expect(call.params.fetchAll).toBe('true');
    expect(call.params.campaignId).toBe('camp1');
    expect(call.params.adSetId).toBe('set1');
    expect(call.params.searchId).toBe('search1');
    expect(call.params.selectedAdAccountId).toBe('act_1');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_get_facebook_entity').handler(
      { type: 'AD_MANAGER', entityType: 'CAMPAIGN' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_pages ──────────────────────────────────────────────────

describe('ghl_get_facebook_pages', () => {
  it('calls GET /ad-publishing/facebook/pages with locationId, fetchExisting', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_pages').handler(
      { fetchExisting: 'true' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/pages');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.fetchExisting).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_facebook_pages').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_delete_facebook_page ────────────────────────────────────────────────

describe('ghl_delete_facebook_page', () => {
  it('calls DELETE /ad-publishing/facebook/page with locationId, pageId query params', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_facebook_page').handler(
      { pageId: 'page1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/page');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.pageId).toBe('page1');
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_facebook_page').handler(
      { pageId: 'page1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_set_default_facebook_page ───────────────────────────────────────────

describe('ghl_set_default_facebook_page', () => {
  it('calls PUT /ad-publishing/facebook/page/default with locationId query and pageId body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_set_default_facebook_page').handler(
      { pageId: 'page1', isDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/page/default');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('false');
    expect(call.body?.pageId).toBe('page1');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_set_default_facebook_page').handler(
      { pageId: 'page1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_facebook_page_forms ─────────────────────────────────────────────

describe('ghl_get_facebook_page_forms', () => {
  it('calls GET /ad-publishing/facebook/page/:pageId/forms with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_page_forms').handler(
      { pageId: 'page1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/page/page1/forms');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_page_forms').handler(
      { pageId: 'page1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_create_facebook_page_form ───────────────────────────────────────────

const CREATE_FORM_ARGS = {
  pageId: 'page1',
  type: 'MORE_VOLUME',
  name: 'Contact Form',
  questions: [{ key: 'full_name', type: 'FULL_NAME', options: [] }],
  privacyPolicyLink: 'https://example.com/privacy',
  thankYouPage: {
    title: 'Thank You!',
    body: 'We will contact you soon',
    buttonType: 'VIEW_WEBSITE',
    buttonText: 'Visit Website',
    buttonLink: 'https://example.com',
  },
};

describe('ghl_create_facebook_page_form', () => {
  it('calls POST /ad-publishing/facebook/page/:pageId/forms with locationId plus required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_facebook_page_form').handler(
      CREATE_FORM_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/page/page1/forms');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.type).toBe('MORE_VOLUME');
    expect(call.body?.name).toBe('Contact Form');
    expect(call.body?.questions).toEqual(CREATE_FORM_ARGS.questions);
    expect(call.body?.privacyPolicyLink).toBe(CREATE_FORM_ARGS.privacyPolicyLink);
    expect(call.body?.thankYouPage).toEqual(CREATE_FORM_ARGS.thankYouPage);
    expect(call.body?.pageId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('includes optional fields when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_facebook_page_form').handler(
      {
        ...CREATE_FORM_ARGS,
        questionPageHeadline: 'Tell us about yourself',
        privacyPolicyText: 'We respect your privacy',
        greetingCard: { title: 'Welcome!', style: 'LIST_STYLE', content: ['Learn more'] },
        customDisclaimer: { title: 'Terms', body: 'By submitting...', checkboxes: [] },
        isDraft: true,
        draftFormId: '1234567890',
        locale: 'EN_US',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.questionPageHeadline).toBe('Tell us about yourself');
    expect(call.body?.privacyPolicyText).toBe('We respect your privacy');
    expect(call.body?.greetingCard).toEqual({ title: 'Welcome!', style: 'LIST_STYLE', content: ['Learn more'] });
    expect(call.body?.customDisclaimer).toEqual({ title: 'Terms', body: 'By submitting...', checkboxes: [] });
    expect(call.body?.isDraft).toBe(true);
    expect(call.body?.draftFormId).toBe('1234567890');
    expect(call.body?.locale).toBe('EN_US');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_facebook_page_form').handler(
      CREATE_FORM_ARGS,
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_page_instagram_accounts ────────────────────────────────

describe('ghl_get_facebook_page_instagram_accounts', () => {
  it('calls GET /ad-publishing/facebook/page/:pageId/instagram with locationId, type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_page_instagram_accounts').handler(
      { pageId: 'page1', type: 'INTEGRATION' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/page/page1/instagram');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('INTEGRATION');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_page_instagram_accounts').handler(
      { pageId: 'page1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
