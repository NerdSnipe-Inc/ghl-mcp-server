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
  it('calls GET /phone-system/numbers/location/:locationId with no extra params', async () => {
    const fetch = mockFetchSuccess({ phoneNumbers: [] });
    await getTool('ghl_get_phone_numbers').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/phone-system/numbers/location/${TEST_CONFIG.locationId}`
    );
  });

  it('passes pageSize, page, and searchFilter params', async () => {
    const fetch = mockFetchSuccess({ phoneNumbers: [] });
    await getTool('ghl_get_phone_numbers').handler(
      { pageSize: 10, page: 2, searchFilter: '613' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.pageSize).toBe('10');
    expect(call.params.page).toBe('2');
    expect(call.params.searchFilter).toBe('613');
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
  it('calls GET /phone-system/numbers/location/:locationId/available with countryCode', async () => {
    const fetch = mockFetchSuccess({ numbers: [] });
    await getTool('ghl_search_available_phone_numbers').handler(
      { countryCode: 'US' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/phone-system/numbers/location/${TEST_CONFIG.locationId}/available`
    );
    expect(call.params.countryCode).toBe('US');
  });

  it('passes optional params: numberTypes, firstPart, smsEnabled', async () => {
    const fetch = mockFetchSuccess({ numbers: [] });
    await getTool('ghl_search_available_phone_numbers').handler(
      { countryCode: 'CA', numberTypes: 'local', firstPart: '613', smsEnabled: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.countryCode).toBe('CA');
    expect(call.params.numberTypes).toBe('local');
    expect(call.params.firstPart).toBe('613');
    expect(call.params.smsEnabled).toBe('true');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_search_available_phone_numbers').handler(
        { countryCode: 'US' },
        TEST_CONFIG
      ),
      500
    );
  });
});

// ── ghl_purchase_phone_number ─────────────────────────────────────────────────

describe('ghl_purchase_phone_number', () => {
  it('calls POST /phone-system/numbers/location/:locationId/purchase with phoneNumber', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_purchase_phone_number').handler(
      { phoneNumber: '+16135550100' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/phone-system/numbers/location/${TEST_CONFIG.locationId}/purchase`
    );
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
  it('calls DELETE /phone-system/numbers/location/:locationId/:numberId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_release_phone_number').handler(
      { numberId: 'num-abc123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(
      `/phone-system/numbers/location/${TEST_CONFIG.locationId}/num-abc123`
    );
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Number not found' });
    expectError(
      await getTool('ghl_release_phone_number').handler(
        { numberId: 'bad-id' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_update_phone_number ───────────────────────────────────────────────────

describe('ghl_update_phone_number', () => {
  it('calls PUT /phone-system/numbers/location/:locationId/:numberId with body', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_update_phone_number').handler(
      { numberId: 'num-abc123', friendlyName: 'Sales Line', callForwardingNumber: '+15550001111' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(
      `/phone-system/numbers/location/${TEST_CONFIG.locationId}/num-abc123`
    );
    expect(call.body?.friendlyName).toBe('Sales Line');
    expect(call.body?.callForwardingNumber).toBe('+15550001111');
  });

  it('handles errors', async () => {
    mockFetchError(422, { message: 'Invalid config' });
    expectError(
      await getTool('ghl_update_phone_number').handler(
        { numberId: 'num-abc123' },
        TEST_CONFIG
      ),
      422
    );
  });
});
