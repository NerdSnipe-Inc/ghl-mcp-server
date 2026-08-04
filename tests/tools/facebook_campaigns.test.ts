import { describe, it, expect } from 'vitest';
import { facebookCampaignsTools } from '../../src/tools/facebook_campaigns.js';
import { GHL_VERSION_LEGACY, GHL_VERSION_V3 } from '../../src/client.js';
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
  const tool = facebookCampaignsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_facebook_campaign ───────────────────────────────────────────────

describe('ghl_get_facebook_campaign', () => {
  it('calls GET /ad-publishing/facebook/campaign/:campaignId with locationId, fields, source', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_campaign').handler(
      { campaignId: 'camp1', fields: 'name,objective', source: 'facebook' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaign/camp1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.fields).toBe('name,objective');
    expect(call.params.source).toBe('facebook');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional filters when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_facebook_campaign').handler({ campaignId: 'camp1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.fields).toBeUndefined();
    expect(call.params.source).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_upsert_facebook_campaign ────────────────────────────────────────────

describe('ghl_upsert_facebook_campaign', () => {
  it('calls PUT /ad-publishing/facebook/campaigns with locationId plus optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_facebook_campaign').handler(
      {
        id: 'camp1',
        name: 'Summer Campaign',
        objective: 'OUTCOME_LEADS',
        specialAdCategories: ['NONE'],
        source: 'facebook',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaigns');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.id).toBe('camp1');
    expect(call.body?.name).toBe('Summer Campaign');
    expect(call.body?.objective).toBe('OUTCOME_LEADS');
    expect(call.body?.specialAdCategories).toEqual(['NONE']);
    expect(call.body?.source).toBe('facebook');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided (create path, no id)', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_facebook_campaign').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.id).toBeUndefined();
    expect(call.body?.name).toBeUndefined();
    expect(call.body?.objective).toBeUndefined();
    expect(call.body?.specialAdCategories).toBeUndefined();
    expect(call.body?.source).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_facebook_campaign').handler({}, TEST_CONFIG);
    expectError(result, 422);
  });
});

// ── ghl_delete_facebook_campaign ────────────────────────────────────────────

