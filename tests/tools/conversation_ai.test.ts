import { describe, it, expect } from 'vitest';
import { conversationAiTools } from '../../src/tools/conversation_ai.js';
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
  const tool = conversationAiTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_conversation_ai_agent ───────────────────────────────────────

const CREATE_AGENT_ARGS = {
  name: 'Sales Bot',
  personality: 'Friendly and helpful',
  goal: 'Assist customers with inquiries.',
  instructions: 'Provide excellent customer service.',
};

describe('ghl_create_conversation_ai_agent', () => {
  it('calls POST /conversation-ai/agents with required fields and NO locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_conversation_ai_agent').handler(
      CREATE_AGENT_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversation-ai/agents');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.name).toBe('Sales Bot');
    expect(call.body.personality).toBe(CREATE_AGENT_ARGS.personality);
    expect(call.body.goal).toBe(CREATE_AGENT_ARGS.goal);
    expect(call.body.instructions).toBe(CREATE_AGENT_ARGS.instructions);
    expect(call.body.locationId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_conversation_ai_agent').handler(
      {
        ...CREATE_AGENT_ARGS,
        businessName: 'Tech Corp',
        mode: 'auto-pilot',
        channels: ['SMS', 'WhatsApp'],
        isPrimary: true,
        waitTime: 2,
        waitTimeUnit: 'seconds',
        autoPilotMaxMessages: 75,
        knowledgeBaseIds: ['kb1'],
        respondToImages: true,
        respondToAudio: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.businessName).toBe('Tech Corp');
    expect(call.body.mode).toBe('auto-pilot');
    expect(call.body.channels).toEqual(['SMS', 'WhatsApp']);
    expect(call.body.isPrimary).toBe(true);
    expect(call.body.waitTime).toBe(2);
    expect(call.body.waitTimeUnit).toBe('seconds');
    expect(call.body.autoPilotMaxMessages).toBe(75);
    expect(call.body.knowledgeBaseIds).toEqual(['kb1']);
    expect(call.body.respondToImages).toBe(true);
    expect(call.body.respondToAudio).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_conversation_ai_agent').handler(
      CREATE_AGENT_ARGS,
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_search_conversation_ai_agents ──────────────────────────────────────

describe('ghl_search_conversation_ai_agents', () => {
  it('calls GET /conversation-ai/agents/search with no locationId', async () => {
    const fetch = mockFetchSuccess({ agents: [] });
    const result = await getTool('ghl_search_conversation_ai_agents').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversation-ai/agents/search');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expectSuccess(result, { agents: [] });
  });

  it('passes optional startAfter, limit, query', async () => {
    const fetch = mockFetchSuccess({ agents: [] });
    await getTool('ghl_search_conversation_ai_agents').handler(
      { startAfter: 'agent123', limit: 10, query: 'booking' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.startAfter).toBe('agent123');
    expect(call.params.limit).toBe('10');
    expect(call.params.query).toBe('booking');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_search_conversation_ai_agents').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_conversation_ai_agent ──────────────────────────────────────────

describe('ghl_get_conversation_ai_agent', () => {
  it('calls GET /conversation-ai/agents/:agentId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_conversation_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_conversation_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_conversation_ai_agent ───────────────────────────────────────

describe('ghl_update_conversation_ai_agent', () => {
  it('calls PUT /conversation-ai/agents/:agentId with required autoPilotMaxMessages, no locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_conversation_ai_agent').handler(
      { agentId: 'agent1', autoPilotMaxMessages: 50 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.autoPilotMaxMessages).toBe(50);
    expect(call.body.agentId).toBeUndefined();
    expect(call.body.locationId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_conversation_ai_agent').handler(
      {
        agentId: 'agent1',
        autoPilotMaxMessages: 50,
        name: 'New Name',
        personality: 'Formal',
        goal: 'Close deals',
        instructions: 'Be direct',
        mode: 'suggestive',
        channels: ['FB'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.name).toBe('New Name');
    expect(call.body.personality).toBe('Formal');
    expect(call.body.goal).toBe('Close deals');
    expect(call.body.instructions).toBe('Be direct');
    expect(call.body.mode).toBe('suggestive');
    expect(call.body.channels).toEqual(['FB']);
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_update_conversation_ai_agent').handler(
      { agentId: 'agent1', autoPilotMaxMessages: 50 },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_delete_conversation_ai_agent ───────────────────────────────────────

describe('ghl_delete_conversation_ai_agent', () => {
  it('calls DELETE /conversation-ai/agents/:agentId', async () => {
    const fetch = mockFetchSuccess({ id: 'agent1' });
    const result = await getTool('ghl_delete_conversation_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { id: 'agent1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_conversation_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_attach_conversation_ai_action ──────────────────────────────────────

const ATTACH_ACTION_ARGS = {
  agentId: 'agent1',
  type: 'triggerWorkflow',
  name: 'Trigger a Workflow',
  details: { workflowId: 'workflow1' },
};

describe('ghl_attach_conversation_ai_action', () => {
  it('calls POST /conversation-ai/agents/:agentId/actions with type, name, details', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_attach_conversation_ai_action').handler(
      ATTACH_ACTION_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1/actions');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.type).toBe('triggerWorkflow');
    expect(call.body.name).toBe('Trigger a Workflow');
    expect(call.body.details).toEqual({ workflowId: 'workflow1' });
    expect(call.body.agentId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_attach_conversation_ai_action').handler(
      ATTACH_ACTION_ARGS,
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_list_conversation_ai_agent_actions ─────────────────────────────────

describe('ghl_list_conversation_ai_agent_actions', () => {
  it('calls GET /conversation-ai/agents/:agentId/actions/list', async () => {
    const fetch = mockFetchSuccess({ data: [] });
    const result = await getTool('ghl_list_conversation_ai_agent_actions').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1/actions/list');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { data: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_list_conversation_ai_agent_actions').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_conversation_ai_agent_action ───────────────────────────────────

describe('ghl_get_conversation_ai_agent_action', () => {
  it('calls GET /conversation-ai/agents/:agentId/actions/:actionId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_conversation_ai_agent_action').handler(
      { agentId: 'agent1', actionId: 'action1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1/actions/action1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_conversation_ai_agent_action').handler(
      { agentId: 'agent1', actionId: 'action1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_conversation_ai_agent_action ────────────────────────────────

const UPDATE_ACTION_ARGS = {
  agentId: 'agent1',
  actionId: 'action1',
  type: 'stopBot',
  name: 'Stop Bot',
  details: { enabled: true },
};

describe('ghl_update_conversation_ai_agent_action', () => {
  it('calls PUT /conversation-ai/agents/:agentId/actions/:actionId with type, name, details', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_conversation_ai_agent_action').handler(
      UPDATE_ACTION_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1/actions/action1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.type).toBe('stopBot');
    expect(call.body.name).toBe('Stop Bot');
    expect(call.body.details).toEqual({ enabled: true });
    expect(call.body.agentId).toBeUndefined();
    expect(call.body.actionId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_conversation_ai_agent_action').handler(
      UPDATE_ACTION_ARGS,
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_remove_conversation_ai_agent_action ────────────────────────────────

describe('ghl_remove_conversation_ai_agent_action', () => {
  it('calls DELETE /conversation-ai/agents/:agentId/actions/:actionId', async () => {
    const fetch = mockFetchSuccess({ id: 'action1' });
    const result = await getTool('ghl_remove_conversation_ai_agent_action').handler(
      { agentId: 'agent1', actionId: 'action1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1/actions/action1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { id: 'action1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_remove_conversation_ai_agent_action').handler(
      { agentId: 'agent1', actionId: 'action1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_conversation_ai_followup_settings ───────────────────────────

const FOLLOWUP_ARGS = {
  agentId: 'agent1',
  actionIds: ['action1', 'action2'],
  followupSettings: {
    dynamicChannelSwitching: true,
  },
};

describe('ghl_update_conversation_ai_followup_settings', () => {
  it('calls PATCH /conversation-ai/agents/:agentId/followup-settings with actionIds, followupSettings', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_conversation_ai_followup_settings').handler(
      FOLLOWUP_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/conversation-ai/agents/agent1/followup-settings');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.actionIds).toEqual(['action1', 'action2']);
    expect(call.body.followupSettings).toEqual({ dynamicChannelSwitching: true });
    expect(call.body.agentId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional followupSettings fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_conversation_ai_followup_settings').handler(
      {
        agentId: 'agent1',
        actionIds: ['action1'],
        followupSettings: {
          dynamicChannelSwitching: false,
          followUpHours: true,
          workingHours: [{ dayOfTheWeek: 1, intervals: [] }],
          timezoneToUse: 'contact',
        },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    const settings = call.body.followupSettings as Record<string, unknown>;
    expect(settings.followUpHours).toBe(true);
    expect(settings.workingHours).toEqual([{ dayOfTheWeek: 1, intervals: [] }]);
    expect(settings.timezoneToUse).toBe('contact');
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_conversation_ai_followup_settings').handler(
      FOLLOWUP_ARGS,
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_conversation_ai_generation ─────────────────────────────────────

describe('ghl_get_conversation_ai_generation', () => {
  it('calls GET /conversation-ai/generations with messageId, source', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_conversation_ai_generation').handler(
      { messageId: 'msg1', source: 'conversation' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/conversation-ai/generations');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.messageId).toBe('msg1');
    expect(call.params.source).toBe('conversation');
    expect(call.params.locationId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_conversation_ai_generation').handler(
      { messageId: 'msg1', source: 'conversation' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
