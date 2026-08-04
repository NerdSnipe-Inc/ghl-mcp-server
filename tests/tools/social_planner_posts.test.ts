import { describe, it, expect } from 'vitest';
import { socialPlannerPostsTools } from '../../src/tools/social_planner_posts.js';
import { GHL_VERSION_V3, GHL_BASE_URL } from '../../src/client.js';
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
  const tool = socialPlannerPostsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_upload_social_csv ───────────────────────────────────────────────────

describe('ghl_upload_social_csv', () => {
  it('sends multipart form data with the csv file', async () => {
    const fetchMock = mockFetchSuccess({ uploadId: 'up-1' });
    const result = await getTool('ghl_upload_social_csv').handler(
      { csvContent: 'name,platform\nJohn,facebook', filename: 'posts.csv' },
      TEST_CONFIG
    );
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `${GHL_BASE_URL}/social-media-posting/${TEST_CONFIG.locationId}/csv`
    );
    expect(init.body).toBeInstanceOf(FormData);
    const body = init.body as FormData;
    const file = body.get('file');
    expect(file).toBeInstanceOf(Blob);
    expect((file as File).name).toBe('posts.csv');
    const headers = init.headers as Record<string, string>;
    expect(headers['Version']).toBe(GHL_VERSION_V3);
    expectSuccess(result, { uploadId: 'up-1' });
  });

  it('formats errors', async () => {
    mockFetchError(400, { message: 'bad file' });
    const result = await getTool('ghl_upload_social_csv').handler(
      { csvContent: 'x', filename: 'x.csv' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_csv_upload_status ────────────────────────────────────────

describe('ghl_get_social_csv_upload_status', () => {
  it('calls GET /social-media-posting/{locationId}/csv with query params', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_social_csv_upload_status').handler(
      {
        userId: 'user1',
        skip: 0,
        limit: 20,
        includeUsers: true,
        isFromTemplate: false,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/csv`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.userId).toBe('user1');
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('20');
    expect(call.params.includeUsers).toBe('true');
    expect(call.params.isFromTemplate).toBe('false');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_social_csv_upload_status').handler(
      { userId: 'user1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_csv_post ─────────────────────────────────────────────────

describe('ghl_get_social_csv_post', () => {
  it('calls GET /social-media-posting/{locationId}/csv/{id} with optional pagination', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_social_csv_post').handler(
      { id: 'csv-1', skip: 0, limit: 10 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/csv/csv-1`
    );
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('10');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_social_csv_post').handler(
      { id: 'csv-1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_finalize_social_csv ─────────────────────────────────────────────────

describe('ghl_finalize_social_csv', () => {
  it('calls PATCH /social-media-posting/{locationId}/csv/{id} with userId body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_finalize_social_csv').handler(
      { id: 'csv-1', userId: 'user1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/csv/csv-1`
    );
    expect(call.body).toEqual({ userId: 'user1' });
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_finalize_social_csv').handler(
      { id: 'csv-1', userId: 'user1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_social_csv ───────────────────────────────────────────────────

describe('ghl_delete_social_csv', () => {
  it('calls DELETE /social-media-posting/{locationId}/csv/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_social_csv').handler(
      { id: 'csv-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/csv/csv-1`
    );
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_social_csv').handler(
      { id: 'csv-1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_social_csv_post ──────────────────────────────────────────────

describe('ghl_delete_social_csv_post', () => {
  it('calls DELETE /social-media-posting/{locationId}/csv/{csvId}/post/{postId}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_social_csv_post').handler(
      { csvId: 'csv-1', postId: 'post-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/csv/csv-1/post/post-1`
    );
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_social_csv_post').handler(
      { csvId: 'csv-1', postId: 'post-1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_bulk_delete_social_posts ────────────────────────────────────────────

describe('ghl_bulk_delete_social_posts', () => {
  it('calls POST /social-media-posting/{locationId}/posts/bulk-delete with postIds', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_bulk_delete_social_posts').handler(
      { postIds: ['p1', 'p2'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts/bulk-delete`
    );
    expect(call.body).toEqual({ postIds: ['p1', 'p2'] });
    expectSuccess(result, MOCK_DATA);
  });

  it('allows omitting postIds (upstream treats body as optional)', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_bulk_delete_social_posts').handler(
      {},
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_bulk_delete_social_posts').handler(
      { postIds: ['p1'] },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_post ─────────────────────────────────────────────────────

describe('ghl_get_social_post', () => {
  it('calls GET /social-media-posting/{locationId}/posts/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_social_post').handler(
      { id: 'post-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts/post-1`
    );
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_social_post').handler(
      { id: 'post-1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_social_post ──────────────────────────────────────────────────

describe('ghl_update_social_post', () => {
  it('calls PUT /social-media-posting/{locationId}/posts/{id} with required + optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_social_post').handler(
      {
        id: 'post-1',
        type: 'post',
        accountIds: ['acc-1'],
        userId: 'user1',
        summary: 'Hello world',
        status: 'scheduled',
        scheduleDate: '2026-09-01T00:00:00.000Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts/post-1`
    );
    expect(call.body).toEqual({
      type: 'post',
      accountIds: ['acc-1'],
      userId: 'user1',
      summary: 'Hello world',
      status: 'scheduled',
      scheduleDate: '2026-09-01T00:00:00.000Z',
    });
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_social_post').handler(
      { id: 'post-1', type: 'post', accountIds: ['acc-1'], userId: 'user1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_social_statistics ───────────────────────────────────────────────

describe('ghl_get_social_statistics', () => {
  it('calls POST /social-media-posting/statistics with locationId query and profileIds body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_social_statistics').handler(
      {
        profileIds: ['profile-1'],
        platforms: ['facebook', 'instagram'],
        currentRange: {
          startDate: '2026-03-01T00:00:00.000Z',
          endDate: '2026-03-31T23:59:59.999Z',
        },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/statistics');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body).toEqual({
      profileIds: ['profile-1'],
      platforms: ['facebook', 'instagram'],
      currentRange: {
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-03-31T23:59:59.999Z',
      },
    });
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_social_statistics').handler(
      { profileIds: ['profile-1'] },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

describe('socialPlannerPostsTools', () => {
  it('has 10 tools', () => {
    expect(socialPlannerPostsTools).toHaveLength(10);
  });
});
