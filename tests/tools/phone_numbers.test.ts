import { describe, it, expect } from 'vitest';
import { phoneNumberTools } from '../../src/tools/phone_numbers.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = phoneNumberTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_phone_numbers ─────────────────────────────────────────────────────

describe('ghl_get_phone_numbers', () => {
  it('calls GET /phone-number/ with locationId', async () => {
    const fetch = mockFetchSuccess({ phoneNumbers: [] });
    await getTool('ghl_get_phone_numbers').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/phone-number/');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes limit and skip params', async () => {
    const fetch = mockFetchSuccess({ phoneNumbers: [] });
    await getTool('ghl_get_phone_numbers').handler(
      { limit: 10, skip: 5 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('5');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(
      await getTool('ghl_get_phone_numbers').handler({}, TEST_CONFIG),
      401
    );
  });
});

// ── ghl_search_available_phone_numbers ────────────────────────────────────────

describe('ghl_search_available_phone_numbers', () => {
  it('calls GET /phone-number/search with locationId', async () => {
    const fetch = mockFetchSuccess({ numbers: [] });
    await getTool('ghl_search_available_phone_numbers').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/phone-number/search');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes areaCode, countryCode, type, and limit params', async () => {
    const fetch = mockFetchSuccess({ numbers: [] });
    await getTool('ghl_search_available_phone_numbers').handler(
      { areaCode: '613', countryCode: 'CA', type: 'local', limit: 5 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.areaCode).toBe('613');
    expect(call.params.countryCode).toBe('CA');
    expect(call.params.type).toBe('local');
    expect(call.params.limit).toBe('5');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_search_available_phone_numbers').handler({}, TEST_CONFIG),
      500
    );
  });
});

// ── ghl_purchase_phone_number ─────────────────────────────────────────────────

describe('ghl_purchase_phone_number', () => {
  it('calls POST /phone-number/ with locationId and phoneNumber', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_purchase_phone_number').handler(
      { phoneNumber: '+16135550100' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/phone-number/');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.phoneNumber).toBe('+16135550100');
  });

  it('handles errors', async () => {
    mockFetchError(422, { message: 'Number unavailable' });
    expectError(
      await getTool('ghl_purchase_phone_number').handler(
        { phoneNumber: '+16135550100' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_release_phone_number ──────────────────────────────────────────────────

describe('ghl_release_phone_number', () => {
  it('calls DELETE /phone-number/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_release_phone_number').handler(
      { phoneNumberId: 'pn-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/phone-number/pn-1');
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Number not found' });
    expectError(
      await getTool('ghl_release_phone_number').handler(
        { phoneNumberId: 'bad' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_update_phone_number ───────────────────────────────────────────────────

describe('ghl_update_phone_number', () => {
  it('calls PUT /phone-number/:id with locationId and update data', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_phone_number').handler(
      { phoneNumberId: 'pn-1', assignedTo: 'user-123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/phone-number/pn-1');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.assignedTo).toBe('user-123');
    expect(call.body?.phoneNumberId).toBeUndefined();
  });

  it('passes call forwarding settings', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_phone_number').handler(
      {
        phoneNumberId: 'pn-1',
        callForwardingEnabled: true,
        callForwardingNumber: '+16135559999',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.callForwardingEnabled).toBe(true);
    expect(call.body?.callForwardingNumber).toBe('+16135559999');
  });

  it('handles errors', async () => {
    mockFetchError(422, { message: 'Invalid data' });
    expectError(
      await getTool('ghl_update_phone_number').handler(
        { phoneNumberId: 'pn-1' },
        TEST_CONFIG
      ),
      422
    );
  });
});
