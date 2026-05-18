import { describe, it, expect } from 'vitest';
import { funnelTools } from '../../src/tools/funnels.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = funnelTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_funnels ───────────────────────────────────────────────────────────

describe('ghl_get_funnels', () => {
  it('calls GET /funnels/funnel/list with locationId', async () => {
    const fetch = mockFetchSuccess({ funnels: [] });
    await getTool('ghl_get_funnels').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/funnels/funnel/list');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes limit, offset, and search params', async () => {
    const fetch = mockFetchSuccess({ funnels: [] });
    await getTool('ghl_get_funnels').handler(
      { limit: 10, offset: 5, search: 'landing' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('5');
    expect(call.params.search).toBe('landing');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_funnels').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_get_funnel_pages ──────────────────────────────────────────────────────

describe('ghl_get_funnel_pages', () => {
  it('calls GET /funnels/funnel/:id/pages with locationId', async () => {
    const fetch = mockFetchSuccess({ pages: [] });
    await getTool('ghl_get_funnel_pages').handler(
      { funnelId: 'funnel-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/funnels/funnel/funnel-1/pages');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes limit and offset params', async () => {
    const fetch = mockFetchSuccess({ pages: [] });
    await getTool('ghl_get_funnel_pages').handler(
      { funnelId: 'funnel-1', limit: 5, offset: 10 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('5');
    expect(call.params.offset).toBe('10');
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Funnel not found' });
    expectError(
      await getTool('ghl_get_funnel_pages').handler(
        { funnelId: 'bad' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_get_funnel_page_count ─────────────────────────────────────────────────

describe('ghl_get_funnel_page_count', () => {
  it('calls GET /funnels/funnel/:funnelId/pages/:pageId/count with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_funnel_page_count').handler(
      { funnelId: 'funnel-1', pageId: 'page-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/funnels/funnel/funnel-1/pages/page-1/count');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes date range filters', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_funnel_page_count').handler(
      {
        funnelId: 'funnel-1',
        pageId: 'page-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.startDate).toBe('2024-01-01');
    expect(call.params.endDate).toBe('2024-12-31');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_get_funnel_page_count').handler(
        { funnelId: 'f', pageId: 'p' },
        TEST_CONFIG
      ),
      500
    );
  });
});
