import { describe, it, expect } from 'vitest';
import { contactTools } from '../../src/tools/contacts.js';
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
  const tool = contactTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_contacts removed ────────────────────────────────────────────────────
// GET /contacts/ does not exist in the real v3 spec — the tool was removed rather
// than repointed, since ghl_search_contacts (POST /contacts/search) already covers
// list/search. This test locks in the removal.

describe('ghl_get_contacts (removed)', () => {
  it('is not registered as a tool', () => {
    expect(contactTools.find((t) => t.name === 'ghl_get_contacts')).toBeUndefined();
  });
});

// ── ghl_get_contact ───────────────────────────────────────────────────────────

describe('ghl_get_contact', () => {
  it('calls GET /contacts/:id', async () => {
    const fetch = mockFetchSuccess({ contact: { id: 'abc' } });
    const result = await getTool('ghl_get_contact').handler(
      { contactId: 'abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/contacts/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expectSuccess(result, { contact: { id: 'abc' } });
  });

  it('handles 404', async () => {
    mockFetchError(404, { message: 'Not found' });
    expectError(
      await getTool('ghl_get_contact').handler({ contactId: 'bad' }, TEST_CONFIG),
      404
    );
  });
});

// ── ghl_create_contact ────────────────────────────────────────────────────────

describe('ghl_create_contact', () => {
  it('calls POST /contacts/ with body including locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_contact').handler(
      { firstName: 'Jane', email: 'jane@example.com' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/contacts/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.firstName).toBe('Jane');
    expect(call.body?.email).toBe('jane@example.com');
  });

  it('handles 422 validation error', async () => {
    mockFetchError(422, { message: 'Invalid email' });
    expectError(
      await getTool('ghl_create_contact').handler({ email: 'bad' }, TEST_CONFIG),
      422
    );
  });

  it('sends customFields as {id, fieldValue} per spec, not {id, value}', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_contact').handler(
      { customFields: [{ id: 'cf1', fieldValue: 'My Text' }] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.customFields).toEqual([{ id: 'cf1', fieldValue: 'My Text' }]);
  });

  it('passes through spec fields name, gender, dateOfBirth, assignedTo, dndSettings, inboundDndSettings', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_contact').handler(
      {
        name: 'Jane Doe',
        gender: 'female',
        dateOfBirth: '1990-01-01',
        assignedTo: 'user-1',
        dndSettings: { call: { status: 'active', message: 'Do not call' } },
        inboundDndSettings: { all: { status: 'active', message: 'Do not contact' } },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.name).toBe('Jane Doe');
    expect(call.body?.gender).toBe('female');
    expect(call.body?.dateOfBirth).toBe('1990-01-01');
    expect(call.body?.assignedTo).toBe('user-1');
    expect(call.body?.dndSettings).toEqual({ call: { status: 'active', message: 'Do not call' } });
    expect(call.body?.inboundDndSettings).toEqual({ all: { status: 'active', message: 'Do not contact' } });
  });
});

// ── ghl_update_contact ────────────────────────────────────────────────────────

describe('ghl_update_contact', () => {
  it('calls PUT /contacts/:id with update fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_contact').handler(
      { contactId: 'abc', firstName: 'Updated' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/contacts/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.firstName).toBe('Updated');
    expect(call.body?.contactId).toBeUndefined();
  });

  it('sends customFields as {id, fieldValue} per spec', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_contact').handler(
      { contactId: 'abc', customFields: [{ id: 'cf1', fieldValue: 'Updated Text' }] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.customFields).toEqual([{ id: 'cf1', fieldValue: 'Updated Text' }]);
  });

  it('passes through spec fields name, dateOfBirth, assignedTo, dndSettings, inboundDndSettings', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_contact').handler(
      {
        contactId: 'abc',
        name: 'Jane Doe',
        dateOfBirth: '1990-01-01',
        assignedTo: 'user-1',
        dndSettings: { email: { status: 'inactive' } },
        inboundDndSettings: { all: { status: 'active' } },
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.name).toBe('Jane Doe');
    expect(call.body?.dateOfBirth).toBe('1990-01-01');
    expect(call.body?.assignedTo).toBe('user-1');
    expect(call.body?.dndSettings).toEqual({ email: { status: 'inactive' } });
    expect(call.body?.inboundDndSettings).toEqual({ all: { status: 'active' } });
  });
});

// ── ghl_upsert_contact ────────────────────────────────────────────────────────

