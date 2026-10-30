import { describe, it, expect } from 'vitest';
import { projectCommentTools } from '../../src/tools/project_comments.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { GHL_VERSION_V3 } from '../../src/client.js';

const getTool = (name: string) => {
  const tool = projectCommentTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_task_comments ─────────────────────────────────────────────────────

describe('ghl_get_task_comments', () => {
  it('calls GET /projects/tasks/:taskId/comments without locationId', async () => {
    const fetch = mockFetchSuccess({ comments: [] });
    await getTool('ghl_get_task_comments').handler({ taskId: 'task_1', skip: 50, limit: 25 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/projects/tasks/task_1/comments');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.params.skip).toBe('50');
    expect(call.params.limit).toBe('25');
  });

  it('requires taskId; skip >= 0; limit bounded 1-100', () => {
    const schema = getTool('ghl_get_task_comments').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(true);
    expect(schema.safeParse({ taskId: 'task_1', skip: -1 }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', skip: 0 }).success).toBe(true);
    expect(schema.safeParse({ taskId: 'task_1', limit: 0 }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', limit: 101 }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', limit: 100 }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Task not found' });
    expectError(await getTool('ghl_get_task_comments').handler({ taskId: 'missing' }, TEST_CONFIG), 404);
  });
});

// ── ghl_create_task_comment ───────────────────────────────────────────────────

describe('ghl_create_task_comment', () => {
  it('calls POST /projects/tasks/:taskId/comments without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'comment_1' });
    await getTool('ghl_create_task_comment').handler(
      {
        taskId: 'task_1',
        body: 'Looks good',
        parentCommentId: 'comment_0',
        mentionedUserIds: ['user_1'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/projects/tasks/task_1/comments');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({
      body: 'Looks good',
      parentCommentId: 'comment_0',
      mentionedUserIds: ['user_1'],
    });
  });

  it('succeeds with only taskId and body', () => {
    const schema = getTool('ghl_create_task_comment').inputSchema;
    expect(schema.safeParse({ taskId: 'task_1', body: 'Hi' }).success).toBe(true);
  });

  it('requires taskId and body; body max 32000 chars; parentCommentId nullable', () => {
    const schema = getTool('ghl_create_task_comment').inputSchema;
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(false);
    expect(schema.safeParse({ body: 'Hi' }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', body: 'x'.repeat(32000) }).success).toBe(true);
    expect(schema.safeParse({ taskId: 'task_1', body: 'x'.repeat(32001) }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', body: 'Hi', parentCommentId: null }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid body' });
    expectError(
      await getTool('ghl_create_task_comment').handler({ taskId: 'task_1', body: 'Hi' }, TEST_CONFIG),
      422
    );
  });
});

// ── ghl_update_task_comment ───────────────────────────────────────────────────

describe('ghl_update_task_comment', () => {
  it('calls PATCH /projects/tasks/:taskId/comments/:commentId without locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'comment_1' });
    await getTool('ghl_update_task_comment').handler(
      { taskId: 'task_1', commentId: 'comment_1', body: 'Edited', mentionedUserIds: ['user_2'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/projects/tasks/task_1/comments/comment_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body).toEqual({ body: 'Edited', mentionedUserIds: ['user_2'] });
  });

  it('requires taskId, commentId and body; body max 32000 chars', () => {
    const schema = getTool('ghl_update_task_comment').inputSchema;
    expect(schema.safeParse({ taskId: 'task_1', commentId: 'comment_1' }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', body: 'Hi' }).success).toBe(false);
    expect(schema.safeParse({ commentId: 'comment_1', body: 'Hi' }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', commentId: 'comment_1', body: 'Hi' }).success).toBe(true);
    expect(
      schema.safeParse({ taskId: 'task_1', commentId: 'comment_1', body: 'x'.repeat(32001) }).success
    ).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Comment not found' });
    expectError(
      await getTool('ghl_update_task_comment').handler(
        { taskId: 'task_1', commentId: 'missing', body: 'Hi' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_delete_task_comment ───────────────────────────────────────────────────

describe('ghl_delete_task_comment', () => {
  it('calls DELETE /projects/tasks/:taskId/comments/:commentId without locationId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_task_comment').handler({ taskId: 'task_1', commentId: 'comment_1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/projects/tasks/task_1/comments/comment_1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
  });

  it('requires taskId and commentId', () => {
    const schema = getTool('ghl_delete_task_comment').inputSchema;
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1' }).success).toBe(false);
    expect(schema.safeParse({ taskId: 'task_1', commentId: 'comment_1' }).success).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Comment not found' });
    expectError(
      await getTool('ghl_delete_task_comment').handler({ taskId: 'task_1', commentId: 'missing' }, TEST_CONFIG),
      404
    );
  });
});
