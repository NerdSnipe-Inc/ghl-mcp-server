import { describe, it, expect } from 'vitest';
import { surveyTools } from '../../src/tools/surveys.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = surveyTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_surveys ───────────────────────────────────────────────────────────

describe('ghl_get_surveys', () => {
  it('calls GET /surveys/ with locationId', async () => {
    const fetch = mockFetchSuccess({ surveys: [] });
    await getTool('ghl_get_surveys').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/surveys/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes limit, skip, and type params', async () => {
    const fetch = mockFetchSuccess({ surveys: [] });
    await getTool('ghl_get_surveys').handler(
      { limit: 10, skip: 5, type: 'quiz' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('5');
    expect(call.params.type).toBe('quiz');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_surveys').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_get_survey_submissions ────────────────────────────────────────────────

describe('ghl_get_survey_submissions', () => {
  it('calls GET /surveys/submissions with locationId', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    await getTool('ghl_get_survey_submissions').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/surveys/submissions');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes surveyId and q filters', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    await getTool('ghl_get_survey_submissions').handler(
      { surveyId: 'survey-1', q: 'contact-abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.surveyId).toBe('survey-1');
    expect(call.params.q).toBe('contact-abc');
  });

  it('does not accept contactId (not a real SearchSubmissionsDTO field)', () => {
    const schema = getTool('ghl_get_survey_submissions').inputSchema;
    const result = schema.safeParse({ contactId: 'contact-abc' });
    // Extra unknown keys are stripped by default zod object parsing, not rejected —
    // assert the parsed output no longer carries contactId through to the request.
    expect(result.success).toBe(true);
    expect((result.data as Record<string, unknown>).contactId).toBeUndefined();
  });

  it('passes date range filters', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    await getTool('ghl_get_survey_submissions').handler(
      { startAt: '2024-01-01', endAt: '2024-12-31', limit: 10, page: 2 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.startAt).toBe('2024-01-01');
    expect(call.params.endAt).toBe('2024-12-31');
    expect(call.params.limit).toBe('10');
    expect(call.params.page).toBe('2');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_get_survey_submissions').handler({}, TEST_CONFIG),
      500
    );
  });
});