describe('ghl_upsert_contact', () => {
  it('calls POST /contacts/upsert with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_contact').handler(
      { email: 'jane@example.com', firstName: 'Jane' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/contacts/upsert');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.email).toBe('jane@example.com');
  });

  it('sends customFields as {id, fieldValue} and passes through missing spec fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_upsert_contact').handler(
      {
        email: 'jane@example.com',
        name: 'Jane Doe',
        gender: 'female',
        address1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        website: 'https://example.com',
        timezone: 'America/Chicago',
        dnd: true,
        inboundDndSettings: { all: { status: 'active' } },
        dateOfBirth: '1990-01-01',
        country: 'US',
        assignedTo: 'user-1',
        createNewIfDuplicateAllowed: true,
        dndSettings: { sms: { status: 'active' } },
        customFields: [{ id: 'cf1', fieldValue: 'x' }],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.name).toBe('Jane Doe');
    expect(call.body?.gender).toBe('female');
    expect(call.body?.address1).toBe('123 Main St');
    expect(call.body?.city).toBe('Austin');
    expect(call.body?.state).toBe('TX');
    expect(call.body?.postalCode).toBe('78701');
    expect(call.body?.website).toBe('https://example.com');
    expect(call.body?.timezone).toBe('America/Chicago');
    expect(call.body?.dnd).toBe(true);
    expect(call.body?.inboundDndSettings).toEqual({ all: { status: 'active' } });
    expect(call.body?.dateOfBirth).toBe('1990-01-01');
    expect(call.body?.country).toBe('US');
    expect(call.body?.assignedTo).toBe('user-1');
    expect(call.body?.createNewIfDuplicateAllowed).toBe(true);
    expect(call.body?.dndSettings).toEqual({ sms: { status: 'active' } });
    expect(call.body?.customFields).toEqual([{ id: 'cf1', fieldValue: 'x' }]);
  });
});

// ── ghl_delete_contact ────────────────────────────────────────────────────────

