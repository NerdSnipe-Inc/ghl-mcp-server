import { describe, it, expect } from 'vitest';
import { socialTools, mediaTools, triggerLinkTools } from '../../src/tools/social.js';
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
  });

  it('handles errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_social_accounts').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_get_social_posts ──────────────────────────────────────────────────────

describe('ghl_get_social_posts', () => {
  it('calls POST /social-media-posting/:locationId/posts/list', async () => {
    const fetch = mockFetchSuccess({ posts: [] });
    await getTool('ghl_get_social_posts').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts/list`
    );
  });

  it('passes skip, limit, and status in the request body', async () => {
    const fetch = mockFetchSuccess({ posts: [] });
    await getTool('ghl_get_social_posts').handler(
      { skip: 10, limit: 5, status: 'scheduled' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.skip).toBe(10);
    expect(call.body?.limit).toBe(5);
    expect(call.body?.status).toBe('scheduled');
  });
});

// ── ghl_create_social_post ────────────────────────────────────────────────────

describe('ghl_create_social_post', () => {
  it('calls POST /social-media-posting/:locationId/posts with content', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_social_post').handler(
      {
        content: 'Check out our new offer!',
        accountIds: ['acc-1', 'acc-2'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/social-media-posting/${TEST_CONFIG.locationId}/posts`
    );
    expect(call.body?.content).toBe('Check out our new offer!');
    expect(call.body?.accountIds).toEqual(['acc-1', 'acc-2']);
  });

  it('includes scheduledAt when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_social_post').handler(
      {
        content: 'Scheduled post',
        accountIds: ['acc-1'],
        scheduledAt: '2024-12-20T09:00:00Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.scheduledAt).toBe('2024-12-20T09:00:00Z');
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
  });
});
