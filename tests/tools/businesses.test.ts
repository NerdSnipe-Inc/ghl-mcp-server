import { describe, it, expect } from 'vitest';
import { businessesTools } from '../../src/tools/businesses.js';
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
  const tool = businessesTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_businesses ──────────────────────────────────────────────────────

describe('ghl_get_businesses', () => {
  it('calls GET /businesses/ with locationId, limit, skip', async () => {
    const fetch = mockFetchSuccess({ businesses: [] });
    const result = await getTool('ghl_get_businesses').handler(
      { limit: 10, skip: 0 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/businesses/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('0');
    expectSuccess(result, { businesses: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_businesses').handler({ limit: 10, skip: 0 }, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_business ────────────────────────────────────────────────────────

describe('ghl_get_business', () => {
  it('calls GET /businesses/:businessId with businessId', async () => {
    const fetch = mockFetchSuccess({ id: 'biz1', name: 'Acme Corp' });
    const result = await getTool('ghl_get_business').handler(
      { businessId: 'biz1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/businesses/biz1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { id: 'biz1', name: 'Acme Corp' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_business').handler({ businessId: 'biz1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_create_business ─────────────────────────────────────────────────────

const CREATE_BUSINESS_ARGS = {
  name: 'Acme Corp',
  phone: '555-0123',
  email: 'info@acme.com',
  website: 'https://acme.com',
  address: '123 Main St',
  city: 'Springfield',
  postalCode: '12345',
  state: 'IL',
  country: 'USA',
  description: 'A sample business',
};

describe('ghl_create_business', () => {
  it('calls POST /businesses/ with body including required fields (name, locationId) plus optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_business').handler(CREATE_BUSINESS_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/businesses/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.name).toBe('Acme Corp');
    expect(call.body.phone).toBe('555-0123');
    expect(call.body.email).toBe('info@acme.com');
    expect(call.body.website).toBe('https://acme.com');
    expect(call.body.address).toBe('123 Main St');
    expect(call.body.city).toBe('Springfield');
    expect(call.body.postalCode).toBe('12345');
    expect(call.body.state).toBe('IL');
    expect(call.body.country).toBe('USA');
    expect(call.body.description).toBe('A sample business');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes only required fields when optional fields are omitted', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_business').handler(
      { name: 'Minimal Biz' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.name).toBe('Minimal Biz');
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.phone).toBeUndefined();
    expect(call.body.email).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_business').handler(CREATE_BUSINESS_ARGS, TEST_CONFIG);
    expectError(result, 400);
  });
});

// ── ghl_update_business ─────────────────────────────────────────────────────

const UPDATE_BUSINESS_ARGS = {
  businessId: 'biz1',
  name: 'Acme Corp Updated',
  phone: '555-0999',
  email: 'support@acme.com',
  website: 'https://acme-new.com',
  address: '456 Oak Ave',
  city: 'Portland',
  postalCode: '54321',
  state: 'OR',
  country: 'USA',
  description: 'Updated business description',
};

describe('ghl_update_business', () => {
  it('calls PUT /businesses/:businessId with body including all provided fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_business').handler(UPDATE_BUSINESS_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/businesses/biz1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.name).toBe('Acme Corp Updated');
    expect(call.body.phone).toBe('555-0999');
    expect(call.body.email).toBe('support@acme.com');
    expect(call.body.website).toBe('https://acme-new.com');
    expect(call.body.address).toBe('456 Oak Ave');
    expect(call.body.city).toBe('Portland');
    expect(call.body.postalCode).toBe('54321');
    expect(call.body.state).toBe('OR');
    expect(call.body.country).toBe('USA');
    expect(call.body.description).toBe('Updated business description');
    expect(call.body.businessId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('passes only provided fields when some optional fields are omitted', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_business').handler(
      { businessId: 'biz1', name: 'New Name' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.name).toBe('New Name');
    expect(call.body.phone).toBeUndefined();
    expect(call.body.email).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_update_business').handler(UPDATE_BUSINESS_ARGS, TEST_CONFIG);
    expectError(result, 404);
  });
});

// ── ghl_delete_business ─────────────────────────────────────────────────────

describe('ghl_delete_business', () => {
  it('calls DELETE /businesses/:businessId', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_business').handler(
      { businessId: 'biz1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/businesses/biz1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_business').handler({ businessId: 'biz1' }, TEST_CONFIG);
    expectError(result, 404);
  });
});