describe('ghl_delete_contact', () => {
  it('calls DELETE /contacts/:id', async () => {
    const fetch = mockFetchSuccess({ deleted: true });
    await getTool('ghl_delete_contact').handler({ contactId: 'abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/contacts/abc');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_search_contacts ───────────────────────────────────────────────────────

describe('ghl_search_contacts', () => {
  it('calls POST /contacts/search with locationId in body', async () => {
    const fetch = mockFetchSuccess({ contacts: [] });
    await getTool('ghl_search_contacts').handler(
      { query: 'Jane' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/contacts/search');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.query).toBe('Jane');
  });

  it('includes filters in body when provided', async () => {
    const fetch = mockFetchSuccess({ contacts: [] });
    const filters = [{ field: 'tags', operator: 'contains', value: 'vip' }];
    await getTool('ghl_search_contacts').handler({ filters }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.body?.filters).toEqual(filters);
  });
});

// ── ghl_add_contact_tags ──────────────────────────────────────────────────────

describe('ghl_add_contact_tags', () => {
  it('calls POST /contacts/:id/tags with tags array', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_add_contact_tags').handler(
      { contactId: 'abc', tags: ['vip', 'hot-lead'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/contacts/abc/tags');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.tags).toEqual(['vip', 'hot-lead']);
  });
});

// ── ghl_remove_contact_tags ───────────────────────────────────────────────────

describe('ghl_remove_contact_tags', () => {
  it('calls DELETE /contacts/:id/tags with tags array', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_remove_contact_tags').handler(
      { contactId: 'abc', tags: ['old-tag'] },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/contacts/abc/tags');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.tags).toEqual(['old-tag']);
  });
});

// ── ghl_get_contact_notes ─────────────────────────────────────────────────────

describe('ghl_get_contact_notes', () => {
  it('calls GET /contacts/:id/notes', async () => {
    const fetch = mockFetchSuccess({ notes: [] });
    await getTool('ghl_get_contact_notes').handler({ contactId: 'abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/contacts/abc/notes');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_create_contact_note ───────────────────────────────────────────────────

describe('ghl_create_contact_note', () => {
  it('calls POST /contacts/:id/notes with body', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_contact_note').handler(
      { contactId: 'abc', body: 'Called, left voicemail' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/contacts/abc/notes');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.body).toBe('Called, left voicemail');
  });

  it('includes userId when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_contact_note').handler(
      { contactId: 'abc', body: 'Note text', userId: 'user-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.userId).toBe('user-1');
  });

  it('includes title, color, pinned when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_contact_note').handler(
      { contactId: 'abc', body: 'Note text', title: 'Follow-up', color: '#FFAA00', pinned: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.title).toBe('Follow-up');
    expect(call.body?.color).toBe('#FFAA00');
    expect(call.body?.pinned).toBe(true);
  });
});

// ── ghl_update_contact_note ───────────────────────────────────────────────────

describe('ghl_update_contact_note', () => {
  it('calls PUT /contacts/:id/notes/:noteId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_contact_note').handler(
      { contactId: 'abc', noteId: 'note-1', body: 'Updated note' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/contacts/abc/notes/note-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.body).toBe('Updated note');
  });

  it('does not require body — spec has no required fields on update', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_contact_note').handler(
      { contactId: 'abc', noteId: 'note-1', pinned: true },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.body).toBeUndefined();
    expect(call.body?.pinned).toBe(true);
  });

  it('includes title and color when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_contact_note').handler(
      { contactId: 'abc', noteId: 'note-1', title: 'New title', color: '#FF0000' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.title).toBe('New title');
    expect(call.body?.color).toBe('#FF0000');
  });
});

// ── ghl_delete_contact_note ───────────────────────────────────────────────────

describe('ghl_delete_contact_note', () => {
  it('calls DELETE /contacts/:id/notes/:noteId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_contact_note').handler(
      { contactId: 'abc', noteId: 'note-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/contacts/abc/notes/note-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_get_contact_tasks ─────────────────────────────────────────────────────

describe('ghl_get_contact_tasks', () => {
  it('calls GET /contacts/:id/tasks', async () => {
    const fetch = mockFetchSuccess({ tasks: [] });
    await getTool('ghl_get_contact_tasks').handler({ contactId: 'abc' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/contacts/abc/tasks');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_create_contact_task ───────────────────────────────────────────────────

describe('ghl_create_contact_task', () => {
  it('calls POST /contacts/:id/tasks with task data', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_contact_task').handler(
      {
        contactId: 'abc',
        title: 'Follow up',
        dueDate: '2024-12-31T17:00:00Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/contacts/abc/tasks');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.title).toBe('Follow up');
    expect(call.body?.dueDate).toBe('2024-12-31T17:00:00Z');
    expect(call.body?.contactId).toBeUndefined();
  });
});

// ── ghl_update_contact_task ───────────────────────────────────────────────────

describe('ghl_update_contact_task', () => {
  it('calls PUT /contacts/:id/tasks/:taskId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_contact_task').handler(
      { contactId: 'abc', taskId: 'task-1', status: 'completed' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/contacts/abc/tasks/task-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.status).toBe('completed');
    expect(call.body?.contactId).toBeUndefined();
    expect(call.body?.taskId).toBeUndefined();
  });
});

// ── ghl_delete_contact_task ───────────────────────────────────────────────────

describe('ghl_delete_contact_task', () => {
  it('calls DELETE /contacts/:id/tasks/:taskId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_contact_task').handler(
      { contactId: 'abc', taskId: 'task-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/contacts/abc/tasks/task-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_add_contact_to_workflow ───────────────────────────────────────────────

describe('ghl_add_contact_to_workflow', () => {
  it('calls POST /contacts/:id/workflow/:workflowId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_add_contact_to_workflow').handler(
      { contactId: 'abc', workflowId: 'wf-123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/contacts/abc/workflow/wf-123');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body).toEqual({});
  });

  it('passes eventStartTime in body when provided', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_add_contact_to_workflow').handler(
      {
        contactId: 'abc',
        workflowId: 'wf-123',
        eventStartTime: '2024-12-15T09:00:00Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.eventStartTime).toBe('2024-12-15T09:00:00Z');
  });
});

// ── ghl_remove_contact_from_workflow ─────────────────────────────────────────

describe('ghl_remove_contact_from_workflow', () => {
  it('calls DELETE /contacts/:id/workflow/:workflowId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_remove_contact_from_workflow').handler(
      { contactId: 'abc', workflowId: 'wf-123' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/contacts/abc/workflow/wf-123');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_get_contact_appointments ─────────────────────────────────────────────

describe('ghl_get_contact_appointments', () => {
  it('calls GET /contacts/:id/appointments', async () => {
    const fetch = mockFetchSuccess({ appointments: [] });
    await getTool('ghl_get_contact_appointments').handler(
      { contactId: 'abc' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/contacts/abc/appointments');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});
