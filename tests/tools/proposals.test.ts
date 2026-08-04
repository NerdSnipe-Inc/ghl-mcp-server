import { describe, it, expect } from 'vitest';
import { proposalTools } from '../../src/tools/proposals.js';
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
  const tool = proposalTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_proposal_documents ──────────────────────────────────────────────

describe('ghl_get_proposal_documents', () => {
  it('calls GET /proposals/document with locationId', async () => {
    const fetch = mockFetchSuccess({ documents: [], total: 0 });
    const result = await getTool('ghl_get_proposal_documents').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/proposals/document');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { documents: [], total: 0 });
  });

  it('passes optional filters', async () => {
    const fetch = mockFetchSuccess({ documents: [], total: 0 });
    await getTool('ghl_get_proposal_documents').handler(
      {
        status: 'draft',
        paymentStatus: 'paid',
        limit: 10,
        skip: 0,
        query: 'document',
        dateFrom: '2025-02-03T18:30:00.000Z',
        dateTo: '2025-02-14T18:29:59.999Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.status).toBe('draft');
    expect(call.params.paymentStatus).toBe('paid');
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('0');
    expect(call.params.query).toBe('document');
    expect(call.params.dateFrom).toBe('2025-02-03T18:30:00.000Z');
    expect(call.params.dateTo).toBe('2025-02-14T18:29:59.999Z');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    const result = await getTool('ghl_get_proposal_documents').handler({}, TEST_CONFIG);
    expectError(result, 401);
  });

  it('rejects invalid status/paymentStatus enum values', () => {
    const schema = getTool('ghl_get_proposal_documents').inputSchema;
    expect(schema.safeParse({ status: 'archived' }).success).toBe(false);
    expect(schema.safeParse({ paymentStatus: 'refunded' }).success).toBe(false);
    expect(schema.safeParse({ status: 'draft', paymentStatus: 'paid' }).success).toBe(true);
  });
});

// ── ghl_send_proposal_document ──────────────────────────────────────────────

describe('ghl_send_proposal_document', () => {
  it('calls POST /proposals/document/send with required fields plus locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_send_proposal_document').handler(
      { documentId: 'doc1', sentBy: 'user1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/proposals/document/send');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.documentId).toBe('doc1');
    expect(call.body.sentBy).toBe('user1');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional documentName, medium, ccRecipients, notificationSettings', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const ccRecipients = [
      {
        id: 'u1',
        email: 'jim@gmail.com',
        imageUrl: 'https://example.com/jim.png',
        contactName: 'Jim Doe',
        firstName: 'Jim',
        lastName: 'Doe',
      },
    ];
    const notificationSettings = {
      sender: { fromName: 'A', fromEmail: 'a@b.com' },
      receive: { templateId: 't1', subject: 'Hello' },
    };
    await getTool('ghl_send_proposal_document').handler(
      {
        documentId: 'doc1',
        sentBy: 'user1',
        documentName: 'New Document',
        medium: 'email',
        ccRecipients,
        notificationSettings,
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.documentName).toBe('New Document');
    expect(call.body.medium).toBe('email');
    expect(call.body.ccRecipients).toEqual(ccRecipients);
    expect(call.body.notificationSettings).toEqual(notificationSettings);
  });

  it('handles API errors', async () => {
    mockFetchError(400, { message: 'Bad request' });
    const result = await getTool('ghl_send_proposal_document').handler(
      { documentId: 'doc1', sentBy: 'user1' },
      TEST_CONFIG
    );
    expectError(result, 400);
  });

  it('rejects incomplete ccRecipients/notificationSettings shapes', () => {
    const schema = getTool('ghl_send_proposal_document').inputSchema;
    expect(
      schema.safeParse({
        documentId: 'd1',
        sentBy: 'u1',
        ccRecipients: [{ id: 'u1', email: 'jim@gmail.com' }], // missing imageUrl/contactName/firstName/lastName
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        documentId: 'd1',
        sentBy: 'u1',
        notificationSettings: { sender: { fromEmail: 'a@b.com', fromName: 'A' } }, // missing receive
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        documentId: 'd1',
        sentBy: 'u1',
        ccRecipients: [
          {
            id: 'u1',
            email: 'jim@gmail.com',
            imageUrl: 'https://example.com/jim.png',
            contactName: 'Jim Doe',
            firstName: 'Jim',
            lastName: 'Doe',
          },
        ],
        notificationSettings: {
          sender: { fromEmail: 'a@b.com', fromName: 'A' },
          receive: { templateId: 't1', subject: 'Hi' },
        },
      }).success
    ).toBe(true);
  });
});

// ── ghl_get_proposal_templates ──────────────────────────────────────────────

describe('ghl_get_proposal_templates', () => {
  it('calls GET /proposals/templates with locationId', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    const result = await getTool('ghl_get_proposal_templates').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/proposals/templates');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expectSuccess(result, { data: [], total: 0 });
  });

  it('passes optional filters', async () => {
    const fetch = mockFetchSuccess({ data: [], total: 0 });
    await getTool('ghl_get_proposal_templates').handler(
      {
        dateFrom: '2025-02-03T18:30:00.000Z',
        dateTo: '2025-02-14T18:29:59.999Z',
        type: 'proposal,estimate',
        name: 'Template Name',
        isPublicDocument: true,
        userId: 'user1',
        limit: '10',
        skip: '0',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.dateFrom).toBe('2025-02-03T18:30:00.000Z');
    expect(call.params.dateTo).toBe('2025-02-14T18:29:59.999Z');
    expect(call.params.type).toBe('proposal,estimate');
    expect(call.params.name).toBe('Template Name');
    expect(call.params.isPublicDocument).toBe('true');
    expect(call.params.userId).toBe('user1');
    expect(call.params.limit).toBe('10');
    expect(call.params.skip).toBe('0');
  });

  it('handles API errors', async () => {
    mockFetchError(500, { message: 'Server error' });
    const result = await getTool('ghl_get_proposal_templates').handler({}, TEST_CONFIG);
    expectError(result, 500);
  });
});

// ── ghl_send_proposal_template ──────────────────────────────────────────────

describe('ghl_send_proposal_template', () => {
  it('calls POST /proposals/templates/send with required fields plus locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    const result = await getTool('ghl_send_proposal_template').handler(
      { templateId: 'tmpl1', userId: 'user1', contactId: 'contact1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/proposals/templates/send');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body.templateId).toBe('tmpl1');
    expect(call.body.userId).toBe('user1');
    expect(call.body.contactId).toBe('contact1');
    expectSuccess(result, MOCK_DATA);
  });

  it('passes optional sendDocument and opportunityId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_send_proposal_template').handler(
      {
        templateId: 'tmpl1',
        userId: 'user1',
        contactId: 'contact1',
        sendDocument: true,
        opportunityId: 'opp1',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body.sendDocument).toBe(true);
    expect(call.body.opportunityId).toBe('opp1');
  });

  it('handles API errors', async () => {
    mockFetchError(404, { message: 'Not found' });
    const result = await getTool('ghl_send_proposal_template').handler(
      { templateId: 'tmpl1', userId: 'user1', contactId: 'contact1' },
      TEST_CONFIG
    );
    expectError(result, 404);
  });
});
