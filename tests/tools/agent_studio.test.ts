import { describe, it, expect } from 'vitest';
import { agentStudioTools } from '../../src/tools/agent_studio.js';
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
  const tool = agentStudioTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

describe('agentStudioTools manifest', () => {
  it('exposes exactly 8 tools', () => {
    expect(agentStudioTools).toHaveLength(8);
  });

  it('does not include the deprecated public-api variants', () => {
    const names = agentStudioTools.map((t) => t.name);
    expect(names).not.toContain('ghl_list_agent_studio_public_agents');
    expect(names).not.toContain('ghl_get_agent_studio_public_agent');
    expect(names).not.toContain('ghl_execute_agent_studio_public_agent');
  });
});

// ── ghl_create_agent_studio_agent ───────────────────────────────────────────

describe('ghl_create_agent_studio_agent', () => {
  it('calls POST /agent-studio/agent with required fields and config.locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_agent_studio_agent').handler(
      {
        status: 'active',
        version: { versionName: 'Version 1', nodes: [], edges: [] },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/agent-studio/agent');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.status).toBe('active');
    expect(call.body.version).toEqual({ versionName: 'Version 1', nodes: [], edges: [] });
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional name, description, agencyId, authorId, authorName, authorEmail', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_agent_studio_agent').handler(
      {
        name: 'Customer Support Agent',
        description: 'Handles support tickets',
        agencyId: 'agency-1',
        authorId: 'usr-1',
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        status: 'active',
        version: { versionName: 'v1' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.name).toBe('Customer Support Agent');
    expect(call.body.description).toBe('Handles support tickets');
    expect(call.body.agencyId).toBe('agency-1');
    expect(call.body.authorId).toBe('usr-1');
    expect(call.body.authorName).toBe('John Doe');
    expect(call.body.authorEmail).toBe('john@example.com');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable Entity' });
    const result = await getTool('ghl_create_agent_studio_agent').handler(
      { status: 'active', version: {} },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_list_agent_studio_agents ────────────────────────────────────────────

describe('ghl_list_agent_studio_agents', () => {
  it('calls GET /agent-studio/agent with locationId, limit, offset', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_list_agent_studio_agents').handler(
      { limit: 20, offset: 0 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/agent-studio/agent');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.limit).toBe('20');
    expect(call.params.offset).toBe('0');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional isPublished filter', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_list_agent_studio_agents').handler(
      { limit: 20, offset: 0, isPublished: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.isPublished).toBe('true');
  });
});

// ── ghl_get_agent_studio_agent ──────────────────────────────────────────────

describe('ghl_get_agent_studio_agent', () => {
  it('calls GET /agent-studio/agent/{agentId} with locationId query param', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_agent_studio_agent').handler(
      { agentId: 'agent-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/agent-studio/agent/agent-1');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Agent not found' });
    const result = await getTool('ghl_get_agent_studio_agent').handler(
      { agentId: 'missing' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_agent_studio_agent_metadata ──────────────────────────────────

describe('ghl_update_agent_studio_agent_metadata', () => {
  it('calls PATCH /agent-studio/agent/{agentId} with locationId body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_agent_studio_agent_metadata').handler(
      { agentId: 'agent-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/agent-studio/agent/agent-1');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional name, description, status', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_agent_studio_agent_metadata').handler(
      { agentId: 'agent-1', name: 'New Name', description: 'New Desc', status: 'inactive' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.name).toBe('New Name');
    expect(call.body.description).toBe('New Desc');
    expect(call.body.status).toBe('inactive');
  });

  it('does not touch nodes/edges/version fields (metadata only)', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_agent_studio_agent_metadata').handler(
      { agentId: 'agent-1', name: 'New Name' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.nodes).toBeUndefined();
    expect(call.body.edges).toBeUndefined();
  });
});

// ── ghl_delete_agent_studio_agent ───────────────────────────────────────────

describe('ghl_delete_agent_studio_agent', () => {
  it('calls DELETE /agent-studio/agent/{agentId} with locationId query param', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_delete_agent_studio_agent').handler(
      { agentId: 'agent-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/agent-studio/agent/agent-1');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });
});

// ── ghl_update_agent_studio_agent_version ───────────────────────────────────

describe('ghl_update_agent_studio_agent_version', () => {
  it('calls PATCH /agent-studio/agent/versions/{versionId} with locationId body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_agent_studio_agent_version').handler(
      { versionId: 'ver-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe('/agent-studio/agent/versions/ver-1');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional versionName, description, nodes, edges, variables, globalConfig, userId, userName', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const nodes = [{ nodeId: 'node_1', type: 'start' }];
    const edges = [{ startNode: 'node_1', endNode: 'node_2' }];
    const globalVariables = [{ key: 'apiKey', type: 'string', value: 'x' }];
    const inputVariables = [{ key: 'customerName', type: 'string' }];
    const runtimeVariables = [{ key: 'sessionId', type: 'string' }];
    const globalConfig = { globalPrompt: { currentPrompt: 'hi', history: [] } };
    await getTool('ghl_update_agent_studio_agent_version').handler(
      {
        versionId: 'ver-1',
        versionName: 'v2',
        description: 'Updated version',
        nodes,
        edges,
        globalVariables,
        inputVariables,
        runtimeVariables,
        globalConfig,
        userId: 'usr-1',
        userName: 'John Doe',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.versionName).toBe('v2');
    expect(call.body.description).toBe('Updated version');
    expect(call.body.nodes).toEqual(nodes);
    expect(call.body.edges).toEqual(edges);
    expect(call.body.globalVariables).toEqual(globalVariables);
    expect(call.body.inputVariables).toEqual(inputVariables);
    expect(call.body.runtimeVariables).toEqual(runtimeVariables);
    expect(call.body.globalConfig).toEqual(globalConfig);
    expect(call.body.userId).toBe('usr-1');
    expect(call.body.userName).toBe('John Doe');
  });
});

// ── ghl_publish_agent_studio_agent ──────────────────────────────────────────

describe('ghl_publish_agent_studio_agent', () => {
  it('calls POST /agent-studio/agent/versions/{versionId}/publish with locationId body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_publish_agent_studio_agent').handler(
      { versionId: 'ver-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/agent-studio/agent/versions/ver-1/publish');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional userId, userName, userEmail', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_publish_agent_studio_agent').handler(
      { versionId: 'ver-1', userId: 'usr-1', userName: 'John Doe', userEmail: 'john@example.com' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.userId).toBe('usr-1');
    expect(call.body.userName).toBe('John Doe');
    expect(call.body.userEmail).toBe('john@example.com');
  });
});

// ── ghl_execute_agent_studio_agent ──────────────────────────────────────────

describe('ghl_execute_agent_studio_agent', () => {
  it('calls POST /agent-studio/agent/{agentId}/execute with message and locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_execute_agent_studio_agent').handler(
      { agentId: 'agent-1', message: 'How can you help me?' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/agent-studio/agent/agent-1/execute');
    expect(call.body.message).toBe('How can you help me?');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional executionId, inputVariables, versionId, attachments, contactId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const attachments = [{ type: 'image', imageUrl: 'https://example.com/image.png' }];
    await getTool('ghl_execute_agent_studio_agent').handler(
      {
        agentId: 'agent-1',
        message: 'Continue',
        executionId: 'exec-1',
        inputVariables: { customerName: 'John' },
        versionId: 'ver-1',
        attachments,
        contactId: 'contact-1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.executionId).toBe('exec-1');
    expect(call.body.inputVariables).toEqual({ customerName: 'John' });
    expect(call.body.versionId).toBe('ver-1');
    expect(call.body.attachments).toEqual(attachments);
    expect(call.body.contactId).toBe('contact-1');
  });

  it('handles API errors', async () => {
    mockFetchError(403, { message: 'Forbidden' });
    const result = await getTool('ghl_execute_agent_studio_agent').handler(
      { agentId: 'agent-1', message: 'hi' },
      TEST_CONFIG
    );
    expectError(result, 403);
  });
});
