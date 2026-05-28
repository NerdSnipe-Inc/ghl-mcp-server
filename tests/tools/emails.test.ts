import { describe, it, expect } from 'vitest';
import { emailBuilderTools, emailCampaignTools } from '../../src/tools/emails.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const allEmailTools = [...emailBuilderTools, ...emailCampaignTools];

const getTool = (name: string) => {
  const tool = allEmailTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_email_builder_templates ──────────────────────────────────────────

describe('ghl_get_email_builder_templates', () => {
  it('calls GET /emails/builder with locationId', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    await getTool('ghl_get_email_builder_templates').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/emails/builder');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes limit, offset, and sortByDate params', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    await getTool('ghl_get_email_builder_templates').handler(
      { limit: 10, offset: 20, sortByDate: 'asc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('20');
    expect(call.params.sortByDate).toBe('asc');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(
      await getTool('ghl_get_email_builder_templates').handler({}, TEST_CONFIG),
      401
    );
  });
});

// ── ghl_get_email_builder_template ────────────────────────────────────────────

describe('ghl_get_email_builder_template', () => {
  it('calls GET /emails/builder/:locationId/:templateId', async () => {
    const fetch = mockFetchSuccess({ template: { id: 'tmpl-1' } });
    await getTool('ghl_get_email_builder_template').handler(
      { templateId: 'tmpl-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(
      `/emails/builder/${TEST_CONFIG.locationId}/tmpl-1`
    );
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_email_builder_template').handler(
        { templateId: 'bad' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_create_email_builder_template ────────────────────────────────────────

describe('ghl_create_email_builder_template', () => {
  it('calls POST /emails/builder then POST /emails/builder/data', async () => {
    // First call creates skeleton, second pushes HTML
    const fetch = mockFetchSuccess({ redirect: 'new-template-id', traceId: 'trace-1' });
    const result = await getTool('ghl_create_email_builder_template').handler(
      { name: 'My Template', html: '<h1>Hello</h1>' },
      TEST_CONFIG
    );

    // The handler makes two fetches — first call creates the skeleton
    expect(fetch).toHaveBeenCalledTimes(2);
    const firstCallArgs = fetch.mock.calls[0] as [string, RequestInit];
    const firstUrl = new URL(firstCallArgs[0]);
    expect(firstUrl.pathname).toBe('/emails/builder');
    expect(firstCallArgs[1].method).toBe('POST');

    const firstBody = JSON.parse(firstCallArgs[1].body as string) as Record<string, unknown>;
    expect(firstBody.locationId).toBe(TEST_CONFIG.locationId);
    expect(firstBody.name).toBe('My Template');
    expect(firstBody.type).toBe('html');

    // Second call pushes HTML
    const secondCallArgs = fetch.mock.calls[1] as [string, RequestInit];
    const secondUrl = new URL(secondCallArgs[0]);
    expect(secondUrl.pathname).toBe('/emails/builder/data');
    expect(secondCallArgs[1].method).toBe('POST');

    const secondBody = JSON.parse(secondCallArgs[1].body as string) as Record<string, unknown>;
    expect(secondBody.html).toBe('<h1>Hello</h1>');
    expect(secondBody.editorType).toBe('html');

    const parsed = JSON.parse(result) as Record<string, unknown>;
    expect(parsed.templateId).toBe('new-template-id');
  });

  it('handles API errors on skeleton creation', async () => {
    mockFetchError(422, { message: 'Invalid template' });
    expectError(
      await getTool('ghl_create_email_builder_template').handler(
        { name: 'Bad', html: '<h1>x</h1>' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_update_email_builder_template ────────────────────────────────────────

describe('ghl_update_email_builder_template', () => {
  it('calls POST /emails/builder/data with templateId and html', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_email_builder_template').handler(
      { templateId: 'tmpl-1', html: '<h1>Updated</h1>' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/emails/builder/data');
    expect(call.body?.templateId).toBe('tmpl-1');
    expect(call.body?.html).toBe('<h1>Updated</h1>');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('handles errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    expectError(
      await getTool('ghl_update_email_builder_template').handler(
        { templateId: 'tmpl-1', html: '<h1>x</h1>' },
        TEST_CONFIG
      ),
      500
    );
  });
});

// ── ghl_delete_email_builder_template ────────────────────────────────────────

describe('ghl_delete_email_builder_template', () => {
  it('calls DELETE /emails/builder/:locationId/:templateId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_email_builder_template').handler(
      { templateId: 'tmpl-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(
      `/emails/builder/${TEST_CONFIG.locationId}/tmpl-1`
    );
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_delete_email_builder_template').handler(
        { templateId: 'bad' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_get_email_campaigns ───────────────────────────────────────────────────

describe('ghl_get_email_campaigns', () => {
  it('calls GET /emails/schedule with campaignsOnly=true and locationId', async () => {
    const fetch = mockFetchSuccess({ campaigns: [] });
    await getTool('ghl_get_email_campaigns').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/emails/schedule');
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.campaignsOnly).toBe('true');
  });

  it('passes status, limit, and offset params', async () => {
    const fetch = mockFetchSuccess({ campaigns: [] });
    await getTool('ghl_get_email_campaigns').handler(
      { status: 'sent', limit: 5, offset: 10 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.status).toBe('sent');
    expect(call.params.limit).toBe('5');
    expect(call.params.offset).toBe('10');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(
      await getTool('ghl_get_email_campaigns').handler({}, TEST_CONFIG),
      401
    );
  });
});

// ── ghl_get_email_campaign ────────────────────────────────────────────────────

describe('ghl_get_email_campaign', () => {
  it('calls GET /emails/schedule/:campaignId', async () => {
    const fetch = mockFetchSuccess({ campaign: { id: 'camp-1' } });
    await getTool('ghl_get_email_campaign').handler(
      { campaignId: 'camp-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/emails/schedule/camp-1');
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_email_campaign').handler(
        { campaignId: 'bad-id' },
        TEST_CONFIG
      ),
      404
    );
  });
});

// ── ghl_create_email_campaign ─────────────────────────────────────────────────

describe('ghl_create_email_campaign', () => {
  it('calls POST /emails/schedule with locationId and required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_email_campaign').handler(
      { name: 'My Campaign', templateId: 'tmpl-1', subject: 'Hello World' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/emails/schedule');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.name).toBe('My Campaign');
    expect(call.body?.templateId).toBe('tmpl-1');
    expect(call.body?.subject).toBe('Hello World');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Validation error' });
    expectError(
      await getTool('ghl_create_email_campaign').handler(
        { name: 'Bad', templateId: 'tmpl-1', subject: 'x' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_delete_email_campaign ─────────────────────────────────────────────────

describe('ghl_delete_email_campaign', () => {
  it('calls DELETE /emails/schedule/:campaignId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_email_campaign').handler(
      { campaignId: 'camp-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/emails/schedule/camp-1');
  });

  it('handles errors', async () => {
    mockFetchError(404, { message: 'Campaign not found' });
    expectError(
      await getTool('ghl_delete_email_campaign').handler(
        { campaignId: 'bad-id' },
        TEST_CONFIG
      ),
      404
    );
  });
});
