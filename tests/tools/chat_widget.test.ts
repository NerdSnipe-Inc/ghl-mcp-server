import { describe, it, expect } from 'vitest';
import { chatWidgetTools } from '../../src/tools/chat_widget.js';
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
  const tool = chatWidgetTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_chat_widget ──────────────────────────────────────────────────

describe('ghl_create_chat_widget', () => {
  it('calls POST /chat-widget/ with required fields and config.locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_chat_widget').handler(
      { version: 2, chatType: 'emailChat', name: 'Chat Widget 1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/chat-widget/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.version).toBe(2);
    expect(call.body.chatType).toBe('emailChat');
    expect(call.body.name).toBe('Chat Widget 1');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional deleted, default, and settings fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_chat_widget').handler(
      {
        version: 2,
        chatType: 'liveChat',
        name: 'Chat Widget 2',
        deleted: false,
        default: true,
        settings: { chatType: 'liveChat', chatIcon: 'messageChatCircle' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.deleted).toBe(false);
    expect(call.body.default).toBe(true);
    expect(call.body.settings).toEqual({ chatType: 'liveChat', chatIcon: 'messageChatCircle' });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad Request' });
    const result = await getTool('ghl_create_chat_widget').handler(
      { version: 2, chatType: 'emailChat', name: 'Chat Widget 1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_clone_chat_widget ────────────────────────────────────────────────────

describe('ghl_clone_chat_widget', () => {
  it('calls POST /chat-widget/clone with chatWidgetId and config.locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_clone_chat_widget').handler(
      { chatWidgetId: 'widget-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/chat-widget/clone');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.chatWidgetId).toBe('widget-1');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional name', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_clone_chat_widget').handler(
      { chatWidgetId: 'widget-1', name: 'Chat Widget 1 (copy)' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.name).toBe('Chat Widget 1 (copy)');
  });
});

// ── ghl_get_chat_widget ──────────────────────────────────────────────────────

describe('ghl_get_chat_widget', () => {
  it('calls GET /chat-widget/data/{locationId}/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_chat_widget').handler({ id: 'widget-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/chat-widget/data/${TEST_CONFIG.locationId}/widget-1`);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not Found' });
    const result = await getTool('ghl_get_chat_widget').handler({ id: 'missing' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_update_chat_widget (PUT) ─────────────────────────────────────────────

describe('ghl_update_chat_widget', () => {
  it('calls PUT /chat-widget/data/{locationId}/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_chat_widget').handler(
      { id: 'widget-1', name: 'Renamed Chat Widget' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(`/chat-widget/data/${TEST_CONFIG.locationId}/widget-1`);
    expect(call.body.name).toBe('Renamed Chat Widget');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes all optional fields (version, chatType, default, settings)', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_chat_widget').handler(
      {
        id: 'widget-1',
        version: 2,
        chatType: 'emailChat',
        name: 'Widget',
        default: true,
        settings: { chatType: 'emailChat' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.version).toBe(2);
    expect(call.body.chatType).toBe('emailChat');
    expect(call.body.default).toBe(true);
    expect(call.body.settings).toEqual({ chatType: 'emailChat' });
  });

  it('does not require any body field to be present', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_chat_widget').handler({ id: 'widget-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
  });
});

// ── ghl_patch_chat_widget (PATCH) ────────────────────────────────────────────

describe('ghl_patch_chat_widget', () => {
  it('calls PATCH /chat-widget/data/{locationId}/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_patch_chat_widget').handler(
      { id: 'widget-1', settings: { chatType: 'emailChat' } },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe(`/chat-widget/data/${TEST_CONFIG.locationId}/widget-1`);
    expect(call.body.settings).toEqual({ chatType: 'emailChat' });
    expectSuccess(result, MOCK_DATA);
  });

  it('accepts the same optional field set as PUT (version, chatType, name, default, settings)', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_patch_chat_widget').handler(
      { id: 'widget-1', version: 2, chatType: 'liveChat', name: 'Widget', default: false },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.version).toBe(2);
    expect(call.body.chatType).toBe('liveChat');
    expect(call.body.name).toBe('Widget');
    expect(call.body.default).toBe(false);
  });
});

// ── ghl_list_chat_widgets ────────────────────────────────────────────────────

describe('ghl_list_chat_widgets', () => {
  it('calls GET /chat-widget/list with locationId, offset, limit', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_list_chat_widgets').handler(
      { offset: 0, limit: 10 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/chat-widget/list');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.offset).toBe('0');
    expect(call.params.limit).toBe('10');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional filter params', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_list_chat_widgets').handler(
      {
        offset: 0,
        limit: 10,
        chatType: 'webChat',
        excludeChatType: 'voiceAiChat',
        voiceAiAgentId: 'agent-1',
        allInOneChatTypes: 'emailChat',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.chatType).toBe('webChat');
    expect(call.params.excludeChatType).toBe('voiceAiChat');
    expect(call.params.voiceAiAgentId).toBe('agent-1');
    expect(call.params.allInOneChatTypes).toBe('emailChat');
  });
});

// ── ghl_get_chat_widget_config ───────────────────────────────────────────────

describe('ghl_get_chat_widget_config', () => {
  it('calls GET /chat-widget/public/config/{id} via authenticated ghlRequest', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_chat_widget_config').handler(
      { id: 'widget-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/chat-widget/public/config/widget-1');
    expect(call.headers.Authorization).toBe(`Bearer ${TEST_CONFIG.token}`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional version query param', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_chat_widget_config').handler(
      { id: 'widget-1', version: '3' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.version).toBe('3');
  });
});

// ── ghl_delete_chat_widget ───────────────────────────────────────────────────

describe('ghl_delete_chat_widget', () => {
  it('calls DELETE /chat-widget/{locationId}/{id}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_chat_widget').handler(
      { id: 'widget-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/chat-widget/${TEST_CONFIG.locationId}/widget-1`);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(403, { message: 'Forbidden' });
    const result = await getTool('ghl_delete_chat_widget').handler(
      { id: 'widget-1' },
      TEST_CONFIG
    );
    expectError(result, 403);
  });
});

// ── Tool count ────────────────────────────────────────────────────────────────

describe('chatWidgetTools registry', () => {
  it('exports exactly 8 tools', () => {
    expect(chatWidgetTools).toHaveLength(8);
  });

  it('every tool name starts with ghl_', () => {
    chatWidgetTools.forEach((t) => expect(t.name.startsWith('ghl_')).toBe(true));
  });
});
