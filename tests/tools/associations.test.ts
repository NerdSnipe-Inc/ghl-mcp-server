import { describe, it, expect } from 'vitest';
import { associationsTools } from '../../src/tools/associations.js';
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
  const tool = associationsTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_create_association_relation ─────────────────────────────────────────

describe('ghl_create_association_relation', () => {
  it('calls POST /associations/relations with locationId, associationId, firstRecordId, secondRecordId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_association_relation').handler(
      { associationId: 'assoc1', firstRecordId: 'rec1', secondRecordId: 'rec2' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/associations/relations');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.associationId).toBe('assoc1');
    expect(call.body.firstRecordId).toBe('rec1');
    expect(call.body.secondRecordId).toBe('rec2');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_association_relation').handler(
      { associationId: 'assoc1', firstRecordId: 'rec1', secondRecordId: 'rec2' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_association_relations ───────────────────────────────────────────

describe('ghl_get_association_relations', () => {
  it('calls GET /associations/relations/:recordId with locationId, skip, limit, associationIds', async () => {
    const fetch = mockFetchSuccess({ relations: [] });
    const result = await getTool('ghl_get_association_relations').handler(
      { recordId: 'rec1', skip: 0, limit: 20, associationIds: ['assoc1', 'assoc2'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/associations/relations/rec1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('20');
    expect(call.params.associationIds).toBe('assoc1,assoc2');
    expectSuccess(result, { relations: [] });
  });

  it('omits associationIds when not provided', async () => {
    const fetch = mockFetchSuccess({ relations: [] });
    await getTool('ghl_get_association_relations').handler(
      { recordId: 'rec1', skip: 0, limit: 20 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.associationIds).toBeUndefined();
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_association_relations').handler(
      { recordId: 'rec1', skip: 0, limit: 20 },
      TEST_CONFIG
    );
    expectError(result, 401);
  });
});

// ── ghl_delete_association_relation ─────────────────────────────────────────

describe('ghl_delete_association_relation', () => {
  it('calls DELETE /associations/relations/:relationId with locationId', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_association_relation').handler(
      { relationId: 'rel1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/associations/relations/rel1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_association_relation').handler(
      { relationId: 'rel1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_association_by_key ──────────────────────────────────────────────

describe('ghl_get_association_by_key', () => {
  it('calls GET /associations/key/:key_name with locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'assoc1' });
    const result = await getTool('ghl_get_association_by_key').handler(
      { key_name: 'contact_business' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/associations/key/contact_business');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { id: 'assoc1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_association_by_key').handler(
      { key_name: 'contact_business' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_get_association_by_object_key ───────────────────────────────────────

describe('ghl_get_association_by_object_key', () => {
  it('calls GET /associations/objectKey/:objectKey with locationId', async () => {
    const fetch = mockFetchSuccess({ id: 'assoc1' });
    const result = await getTool('ghl_get_association_by_object_key').handler(
      { objectKey: 'custom_objects.pet' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/associations/objectKey/custom_objects.pet');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { id: 'assoc1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_association_by_object_key').handler(
      { objectKey: 'custom_objects.pet' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_create_association ──────────────────────────────────────────────────

const CREATE_ASSOCIATION_ARGS = {
  key: 'contact_business',
  firstObjectLabel: 'Contact',
  firstObjectKey: 'contact',
  secondObjectLabel: 'Business',
  secondObjectKey: 'business',
};

describe('ghl_create_association', () => {
  it('calls POST /associations/ with locationId plus required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_create_association').handler(
      CREATE_ASSOCIATION_ARGS,
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/associations/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.key).toBe('contact_business');
    expect(call.body.firstObjectLabel).toBe('Contact');
    expect(call.body.firstObjectKey).toBe('contact');
    expect(call.body.secondObjectLabel).toBe('Business');
    expect(call.body.secondObjectKey).toBe('business');
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_create_association').handler(
      CREATE_ASSOCIATION_ARGS,
      TEST_CONFIG
    );
    expectError(result, 400);
  });
});

// ── ghl_get_association ─────────────────────────────────────────────────────

describe('ghl_get_association', () => {
  it('calls GET /associations/:associationId', async () => {
    const fetch = mockFetchSuccess({ id: 'assoc1' });
    const result = await getTool('ghl_get_association').handler(
      { associationId: 'assoc1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/associations/assoc1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { id: 'assoc1' });
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_get_association').handler(
      { associationId: 'assoc1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_update_association ──────────────────────────────────────────────────

describe('ghl_update_association', () => {
  it('calls PUT /associations/:associationId with firstObjectLabel, secondObjectLabel', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_update_association').handler(
      { associationId: 'assoc1', firstObjectLabel: 'Contact 2', secondObjectLabel: 'Business 2' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/associations/assoc1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.firstObjectLabel).toBe('Contact 2');
    expect(call.body.secondObjectLabel).toBe('Business 2');
    expect(call.body.associationId).toBeUndefined();
    expectSuccess(result, MOCK_DATA);
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_update_association').handler(
      { associationId: 'assoc1', firstObjectLabel: 'Contact 2', secondObjectLabel: 'Business 2' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_delete_association ──────────────────────────────────────────────────

describe('ghl_delete_association', () => {
  it('calls DELETE /associations/:associationId', async () => {
    const fetch = mockFetchSuccess({});
    const result = await getTool('ghl_delete_association').handler(
      { associationId: 'assoc1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/associations/assoc1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, {});
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_delete_association').handler(
      { associationId: 'assoc1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});

// ── ghl_list_associations ───────────────────────────────────────────────────

describe('ghl_list_associations', () => {
  it('calls GET /associations/ with locationId, skip, limit', async () => {
    const fetch = mockFetchSuccess({ associations: [] });
    const result = await getTool('ghl_list_associations').handler(
      { skip: 0, limit: 20 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/associations/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.skip).toBe('0');
    expect(call.params.limit).toBe('20');
    expectSuccess(result, { associations: [] });
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_list_associations').handler(
      { skip: 0, limit: 20 },
      TEST_CONFIG
    );
    expectError(result, 401);
  });
});
