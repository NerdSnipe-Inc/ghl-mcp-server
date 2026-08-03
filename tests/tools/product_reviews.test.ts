import { describe, it, expect } from 'vitest';
import { productReviewTools } from '../../src/tools/product_reviews.js';
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
  const tool = productReviewTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_product_reviews ─────────────────────────────────────────────────

describe('ghl_get_product_reviews', () => {
  it('calls GET /products/reviews with altId/altType', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    const result = await getTool('ghl_get_product_reviews').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/reviews');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { data: [], total: 0 });
  });

  it('passes optional query params', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    await getTool('ghl_get_product_reviews').handler(
      {
        limit: 10,
        offset: 5,
        sortField: 'rating',
        sortOrder: 'desc',
        rating: 4,
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        productId: 'p1,p2',
        storeId: 's1,s2',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('5');
    expect(call.params.sortField).toBe('rating');
    expect(call.params.sortOrder).toBe('desc');
    expect(call.params.rating).toBe('4');
    expect(call.params.startDate).toBe('2023-01-01T00:00:00Z');
    expect(call.params.endDate).toBe('2023-12-31T23:59:59Z');
    expect(call.params.productId).toBe('p1,p2');
    expect(call.params.storeId).toBe('s1,s2');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_product_reviews').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_product_review_count ────────────────────────────────────────────

describe('ghl_get_product_review_count', () => {
  it('calls GET /products/reviews/count with altId/altType', async () => {
    const fetch = mockFetchSuccess({ data: [] });
    const result = await getTool('ghl_get_product_review_count').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/products/reviews/count');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expectSuccess(result, { data: [] });
  });

  it('passes optional filter params', async () => {
    const fetch = mockFetchSuccess({ data: [] });
    await getTool('ghl_get_product_review_count').handler(
      {
        rating: 5,
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        productId: 'p1',
        storeId: 's1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.rating).toBe('5');
    expect(call.params.startDate).toBe('2023-01-01T00:00:00Z');
    expect(call.params.endDate).toBe('2023-12-31T23:59:59Z');
    expect(call.params.productId).toBe('p1');
    expect(call.params.storeId).toBe('s1');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_product_review_count').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_bulk_update_product_reviews ─────────────────────────────────────────

describe('ghl_bulk_update_product_reviews', () => {
  it('calls POST /products/reviews/bulk-update with altId/altType and body', async () => {
    const fetch = mockFetchSuccess({ status: true, message: 'Successfully updated' });
    const result = await getTool('ghl_bulk_update_product_reviews').handler(
      {
        reviews: [{ reviewId: 'r1', productId: 'p1', storeId: 's1' }],
        status: 'approved',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/products/reviews/bulk-update');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body.altType).toBe('location');
    expect(call.body.reviews).toEqual([{ reviewId: 'r1', productId: 'p1', storeId: 's1' }]);
    expect(call.body.status).toBe('approved');
    expectSuccess(result, { status: true, message: 'Successfully updated' });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_bulk_update_product_reviews').handler(
      { reviews: [], status: 'approved' },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});

// ── ghl_update_product_review ───────────────────────────────────────────────

describe('ghl_update_product_review', () => {
  it('calls PUT /products/reviews/:id with altId/altType and body', async () => {
    const fetch = mockFetchSuccess({ status: true });
    const result = await getTool('ghl_update_product_review').handler(
      {
        reviewId: 'r1',
        productId: 'p1',
        status: 'approved',
        rating: 4.5,
        headline: 'Great',
        detail: 'Really good',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/products/reviews/r1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.altId).toBe(TEST_CONFIG.locationId);
    expect(call.body.altType).toBe('location');
    expect(call.body.productId).toBe('p1');
    expect(call.body.status).toBe('approved');
    expect(call.body.rating).toBe(4.5);
    expect(call.body.headline).toBe('Great');
    expect(call.body.detail).toBe('Really good');
    expect(call.body.reviewId).toBeUndefined();
    expectSuccess(result, { status: true });
  });

  it('supports reply array', async () => {
    const fetch = mockFetchSuccess({ status: true });
    await getTool('ghl_update_product_review').handler(
      {
        reviewId: 'r1',
        productId: 'p1',
        status: 'approved',
        reply: [{ headline: 'Thanks', comment: 'Appreciate it', user: { name: 'Admin' } }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.reply).toEqual([
      { headline: 'Thanks', comment: 'Appreciate it', user: { name: 'Admin' } },
    ]);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad Request' });
    const result = await getTool('ghl_update_product_review').handler(
      { reviewId: 'r1', productId: 'p1', status: 'approved' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_product_review ───────────────────────────────────────────────

describe('ghl_delete_product_review', () => {
  it('calls DELETE /products/reviews/:id with altId/altType/productId', async () => {
    const fetch = mockFetchSuccess({ status: true });
    const result = await getTool('ghl_delete_product_review').handler(
      { reviewId: 'r1', productId: 'p1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/products/reviews/r1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.altId).toBe(TEST_CONFIG.locationId);
    expect(call.params.altType).toBe('location');
    expect(call.params.productId).toBe('p1');
    expectSuccess(result, { status: true });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_product_review').handler(
      { reviewId: 'bad', productId: 'p1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
