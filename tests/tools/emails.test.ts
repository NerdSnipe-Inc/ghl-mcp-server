import { describe, it, expect } from 'vitest';
import { emailBuilderTools, emailCampaignTools } from '../../src/tools/emails.js';
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

const allEmailTools = [...emailBuilderTools, ...emailCampaignTools];

const getTool = (name: string) => {
  const tool = allEmailTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

const TEMPLATES_PATH = `/emails/locations/${TEST_CONFIG.locationId}/templates`;
const CAMPAIGNS_PATH = `/emails/locations/${TEST_CONFIG.locationId}/campaigns/emails`;

// ── ghl_get_email_builder_templates ──────────────────────────────────────────

describe('ghl_get_email_builder_templates', () => {
  it('calls GET /emails/locations/:locationId/templates with the v3 Version header', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    await getTool('ghl_get_email_builder_templates').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(TEMPLATES_PATH);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('passes limit, offset, sortOrder, search and archived params', async () => {
    const fetch = mockFetchSuccess({ templates: [] });
    await getTool('ghl_get_email_builder_templates').handler(
      { limit: 10, offset: 20, sortOrder: 'asc', search: 'newsletter', archived: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.limit).toBe('10');
    expect(call.params.offset).toBe('20');
    expect(call.params.sortOrder).toBe('asc');
    expect(call.params.search).toBe('newsletter');
    expect(call.params.archived).toBe('true');
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
  it('calls GET /emails/locations/:locationId/templates/:templateId', async () => {
    const fetch = mockFetchSuccess({ id: 'tmpl-1' });
    const result = await getTool('ghl_get_email_builder_template').handler(
      { templateId: 'tmpl-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`${TEMPLATES_PATH}/tmpl-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { id: 'tmpl-1' });
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
  it('creates the template in a single POST with editorType/editorContent', async () => {
    const fetch = mockFetchSuccess({ id: 'new-template-id', name: 'My Template' });
    const result = await getTool('ghl_create_email_builder_template').handler(
      { name: 'My Template', html: '<h1>Hello</h1>' },
      TEST_CONFIG
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(TEMPLATES_PATH);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.name).toBe('My Template');
    expect(call.body?.editorType).toBe('html');
    expect(call.body?.editorContent).toBe('<h1>Hello</h1>');
    expectSuccess(result, { id: 'new-template-id', name: 'My Template' });
  });

  it('includes previewText when provided and omits it otherwise', async () => {
    const withPreview = mockFetchSuccess({ id: 'a' });
    await getTool('ghl_create_email_builder_template').handler(
      { name: 'T', html: '<p>x</p>', previewText: 'Peek inside' },
      TEST_CONFIG
    );
    expect(parseLastFetchCall(withPreview).body?.previewText).toBe('Peek inside');

    const withoutPreview = mockFetchSuccess({ id: 'a' });
    await getTool('ghl_create_email_builder_template').handler(
      { name: 'T', html: '<p>x</p>' },
      TEST_CONFIG
    );
    expect(parseLastFetchCall(withoutPreview).body).not.toHaveProperty('previewText');
  });

  it('handles API errors', async () => {
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
  it('calls PATCH /emails/locations/:locationId/templates/:templateId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_email_builder_template').handler(
      { templateId: 'tmpl-1', html: '<h1>Updated</h1>' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PATCH');
    expect(call.pathname).toBe(`${TEMPLATES_PATH}/tmpl-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    // editorContent must be sent together with editorType per the v3 schema
    expect(call.body?.editorContent).toBe('<h1>Updated</h1>');
    expect(call.body?.editorType).toBe('html');
  });

  it('supports metadata-only updates without editor content', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_email_builder_template').handler(
      { templateId: 'tmpl-1', name: 'Renamed', previewText: 'New peek' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.name).toBe('Renamed');
    expect(call.body?.previewText).toBe('New peek');
    expect(call.body).not.toHaveProperty('editorContent');
    expect(call.body).not.toHaveProperty('editorType');
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
  it('calls DELETE /emails/locations/:locationId/templates/:templateId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_email_builder_template').handler(
      { templateId: 'tmpl-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`${TEMPLATES_PATH}/tmpl-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
  it('calls GET /emails/locations/:locationId/campaigns/emails', async () => {
    const fetch = mockFetchSuccess({ campaigns: [] });
    await getTool('ghl_get_email_campaigns').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(CAMPAIGNS_PATH);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });

  it('passes status, search, limit, and offset params', async () => {
    const fetch = mockFetchSuccess({ campaigns: [] });
    await getTool('ghl_get_email_campaigns').handler(
      { status: 'sent', search: 'feb', limit: 5, offset: 10 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.status).toBe('sent');
    expect(call.params.search).toBe('feb');
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
  it('calls GET /emails/locations/:locationId/campaigns/emails/:campaignId', async () => {
    const fetch = mockFetchSuccess({ id: 'camp-1' });
    await getTool('ghl_get_email_campaign').handler(
      { campaignId: 'camp-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe(`${CAMPAIGNS_PATH}/camp-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
  it('calls POST /emails/locations/:locationId/campaigns/emails with v3 body fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_email_campaign').handler(
      {
        name: 'My Campaign',
        templateId: 'tmpl-1',
        userId: 'user-1',
        timeZone: 'America/New_York',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe(CAMPAIGNS_PATH);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.name).toBe('My Campaign');
    expect(call.body?.templateId).toBe('tmpl-1');
    expect(call.body?.userId).toBe('user-1');
    expect(call.body?.timeZone).toBe('America/New_York');
    expect(call.body?.editorType).toBe('html');
    // locationId is a path segment in v3, not a body field
    expect(call.body).not.toHaveProperty('locationId');
  });

  it('omits templateId when creating a blank campaign', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_email_campaign').handler(
      { name: 'Blank', userId: 'user-1', timeZone: 'UTC' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body).not.toHaveProperty('templateId');
  });

  it('handles API errors', async () => {
    mockFetchError(422, { message: 'Validation error' });
    expectError(
      await getTool('ghl_create_email_campaign').handler(
        { name: 'Bad', userId: 'user-1', timeZone: 'UTC' },
        TEST_CONFIG
      ),
      422
    );
  });
});

// ── ghl_delete_email_campaign ─────────────────────────────────────────────────

describe('ghl_delete_email_campaign', () => {
  it('calls DELETE /emails/locations/:locationId/campaigns/emails/:campaignId', async () => {
    const fetch = mockFetchSuccess({ success: true });
    await getTool('ghl_delete_email_campaign').handler(
      { campaignId: 'camp-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe(`${CAMPAIGNS_PATH}/camp-1`);
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
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
