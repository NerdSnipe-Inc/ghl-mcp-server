import { describe, it, expect } from 'vitest';
import { socialPlannerQueuesTools } from '../../src/tools/social_planner_queues.js';
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
  const tool = socialPlannerQueuesTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_social_queue ─────────────────────────────────────────────────

describe('ghl_create_social_queue', () => {
  it('calls POST /social-media-posting/category/queues with required + optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_social_queue').handler(
      {
        categoryId: 'cat1',
        timeSlots: [{ dayOfWeek: 0, time: '09:00' }],
        userId: 'user1',
        enableFuturePosts: true,
        prioritizeNewContent: false,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.categoryId).toBe('cat1');
    expect(call.body.timeSlots).toEqual([{ dayOfWeek: 0, time: '09:00' }]);
    expect(call.body.userId).toBe('user1');
    expect(call.body.enableFuturePosts).toBe(true);
    expect(call.body.prioritizeNewContent).toBe(false);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_social_queue').handler(
      { categoryId: 'cat1', timeSlots: [{ dayOfWeek: 0, time: '09:00' }], userId: 'user1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_queue_categories ─────────────────────────────────────────

describe('ghl_get_social_queue_categories', () => {
  it('calls GET .../available-categories with locationId, skip, limit, q', async () => {
    const fetch = mockFetchSuccess({ categories: [] });
    const result = await getTool('ghl_get_social_queue_categories').handler(
      { skip: 0, limit: 20, q: 'blog' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/social-media-posting/category/queues/available-categories');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('20');
    expect(call.params.q).toBe('blog');
    expectSuccess(result, { categories: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_social_queue_categories').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_list_social_queues ──────────────────────────────────────────────────

describe('ghl_list_social_queues', () => {
  it('calls POST .../list with locationId, skip, limit', async () => {
    const fetch = mockFetchSuccess({ queues: [] });
    const result = await getTool('ghl_list_social_queues').handler(
      { skip: 0, limit: 20 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/list');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.skip).toBe(0);
    expect(call.body.limit).toBe(20);
    expectSuccess(result, { queues: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_list_social_queues').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_social_queue_calendar ───────────────────────────────────────────

describe('ghl_get_social_queue_calendar', () => {
  it('calls POST .../list/calendar with locationId, startDate, endDate, categoryIds, accountIds', async () => {
    const fetch = mockFetchSuccess({ calendar: [] });
    const result = await getTool('ghl_get_social_queue_calendar').handler(
      {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        categoryIds: ['cat1'],
        accountIds: ['acct1'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/list/calendar');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.startDate).toBe('2026-08-01');
    expect(call.body.endDate).toBe('2026-08-31');
    expect(call.body.categoryIds).toEqual(['cat1']);
    expect(call.body.accountIds).toEqual(['acct1']);
    expectSuccess(result, { calendar: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_social_queue_calendar').handler(
      { startDate: '2026-08-01', endDate: '2026-08-31' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_social_queue_active_post ─────────────────────────────────────

describe('ghl_delete_social_queue_active_post', () => {
  it('calls DELETE .../:postId/active-post with locationId', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_social_queue_active_post').handler(
      { postId: 'post1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/social-media-posting/category/queues/post1/active-post');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_social_queue_active_post').handler(
      { postId: 'post1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_social_queue ────────────────────────────────────────────────────

describe('ghl_get_social_queue', () => {
  it('calls GET .../:queueId with locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'queue1' });
    const result = await getTool('ghl_get_social_queue').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { id: 'queue1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_social_queue').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_social_queue ─────────────────────────────────────────────────

describe('ghl_update_social_queue', () => {
  it('calls PUT .../:queueId with locationId + optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_social_queue').handler(
      {
        queueId: 'queue1',
        skipLegacyWatermark: true,
        status: 'paused',
        skipDateTime: '2026-08-01T00:00:00.000Z',
        timeSlots: [{ dayOfWeek: 1, time: '10:00' }],
        enableFuturePosts: true,
        prioritizeNewContent: false,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.skipLegacyWatermark).toBe(true);
    expect(call.body.status).toBe('paused');
    expect(call.body.skipDateTime).toBe('2026-08-01T00:00:00.000Z');
    expect(call.body.timeSlots).toEqual([{ dayOfWeek: 1, time: '10:00' }]);
    expect(call.body.enableFuturePosts).toBe(true);
    expect(call.body.prioritizeNewContent).toBe(false);
    expect(call.body.queueId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_social_queue').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_create_social_queue_item ────────────────────────────────────────────

describe('ghl_create_social_queue_item', () => {
  it('calls POST .../:queueId/create/item with locationId + optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_social_queue_item').handler(
      {
        queueId: 'queue1',
        sessionId: 'sess1',
        modifiedPostPayload: { summary: 'hi' },
        order: 'top',
        variations: [{ content: 'hi there' }],
        primaryImage: 'http://example.com/media.png',
        directToQueue: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/create/item');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.modifiedPostPayload).toEqual({ summary: 'hi' });
    expect(call.body.order).toBe('top');
    expect(call.body.variations).toEqual([{ content: 'hi there' }]);
    expect(call.body.primaryImage).toBe('http://example.com/media.png');
    expect(call.body.directToQueue).toBe(true);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_social_queue_item').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_queue_edit_calendar ──────────────────────────────────────

describe('ghl_get_social_queue_edit_calendar', () => {
  it('calls POST .../:queueId/edit/calendar with locationId, sessionId, startDate, endDate, accountIds', async () => {
    const fetch = mockFetchSuccess({ calendar: [] });
    const result = await getTool('ghl_get_social_queue_edit_calendar').handler(
      {
        queueId: 'queue1',
        sessionId: 'sess1',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        accountIds: ['acct1'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/edit/calendar');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.startDate).toBe('2026-08-01');
    expect(call.body.endDate).toBe('2026-08-31');
    expect(call.body.accountIds).toEqual(['acct1']);
    expectSuccess(result, { calendar: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_social_queue_edit_calendar').handler(
      { queueId: 'queue1', sessionId: 'sess1', startDate: '2026-08-01', endDate: '2026-08-31' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_discard_social_queue_edit ───────────────────────────────────────────

describe('ghl_discard_social_queue_edit', () => {
  it('calls POST .../:queueId/edit/discard with locationId, sessionId, keepInDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_discard_social_queue_edit').handler(
      { queueId: 'queue1', sessionId: 'sess1', keepInDraft: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/edit/discard');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.keepInDraft).toBe(true);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_discard_social_queue_edit').handler(
      { queueId: 'queue1', sessionId: 'sess1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_save_social_queue_edit ──────────────────────────────────────────────

describe('ghl_save_social_queue_edit', () => {
  it('calls POST .../:queueId/edit/save with locationId, sessionId, keepInDraft', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_save_social_queue_edit').handler(
      { queueId: 'queue1', sessionId: 'sess1', keepInDraft: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/edit/save');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.keepInDraft).toBe(false);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_save_social_queue_edit').handler(
      { queueId: 'queue1', sessionId: 'sess1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_start_social_queue_edit ─────────────────────────────────────────────

describe('ghl_start_social_queue_edit', () => {
  it('calls POST .../:queueId/edit/start with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_start_social_queue_edit').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/edit/start');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_start_social_queue_edit').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_queue_items ──────────────────────────────────────────────

describe('ghl_get_social_queue_items', () => {
  it('calls POST .../:queueId/items with locationId + optional fields', async () => {
    const fetch = mockFetchSuccess({ items: [] });
    const result = await getTool('ghl_get_social_queue_items').handler(
      {
        queueId: 'queue1',
        sessionId: 'sess1',
        skip: 0,
        limit: 20,
        errorFilter: true,
        itemId: 'item1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/items');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.skip).toBe(0);
    expect(call.body.limit).toBe(20);
    expect(call.body.errorFilter).toBe(true);
    expect(call.body.itemId).toBe('item1');
    expectSuccess(result, { items: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_social_queue_items').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_social_queue_item ────────────────────────────────────────────

describe('ghl_delete_social_queue_item', () => {
  it('calls DELETE .../:queueId/items/:itemId with locationId, sessionId', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1', sessionId: 'sess1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/items/item1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.sessionId).toBe('sess1');
    expectSuccess(result, {});
  });

  it('omits sessionId when not provided', async () => {
    const fetch = mockFetchSuccess({});
    await getTool('ghl_delete_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.sessionId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_social_queue_item ────────────────────────────────────────────

describe('ghl_update_social_queue_item', () => {
  it('calls PUT .../:queueId/items/:itemId with locationId + optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_social_queue_item').handler(
      {
        queueId: 'queue1',
        itemId: 'item1',
        sessionId: 'sess1',
        modifiedPostPayload: { summary: 'updated' },
        newOrder: 5,
        variations: [{ content: 'updated content' }],
        primaryImage: 'http://example.com/new.png',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/items/item1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.modifiedPostPayload).toEqual({ summary: 'updated' });
    expect(call.body.newOrder).toBe(5);
    expect(call.body.variations).toEqual([{ content: 'updated content' }]);
    expect(call.body.primaryImage).toBe('http://example.com/new.png');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_clone_social_queue_item ─────────────────────────────────────────────

describe('ghl_clone_social_queue_item', () => {
  it('calls POST .../:queueId/items/:itemId/clone with locationId, sessionId, order', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_clone_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1', sessionId: 'sess1', order: 3 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/items/item1/clone');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.order).toBe(3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_clone_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1', sessionId: 'sess1', order: 3 },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_reset_social_queue_item ─────────────────────────────────────────────

describe('ghl_reset_social_queue_item', () => {
  it('calls PUT .../:queueId/items/:itemId/reset with locationId, sessionId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_reset_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1', sessionId: 'sess1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/items/item1/reset');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_reset_social_queue_item').handler(
      { queueId: 'queue1', itemId: 'item1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_queue_slots ───────────────────────────────────────────────

describe('ghl_get_social_queue_slots', () => {
  it('calls POST .../:queueId/slots with locationId + optional fields', async () => {
    const fetch = mockFetchSuccess({ slots: [] });
    const result = await getTool('ghl_get_social_queue_slots').handler(
      { queueId: 'queue1', sessionId: 'sess1', skip: 0, limit: 20 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/category/queues/queue1/slots');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.sessionId).toBe('sess1');
    expect(call.body.skip).toBe(0);
    expect(call.body.limit).toBe(20);
    expectSuccess(result, { slots: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_social_queue_slots').handler(
      { queueId: 'queue1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});
