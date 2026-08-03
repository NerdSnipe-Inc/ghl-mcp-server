import { describe, it, expect } from 'vitest';
import { formTools } from '../../src/tools/forms.js';
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
  const tool = formTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_forms ──────────────────────────────────────────────────────────────

describe('ghl_get_forms', () => {
  it('calls GET /forms/ with locationId', async () => {
    const fetch = mockFetchSuccess({ forms: [] });
    const result = await getTool('ghl_get_forms').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/forms/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { forms: [] });
  });

  it('passes optional query params', async () => {
    const fetch = mockFetchSuccess({ forms: [] });
    await getTool('ghl_get_forms').handler(
      { limit: 10, skip: 5, type: 'folder' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('5');
    expect(call.params.type).toBe('folder');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_forms').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });
});

// ── ghl_get_form_submissions ────────────────────────────────────────────────────

describe('ghl_get_form_submissions', () => {
  it('calls GET /forms/submissions with locationId', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    const result = await getTool('ghl_get_form_submissions').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/forms/submissions');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { submissions: [] });
  });

  it('passes optional filter params', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    await getTool('ghl_get_form_submissions').handler(
      {
        formId: 'form-1',
        startAt: '2024-01-01',
        endAt: '2024-01-31',
        limit: 50,
        page: 2,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.formId).toBe('form-1');
    expect(call.params.startAt).toBe('2024-01-01');
    expect(call.params.endAt).toBe('2024-01-31');
    expect(call.params.limit).toBe('50');
    expect(call.params.page).toBe('2');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Invalid request' });
    const result = await getTool('ghl_get_form_submissions').handler({}, TEST_CONFIG);
    expectError(result, 422);
  });
});
