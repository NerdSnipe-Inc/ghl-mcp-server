import { describe, it, expect } from 'vitest';
import { facebookAudiencesTools } from '../../src/tools/facebook_audiences.js';
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
  const tool = facebookAudiencesTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_facebook_custom_audiences ───────────────────────────────────────

describe('ghl_get_facebook_custom_audiences', () => {
  it('calls GET /ad-publishing/facebook/custom-audience with locationId, type, adAccountId, source', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_custom_audiences').handler(
      { type: 'custom', adAccountId: 'act_123', source: 'ad_manager' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/custom-audience');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('custom');
    expect(call.params.adAccountId).toBe('act_123');
    expect(call.params.source).toBe('ad_manager');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional source when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_custom_audiences').handler(
      { type: 'custom', adAccountId: 'act_123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.source).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_custom_audiences').handler(
      { type: 'custom', adAccountId: 'act_123' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });

  it('validates type and source as closed enums', () => {
    const schema = getTool('ghl_get_facebook_custom_audiences').inputSchema;
    expect(
      schema.safeParse({ type: 'lookalike', adAccountId: 'act_123', source: 'integration' }).success
    ).toBe(true);
    expect(schema.safeParse({ type: 'all', adAccountId: 'act_123' }).success).toBe(true);
    expect(schema.safeParse({ type: 'not_a_real_type', adAccountId: 'act_123' }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ type: 'custom', adAccountId: 'act_123', source: 'facebook' }).success
    ).toBe(false);
  });
});

// ── ghl_delete_facebook_custom_audience ─────────────────────────────────────

describe('ghl_delete_facebook_custom_audience', () => {
  it('calls DELETE /ad-publishing/facebook/custom-audience/:audienceId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_facebook_custom_audience').handler(
      { audienceId: 'aud1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/custom-audience/aud1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, {});
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess({});
    await getTool('ghl_delete_facebook_custom_audience').handler({ audienceId: 'aud1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_delete_facebook_custom_audience').handler(
      { audienceId: 'aud1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_update_facebook_custom_audience ─────────────────────────────────────

describe('ghl_update_facebook_custom_audience', () => {
  it('calls PUT /ad-publishing/facebook/custom-audience/:audienceId with locationId, name, description', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_facebook_custom_audience').handler(
      { audienceId: 'aud1', name: 'My Audience', description: 'A lookalike audience' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/custom-audience/aud1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('My Audience');
    expect(call.body?.description).toBe('A lookalike audience');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional description when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_facebook_custom_audience').handler(
      { audienceId: 'aud1', name: 'My Audience' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.description).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_update_facebook_custom_audience').handler(
      { audienceId: 'aud1', name: 'My Audience' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_custom_audience ────────────────────────────────────────

describe('ghl_get_facebook_custom_audience', () => {
  it('calls GET /ad-publishing/facebook/custom-audience/:audienceId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_custom_audience').handler(
      { audienceId: 'aud1', isDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/custom-audience/aud1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('false');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_custom_audience').handler({ audienceId: 'aud1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_custom_audience').handler(
      { audienceId: 'aud1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_add_facebook_custom_audience_member ─────────────────────────────────

describe('ghl_add_facebook_custom_audience_member', () => {
  it('calls PUT .../member with locationId, contactId, fbAdAccountId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_add_facebook_custom_audience_member').handler(
      { audienceId: 'aud1', contactId: 'contact1', fbAdAccountId: 'act_123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/custom-audience/aud1/member');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.contactId).toBe('contact1');
    expect(call.body?.fbAdAccountId).toBe('act_123');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fbAdAccountId when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_add_facebook_custom_audience_member').handler(
      { audienceId: 'aud1', contactId: 'contact1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.fbAdAccountId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_add_facebook_custom_audience_member').handler(
      { audienceId: 'aud1', contactId: 'contact1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_remove_facebook_custom_audience_member ──────────────────────────────

describe('ghl_remove_facebook_custom_audience_member', () => {
  it('calls DELETE .../member with locationId, contactId, fbAdAccountId', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_remove_facebook_custom_audience_member').handler(
      { audienceId: 'aud1', contactId: 'contact1', fbAdAccountId: 'act_123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/custom-audience/aud1/member');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.contactId).toBe('contact1');
    expect(call.body?.fbAdAccountId).toBe('act_123');
    expectSuccess(result, {});
  });

  it('omits optional fbAdAccountId when not provided', async () => {
    const fetch = mockFetchSuccess({});
    await getTool('ghl_remove_facebook_custom_audience_member').handler(
      { audienceId: 'aud1', contactId: 'contact1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.fbAdAccountId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_remove_facebook_custom_audience_member').handler(
      { audienceId: 'aud1', contactId: 'contact1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_batch_update_facebook_custom_audience_members ───────────────────────

describe('ghl_batch_update_facebook_custom_audience_members', () => {
  it('calls PUT .../member/batch with locationId, operationType plus optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_batch_update_facebook_custom_audience_members').handler(
      {
        audienceId: 'aud1',
        operationType: 'ADD',
        csvPath: '/uploads/audience.csv',
        smartlistIds: ['list_1', 'list_2'],
        dynamicAudience: 'true',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/custom-audience/aud1/member/batch');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.operationType).toBe('ADD');
    expect(call.body?.csvPath).toBe('/uploads/audience.csv');
    expect(call.body?.smartlistIds).toEqual(['list_1', 'list_2']);
    expect(call.body?.dynamicAudience).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_batch_update_facebook_custom_audience_members').handler(
      { audienceId: 'aud1', operationType: 'ADD' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.csvPath).toBeUndefined();
    expect(call.body?.smartlistIds).toBeUndefined();
    expect(call.body?.dynamicAudience).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_batch_update_facebook_custom_audience_members').handler(
      { audienceId: 'aud1', operationType: 'ADD' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_pixels ──────────────────────────────────────────────────

describe('ghl_get_facebook_pixels', () => {
  it('calls GET /ad-publishing/facebook/pixels with locationId plus optional filters', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_pixels').handler(
      { channel: 'facebook', pageId: 'page1', igUserId: 'ig1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/pixels');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.channel).toBe('facebook');
    expect(call.params.pageId).toBe('page1');
    expect(call.params.igUserId).toBe('ig1');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional filters when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_pixels').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.channel).toBeUndefined();
    expect(call.params.pageId).toBeUndefined();
    expect(call.params.igUserId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_pixels').handler({}, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_upsert_facebook_pixel ────────────────────────────────────────────────

describe('ghl_upsert_facebook_pixel', () => {
  it('calls PUT /ad-publishing/facebook/pixels with locationId, type plus optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_facebook_pixel').handler(
      {
        type: 'LEAD_EVENT',
        conversionPixelId: 'px_123',
        name: 'My Pixel',
        igUserId: 'ig_user_123',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/pixels');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.type).toBe('LEAD_EVENT');
    expect(call.body?.conversionPixelId).toBe('px_123');
    expect(call.body?.name).toBe('My Pixel');
    expect(call.body?.igUserId).toBe('ig_user_123');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_facebook_pixel').handler({ type: 'LEAD_EVENT' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.conversionPixelId).toBeUndefined();
    expect(call.body?.name).toBeUndefined();
    expect(call.body?.igUserId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_facebook_pixel').handler({ type: 'LEAD_EVENT' }, TEST_CONFIG);
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_conversation_forms ─────────────────────────────────────

describe('ghl_get_facebook_conversation_forms', () => {
  it('calls GET /ad-publishing/facebook/conversation-forms with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_conversation_forms').handler(
      { isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/conversation-forms');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_conversation_forms').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_conversation_forms').handler({}, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_create_facebook_conversation_form ───────────────────────────────────

describe('ghl_create_facebook_conversation_form', () => {
  it('calls POST /ad-publishing/facebook/conversation-forms with locationId, name, text, questions', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_facebook_conversation_form').handler(
      {
        name: 'Welcome Form',
        text: 'Hi! How can we help?',
        questions: [
          { question: 'How can we help?', response: 'Thanks for reaching out!' },
          { question: 'I want to learn more' },
        ],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/conversation-forms');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('Welcome Form');
    expect(call.body?.text).toBe('Hi! How can we help?');
    expect(call.body?.questions).toEqual([
      { question: 'How can we help?', response: 'Thanks for reaching out!' },
      { question: 'I want to learn more' },
    ]);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_facebook_conversation_form').handler(
      { name: 'Welcome Form', text: 'Hi!', questions: [{ question: 'Q1' }] },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_lead_form ───────────────────────────────────────────────

describe('ghl_get_facebook_lead_form', () => {
  it('calls GET /ad-publishing/facebook/lead-form/:leadFormId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_lead_form').handler(
      { leadFormId: 'form1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/lead-form/form1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional isDraft when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_lead_form').handler({ leadFormId: 'form1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.isDraft).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_lead_form').handler(
      { leadFormId: 'form1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
