import { describe, it, expect } from 'vitest';
import { opportunityTools } from '../../src/tools/opportunities.js';
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
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_pipelines').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_search_opportunities ──────────────────────────────────────────────────

describe('ghl_search_opportunities', () => {
  it('calls GET /opportunities/search with location_id', async () => {
    const fetch = mockFetchSuccess({ opportunities: [] });
    await getTool('ghl_search_opportunities').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/opportunities/search');
    expect(call.params.location_id).toBe(TEST_CONFIG.locationId);
  });

  it('passes contactId, pipelineId, and status filters', async () => {
    const fetch = mockFetchSuccess({ opportunities: [] });
    await getTool('ghl_search_opportunities').handler(
      {
        contactId: 'contact-abc',
        pipelineId: 'pipe-1',
        status: 'open',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.contact_id).toBe('contact-abc');
    expect(call.params.pipeline_id).toBe('pipe-1');
    expect(call.params.status).toBe('open');
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
    expect(call.body?.pipelineStageId).toBe('stage-2');
    expect(call.body?.monetaryValue).toBe(7500);
    expect(call.body?.opportunityId).toBeUndefined();
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
});

// ── ghl_upsert_opportunity ────────────────────────────────────────────────────

describe('ghl_upsert_opportunity', () => {
  it('calls POST /opportunities/upsert with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_opportunity').handler(
      {
        pipelineId: 'pipe-1',
        pipelineStageId: 'stage-1',
        contactId: 'contact-abc',
        name: 'Upserted Deal',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/opportunities/upsert');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
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
