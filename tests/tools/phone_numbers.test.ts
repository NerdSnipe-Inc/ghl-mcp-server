import { describe, it, expect } from 'vitest';
import { phoneNumberTools } from '../../src/tools/phone_numbers.js';
import { GHL_VERSION_LEGACY } from '../../src/client.js';
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
    expect(call.headers.Version).toBe('v3');
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

const VALID_SEARCH_ARGS = {
  countryCode: 'US',
  numberTypes: 'local',
  firstPart: '613',
  lastPart: '555',
  anywhere: false,
  smsEnabled: true,
  mmsEnabled: true,
  voiceEnabled: true,
};

describe('ghl_search_available_phone_numbers', () => {
  it('calls GET /phone-system/numbers/location/:locationId/available with all required params', async () => {
    const fetch = mockFetchSuccess({ numbers: [] });
    await getTool('ghl_search_available_phone_numbers').handler(
      VALID_SEARCH_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/phone-system/numbers/location/${TEST_CONFIG.locationId}/available`
    );
    expect(call.params.countryCode).toBe('US');
    expect(call.params.numberTypes).toBe('local');
    expect(call.params.firstPart).toBe('613');
    expect(call.params.lastPart).toBe('555');
    expect(call.params.anywhere).toBe('false');
    expect(call.params.smsEnabled).toBe('true');
    expect(call.params.mmsEnabled).toBe('true');
    expect(call.params.voiceEnabled).toBe('true');
    expect(call.headers.Version).toBe('v3');
  });

  it.each([
    'firstPart',
    'lastPart',
    'anywhere',
    'numberTypes',
    'smsEnabled',
    'mmsEnabled',
    'voiceEnabled',
    'countryCode',
  ])('rejects missing required field %s', (field) => {
    const schema = getTool('ghl_search_available_phone_numbers').inputSchema;
    const args = { ...VALID_SEARCH_ARGS } as Record<string, unknown>;
    delete args[field];
    const result = schema.safeParse(args);
    expect(result.success).toBe(false);
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_search_available_phone_numbers').handler(
        VALID_SEARCH_ARGS,
        TEST_CONFIG
      ),
      500
    );
  });
});

// ── ghl_purchase_phone_number ─────────────────────────────────────────────────

const VALID_PURCHASE_ARGS = {
  phoneNumber: '+16135550100',
  addressSid: 'ADXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  bundleSid: 'BUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  countryCode: 'US',
  numberType: 'local',
  paymentIntentId: 'pi_3Oxxxxxxxxxxxxxxxxxxxx',
  stripeAccountId: 'acct_1Oxxxxxxxxxxxxxxxx',
  paymentMethodId: 'pm_1Oxxxxxxxxxxxxxxxx',
  locality: 'Austin',
  region: 'TX',
  fingerprintId: 'purchase-req-abc-123',
  skipLocationKYC: false,
};

describe('ghl_purchase_phone_number', () => {
  it('calls POST /phone-system/numbers/location/:locationId/purchase with all required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_purchase_phone_number').handler(VALID_PURCHASE_ARGS, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(
      `/phone-system/numbers/location/${TEST_CONFIG.locationId}/purchase`
    );
    expect(call.body?.phoneNumber).toBe('+16135550100');
    expect(call.body?.addressSid).toBe(VALID_PURCHASE_ARGS.addressSid);
    expect(call.body?.bundleSid).toBe(VALID_PURCHASE_ARGS.bundleSid);
    expect(call.body?.countryCode).toBe('US');
    expect(call.body?.numberType).toBe('local');
    expect(call.body?.paymentIntentId).toBe(VALID_PURCHASE_ARGS.paymentIntentId);
    expect(call.body?.stripeAccountId).toBe(VALID_PURCHASE_ARGS.stripeAccountId);
    expect(call.body?.paymentMethodId).toBe(VALID_PURCHASE_ARGS.paymentMethodId);
    expect(call.body?.locality).toBe('Austin');
    expect(call.body?.region).toBe('TX');
    expect(call.body?.fingerprintId).toBe(VALID_PURCHASE_ARGS.fingerprintId);
    expect(call.body?.skipLocationKYC).toBe(false);
    expect(call.headers.Version).toBe('v3');
  });

  it.each([
    'addressSid',
    'bundleSid',
    'countryCode',
    'numberType',
    'paymentIntentId',
    'stripeAccountId',
    'paymentMethodId',
    'locality',
    'region',
    'fingerprintId',
    'skipLocationKYC',
  ])('rejects missing required field %s', (field) => {
    const schema = getTool('ghl_purchase_phone_number').inputSchema;
    const args = { ...VALID_PURCHASE_ARGS } as Record<string, unknown>;
    delete args[field];
    const result = schema.safeParse(args);
    expect(result.success).toBe(false);
  });

  it('handles errors', async () => {
    mockFetchError(422, { message: 'Number unavailable' });
    expectError(
      await getTool('ghl_purchase_phone_number').handler(VALID_PURCHASE_ARGS, TEST_CONFIG),
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
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
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
    expect(call.headers.Version).toBe(GHL_VERSION_LEGACY);
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
