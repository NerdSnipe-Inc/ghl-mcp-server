import { describe, it, expect } from 'vitest';
import { conversationTools } from '../../src/tools/conversations.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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

  it('accepts the full lastMessageType enum, not just a 5-value subset', async () => {
    for (const type of ['TYPE_RCS', 'TYPE_TIKTOK', 'TYPE_WEBCHAT', 'TYPE_GMB', 'TYPE_SMS_REACTION']) {
      const result = getTool('ghl_search_conversations').inputSchema.safeParse({
        lastMessageType: type,
      });
      expect(result.success, `expected ${type} to be valid`).toBe(true);
    }
  });

  it('passes through the missing spec query params', async () => {
    const fetch = mockFetchSuccess({ conversations: [] });
    await getTool('ghl_search_conversations').handler(
      {
        assignedTo: 'user-1,user-2',
        followers: 'user-3',
        mentions: 'user-4',
        sort: 'desc',
        sortBy: 'last_message_date',
        startAfterDate: 1600854,
        id: 'conv-1',
        lastMessageAction: 'manual',
        lastMessageDirection: 'inbound',
        sortScoreProfile: 'sp-1',
        scoreProfile: 'sp-2',
        scoreProfileMin: 0,
        scoreProfileMax: 100,
        startDate: 1640995200000,
        endDate: 1672531199000,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.assignedTo).toBe('user-1,user-2');
    expect(call.params.followers).toBe('user-3');
    expect(call.params.mentions).toBe('user-4');
    expect(call.params.sort).toBe('desc');
    expect(call.params.sortBy).toBe('last_message_date');
    expect(call.params.startAfterDate).toBe('1600854');
    expect(call.params.id).toBe('conv-1');
    expect(call.params.lastMessageAction).toBe('manual');
    expect(call.params.lastMessageDirection).toBe('inbound');
    expect(call.params.sortScoreProfile).toBe('sp-1');
    expect(call.params.scoreProfile).toBe('sp-2');
    expect(call.params.scoreProfileMin).toBe('0');
    expect(call.params.scoreProfileMax).toBe('100');
    expect(call.params.startDate).toBe('1640995200000');
    expect(call.params.endDate).toBe('1672531199000');
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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

  it('rejects invalid type values GMB and Call, accepts RCS and TIKTOK', async () => {
    for (const bad of ['GMB', 'Call']) {
      const result = getTool('ghl_send_message').inputSchema.safeParse({
        contactId: 'contact-abc',
        type: bad,
        message: 'Hi',
      });
      expect(result.success, `expected ${bad} to be invalid`).toBe(false);
    }
    for (const good of ['RCS', 'TIKTOK']) {
      const result = getTool('ghl_send_message').inputSchema.safeParse({
        contactId: 'contact-abc',
        type: good,
        message: 'Hi',
      });
      expect(result.success, `expected ${good} to be valid`).toBe(true);
    }
  });

  it('passes through missing spec fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_send_message').handler(
      {
        contactId: 'contact-abc',
        type: 'Email',
        message: 'Hi',
        appointmentId: 'appt-1',
        templateId: 'tmpl-1',
        threadId: 'thread-1',
        customSubtypeId: 'sub-1',
        emailReplyMode: 'reply_all',
        forward: { isForwarded: true, toEmail: 'forward@example.com' },
        toNumber: '+15551234567',
        usesNativeSchedulingAi: true,
        optimizationPeriod: '24h',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.appointmentId).toBe('appt-1');
    expect(call.body?.templateId).toBe('tmpl-1');
    expect(call.body?.threadId).toBe('thread-1');
    expect(call.body?.customSubtypeId).toBe('sub-1');
    expect(call.body?.emailReplyMode).toBe('reply_all');
    expect(call.body?.forward).toEqual({ isForwarded: true, toEmail: 'forward@example.com' });
    expect(call.body?.toNumber).toBe('+15551234567');
    expect(call.body?.usesNativeSchedulingAi).toBe(true);
    expect(call.body?.optimizationPeriod).toBe('24h');
  });

  it('does not accept fromName — it is not a real spec field', () => {
    const shape = getTool('ghl_send_message').inputSchema.shape as Record<string, unknown>;
    expect(shape.fromName).toBeUndefined();
  });
});

// ── ghl_send_email ────────────────────────────────────────────────────────────

describe('ghl_send_email', () => {
  it('calls POST /conversations/messages with type Email', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_send_email').handler(
      {
        contactId: 'contact-abc',
        subject: 'Hello',
        message: 'Email body',
        html: '<p>Email body</p>',
        emailFrom: 'sender@example.com',
        emailTo: 'jane@example.com',
        emailCc: ['cc@example.com'],
        emailBcc: ['bcc@example.com'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversations/messages');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.type).toBe('Email');
    expect(call.body?.contactId).toBe('contact-abc');
    expect(call.body?.subject).toBe('Hello');
    expect(call.body?.message).toBe('Email body');
    expect(call.body?.html).toBe('<p>Email body</p>');
    expect(call.body?.emailFrom).toBe('sender@example.com');
    expect(call.body?.emailTo).toBe('jane@example.com');
    expect(call.body?.emailCc).toEqual(['cc@example.com']);
    expect(call.body?.emailBcc).toEqual(['bcc@example.com']);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles send errors', async () => {
    mockFetchError(422, { message: 'Invalid contact' });
    expectError(
      await getTool('ghl_send_email').handler(
        { contactId: 'bad', subject: 'Hi', message: 'Body' },
        TEST_CONFIG
      ),
      422
    );
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.status).toBe('read');
  });

  it('rejects "unread" — not a valid spec status', () => {
    const result = getTool('ghl_update_message_status').inputSchema.safeParse({
      messageId: 'msg-1',
      status: 'unread',
    });
    expect(result.success).toBe(false);
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
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_add_inbound_message ───────────────────────────────────────────────────

describe('ghl_add_inbound_message', () => {
  it('calls POST /conversations/messages/inbound with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_add_inbound_message').handler(
      {
        type: 'SMS',
        message: 'Reply text',
        contactId: 'contact-abc',
        conversationId: 'conv-1',
        conversationProviderId: 'provider-1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversations/messages/inbound');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.type).toBe('SMS');
    expect(call.body?.message).toBe('Reply text');
    expect(call.body?.conversationId).toBe('conv-1');
    expect(call.body?.conversationProviderId).toBe('provider-1');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('requires conversationId and conversationProviderId per spec', () => {
    const missingConversationId = getTool('ghl_add_inbound_message').inputSchema.safeParse({
      type: 'SMS',
      message: 'Reply text',
      contactId: 'contact-abc',
      conversationProviderId: 'provider-1',
    });
    expect(missingConversationId.success).toBe(false);

    const missingProviderId = getTool('ghl_add_inbound_message').inputSchema.safeParse({
      type: 'SMS',
      message: 'Reply text',
      contactId: 'contact-abc',
      conversationId: 'conv-1',
    });
    expect(missingProviderId.success).toBe(false);
  });

  it('accepts the expanded type enum (GMB, WebChat, Live_Chat, etc.)', () => {
    for (const type of ['GMB', 'WebChat', 'Live_Chat', 'TIKTOK', 'FORM_SUBMISSION']) {
      const result = getTool('ghl_add_inbound_message').inputSchema.safeParse({
        type,
        message: 'Reply text',
        contactId: 'contact-abc',
        conversationId: 'conv-1',
        conversationProviderId: 'provider-1',
      });
      expect(result.success, `expected ${type} to be valid`).toBe(true);
    }
  });
});
