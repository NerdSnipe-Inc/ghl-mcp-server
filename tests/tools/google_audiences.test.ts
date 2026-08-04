import { describe, it, expect } from 'vitest';
import { googleAudiencesTools } from '../../src/tools/google_audiences.js';
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
  const tool = googleAudiencesTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_upsert_google_audience ──────────────────────────────────────────────

describe('ghl_upsert_google_audience', () => {
  it('calls PUT /ad-publishing/google/audiences with locationId, name', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_google_audience').handler(
      { name: 'Audience A' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/google/audiences');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('Audience A');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes resourceName and dimensions/exclusionDimension through', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_google_audience').handler(
      {
        name: 'Audience A',
        resourceName: 'customers/123/customAudiences/456',
        dimensions: {
          isAgeUnknown: false,
          ageRanges: ['25-34'],
          genders: ['MALE', 'FEMALE'],
          audienceSegments: { customAudiences: ['customers/123/customAudiences/456'] },
        },
        exclusionDimension: { genders: ['UNDETERMINED'] },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.resourceName).toBe('customers/123/customAudiences/456');
    expect(call.body?.dimensions).toEqual({
      isAgeUnknown: false,
      ageRanges: ['25-34'],
      genders: ['MALE', 'FEMALE'],
      audienceSegments: { customAudiences: ['customers/123/customAudiences/456'] },
    });
    expect(call.body?.exclusionDimension).toEqual({ genders: ['UNDETERMINED'] });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_google_audience').handler(
      { name: 'Audience A' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_google_audiences ────────────────────────────────────────────────

describe('ghl_get_google_audiences', () => {
  it('calls GET /ad-publishing/google/audiences with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_audiences').handler(
      { isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/audiences');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(500);
    const result = await getTool('ghl_get_google_audiences').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_get_google_audience ─────────────────────────────────────────────────

describe('ghl_get_google_audience', () => {
  it('calls GET /ad-publishing/google/audiences/:audienceId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_audience').handler(
      { audienceId: 'aud_1', isDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/audiences/aud_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('false');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404);
    const result = await getTool('ghl_get_google_audience').handler(
      { audienceId: 'aud_1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_google_segments ─────────────────────────────────────────────────

describe('ghl_get_google_segments', () => {
  it('calls GET /ad-publishing/google/segments with locationId, type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_segments').handler(
      { type: 'CUSTOM_SEGMENTS' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/segments');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('CUSTOM_SEGMENTS');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(500);
    const result = await getTool('ghl_get_google_segments').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_upsert_google_segment ───────────────────────────────────────────────

describe('ghl_upsert_google_segment', () => {
  it('calls PUT /ad-publishing/google/segments with locationId, type query params and name in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_google_segment').handler(
      { type: 'CUSTOM_SEGMENTS', name: 'Segment A' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/google/segments');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('CUSTOM_SEGMENTS');
    expect(call.body?.name).toBe('Segment A');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes members, expansionLevel, ruleBasedUserList, and other optional fields through', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_google_segment').handler(
      {
        type: 'CUSTOM_SEGMENTS',
        name: 'Segment A',
        description: 'desc',
        members: [{ memberType: 'KEYWORD', keyword: 'marketing' }],
        status: 'ENABLED',
        id: 'seg_1',
        membershipStatus: 'OPEN',
        ruleBasedUserList: { prepopulationStatus: 'REQUESTED' },
        membershipLifeSpan: 30,
        seedUserListIds: ['123'],
        countryCodes: ['US'],
        expansionLevel: 'BALANCED',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.members).toEqual([{ memberType: 'KEYWORD', keyword: 'marketing' }]);
    expect(call.body?.expansionLevel).toBe('BALANCED');
    expect(call.body?.ruleBasedUserList).toEqual({ prepopulationStatus: 'REQUESTED' });
    expect(call.body?.membershipLifeSpan).toBe(30);
    expect(call.body?.seedUserListIds).toEqual(['123']);
    expect(call.body?.countryCodes).toEqual(['US']);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_google_segment').handler(
      { type: 'CUSTOM_SEGMENTS', name: 'Segment A' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_create_google_offline_user_list_job ─────────────────────────────────

describe('ghl_create_google_offline_user_list_job', () => {
  it('calls POST /ad-publishing/google/segments/offline-user-list-job with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_google_offline_user_list_job').handler(
      {},
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/google/segments/offline-user-list-job');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes smartListIds, csvPath, userListId, isDynamic through', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_google_offline_user_list_job').handler(
      {
        smartListIds: ['sl_1'],
        csvPath: '/tmp/list.csv',
        userListId: 'ul_1',
        isDynamic: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.smartListIds).toEqual(['sl_1']);
    expect(call.body?.csvPath).toBe('/tmp/list.csv');
    expect(call.body?.userListId).toBe('ul_1');
    expect(call.body?.isDynamic).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_google_offline_user_list_job').handler(
      {},
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_delete_google_segment ───────────────────────────────────────────────

describe('ghl_delete_google_segment', () => {
  it('calls DELETE /ad-publishing/google/segments/:segmentId with locationId, type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_google_segment').handler(
      { segmentId: 'seg_1', type: 'CUSTOM_SEGMENTS' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/google/segments/seg_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('CUSTOM_SEGMENTS');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404);
    const result = await getTool('ghl_delete_google_segment').handler(
      { segmentId: 'seg_1', type: 'CUSTOM_SEGMENTS' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_google_segment ──────────────────────────────────────────────────

describe('ghl_get_google_segment', () => {
  it('calls GET /ad-publishing/google/segments/:segmentId with locationId, type', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_segment').handler(
      { segmentId: 'seg_1', type: 'DATA_SEGMENTS' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/segments/seg_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('DATA_SEGMENTS');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404);
    const result = await getTool('ghl_get_google_segment').handler(
      { segmentId: 'seg_1', type: 'DATA_SEGMENTS' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_google_conversions ──────────────────────────────────────────────

describe('ghl_get_google_conversions', () => {
  it('calls GET /ad-publishing/google/conversions with locationId and optional filters', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_conversions').handler(
      {
        type: 'AD_WORDS',
        conversionType: 'WEBPAGE',
        category: 'PURCHASE',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/conversions');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('AD_WORDS');
    expect(call.params.conversionType).toBe('WEBPAGE');
    expect(call.params.category).toBe('PURCHASE');
    expect(call.params.startDate).toBe('2024-01-01');
    expect(call.params.endDate).toBe('2024-01-31');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(500);
    const result = await getTool('ghl_get_google_conversions').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_upsert_google_conversion ────────────────────────────────────────────

describe('ghl_upsert_google_conversion', () => {
  const requiredArgs = {
    name: 'Conversion A',
    type: 'WEBPAGE' as const,
    category: 'PURCHASE',
    valueSettings: { defaultValue: 10, defaultCurrencyCode: 'USD', alwaysUseDefaultValue: false },
    countingType: 'ONE_PER_CLICK' as const,
    attributionModel: 'GOOGLE_ADS_LAST_CLICK' as const,
    clickThroughWindow: 30,
  };

  it('calls PUT /ad-publishing/google/conversions with all required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_google_conversion').handler(
      requiredArgs,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/google/conversions');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('Conversion A');
    expect(call.body?.type).toBe('WEBPAGE');
    expect(call.body?.category).toBe('PURCHASE');
    expect(call.body?.valueSettings).toEqual({
      defaultValue: 10,
      defaultCurrencyCode: 'USD',
      alwaysUseDefaultValue: false,
    });
    expect(call.body?.countingType).toBe('ONE_PER_CLICK');
    expect(call.body?.attributionModel).toBe('GOOGLE_ADS_LAST_CLICK');
    expect(call.body?.clickThroughWindow).toBe(30);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes conversionId when updating an existing conversion', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_google_conversion').handler(
      { ...requiredArgs, conversionId: 'conv_1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.conversionId).toBe('conv_1');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_google_conversion').handler(
      requiredArgs,
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_google_conversion ───────────────────────────────────────────────

describe('ghl_get_google_conversion', () => {
  it('calls GET /ad-publishing/google/conversions/:conversionId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_conversion').handler(
      { conversionId: 'conv_1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/conversions/conv_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404);
    const result = await getTool('ghl_get_google_conversion').handler(
      { conversionId: 'conv_1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_google_conversion ────────────────────────────────────────────

describe('ghl_delete_google_conversion', () => {
  it('calls DELETE /ad-publishing/google/conversions/:conversionId with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_google_conversion').handler(
      { conversionId: 'conv_1', isDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/google/conversions/conv_1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('false');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404);
    const result = await getTool('ghl_delete_google_conversion').handler(
      { conversionId: 'conv_1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_google_conversion_goals ─────────────────────────────────────────

describe('ghl_get_google_conversion_goals', () => {
  it('calls GET /ad-publishing/google/conversion-goals with locationId, isDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_conversion_goals').handler(
      { isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/conversion-goals');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(500);
    const result = await getTool('ghl_get_google_conversion_goals').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_get_google_target_interests ─────────────────────────────────────────

describe('ghl_get_google_target_interests', () => {
  it('calls GET /ad-publishing/google/target-interests with locationId, type, advertisingChannelType', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_google_target_interests').handler(
      { type: 'AFFINITY', advertisingChannelType: 'DISPLAY' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/google/target-interests');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.type).toBe('AFFINITY');
    expect(call.params.advertisingChannelType).toBe('DISPLAY');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(500);
    const result = await getTool('ghl_get_google_target_interests').handler(
      { type: 'IN_MARKET', advertisingChannelType: 'SEARCH' },
      TEST_CONFIG
    );
    expectError(result, 500);
  });
});
