import { describe, it, expect } from 'vitest';
import { productTools } from '../../src/tools/products.js';
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
  const tool = productTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_products ────────────────────────────────────────────────────────

describe('ghl_get_products', () => {
  it('calls GET /products/ with locationId', async () => {
    const fetch = mockFetchSuccess({ products: [] });
    await getTool('ghl_get_products').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes optional query params', async () => {
    const fetch = mockFetchSuccess({ products: [] });
    await getTool('ghl_get_products').handler(
      {
        limit: 10,
        offset: 5,
        search: 'shirt',
        collectionIds: 'col1',
        collectionSlug: 'shirts',
        storeId: 'store1',
        includedInStore: true,
        availableInStore: false,
        sortOrder: 'desc',
        expand: ['variants', 'medias'],
        productIds: ['p1', 'p2'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('5');
    expect(call.params.search).toBe('shirt');
    expect(call.params.collectionIds).toBe('col1');
    expect(call.params.collectionSlug).toBe('shirts');
    expect(call.params.storeId).toBe('store1');
    expect(call.params.includedInStore).toBe('true');
    expect(call.params.availableInStore).toBe('false');
    expect(call.params.sortOrder).toBe('desc');
    expect(call.url.searchParams.getAll('expand')).toEqual(['variants', 'medias']);
    expect(call.url.searchParams.getAll('productIds')).toEqual(['p1', 'p2']);
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_products').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_product ─────────────────────────────────────────────────────────

describe('ghl_get_product', () => {
  it('calls GET /products/:id with locationId', async () => {
    const fetch = mockFetchSuccess({ product: { id: 'abc' } });
    const result = await getTool('ghl_get_product').handler(
      { productId: 'abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { product: { id: 'abc' } });
  });

  it('passes sendWishlistStatus', async () => {
    const fetch = mockFetchSuccess({ product: {} });
    await getTool('ghl_get_product').handler(
      { productId: 'abc', sendWishlistStatus: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.sendWishlistStatus).toBe('true');
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_product').handler({ productId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_create_product ──────────────────────────────────────────────────────

describe('ghl_create_product', () => {
  it('calls POST /products/ with body including locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_product').handler(
      { name: 'T-Shirt', productType: 'PHYSICAL' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('T-Shirt');
    expect(call.body?.productType).toBe('PHYSICAL');
  });

  it('passes optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_product').handler(
      {
        name: 'T-Shirt',
        productType: 'PHYSICAL',
        description: 'Nice shirt',
        image: 'https://example.com/img.png',
        statementDescriptor: 'SHIRT',
        availableInStore: true,
        collectionIds: ['col1'],
        medias: [{ url: 'https://example.com/1.png', type: 'image' }],
        variants: [{ name: 'Size', options: [{ name: 'S' }] }],
        isTaxesEnabled: true,
        taxes: ['tax1'],
        automaticTaxCategoryId: 'cat1',
        isLabelEnabled: true,
        label: { title: 'New' },
        slug: 't-shirt',
        seo: { title: 'T-Shirt' },
        taxInclusive: false,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.description).toBe('Nice shirt');
    expect(call.body?.collectionIds).toEqual(['col1']);
    expect(call.body?.variants).toEqual([{ name: 'Size', options: [{ name: 'S' }] }]);
    expect(call.body?.taxes).toEqual(['tax1']);
    expect(call.body?.label).toEqual({ title: 'New' });
    expect(call.body?.seo).toEqual({ title: 'T-Shirt' });
  });

  it('handles 422 validation error', async () => {
    mockFetchError(422, { message: 'Invalid' });
    expectError(
      await getTool('ghl_create_product').handler(
        { name: '', productType: 'PHYSICAL' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_update_product ──────────────────────────────────────────────────────

describe('ghl_update_product', () => {
  it('calls PUT /products/:id with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_product').handler(
      { productId: 'abc', name: 'Updated Shirt', productType: 'PHYSICAL' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/products/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('Updated Shirt');
    expect(call.body?.productId).toBeUndefined();
  });

  it('passes prices field', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_product').handler(
      {
        productId: 'abc',
        name: 'Shirt',
        productType: 'PHYSICAL',
        prices: ['price1'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.prices).toEqual(['price1']);
  });

  it('handles errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(
      await getTool('ghl_update_product').handler(
        { productId: 'abc', name: 'X', productType: 'PHYSICAL' },
        TEST_CONFIG
      ),
      400
    );
  });
});

// ── ghl_delete_product ──────────────────────────────────────────────────────

describe('ghl_delete_product', () => {
  it('calls DELETE /products/:id with locationId', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_product').handler({ productId: 'abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/products/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_delete_product').handler({ productId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_bulk_update_products ────────────────────────────────────────────────

describe('ghl_bulk_update_products', () => {
  it('calls POST /products/bulk-update with altId/altType', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_bulk_update_products').handler(
      { type: 'bulk-update-availability', productIds: ['p1', 'p2'], availability: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/bulk-update');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.type).toBe('bulk-update-availability');
    expect(call.body?.productIds).toEqual(['p1', 'p2']);
    expect(call.body?.availability).toBe(true);
  });

  it('passes filters/price/compareAtPrice/collectionIds/currency', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_bulk_update_products').handler(
      {
        type: 'bulk-update-price',
        productIds: ['p1'],
        filters: { collectionIds: ['c1'] },
        price: { type: 'SET_NEW_PRICE', value: 10 },
        compareAtPrice: { type: 'SET_NEW_PRICE', value: 20 },
        collectionIds: ['c1'],
        currency: 'USD',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.filters).toEqual({ collectionIds: ['c1'] });
    expect(call.body?.price).toEqual({ type: 'SET_NEW_PRICE', value: 10 });
    expect(call.body?.compareAtPrice).toEqual({ type: 'SET_NEW_PRICE', value: 20 });
    expect(call.body?.currency).toBe('USD');
  });

  it('handles errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(
      await getTool('ghl_bulk_update_products').handler(
        { type: 'bulk-delete-products', productIds: ['p1'] },
        TEST_CONFIG
      ),
      400
    );
  });
});

// ── ghl_bulk_edit_product_prices ────────────────────────────────────────────

describe('ghl_bulk_edit_product_prices', () => {
  it('calls POST /products/bulk-update/edit with altId/altType/products', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_bulk_edit_product_prices').handler(
      { products: [{ productId: 'p1', prices: [{ id: 'price1', amount: 15 }] }] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/bulk-update/edit');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.products).toEqual([
      { productId: 'p1', prices: [{ id: 'price1', amount: 15 }] },
    ]);
  });

  it('handles errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(
      await getTool('ghl_bulk_edit_product_prices').handler({ products: [] }, TEST_CONFIG),
      400
    );
  });
});

// ── ghl_get_product_prices ──────────────────────────────────────────────────

describe('ghl_get_product_prices', () => {
  it('calls GET /products/:id/price with locationId', async () => {
    const fetch = mockFetchSuccess({ prices: [] });
    await getTool('ghl_get_product_prices').handler({ productId: 'abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/abc/price');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes limit/offset/ids', async () => {
    const fetch = mockFetchSuccess({ prices: [] });
    await getTool('ghl_get_product_prices').handler(
      { productId: 'abc', limit: 10, offset: 0, ids: 'price1,price2' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('0');
    expect(call.params.ids).toBe('price1,price2');
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_product_prices').handler({ productId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_get_product_price ───────────────────────────────────────────────────

describe('ghl_get_product_price', () => {
  it('calls GET /products/:id/price/:priceId with locationId', async () => {
    const fetch = mockFetchSuccess({ price: { id: 'price1' } });
    await getTool('ghl_get_product_price').handler(
      { productId: 'abc', priceId: 'price1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/abc/price/price1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_product_price').handler(
        { productId: 'abc', priceId: 'bad' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_create_product_price ────────────────────────────────────────────────

describe('ghl_create_product_price', () => {
  it('calls POST /products/:id/price with body including locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_product_price').handler(
      { productId: 'abc', name: 'Standard', type: 'one_time', currency: 'USD', amount: 100 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/abc/price');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('Standard');
    expect(call.body?.type).toBe('one_time');
    expect(call.body?.currency).toBe('USD');
    expect(call.body?.amount).toBe(100);
    expect(call.body?.productId).toBeUndefined();
  });

  it('passes optional fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_product_price').handler(
      {
        productId: 'abc',
        name: 'Standard',
        type: 'recurring',
        currency: 'USD',
        amount: 100,
        recurring: { interval: 'month', intervalCount: 1 },
        description: 'Monthly plan',
        trialPeriod: 7,
        totalCycles: 12,
        setupFee: 10,
        variantOptionIds: ['opt1'],
        compareAtPrice: 150,
        sku: 'SKU1',
        trackInventory: true,
        availableQuantity: 5,
        allowOutOfStockPurchases: false,
        isDigitalProduct: true,
        digitalDelivery: ['https://example.com/file.zip'],
        meta: { source: 'stripe', stripePriceId: 'price_123', internalSource: 'funnel' },
        shippingOptions: { weight: { value: 1, unit: 'kg' } },
        membershipOffers: [{ label: 'top_50', value: '50', _id: 'offer1' }],
        userId: 'user1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.recurring).toEqual({ interval: 'month', intervalCount: 1 });
    expect(call.body?.trialPeriod).toBe(7);
    expect(call.body?.variantOptionIds).toEqual(['opt1']);
    expect(call.body?.digitalDelivery).toEqual(['https://example.com/file.zip']);
    expect(call.body?.membershipOffers).toEqual([{ label: 'top_50', value: '50', _id: 'offer1' }]);
  });

  it('handles errors', async () => {
    mockFetchError(422, { message: 'Invalid' });
    expectError(
      await getTool('ghl_create_product_price').handler(
        { productId: 'abc', name: '', type: 'one_time', currency: 'USD', amount: 0 },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_update_product_price ────────────────────────────────────────────────

describe('ghl_update_product_price', () => {
  it('calls PUT /products/:id/price/:priceId with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_product_price').handler(
      {
        productId: 'abc',
        priceId: 'price1',
        name: 'Updated',
        type: 'one_time',
        currency: 'USD',
        amount: 200,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/products/abc/price/price1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('Updated');
    expect(call.body?.amount).toBe(200);
    expect(call.body?.priceId).toBeUndefined();
    expect(call.body?.productId).toBeUndefined();
  });

  it('handles errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(
      await getTool('ghl_update_product_price').handler(
        { productId: 'abc', priceId: 'price1', name: 'X', type: 'one_time', currency: 'USD', amount: 1 },
        TEST_CONFIG
      ),
      400
    );
  });
});

// ── ghl_delete_product_price ────────────────────────────────────────────────

describe('ghl_delete_product_price', () => {
  it('calls DELETE /products/:id/price/:priceId with locationId', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_product_price').handler(
      { productId: 'abc', priceId: 'price1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/products/abc/price/price1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_delete_product_price').handler(
        { productId: 'abc', priceId: 'bad' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_get_product_inventory ───────────────────────────────────────────────

describe('ghl_get_product_inventory', () => {
  it('calls GET /products/inventory with altId/altType', async () => {
    const fetch = mockFetchSuccess({ items: [] });
    await getTool('ghl_get_product_inventory').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/inventory');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
  });

  it('passes limit/offset/search', async () => {
    const fetch = mockFetchSuccess({ items: [] });
    await getTool('ghl_get_product_inventory').handler(
      { limit: 10, offset: 0, search: 'shirt' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('0');
    expect(call.params.search).toBe('shirt');
  });

  it('handles errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(
      await getTool('ghl_get_product_inventory').handler({}, TEST_CONFIG),
      401
    );
  });
});

// ── ghl_update_product_inventory ────────────────────────────────────────────

describe('ghl_update_product_inventory', () => {
  it('calls POST /products/inventory with altId/altType/items', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_product_inventory').handler(
      { items: [{ priceId: 'price1', productId: 'abc', availableQuantity: 5 }] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/inventory');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.altType).toBe('location');
    expect(call.body?.items).toEqual([
      { priceId: 'price1', productId: 'abc', availableQuantity: 5 },
    ]);
  });

  it('handles errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    expectError(
      await getTool('ghl_update_product_inventory').handler({ items: [] }, TEST_CONFIG),
      400
    );
  });
});
