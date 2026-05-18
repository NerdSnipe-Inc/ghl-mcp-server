import { describe, it, expect } from 'vitest';
import { surveyTools } from '../../src/tools/surveys.js';
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
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes surveyId and contactId filters', async () => {
    const fetch = mockFetchSuccess({ submissions: [] });
    await getTool('ghl_get_survey_submissions').handler(
      { surveyId: 'survey-1', contactId: 'contact-abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.surveyId).toBe('survey-1');
    expect(call.params.contactId).toBe('contact-abc');
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