describe('ghl_delete_facebook_campaign', () => {
  it('calls DELETE /ad-publishing/facebook/campaigns/:campaignId with locationId in body', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaigns/camp1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_delete_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_duplicate_facebook_campaign ─────────────────────────────────────────

describe('ghl_duplicate_facebook_campaign', () => {
  it('calls POST /ad-publishing/facebook/campaigns/:campaignId/duplicate with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_duplicate_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaigns/camp1/duplicate');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_duplicate_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_pause_facebook_campaign ─────────────────────────────────────────────

describe('ghl_pause_facebook_campaign', () => {
  it('calls POST /ad-publishing/facebook/campaigns/:campaignId/pause with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_pause_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaigns/camp1/pause');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_pause_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_publish_facebook_campaign ───────────────────────────────────────────

describe('ghl_publish_facebook_campaign', () => {
  it('calls POST /ad-publishing/facebook/campaigns/:campaignId/publish with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_publish_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaigns/camp1/publish');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_publish_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_facebook_campaign_publishing_progress ───────────────────────────

describe('ghl_get_facebook_campaign_publishing_progress', () => {
  it('calls GET .../publishing-progress with GHL_VERSION_V3 (the sole v3 exception)', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_facebook_campaign_publishing_progress').handler(
      { campaignId: 'camp1', isDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaigns/camp1/publishing-progress');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.isDraft).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_facebook_campaign_publishing_progress').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_resume_facebook_campaign ────────────────────────────────────────────

describe('ghl_resume_facebook_campaign', () => {
  it('calls POST /ad-publishing/facebook/campaigns/:campaignId/resume with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_resume_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/campaigns/camp1/resume');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_resume_facebook_campaign').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_upsert_facebook_adset ───────────────────────────────────────────────

describe('ghl_upsert_facebook_adset', () => {
  it('calls PUT /ad-publishing/facebook/adsets with locationId, campaignId plus optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_facebook_adset').handler(
      {
        id: 'adset1',
        campaignId: 'camp1',
        name: 'Targeting Group A',
        pageId: 'page1',
        instagramActorId: 'ig_123',
        messagingPlatforms: ['WHATSAPP'],
        whatsappNumber: '+1234567890',
        audience: { ageMin: 18, ageMax: 65 },
        budget: { budgetType: 'DAILY', amount: 1000 },
        conversionLocation: 'website',
        customEventType: 'Purchase',
        pixelId: 'px_123',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/adsets');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.campaignId).toBe('camp1');
    expect(call.body?.id).toBe('adset1');
    expect(call.body?.name).toBe('Targeting Group A');
    expect(call.body?.pageId).toBe('page1');
    expect(call.body?.instagramActorId).toBe('ig_123');
    expect(call.body?.messagingPlatforms).toEqual(['WHATSAPP']);
    expect(call.body?.whatsappNumber).toBe('+1234567890');
    expect(call.body?.audience).toEqual({ ageMin: 18, ageMax: 65 });
    expect(call.body?.budget).toEqual({ budgetType: 'DAILY', amount: 1000 });
    expect(call.body?.conversionLocation).toBe('website');
    expect(call.body?.customEventType).toBe('Purchase');
    expect(call.body?.pixelId).toBe('px_123');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_facebook_adset').handler({ campaignId: 'camp1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.id).toBeUndefined();
    expect(call.body?.name).toBeUndefined();
    expect(call.body?.audience).toBeUndefined();
    expect(call.body?.budget).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_facebook_adset').handler(
      { campaignId: 'camp1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_delete_facebook_adset ───────────────────────────────────────────────

describe('ghl_delete_facebook_adset', () => {
  it('calls DELETE /ad-publishing/facebook/adsets/:adSetId with locationId in body', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/adsets/adset1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_delete_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_duplicate_facebook_adset ────────────────────────────────────────────

describe('ghl_duplicate_facebook_adset', () => {
  it('calls POST /ad-publishing/facebook/adsets/:adSetId/duplicate with no body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_duplicate_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/adsets/adset1/duplicate');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_duplicate_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_pause_facebook_adset ────────────────────────────────────────────────

describe('ghl_pause_facebook_adset', () => {
  it('calls POST /ad-publishing/facebook/adsets/:adSetId/pause with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_pause_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/adsets/adset1/pause');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_pause_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_resume_facebook_adset ───────────────────────────────────────────────

describe('ghl_resume_facebook_adset', () => {
  it('calls POST /ad-publishing/facebook/adsets/:adSetId/resume with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_resume_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/adsets/adset1/resume');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_resume_facebook_adset').handler(
      { adSetId: 'adset1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_upsert_facebook_ad ──────────────────────────────────────────────────

describe('ghl_upsert_facebook_ad', () => {
  it('calls PUT /ad-publishing/facebook/ads with locationId, campaignId, adsetId plus optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_upsert_facebook_ad').handler(
      {
        id: 'ad1',
        campaignId: 'camp1',
        adsetId: 'adset1',
        name: 'My Ad Creative',
        primaryText: 'Check out our offer!',
        headline: 'Great Deal',
        description: 'Limited time offer',
        imageUrl: 'https://example.com/img.jpg',
        mediaType: 'SINGLE',
        media: [{ src: 'https://example.com/image.jpg', type: 'IMAGE' }],
        multiAdvertiserAds: false,
        cta: 'LEARN_MORE',
        conversationFormId: 'conv_123',
        destinationLink: 'https://example.com',
        destinationFormId: 'form_123',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/ad-publishing/facebook/ads');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.campaignId).toBe('camp1');
    expect(call.body?.adsetId).toBe('adset1');
    expect(call.body?.id).toBe('ad1');
    expect(call.body?.name).toBe('My Ad Creative');
    expect(call.body?.primaryText).toBe('Check out our offer!');
    expect(call.body?.headline).toBe('Great Deal');
    expect(call.body?.description).toBe('Limited time offer');
    expect(call.body?.imageUrl).toBe('https://example.com/img.jpg');
    expect(call.body?.mediaType).toBe('SINGLE');
    expect(call.body?.media).toEqual([{ src: 'https://example.com/image.jpg', type: 'IMAGE' }]);
    expect(call.body?.multiAdvertiserAds).toBe(false);
    expect(call.body?.cta).toBe('LEARN_MORE');
    expect(call.body?.conversationFormId).toBe('conv_123');
    expect(call.body?.destinationLink).toBe('https://example.com');
    expect(call.body?.destinationFormId).toBe('form_123');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional fields when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_facebook_ad').handler(
      { campaignId: 'camp1', adsetId: 'adset1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.id).toBeUndefined();
    expect(call.body?.name).toBeUndefined();
    expect(call.body?.media).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_upsert_facebook_ad').handler(
      { campaignId: 'camp1', adsetId: 'adset1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_delete_facebook_ad ──────────────────────────────────────────────────

describe('ghl_delete_facebook_ad', () => {
  it('calls DELETE /ad-publishing/facebook/ads/:adId with locationId in body', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_facebook_ad').handler({ adId: 'ad1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/ad-publishing/facebook/ads/ad1');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_delete_facebook_ad').handler({ adId: 'ad1' }, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_duplicate_facebook_ad ───────────────────────────────────────────────

describe('ghl_duplicate_facebook_ad', () => {
  it('calls POST /ad-publishing/facebook/ads/:adId/duplicate with no body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_duplicate_facebook_ad').handler(
      { adId: 'ad1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/ads/ad1/duplicate');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_duplicate_facebook_ad').handler(
      { adId: 'ad1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_pause_facebook_ad ───────────────────────────────────────────────────

describe('ghl_pause_facebook_ad', () => {
  it('calls POST /ad-publishing/facebook/ads/:adId/pause with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_pause_facebook_ad').handler({ adId: 'ad1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/ads/ad1/pause');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_pause_facebook_ad').handler({ adId: 'ad1' }, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_resume_facebook_ad ──────────────────────────────────────────────────

describe('ghl_resume_facebook_ad', () => {
  it('calls POST /ad-publishing/facebook/ads/:adId/resume with locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_resume_facebook_ad').handler({ adId: 'ad1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/ad-publishing/facebook/ads/ad1/resume');
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_resume_facebook_ad').handler({ adId: 'ad1' }, TEST_CONFIG);
    expectError(result, 400);
  });
});
