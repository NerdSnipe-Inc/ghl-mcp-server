import { describe, it, expect } from 'vitest';
import { opportunityTools } from '../../src/tools/opportunities.js';
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
  const tool = opportunityTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_pipelines ─────────────────────────────────────────────────────────

describe('ghl_get_pipelines', () => {
  it('calls GET /opportunities/pipelines with locationId', async () => {
    const fetch = mockFetchSuccess({ pipelines: [] });
    await getTool('ghl_get_pipelines').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/opportunities/pipelines');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_pipelines').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_search_opportunities ──────────────────────────────────────────────────

describe('ghl_search_opportunities', () => {
  it('calls GET /opportunities/search with camelCase locationId', async () => {
    const fetch = mockFetchSuccess({ opportunities: [] });
    await getTool('ghl_search_opportunities').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/opportunities/search');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.location_id).toBeUndefined();
  });

  it('passes contactId, pipelineId, pipelineStageId, assignedTo, and status filters in camelCase', async () => {
    const fetch = mockFetchSuccess({ opportunities: [] });
    await getTool('ghl_search_opportunities').handler(
      {
        contactId: 'contact-abc',
        pipelineId: 'pipe-1',
        pipelineStageId: 'stage-1',
        assignedTo: 'user-1',
        status: 'open',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.contactId).toBe('contact-abc');
    expect(call.params.pipelineId).toBe('pipe-1');
    expect(call.params.pipelineStageId).toBe('stage-1');
    expect(call.params.assignedTo).toBe('user-1');
    expect(call.params.status).toBe('open');
    expect(call.params.contact_id).toBeUndefined();
    expect(call.params.pipeline_id).toBeUndefined();
    expect(call.params.pipeline_stage_id).toBeUndefined();
    expect(call.params.assigned_to).toBeUndefined();
  });
});

// ── ghl_get_opportunity ───────────────────────────────────────────────────────

describe('ghl_get_opportunity', () => {
  it('calls GET /opportunities/:id', async () => {
    const fetch = mockFetchSuccess({ opportunity: { id: 'opp-1' } });
    await getTool('ghl_get_opportunity').handler(
      { opportunityId: 'opp-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/opportunities/opp-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_create_opportunity ────────────────────────────────────────────────────

describe('ghl_create_opportunity', () => {
  it('calls POST /opportunities/ with required fields and locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_opportunity').handler(
      {
        pipelineId: 'pipe-1',
        pipelineStageId: 'stage-1',
        contactId: 'contact-abc',
        name: 'New Deal',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/opportunities/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.pipelineId).toBe('pipe-1');
    expect(call.body?.pipelineStageId).toBe('stage-1');
    expect(call.body?.contactId).toBe('contact-abc');
    expect(call.body?.name).toBe('New Deal');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('includes monetaryValue when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_opportunity').handler(
      {
        pipelineId: 'pipe-1',
        pipelineStageId: 'stage-1',
        contactId: 'contact-abc',
        name: 'Big Deal',
        monetaryValue: 5000,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.monetaryValue).toBe(5000);
  });

  it('sends customFields items as {id, fieldValue} per spec', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_opportunity').handler(
      {
        pipelineId: 'pipe-1',
        pipelineStageId: 'stage-1',
        contactId: 'contact-abc',
        name: 'New Deal',
        customFields: [{ id: 'cf-1', fieldValue: 'some value' }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.customFields).toEqual([{ id: 'cf-1', fieldValue: 'some value' }]);
  });
});

// ── ghl_update_opportunity ────────────────────────────────────────────────────

describe('ghl_update_opportunity', () => {
  it('calls PUT /opportunities/:id with update fields, strips opportunityId from body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_opportunity').handler(
      {
        opportunityId: 'opp-1',
        pipelineStageId: 'stage-2',
        monetaryValue: 7500,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/opportunities/opp-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.pipelineStageId).toBe('stage-2');
    expect(call.body?.monetaryValue).toBe(7500);
    expect(call.body?.opportunityId).toBeUndefined();
  });

  it('sends customFields items as {id, fieldValue} per spec', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_opportunity').handler(
      {
        opportunityId: 'opp-1',
        customFields: [{ id: 'cf-1', fieldValue: 'updated value' }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.customFields).toEqual([{ id: 'cf-1', fieldValue: 'updated value' }]);
  });
});

// ── ghl_update_opportunity_status ─────────────────────────────────────────────

describe('ghl_update_opportunity_status', () => {
  it('calls PUT /opportunities/:id/status', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_opportunity_status').handler(
      { opportunityId: 'opp-1', status: 'won' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/opportunities/opp-1/status');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.status).toBe('won');
  });

  it('supports all status values', async () => {
    for (const status of ['open', 'won', 'lost', 'abandoned']) {
      mockFetchSuccess(MOCK_DATA);
      const result = await getTool('ghl_update_opportunity_status').handler(
        { opportunityId: 'opp-1', status },
        TEST_CONFIG
      );
      expect(() => JSON.parse(result)).not.toThrow();
    }
  });

  it('includes optional lostReasonId when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_opportunity_status').handler(
      { opportunityId: 'opp-1', status: 'lost', lostReasonId: 'reason-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.lostReasonId).toBe('reason-1');
  });
});

// ── ghl_upsert_opportunity ────────────────────────────────────────────────────

describe('ghl_upsert_opportunity', () => {
  it('calls POST /opportunities/upsert with locationId and required followers fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_opportunity').handler(
      {
        pipelineId: 'pipe-1',
        pipelineStageId: 'stage-1',
        name: 'Upserted Deal',
        followers: ['contact-abc'],
        isRemoveAllFollowers: false,
        followersActionType: 'add',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/opportunities/upsert');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.followers).toEqual(['contact-abc']);
    expect(call.body?.isRemoveAllFollowers).toBe(false);
    expect(call.body?.followersActionType).toBe('add');
  });

  it('rejects missing required followers/isRemoveAllFollowers/followersActionType', () => {
    const schema = getTool('ghl_upsert_opportunity').inputSchema;
    const result = schema.safeParse({
      pipelineId: 'pipe-1',
      pipelineStageId: 'stage-1',
      name: 'Upserted Deal',
    });
    expect(result.success).toBe(false);
  });

  it('does not require contactId (not a real UpsertOpportunityDto field)', () => {
    const schema = getTool('ghl_upsert_opportunity').inputSchema;
    const result = schema.safeParse({
      pipelineId: 'pipe-1',
      pipelineStageId: 'stage-1',
      name: 'Upserted Deal',
      followers: ['contact-abc'],
      isRemoveAllFollowers: false,
      followersActionType: 'add',
    });
    expect(result.success).toBe(true);
  });
});

// ── ghl_delete_opportunity ────────────────────────────────────────────────────

describe('ghl_delete_opportunity', () => {
  it('calls DELETE /opportunities/:id', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_opportunity').handler(
      { opportunityId: 'opp-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/opportunities/opp-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_delete_opportunity').handler(
        { opportunityId: 'bad-id' },
        TEST_CONFIG
      ),
      404
    );
  });
});
