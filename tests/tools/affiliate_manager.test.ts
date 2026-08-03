import { describe, it, expect } from 'vitest';
import { affiliateManagerTools } from '../../src/tools/affiliate_manager.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectSuccess,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = affiliateManagerTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_affiliates ───────────────────────────────────────────────────────

describe('ghl_get_affiliates', () => {
  it('calls GET /affiliate-manager/:locationId/affiliates with filters', async () => {
    const fetch = mockFetchSuccess({ affiliates: [] });
    const result = await getTool('ghl_get_affiliates').handler(
      {
        query: 'John',
        active: true,
        campaignId: '63d376de11be1d26d38f7369',
        skip: 0,
        limit: 10,
        fromDate: '2023-10-01',
        toDate: '2023-10-31',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/affiliate-manager/${TEST_CONFIG.locationId}/affiliates`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.query).toBe('John');
    expect(call.params.active).toBe('true');
    expect(call.params.campaignId).toBe('63d376de11be1d26d38f7369');
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('10');
    expect(call.params.fromDate).toBe('2023-10-01');
    expect(call.params.toDate).toBe('2023-10-31');
    expectSuccess(result, { affiliates: [] });
  });

  it('works with no filters', async () => {
    const fetch = mockFetchSuccess({ affiliates: [] });
    const result = await getTool('ghl_get_affiliates').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/affiliate-manager/${TEST_CONFIG.locationId}/affiliates`);
    expectSuccess(result, { affiliates: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_affiliates').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_affiliate ────────────────────────────────────────────────────────

describe('ghl_get_affiliate', () => {
  it('calls GET /affiliate-manager/:locationId/affiliates/:affiliateId', async () => {
    const fetch = mockFetchSuccess({ affiliate: { id: 'aff1' } });
    const result = await getTool('ghl_get_affiliate').handler(
      { affiliateId: 'aff1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/affiliate-manager/${TEST_CONFIG.locationId}/affiliates/aff1`
    );
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { affiliate: { id: 'aff1' } });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_get_affiliate').handler(
      { affiliateId: 'aff1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_affiliate_commissions ────────────────────────────────────────────

describe('ghl_get_affiliate_commissions', () => {
  it('calls GET /affiliate-manager/:locationId/commissions with filters', async () => {
    const fetch = mockFetchSuccess({ commissions: [] });
    const result = await getTool('ghl_get_affiliate_commissions').handler(
      {
        campaignId: '6385d230f6d19db03eef6fb2',
        affiliateId: '6385d230f6d19db03eef6fb2',
        status: 'pending',
        query: 'affiliate@gmail.com',
        skip: 0,
        limit: 10,
        fromDate: '2023-10-01',
        toDate: '2023-10-31',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/affiliate-manager/${TEST_CONFIG.locationId}/commissions`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.campaignId).toBe('6385d230f6d19db03eef6fb2');
    expect(call.params.affiliateId).toBe('6385d230f6d19db03eef6fb2');
    expect(call.params.status).toBe('pending');
    expect(call.params.query).toBe('affiliate@gmail.com');
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('10');
    expect(call.params.fromDate).toBe('2023-10-01');
    expect(call.params.toDate).toBe('2023-10-31');
    expectSuccess(result, { commissions: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_affiliate_commissions').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_affiliate_payouts ────────────────────────────────────────────────

describe('ghl_get_affiliate_payouts', () => {
  it('calls GET /affiliate-manager/:locationId/payouts with filters', async () => {
    const fetch = mockFetchSuccess({ payouts: [] });
    const result = await getTool('ghl_get_affiliate_payouts').handler(
      {
        status: 'pending',
        query: 'john',
        affiliateId: '65df04201e428a0c5ebb6572',
        campaignId: '65df04201e428a0c5ebb6573',
        skip: 0,
        limit: 10,
        start: '2022-12-01T00:00:00.000Z',
        end: '2022-12-31T23:59:59.999Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/affiliate-manager/${TEST_CONFIG.locationId}/payouts`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.status).toBe('pending');
    expect(call.params.query).toBe('john');
    expect(call.params.affiliateId).toBe('65df04201e428a0c5ebb6572');
    expect(call.params.campaignId).toBe('65df04201e428a0c5ebb6573');
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('10');
    expect(call.params.start).toBe('2022-12-01T00:00:00.000Z');
    expect(call.params.end).toBe('2022-12-31T23:59:59.999Z');
    expectSuccess(result, { payouts: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_affiliate_payouts').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});
