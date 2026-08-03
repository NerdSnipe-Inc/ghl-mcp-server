import { describe, it, expect } from 'vitest';
import { productCollectionTools } from '../../src/tools/product_collections.js';
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
  const tool = productCollectionTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_product_collections ─────────────────────────────────────────────

describe('ghl_get_product_collections', () => {
  it('calls GET /products/collections with altId/altType', async () => {
    const fetch = mockFetchSuccess({ collections: [] });
    const result = await getTool('ghl_get_product_collections').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/collections');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { collections: [] });
  });

  it('passes optional query params', async () => {
    const fetch = mockFetchSuccess({ collections: [] });
    await getTool('ghl_get_product_collections').handler(
      {
        limit: 10,
        offset: 5,
        collectionIds: 'col1,col2',
        name: 'Best Sellers',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('5');
    expect(call.params.collectionIds).toBe('col1,col2');
    expect(call.params.name).toBe('Best Sellers');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_product_collections').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_product_collection ──────────────────────────────────────────────

describe('ghl_get_product_collection', () => {
  it('calls GET /products/collections/:id with altId', async () => {
    const fetch = mockFetchSuccess({ collection: { id: 'abc' } });
    const result = await getTool('ghl_get_product_collection').handler(
      { collectionId: 'abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/collections/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { collection: { id: 'abc' } });
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_product_collection').handler({ collectionId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_create_product_collection ───────────────────────────────────────────

describe('ghl_create_product_collection', () => {
  it('calls POST /products/collections with body including altId/altType', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_product_collection').handler(
      { name: 'Best Sellers', slug: 'best-sellers' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/collections');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.name).toBe('Best Sellers');
    expect(call.body?.slug).toBe('best-sellers');
  });

  it('passes optional fields including seo', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_product_collection').handler(
      {
        name: 'Best Sellers',
        slug: 'best-sellers',
        image: 'http://example.com/watermark.png',
        collectionId: '66057f9d28536eae584ec047',
        seo: { title: 'Best Sellers', description: 'desc' },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.image).toBe('http://example.com/watermark.png');
    expect(call.body?.collectionId).toBe('66057f9d28536eae584ec047');
    expect(call.body?.seo).toEqual({ title: 'Best Sellers', description: 'desc' });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    const result = await getTool('ghl_create_product_collection').handler(
      { name: 'X', slug: 'x' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_update_product_collection ───────────────────────────────────────────

describe('ghl_update_product_collection', () => {
  it('calls PUT /products/collections/:id with body including altId/altType', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_product_collection').handler(
      { collectionId: 'abc', name: 'New Name' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/products/collections/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.name).toBe('New Name');
    expect(call.body?.collectionId).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_update_product_collection').handler(
      { collectionId: 'bad', name: 'X' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_product_collection ───────────────────────────────────────────

describe('ghl_delete_product_collection', () => {
  it('calls DELETE /products/collections/:id with altId/altType', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    const result = await getTool('ghl_delete_product_collection').handler(
      { collectionId: 'abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/products/collections/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { deleted: true });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_product_collection').handler(
      { collectionId: 'bad' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
