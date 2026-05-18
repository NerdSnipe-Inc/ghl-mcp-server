import { describe, it, expect } from 'vitest';
import { conversationTools } from '../../src/tools/conversations.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = conversationTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_search_conversations ──────────────────────────────────────────────────

describe('ghl_search_conversations', () => {
  it('calls GET /conversations/search with locationId', async () => {
    const fetch = mockFetchSuccess({ conversations: [] });
    await getTool('ghl_search_conversations').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversations/search');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes contactId filter when provided', async () => {
    const fetch = mockFetchSuccess({ conversations: [] });
    await getTool('ghl_search_conversations').handler(
      { contactId: 'contact-abc', status: 'unread' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.contactId).toBe('contact-abc');
    expect(call.params.status).toBe('unread');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_search_conversations').handler({}, TEST_CONFIG),
      500
    );
  });
});

// ── ghl_get_conversation ──────────────────────────────────────────────────────

describe('ghl_get_conversation', () => {
  it('calls GET /conversations/:id', async () => {
    const fetch = mockFetchSuccess({ conversation: { id: 'conv-1' } });
    await getTool('ghl_get_conversation').handler(
      { conversationId: 'conv-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversations/conv-1');
  });
});

// ── ghl_create_conversation ───────────────────────────────────────────────────

describe('ghl_create_conversation', () => {
  it('calls POST /conversations/ with contactId and locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_conversation').handler(
      { contactId: 'contact-abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversations/');
    expect(call.body?.contactId).toBe('contact-abc');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });
});

// ── ghl_get_messages ──────────────────────────────────────────────────────────

describe('ghl_get_messages', () => {
  it('calls GET /conversations/:id/messages', async () => {
    const fetch = mockFetchSuccess({ messages: [] });
    await getTool('ghl_get_messages').handler(
      { conversationId: 'conv-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversations/conv-1/messages');
  });

  it('passes pagination params', async () => {
    const fetch = mockFetchSuccess({ messages: [] });
    await getTool('ghl_get_messages').handler(
      { conversationId: 'conv-1', limit: 50, lastMessageId: 'msg-xyz' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('50');
    expect(call.params.lastMessageId).toBe('msg-xyz');
  });
});

// ── ghl_send_message ──────────────────────────────────────────────────────────

describe('ghl_send_message', () => {
  it('calls POST /conversations/messages with type and message', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_send_message').handler(
      { contactId: 'contact-abc', type: 'SMS', message: 'Hello!' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversations/messages');
    expect(call.body?.contactId).toBe('contact-abc');
    expect(call.body?.type).toBe('SMS');
    expect(call.body?.message).toBe('Hello!');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('includes scheduledTimestamp when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const futureTs = Math.floor(Date.now() / 1000) + 3600;
    await getTool('ghl_send_message').handler(
      {
        contactId: 'contact-abc',
        type: 'Email',
        message: 'Hi',
        scheduledTimestamp: futureTs,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.scheduledTimestamp).toBe(futureTs);
  });

  it('handles send errors', async () => {
    mockFetchError(422, { message: 'Invalid contact' });
    expectError(
      await getTool('ghl_send_message').handler(
        { contactId: 'bad', type: 'SMS', message: 'Hi' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_send_email ────────────────────────────────────────────────────────────

describe('ghl_send_email', () => {
  it('calls POST /conversations/:id/messages/email', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_send_email').handler(
      {
        conversationId: 'conv-1',
        subject: 'Hello',
        body: 'Email body',
        to: ['jane@example.com'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversations/conv-1/messages/email');
    expect(call.body?.subject).toBe('Hello');
    expect(call.body?.to).toEqual(['jane@example.com']);
    expect(call.body?.conversationId).toBeUndefined();
  });
});

// ── ghl_update_message_status ─────────────────────────────────────────────────

describe('ghl_update_message_status', () => {
  it('calls PUT /conversations/messages/:id/status', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_message_status').handler(
      { messageId: 'msg-1', status: 'read' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/conversations/messages/msg-1/status');
    expect(call.body?.status).toBe('read');
  });
});

// ── ghl_cancel_scheduled_message ─────────────────────────────────────────────

describe('ghl_cancel_scheduled_message', () => {
  it('calls DELETE /conversations/messages/:id/schedule', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_cancel_scheduled_message').handler(
      { messageId: 'msg-scheduled-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/conversations/messages/msg-scheduled-1/schedule');
  });
});

// ── ghl_add_inbound_message ───────────────────────────────────────────────────

describe('ghl_add_inbound_message', () => {
  it('calls POST /conversations/messages/inbound with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_add_inbound_message').handler(
      { type: 'SMS', message: 'Reply text', contactId: 'contact-abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversations/messages/inbound');
    expect(call.body?.type).toBe('SMS');
    expect(call.body?.message).toBe('Reply text');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });
});
