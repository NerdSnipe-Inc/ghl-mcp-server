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

  it('passes limit, offset, and name params', async () => {
    const fetch = mockFetchSuccess({ funnels: [] });
    await getTool('ghl_get_funnels').handler(
      { limit: 10, offset: 5, name: 'landing' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('5');
    expect(call.params.name).toBe('landing');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_funnels').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_get_funnel_pages ──────────────────────────────────────────────────────

describe('ghl_get_funnel_pages', () => {
  it('calls GET /funnels/page with funnelId as query param', async () => {
    const fetch = mockFetchSuccess({ pages: [] });
    await getTool('ghl_get_funnel_pages').handler(
      { funnelId: 'funnel-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/funnels/page');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.funnelId).toBe('funnel-1');
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
  it('calls GET /funnels/page/count with funnelId as query param', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_funnel_page_count').handler(
      { funnelId: 'funnel-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/funnels/page/count');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.funnelId).toBe('funnel-1');
  });

  it('passes optional name filter', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_funnel_page_count').handler(
      { funnelId: 'funnel-1', name: 'checkout' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.name).toBe('checkout');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_get_funnel_page_count').handler(
        { funnelId: 'f' },
        TEST_CONFIG
      ),
      500
    );
  });
});
