import { describe, it, expect } from 'vitest';
import { productStoreTools } from '../../src/tools/product_store.js';
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
  const tool = productStoreTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_set_product_store_visibility ────────────────────────────────────────

describe('ghl_set_product_store_visibility', () => {
  it('calls POST /products/store/:storeId with altId/altType and body', async () => {
    const fetch = mockFetchSuccess({ status: true, message: 'Successfully created' });
    const result = await getTool('ghl_set_product_store_visibility').handler(
      {
        storeId: 'store1',
        action: 'include',
        productIds: ['p1', 'p2'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/store/store1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body.altType).toBe('location');
    expect(call.body.action).toBe('include');
    expect(call.body.productIds).toEqual(['p1', 'p2']);
    expect(call.body.storeId).toBeUndefined();
    expectSuccess(result, { status: true, message: 'Successfully created' });
  });

  it('supports exclude action', async () => {
    const fetch = mockFetchSuccess({ status: true });
    await getTool('ghl_set_product_store_visibility').handler(
      { storeId: 'store1', action: 'exclude', productIds: ['p1'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.action).toBe('exclude');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_set_product_store_visibility').handler(
      { storeId: 'store1', action: 'include', productIds: ['p1'] },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_update_product_store_priority ───────────────────────────────────────

describe('ghl_update_product_store_priority', () => {
  it('calls POST /products/store/:storeId/priority with altId/altType and body', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_update_product_store_priority').handler(
      {
        storeId: 'store1',
        products: [
          ['p1', 1],
          ['p2', 2],
        ],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/store/store1/priority');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body.altType).toBe('location');
    expect(call.body.products).toEqual([
      ['p1', 1],
      ['p2', 2],
    ]);
    expect(call.body.storeId).toBeUndefined();
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad Request' });
    const result = await getTool('ghl_update_product_store_priority').handler(
      { storeId: 'store1', products: [] },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_product_store_stats ─────────────────────────────────────────────

describe('ghl_get_product_store_stats', () => {
  it('calls GET /products/store/:storeId/stats with altId/altType', async () => {
    const fetch = mockFetchSuccess({ totalProducts: 100, includedInStore: 80, excludedFromStore: 20 });
    const result = await getTool('ghl_get_product_store_stats').handler(
      { storeId: 'store1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/store/store1/stats');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { totalProducts: 100, includedInStore: 80, excludedFromStore: 20 });
  });

  it('passes optional search and collectionIds params', async () => {
    const fetch = mockFetchSuccess({ totalProducts: 1, includedInStore: 1, excludedFromStore: 0 });
    await getTool('ghl_get_product_store_stats').handler(
      { storeId: 'store1', search: 'Awesome product', collectionIds: 'c1,c2' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.search).toBe('Awesome product');
    expect(call.params.collectionIds).toBe('c1,c2');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_product_store_stats').handler(
      { storeId: 'store1' },
      TEST_CONFIG
    );
    expectError(result, 401);
  });
});
