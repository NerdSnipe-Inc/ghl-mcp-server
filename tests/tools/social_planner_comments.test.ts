import { describe, it, expect } from 'vitest';
import { socialPlannerCommentsTools } from '../../src/tools/social_planner_comments.js';
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
  const tool = socialPlannerCommentsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_social_comment ───────────────────────────────────────────────

describe('ghl_create_social_comment', () => {
  it('calls POST /social-media-posting/comments/{platform} with required + optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_social_comment').handler(
      {
        platform: 'facebook',
        parentId: 'parent1',
        isParentThread: true,
        content: 'This is a comment',
        attachments: ['http://example.com/image.jpg'],
        mentions: ['user1', 'user2'],
        notifyAllGroupMembers: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/comments/facebook');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.parentId).toBe('parent1');
    expect(call.body.isParentThread).toBe(true);
    expect(call.body.content).toBe('This is a comment');
    expect(call.body.attachments).toEqual(['http://example.com/image.jpg']);
    expect(call.body.mentions).toEqual(['user1', 'user2']);
    expect(call.body.notifyAllGroupMembers).toBe(true);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_social_comment').handler(
      {
        platform: 'facebook',
        parentId: 'parent1',
        isParentThread: true,
        content: 'Comment',
      },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_list_social_comments ────────────────────────────────────────────────

describe('ghl_list_social_comments', () => {
  it('calls POST .../comments/{platform}/list with required + optional fields', async () => {
    const fetch = mockFetchSuccess({ comments: [] });
    const result = await getTool('ghl_list_social_comments').handler(
      {
        platform: 'facebook',
        originIds: ['origin1', 'origin2'],
        fromDate: '2026-08-01',
        toDate: '2026-08-31',
        sortBy: 'date',
        search: 'hello',
        skip: 0,
        limit: 20,
        parentId: 'parent1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/comments/facebook/list');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.originIds).toEqual(['origin1', 'origin2']);
    expect(call.body.fromDate).toBe('2026-08-01');
    expect(call.body.toDate).toBe('2026-08-31');
    expect(call.body.sortBy).toBe('date');
    expect(call.body.search).toBe('hello');
    expect(call.body.skip).toBe(0);
    expect(call.body.limit).toBe(20);
    expect(call.body.parentId).toBe('parent1');
    expectSuccess(result, { comments: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_list_social_comments').handler(
      { platform: 'facebook', originIds: ['origin1'] },
      TEST_CONFIG
    );
    expectError(result, 401);
  });
});

// ── ghl_like_social_comment ─────────────────────────────────────────────────

describe('ghl_like_social_comment', () => {
  it('calls POST .../comments/{platform}/{id}/like with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_like_social_comment').handler(
      {
        platform: 'facebook',
        id: 'comment1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/social-media-posting/comments/facebook/comment1/like');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_like_social_comment').handler(
      { platform: 'facebook', id: 'comment1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_unlike_social_comment ───────────────────────────────────────────────

describe('ghl_unlike_social_comment', () => {
  it('calls DELETE .../comments/{platform}/{id}/like with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_unlike_social_comment').handler(
      {
        platform: 'facebook',
        id: 'comment1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/social-media-posting/comments/facebook/comment1/like');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_unlike_social_comment').handler(
      { platform: 'facebook', id: 'comment1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
