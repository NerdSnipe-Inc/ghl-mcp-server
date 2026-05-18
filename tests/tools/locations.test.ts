import { describe, it, expect } from 'vitest';
import { locationTools } from '../../src/tools/location.js';
import { tagTools } from '../../src/tools/tags.js';
import { customFieldTools } from '../../src/tools/custom_fields.js';
import { customValueTools } from '../../src/tools/custom_values.js';
import { userTools } from '../../src/tools/users.js';
import { templateTools } from '../../src/tools/templates.js';
import { formTools } from '../../src/tools/forms.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const ALL_LOCATION_TOOLS = [
  ...locationTools,
  ...tagTools,
  ...customFieldTools,
  ...customValueTools,
  ...userTools,
  ...templateTools,
  ...formTools,
];

const getTool = (name: string) => {
  const tool = ALL_LOCATION_TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_location ──────────────────────────────────────────────────────────

describe('ghl_get_location', () => {
  it('calls GET /locations/:locationId', async () => {
    const fetch = mockFetchSuccess({ location: { id: TEST_CONFIG.locationId } });
    await getTool('ghl_get_location').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}`);
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Location not found' });
    expectError(await getTool('ghl_get_location').handler({}, TEST_CONFIG), 404);
  });
});

// ── ghl_get_location_tags ─────────────────────────────────────────────────────

describe('ghl_get_location_tags', () => {
  it('calls GET /locations/:locationId/tags', async () => {
    const fetch = mockFetchSuccess({ tags: [] });
    await getTool('ghl_get_location_tags').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/tags`);
  });
});

// ── ghl_create_location_tag ───────────────────────────────────────────────────

describe('ghl_create_location_tag', () => {
  it('calls POST /locations/:locationId/tags with name', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_location_tag').handler({ name: 'hot-lead' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/tags`);
    expect(call.body?.name).toBe('hot-lead');
  });
});

// ── ghl_delete_location_tag ───────────────────────────────────────────────────

describe('ghl_delete_location_tag', () => {
  it('calls DELETE /locations/:locationId/tags/:tagId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_location_tag').handler({ tagId: 'tag-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/tags/tag-1`);
  });
});

// ── ghl_get_custom_fields ─────────────────────────────────────────────────────

describe('ghl_get_custom_fields', () => {
  it('calls GET /locations/:locationId/customFields', async () => {
    const fetch = mockFetchSuccess({ customFields: [] });
    await getTool('ghl_get_custom_fields').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields`);
  });
});

// ── ghl_create_custom_field ───────────────────────────────────────────────────

describe('ghl_create_custom_field', () => {
  it('calls POST /locations/:locationId/customFields with field data', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_custom_field').handler(
      { name: 'Lead Score', dataType: 'NUMERICAL' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields`);
    expect(call.body?.name).toBe('Lead Score');
    expect(call.body?.dataType).toBe('NUMERICAL');
  });

  it('includes options for dropdown fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_custom_field').handler(
      {
        name: 'Industry',
        dataType: 'SINGLE_OPTIONS',
        options: ['SaaS', 'Agency', 'E-commerce'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.options).toEqual(['SaaS', 'Agency', 'E-commerce']);
  });
});

// ── ghl_update_custom_field ───────────────────────────────────────────────────

describe('ghl_update_custom_field', () => {
  it('calls PUT /locations/:locationId/customFields/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_custom_field').handler(
      { fieldId: 'field-1', name: 'Updated Name' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields/field-1`);
    expect(call.body?.name).toBe('Updated Name');
    expect(call.body?.fieldId).toBeUndefined();
  });
});

// ── ghl_delete_custom_field ───────────────────────────────────────────────────

describe('ghl_delete_custom_field', () => {
  it('calls DELETE /locations/:locationId/customFields/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_custom_field').handler({ fieldId: 'field-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customFields/field-1`);
  });
});

// ── ghl_get_custom_values ─────────────────────────────────────────────────────

describe('ghl_get_custom_values', () => {
  it('calls GET /locations/:locationId/customValues', async () => {
    const fetch = mockFetchSuccess({ customValues: [] });
    await getTool('ghl_get_custom_values').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customValues`);
  });
});

// ── ghl_create_custom_value ───────────────────────────────────────────────────

describe('ghl_create_custom_value', () => {
  it('calls POST /locations/:locationId/customValues with name and value', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_custom_value').handler(
      { name: 'Company Phone', value: '+15551234567' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customValues`);
    expect(call.body?.name).toBe('Company Phone');
    expect(call.body?.value).toBe('+15551234567');
  });
});

// ── ghl_update_custom_value ───────────────────────────────────────────────────

describe('ghl_update_custom_value', () => {
  it('calls PUT /locations/:locationId/customValues/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_custom_value').handler(
      { valueId: 'val-1', value: '+15559999999' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/customValues/val-1`);
    expect(call.body?.value).toBe('+15559999999');
    expect(call.body?.valueId).toBeUndefined();
  });
});

// ── ghl_get_users ─────────────────────────────────────────────────────────────

describe('ghl_get_users', () => {
  it('calls GET /users/ with locationId', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_get_users').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/users/');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes limit and skip params', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_get_users').handler({ limit: 10, skip: 20 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('20');
  });
});

// ── ghl_search_users ──────────────────────────────────────────────────────────

describe('ghl_search_users', () => {
  it('calls GET /users/search with locationId and query', async () => {
    const fetch = mockFetchSuccess({ users: [] });
    await getTool('ghl_search_users').handler({ query: 'admin' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/users/search');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.query).toBe('admin');
  });
});

// ── ghl_get_templates ─────────────────────────────────────────────────────────

describe('ghl_get_templates', () => {
  it('calls GET /locations/:locationId/templates', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    await getTool('ghl_get_templates').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`/locations/${TEST_CONFIG.locationId}/templates`);
  });

  it('passes type filter when provided', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    await getTool('ghl_get_templates').handler({ type: 'sms' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.type).toBe('sms');
  });
});

// ── ghl_get_forms ─────────────────────────────────────────────────────────────

describe('ghl_get_forms', () => {
  it('calls GET /forms/ with locationId', async () => {
    const fetch = mockFetchSuccess({ forms: [] });
    await getTool('ghl_get_forms').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/forms/');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });
});

// ── ghl_get_form_submissions ──────────────────────────────────────────────────

describe('ghl_get_form_submissions', () => {
  it('calls GET /forms/submissions with locationId', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    await getTool('ghl_get_form_submissions').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/forms/submissions');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes formId and date range filters', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    await getTool('ghl_get_form_submissions').handler(
      { formId: 'form-1', startAt: '2024-01-01', endAt: '2024-12-31' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.formId).toBe('form-1');
    expect(call.params.startAt).toBe('2024-01-01');
    expect(call.params.endAt).toBe('2024-12-31');
  });
});
