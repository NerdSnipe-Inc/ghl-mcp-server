import { describe, it, expect } from 'vitest';
import { voiceAiTools } from '../../src/tools/voice_ai.js';
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
  const tool = voiceAiTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_voice_ai_agent ───────────────────────────────────────────────

describe('ghl_create_voice_ai_agent', () => {
  it('calls POST /voice-ai/agents with config.locationId only', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_voice_ai_agent').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/voice-ai/agents');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional configuration fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_voice_ai_agent').handler(
      {
        agentName: 'Support Agent',
        businessName: 'Acme Corp',
        welcomeMessage: 'Hello! Thanks for calling.',
        agentPrompt: 'Be polite and helpful.',
        voiceId: 'voice-1',
        language: 'en-US',
        patienceLevel: 'high',
        maxCallDuration: 600,
        sendUserIdleReminders: true,
        reminderAfterIdleTimeSeconds: 5,
        inboundNumber: '+1234567890',
        numberPoolId: 'pool-1',
        callEndWorkflowIds: ['wf1', 'wf2'],
        sendPostCallNotificationTo: {
          admins: true,
          allUsers: false,
          contactAssignedUser: false,
          specificUsers: ['user1'],
          customEmails: ['a@b.com'],
        },
        agentWorkingHours: [{ dayOfTheWeek: 1, intervals: [{ startHour: 9, startMinute: 0, endHour: 17, endMinute: 30 }] }],
        timezone: 'America/New_York',
        isAgentAsBackupDisabled: true,
        translation: { enabled: true, language: 'es' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.agentName).toBe('Support Agent');
    expect(call.body.businessName).toBe('Acme Corp');
    expect(call.body.welcomeMessage).toBe('Hello! Thanks for calling.');
    expect(call.body.agentPrompt).toBe('Be polite and helpful.');
    expect(call.body.voiceId).toBe('voice-1');
    expect(call.body.language).toBe('en-US');
    expect(call.body.patienceLevel).toBe('high');
    expect(call.body.maxCallDuration).toBe(600);
    expect(call.body.sendUserIdleReminders).toBe(true);
    expect(call.body.reminderAfterIdleTimeSeconds).toBe(5);
    expect(call.body.inboundNumber).toBe('+1234567890');
    expect(call.body.numberPoolId).toBe('pool-1');
    expect(call.body.callEndWorkflowIds).toEqual(['wf1', 'wf2']);
    expect(call.body.sendPostCallNotificationTo).toEqual({
      admins: true,
      allUsers: false,
      contactAssignedUser: false,
      specificUsers: ['user1'],
      customEmails: ['a@b.com'],
    });
    expect(call.body.agentWorkingHours).toEqual([
      { dayOfTheWeek: 1, intervals: [{ startHour: 9, startMinute: 0, endHour: 17, endMinute: 30 }] },
    ]);
    expect(call.body.timezone).toBe('America/New_York');
    expect(call.body.isAgentAsBackupDisabled).toBe(true);
    expect(call.body.translation).toEqual({ enabled: true, language: 'es' });
  });

  it('rejects incomplete interval shapes and out-of-range dayOfTheWeek', () => {
    const schema = getTool('ghl_create_voice_ai_agent').inputSchema;
    expect(
      schema.safeParse({
        agentWorkingHours: [{ dayOfTheWeek: 1, intervals: [{ startHour: 9 }] }],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        agentWorkingHours: [{ dayOfTheWeek: 8, intervals: [] }],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        agentWorkingHours: [
          { dayOfTheWeek: 1, intervals: [{ startHour: 9, startMinute: 0, endHour: 17, endMinute: 30 }] },
        ],
      }).success
    ).toBe(true);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_voice_ai_agent').handler({}, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_get_voice_ai_agents ──────────────────────────────────────────────────

describe('ghl_get_voice_ai_agents', () => {
  it('calls GET /voice-ai/agents with config.locationId', async () => {
    const fetch = mockFetchSuccess({ agents: [] });
    const result = await getTool('ghl_get_voice_ai_agents').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/voice-ai/agents');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { agents: [] });
  });

  it('passes optional page, pageSize, query', async () => {
    const fetch = mockFetchSuccess({ agents: [] });
    await getTool('ghl_get_voice_ai_agents').handler(
      { page: 2, pageSize: 20, query: 'support' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.page).toBe('2');
    expect(call.params.pageSize).toBe('20');
    expect(call.params.query).toBe('support');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_voice_ai_agents').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_update_voice_ai_agent ────────────────────────────────────────────────

describe('ghl_update_voice_ai_agent', () => {
  it('calls PATCH /voice-ai/agents/:agentId with config.locationId in query, no locationId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_voice_ai_agent').handler(
      { agentId: 'agent1', agentName: 'New Name' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/voice-ai/agents/agent1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.agentName).toBe('New Name');
    expect(call.body.agentId).toBeUndefined();
    expect(call.body.locationId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_voice_ai_agent').handler(
      { agentId: 'agent1', voiceId: 'voice-2', maxCallDuration: 400, patienceLevel: 'medium' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.voiceId).toBe('voice-2');
    expect(call.body.maxCallDuration).toBe(400);
    expect(call.body.patienceLevel).toBe('medium');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_update_voice_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_voice_ai_agent ───────────────────────────────────────────────────

describe('ghl_get_voice_ai_agent', () => {
  it('calls GET /voice-ai/agents/:agentId with config.locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_voice_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/voice-ai/agents/agent1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_voice_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_voice_ai_agent ────────────────────────────────────────────────

describe('ghl_delete_voice_ai_agent', () => {
  it('calls DELETE /voice-ai/agents/:agentId with config.locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'agent1' });
    const result = await getTool('ghl_delete_voice_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/voice-ai/agents/agent1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { id: 'agent1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_voice_ai_agent').handler(
      { agentId: 'agent1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_create_voice_ai_action ───────────────────────────────────────────────

const CREATE_ACTION_ARGS = {
  agentId: 'agent1',
  actionType: 'CALL_TRANSFER',
  name: 'Transfer to Manager',
  actionParameters: { transferToType: 'number', transferToValue: '+12345678901' },
};

describe('ghl_create_voice_ai_action', () => {
  it('calls POST /voice-ai/actions with agentId, config.locationId, actionType, name, actionParameters', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_voice_ai_action').handler(
      CREATE_ACTION_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/voice-ai/actions');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.agentId).toBe('agent1');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.actionType).toBe('CALL_TRANSFER');
    expect(call.body.name).toBe('Transfer to Manager');
    expect(call.body.actionParameters).toEqual({
      transferToType: 'number',
      transferToValue: '+12345678901',
    });
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_voice_ai_action').handler(
      CREATE_ACTION_ARGS,
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_update_voice_ai_action ───────────────────────────────────────────────

const UPDATE_ACTION_ARGS = {
  actionId: 'action1',
  agentId: 'agent1',
  actionType: 'SMS',
  name: 'Send confirmation SMS',
  actionParameters: { messageBody: 'Your appointment is confirmed.' },
};

describe('ghl_update_voice_ai_action', () => {
  it('calls PUT /voice-ai/actions/:actionId with full required set, no actionId in body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_voice_ai_action').handler(
      UPDATE_ACTION_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/voice-ai/actions/action1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.agentId).toBe('agent1');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.actionType).toBe('SMS');
    expect(call.body.name).toBe('Send confirmation SMS');
    expect(call.body.actionParameters).toEqual({ messageBody: 'Your appointment is confirmed.' });
    expect(call.body.actionId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_voice_ai_action').handler(
      UPDATE_ACTION_ARGS,
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_voice_ai_action ──────────────────────────────────────────────────

describe('ghl_get_voice_ai_action', () => {
  it('calls GET /voice-ai/actions/:actionId with config.locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_voice_ai_action').handler(
      { actionId: 'action1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/voice-ai/actions/action1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_voice_ai_action').handler(
      { actionId: 'action1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_voice_ai_action ───────────────────────────────────────────────

describe('ghl_delete_voice_ai_action', () => {
  it('calls DELETE /voice-ai/actions/:actionId with config.locationId and required agentId query', async () => {
    const fetch = mockFetchSuccess({ id: 'action1' });
    const result = await getTool('ghl_delete_voice_ai_action').handler(
      { actionId: 'action1', agentId: 'agent1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/voice-ai/actions/action1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.agentId).toBe('agent1');
    expectSuccess(result, { id: 'action1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_voice_ai_action').handler(
      { actionId: 'action1', agentId: 'agent1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_voice_ai_call_logs ───────────────────────────────────────────────

describe('ghl_get_voice_ai_call_logs', () => {
  it('calls GET /voice-ai/dashboard/call-logs with config.locationId', async () => {
    const fetch = mockFetchSuccess({ logs: [] });
    const result = await getTool('ghl_get_voice_ai_call_logs').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/voice-ai/dashboard/call-logs');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { logs: [] });
  });

  it('passes all optional filters', async () => {
    const fetch = mockFetchSuccess({ logs: [] });
    await getTool('ghl_get_voice_ai_call_logs').handler(
      {
        agentId: 'agent1',
        contactId: 'contact1',
        callType: 'LIVE',
        startDate: 1679308800000,
        endDate: 1679395199000,
        actionType: 'SMS,CALL_TRANSFER',
        sortBy: 'duration',
        sort: 'descend',
        page: 2,
        pageSize: 25,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.agentId).toBe('agent1');
    expect(call.params.contactId).toBe('contact1');
    expect(call.params.callType).toBe('LIVE');
    expect(call.params.startDate).toBe('1679308800000');
    expect(call.params.endDate).toBe('1679395199000');
    expect(call.params.actionType).toBe('SMS,CALL_TRANSFER');
    expect(call.params.sortBy).toBe('duration');
    expect(call.params.sort).toBe('descend');
    expect(call.params.page).toBe('2');
    expect(call.params.pageSize).toBe('25');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_voice_ai_call_logs').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_voice_ai_call_log ────────────────────────────────────────────────

describe('ghl_get_voice_ai_call_log', () => {
  it('calls GET /voice-ai/dashboard/call-logs/:callId with config.locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_voice_ai_call_log').handler(
      { callId: 'call1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/voice-ai/dashboard/call-logs/call1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_voice_ai_call_log').handler(
      { callId: 'call1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
