import { describe, it, expect } from 'vitest';
import { objectsTools } from '../../src/tools/objects.js';
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
  const tool = objectsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_object_schema ────────────────────────────────────────────────────

describe('ghl_get_object_schema', () => {
  it('calls GET /objects/:key with locationId and fetchProperties', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_get_object_schema').handler(
      { key: 'custom_objects.pet', fetchProperties: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/objects/custom_objects.pet');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.fetchProperties).toBe('true');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits fetchProperties when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_get_object_schema').handler({ key: 'custom_objects.pet' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.fetchProperties).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_object_schema').handler(
      { key: 'custom_objects.pet' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_object_schema ─────────────────────────────────────────────────

describe('ghl_update_object_schema', () => {
  it('calls PUT /objects/:key with locationId, searchableProperties, labels, description', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_object_schema').handler(
      {
        key: 'custom_objects.pet',
        searchableProperties: ['custom_objects.pet.name'],
        labels: { singular: 'Pet', plural: 'Pets' },
        description: 'Pets object',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/objects/custom_objects.pet');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.searchableProperties).toEqual(['custom_objects.pet.name']);
    expect(call.body.labels).toEqual({ singular: 'Pet', plural: 'Pets' });
    expect(call.body.description).toBe('Pets object');
    expectSuccess(result, MOCK_DATA);
  });

  it('omits optional labels/description when not provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_object_schema').handler(
      { key: 'custom_objects.pet', searchableProperties: ['custom_objects.pet.name'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.labels).toBeUndefined();
    expect(call.body.description).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_object_schema').handler(
      { key: 'custom_objects.pet', searchableProperties: ['custom_objects.pet.name'] },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_objects ───────────────────────────────────────────────────────────

describe('ghl_get_objects', () => {
  it('calls GET /objects/ with locationId', async () => {
    const fetch = mockFetchSuccess({ objects: [] });
    const result = await getTool('ghl_get_objects').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/objects/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { objects: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_objects').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_object_record ────────────────────────────────────────────────────

describe('ghl_get_object_record', () => {
  it('calls GET /objects/:schemaKey/records/:id with no locationId param', async () => {
    const fetch = mockFetchSuccess({ id: 'rec1' });
    const result = await getTool('ghl_get_object_record').handler(
      { schemaKey: 'custom_objects.pet', id: 'rec1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/objects/custom_objects.pet/records/rec1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expectSuccess(result, { id: 'rec1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_object_record').handler(
      { schemaKey: 'custom_objects.pet', id: 'rec1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_object_record ─────────────────────────────────────────────────

describe('ghl_update_object_record', () => {
  it('calls PUT /objects/:schemaKey/records/:id with locationId param and dynamic body fields', async () => {
    const fetch = mockFetchSuccess({ id: 'rec1' });
    const result = await getTool('ghl_update_object_record').handler(
      { schemaKey: 'custom_objects.pet', id: 'rec1', record: { name: 'Buddy' } },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/objects/custom_objects.pet/records/rec1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.name).toBe('Buddy');
    expectSuccess(result, { id: 'rec1' });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_update_object_record').handler(
      { schemaKey: 'custom_objects.pet', id: 'rec1', record: { name: 'Buddy' } },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_delete_object_record ─────────────────────────────────────────────────

describe('ghl_delete_object_record', () => {
  it('calls DELETE /objects/:schemaKey/records/:id with no locationId param', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_object_record').handler(
      { schemaKey: 'custom_objects.pet', id: 'rec1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/objects/custom_objects.pet/records/rec1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_object_record').handler(
      { schemaKey: 'custom_objects.pet', id: 'rec1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_create_object_record ─────────────────────────────────────────────────

describe('ghl_create_object_record', () => {
  it('calls POST /objects/:schemaKey/records with no locationId param and dynamic body fields', async () => {
    const fetch = mockFetchSuccess({ id: 'rec1' });
    const result = await getTool('ghl_create_object_record').handler(
      { schemaKey: 'custom_objects.pet', record: { name: 'Buddy' } },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/objects/custom_objects.pet/records');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBeUndefined();
    expect(call.body.name).toBe('Buddy');
    expectSuccess(result, { id: 'rec1' });
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_object_record').handler(
      { schemaKey: 'custom_objects.pet', record: { name: 'Buddy' } },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_search_object_records ────────────────────────────────────────────────

describe('ghl_search_object_records', () => {
  it('calls POST /objects/:schemaKey/records/search with locationId, page, pageLimit, query, searchAfter', async () => {
    const fetch = mockFetchSuccess({ records: [] });
    const result = await getTool('ghl_search_object_records').handler(
      {
        schemaKey: 'custom_objects.pet',
        page: 1,
        pageLimit: 10,
        query: 'name:Buddy',
        searchAfter: ['abc123'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/objects/custom_objects.pet/records/search');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.page).toBe(1);
    expect(call.body.pageLimit).toBe(10);
    expect(call.body.query).toBe('name:Buddy');
    expect(call.body.searchAfter).toEqual(['abc123']);
    expectSuccess(result, { records: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Unprocessable' });
    const result = await getTool('ghl_search_object_records').handler(
      {
        schemaKey: 'custom_objects.pet',
        page: 1,
        pageLimit: 10,
        query: 'name:Buddy',
        searchAfter: ['abc123'],
      },
      TEST_CONFIG
    );
    expectError(result, 422);
  });
});
