import { describe, it, expect } from 'vitest';
import { socialTools, mediaTools, triggerLinkTools } from '../../src/tools/social.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const allSocialTools = [...socialTools, ...mediaTools, ...triggerLinkTools];

const getTool = (name: string) => {
  const tool = allSocialTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_social_accounts ───────────────────────────────────────────────────

describe('ghl_get_social_accounts', () => {
  it('calls GET /social-media-posting/:locationId/accounts', async () => {
    const fetch = mockFetchSuccess({ accounts: [] });
    await getTool('ghl_get_social_accounts').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/accounts`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('handles errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_social_accounts').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_get_social_posts ──────────────────────────────────────────────────────

describe('ghl_get_social_posts', () => {
  const REQUIRED_ARGS = {
    fromDate: '2024-01-01T00:00:00Z',
    toDate: '2024-02-01T00:00:00Z',
    includeUsers: true,
  };

  it('calls POST /social-media-posting/:locationId/posts/list', async () => {
    const fetch = mockFetchSuccess({ posts: [] });
    await getTool('ghl_get_social_posts').handler(REQUIRED_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts/list`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('passes skip, limit, type, fromDate, toDate, and includeUsers in the request body', async () => {
    const fetch = mockFetchSuccess({ posts: [] });
    await getTool('ghl_get_social_posts').handler(
      { skip: 10, limit: 5, type: 'scheduled', ...REQUIRED_ARGS },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.skip).toBe(10);
    expect(call.body?.limit).toBe(5);
    expect(call.body?.type).toBe('scheduled');
    expect(call.body?.fromDate).toBe(REQUIRED_ARGS.fromDate);
    expect(call.body?.toDate).toBe(REQUIRED_ARGS.toDate);
    expect(call.body?.includeUsers).toBe(true);
  });

  it('joins accounts array into a comma-separated string and passes postType', async () => {
    const fetch = mockFetchSuccess({ posts: [] });
    await getTool('ghl_get_social_posts').handler(
      { accounts: ['acc-1', 'acc-2'], postType: 'reel', ...REQUIRED_ARGS },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.accounts).toBe('acc-1,acc-2');
    expect(call.body?.postType).toBe('reel');
  });

  it('rejects missing required fromDate/toDate/includeUsers', () => {
    const schema = getTool('ghl_get_social_posts').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse(REQUIRED_ARGS).success).toBe(true);
  });

  it('rejects an old-style status value that is not a real `type` enum member', () => {
    const schema = getTool('ghl_get_social_posts').inputSchema;
    const result = schema.safeParse({ ...REQUIRED_ARGS, type: 'published_only' });
    expect(result.success).toBe(false);
  });
});

// ── ghl_create_social_post ────────────────────────────────────────────────────

describe('ghl_create_social_post', () => {
  const REQUIRED_ARGS = {
    type: 'post' as const,
    accountIds: ['acc-1', 'acc-2'],
    userId: 'user-1',
  };

  it('calls POST /social-media-posting/:locationId/posts with summary', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_social_post').handler(
      {
        summary: 'Check out our new offer!',
        ...REQUIRED_ARGS,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts`
    );
    expect(call.body?.summary).toBe('Check out our new offer!');
    expect(call.body?.accountIds).toEqual(['acc-1', 'acc-2']);
    expect(call.body?.type).toBe('post');
    expect(call.body?.userId).toBe('user-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('includes scheduleDate and media objects when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_social_post').handler(
      {
        ...REQUIRED_ARGS,
        summary: 'Scheduled post',
        scheduleDate: '2024-12-20T09:00:00Z',
        media: [{ url: 'https://example.com/a.jpg', type: 'image/jpeg' }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.scheduleDate).toBe('2024-12-20T09:00:00Z');
    expect(call.body?.media).toEqual([{ url: 'https://example.com/a.jpg', type: 'image/jpeg' }]);
  });

  it('rejects missing required type/accountIds/userId', () => {
    const schema = getTool('ghl_create_social_post').inputSchema;
    expect(schema.safeParse({ summary: 'no required fields' }).success).toBe(false);
    expect(schema.safeParse(REQUIRED_ARGS).success).toBe(true);
  });

  it('rejects a bare media URL string array (old shape)', () => {
    const schema = getTool('ghl_create_social_post').inputSchema;
    const result = schema.safeParse({
      ...REQUIRED_ARGS,
      media: ['https://example.com/a.jpg'],
    });
    expect(result.success).toBe(false);
  });
});

// ── ghl_delete_social_post ────────────────────────────────────────────────────

describe('ghl_delete_social_post', () => {
  it('calls DELETE /social-media-posting/:locationId/posts/:postId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_social_post').handler({ postId: 'post-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts/post-1`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_get_media_files ───────────────────────────────────────────────────────

describe('ghl_get_media_files', () => {
  it('calls GET /medias/files with locationId', async () => {
    const fetch = mockFetchSuccess({ files: [] });
    await getTool('ghl_get_media_files').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/medias/files');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('passes type filter when provided', async () => {
    const fetch = mockFetchSuccess({ files: [] });
    await getTool('ghl_get_media_files').handler({ type: 'image' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.type).toBe('image');
  });
});

// ── ghl_delete_media_file ─────────────────────────────────────────────────────

describe('ghl_delete_media_file', () => {
  it('calls DELETE /medias/:id with altType and altId query params', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_media_file').handler({ fileId: 'file-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/medias/file-1');
    expect(call.params.altType).toBe('location');
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'File not found' });
    expectError(
      await getTool('ghl_delete_media_file').handler({ fileId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_get_trigger_links ─────────────────────────────────────────────────────

describe('ghl_get_trigger_links', () => {
  it('calls GET /links/ with locationId', async () => {
    const fetch = mockFetchSuccess({ links: [] });
    await getTool('ghl_get_trigger_links').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/links/');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_create_trigger_link ───────────────────────────────────────────────────

describe('ghl_create_trigger_link', () => {
  it('calls POST /links/ with name, redirectTo, and locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_trigger_link').handler(
      { name: 'Download Guide', redirectTo: 'https://example.com/guide' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/links/');
    expect(call.body?.name).toBe('Download Guide');
    expect(call.body?.redirectTo).toBe('https://example.com/guide');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_delete_trigger_link ───────────────────────────────────────────────────

describe('ghl_delete_trigger_link', () => {
  it('calls DELETE /links/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_trigger_link').handler({ linkId: 'link-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/links/link-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});
