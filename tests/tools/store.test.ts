import { describe, it, expect } from 'vitest';
import { storeTools } from '../../src/tools/store.js';
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
  const tool = storeTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_shipping_carriers ────────────────────────────────────────────────

describe('ghl_get_shipping_carriers', () => {
  it('calls GET /store/shipping-carrier with altId/altType', async () => {
    const fetch = mockFetchSuccess({ carriers: [] });
    const result = await getTool('ghl_get_shipping_carriers').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/store/shipping-carrier');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { carriers: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_shipping_carriers').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_create_shipping_carrier ──────────────────────────────────────────────

describe('ghl_create_shipping_carrier', () => {
  it('calls POST /store/shipping-carrier with body', async () => {
    const fetch = mockFetchSuccess({ carrier: { id: 'c1' } });
    const result = await getTool('ghl_create_shipping_carrier').handler(
      {
        name: 'FedEx',
        callbackUrl: 'https://example.com/rates',
        services: [{ name: 'Ground', value: 'ground' }],
        allowsMultipleServiceSelection: true,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/store/shipping-carrier');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.name).toBe('FedEx');
    expect(call.body?.callbackUrl).toBe('https://example.com/rates');
    expect(call.body?.services).toEqual([{ name: 'Ground', value: 'ground' }]);
    expect(call.body?.allowsMultipleServiceSelection).toBe(true);
    expectSuccess(result, { carrier: { id: 'c1' } });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_shipping_carrier').handler(
      { name: 'FedEx', callbackUrl: 'https://example.com/rates' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_shipping_carrier ─────────────────────────────────────────────────

describe('ghl_get_shipping_carrier', () => {
  it('calls GET /store/shipping-carrier/:id with altId/altType', async () => {
    const fetch = mockFetchSuccess({ carrier: { id: 'c1' } });
    const result = await getTool('ghl_get_shipping_carrier').handler(
      { shippingCarrierId: 'c1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/store/shipping-carrier/c1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { carrier: { id: 'c1' } });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not Found' });
    const result = await getTool('ghl_get_shipping_carrier').handler(
      { shippingCarrierId: 'c1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_shipping_carrier ──────────────────────────────────────────────

describe('ghl_update_shipping_carrier', () => {
  it('calls PUT /store/shipping-carrier/:id with body', async () => {
    const fetch = mockFetchSuccess({ carrier: { id: 'c1' } });
    const result = await getTool('ghl_update_shipping_carrier').handler(
      { shippingCarrierId: 'c1', name: 'UPS' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/store/shipping-carrier/c1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.name).toBe('UPS');
    expect(call.body?.shippingCarrierId).toBeUndefined();
    expectSuccess(result, { carrier: { id: 'c1' } });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad Request' });
    const result = await getTool('ghl_update_shipping_carrier').handler(
      { shippingCarrierId: 'c1', name: 'UPS' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_shipping_carrier ──────────────────────────────────────────────

describe('ghl_delete_shipping_carrier', () => {
  it('calls DELETE /store/shipping-carrier/:id with altId/altType', async () => {
    const fetch = mockFetchSuccess({ succeeded: true });
    const result = await getTool('ghl_delete_shipping_carrier').handler(
      { shippingCarrierId: 'c1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/store/shipping-carrier/c1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { succeeded: true });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not Found' });
    const result = await getTool('ghl_delete_shipping_carrier').handler(
      { shippingCarrierId: 'c1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_shipping_zones ───────────────────────────────────────────────────

describe('ghl_get_shipping_zones', () => {
  it('calls GET /store/shipping-zone with altId/altType', async () => {
    const fetch = mockFetchSuccess({ zones: [] });
    const result = await getTool('ghl_get_shipping_zones').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/store/shipping-zone');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { zones: [] });
  });

  it('passes optional query params', async () => {
    const fetch = mockFetchSuccess({ zones: [] });
    await getTool('ghl_get_shipping_zones').handler(
      { limit: 10, offset: 5, withShippingRate: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('5');
    expect(call.params.withShippingRate).toBe('true');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_shipping_zones').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_create_shipping_zone ─────────────────────────────────────────────────

describe('ghl_create_shipping_zone', () => {
  it('calls POST /store/shipping-zone with body', async () => {
    const fetch = mockFetchSuccess({ zone: { id: 'z1' } });
    const result = await getTool('ghl_create_shipping_zone').handler(
      {
        name: 'US Zone',
        countries: [{ code: 'US', states: [{ code: 'CA' }] }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/store/shipping-zone');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.name).toBe('US Zone');
    expect(call.body?.countries).toEqual([{ code: 'US', states: [{ code: 'CA' }] }]);
    expectSuccess(result, { zone: { id: 'z1' } });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_shipping_zone').handler(
      { name: 'US Zone', countries: [{ code: 'US' }] },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_get_shipping_zone ────────────────────────────────────────────────────

describe('ghl_get_shipping_zone', () => {
  it('calls GET /store/shipping-zone/:id with altId/altType', async () => {
    const fetch = mockFetchSuccess({ zone: { id: 'z1' } });
    const result = await getTool('ghl_get_shipping_zone').handler(
      { shippingZoneId: 'z1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/store/shipping-zone/z1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { zone: { id: 'z1' } });
  });

  it('passes optional withShippingRate param', async () => {
    const fetch = mockFetchSuccess({ zone: { id: 'z1' } });
    await getTool('ghl_get_shipping_zone').handler(
      { shippingZoneId: 'z1', withShippingRate: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.withShippingRate).toBe('true');
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not Found' });
    const result = await getTool('ghl_get_shipping_zone').handler(
      { shippingZoneId: 'z1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_shipping_zone ─────────────────────────────────────────────────

describe('ghl_update_shipping_zone', () => {
  it('calls PUT /store/shipping-zone/:id with body', async () => {
    const fetch = mockFetchSuccess({ zone: { id: 'z1' } });
    const result = await getTool('ghl_update_shipping_zone').handler(
      { shippingZoneId: 'z1', name: 'Updated Zone' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/store/shipping-zone/z1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.name).toBe('Updated Zone');
    expect(call.body?.shippingZoneId).toBeUndefined();
    expectSuccess(result, { zone: { id: 'z1' } });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad Request' });
    const result = await getTool('ghl_update_shipping_zone').handler(
      { shippingZoneId: 'z1', name: 'Updated Zone' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_shipping_zone ─────────────────────────────────────────────────

describe('ghl_delete_shipping_zone', () => {
  it('calls DELETE /store/shipping-zone/:id with altId/altType', async () => {
    const fetch = mockFetchSuccess({ succeeded: true });
    const result = await getTool('ghl_delete_shipping_zone').handler(
      { shippingZoneId: 'z1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/store/shipping-zone/z1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { succeeded: true });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not Found' });
    const result = await getTool('ghl_delete_shipping_zone').handler(
      { shippingZoneId: 'z1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_available_shipping_rates ─────────────────────────────────────────

describe('ghl_get_available_shipping_rates', () => {
  it('calls POST /store/shipping-zone/shipping-rates with body', async () => {
    const fetch = mockFetchSuccess({ rates: [] });
    const result = await getTool('ghl_get_available_shipping_rates').handler(
      {
        country: 'US',
        totalOrderAmount: 99.99,
        totalOrderWeight: 10,
        source: { type: 'website', subType: 'store' },
        products: [{ id: 'price1', qty: 2 }],
        couponCode: 'TEST',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/store/shipping-zone/shipping-rates');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.country).toBe('US');
    expect(call.body?.totalOrderAmount).toBe(99.99);
    expect(call.body?.totalOrderWeight).toBe(10);
    expect(call.body?.source).toEqual({ type: 'website', subType: 'store' });
    expect(call.body?.products).toEqual([{ id: 'price1', qty: 2 }]);
    expect(call.body?.couponCode).toBe('TEST');
    expectSuccess(result, { rates: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_get_available_shipping_rates').handler(
      {
        country: 'US',
        totalOrderAmount: 99.99,
        totalOrderWeight: 10,
        source: { type: 'website' },
        products: [{ id: 'price1', qty: 2 }],
      },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});
