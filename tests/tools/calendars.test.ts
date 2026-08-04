import { describe, it, expect } from 'vitest';
import { calendarTools } from '../../src/tools/calendars.js';
import { GHL_VERSION_V3 } from '../../src/client.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

const getTool = (name: string) => {
  const tool = calendarTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
};

// ── ghl_get_calendars ─────────────────────────────────────────────────────────

describe('ghl_get_calendars', () => {
  it('calls GET /calendars/ with locationId', async () => {
    const fetch = mockFetchSuccess({ calendars: [] });
    await getTool('ghl_get_calendars').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/calendars/');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes groupId filter when provided', async () => {
    const fetch = mockFetchSuccess({ calendars: [] });
    await getTool('ghl_get_calendars').handler({ groupId: 'grp-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.groupId).toBe('grp-1');
  });

  it('passes showDrafted filter when provided', async () => {
    const fetch = mockFetchSuccess({ calendars: [] });
    await getTool('ghl_get_calendars').handler({ showDrafted: false }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.showDrafted).toBe('false');
  });

  it('handles API errors', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    expectError(await getTool('ghl_get_calendars').handler({}, TEST_CONFIG), 401);
  });
});

// ── ghl_get_calendar ──────────────────────────────────────────────────────────

describe('ghl_get_calendar', () => {
  it('calls GET /calendars/:id', async () => {
    const fetch = mockFetchSuccess({ calendar: { id: 'cal-1' } });
    await getTool('ghl_get_calendar').handler({ calendarId: 'cal-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/calendars/cal-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_get_free_slots ────────────────────────────────────────────────────────

describe('ghl_get_free_slots', () => {
  it('calls GET /calendars/:id/free-slots with date range', async () => {
    const fetch = mockFetchSuccess({ slots: [] });
    const startDate = 1700000000000;
    const endDate = 1700086400000;
    await getTool('ghl_get_free_slots').handler(
      { calendarId: 'cal-1', startDate, endDate },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/calendars/cal-1/free-slots');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.startDate).toBe(String(startDate));
    expect(call.params.endDate).toBe(String(endDate));
  });

  it('passes timezone when provided', async () => {
    const fetch = mockFetchSuccess({ slots: [] });
    await getTool('ghl_get_free_slots').handler(
      {
        calendarId: 'cal-1',
        startDate: 1700000000000,
        endDate: 1700086400000,
        timezone: 'America/New_York',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.timezone).toBe('America/New_York');
  });

  it('passes userId and userIds when provided', async () => {
    const fetch = mockFetchSuccess({ slots: [] });
    await getTool('ghl_get_free_slots').handler(
      {
        calendarId: 'cal-1',
        startDate: 1700000000000,
        endDate: 1700086400000,
        userId: 'user-1',
        userIds: ['user-1', 'user-2'],
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.userId).toBe('user-1');
    expect(call.params.userIds).toBe('user-1,user-2');
  });
});

// ── ghl_get_calendar_events ───────────────────────────────────────────────────

describe('ghl_get_calendar_events', () => {
  it('calls GET /calendars/events with locationId and time range', async () => {
    const fetch = mockFetchSuccess({ events: [] });
    await getTool('ghl_get_calendar_events').handler(
      { startTime: 1700000000000, endTime: 1700086400000 },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/calendars/events');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.params.startTime).toBe('1700000000000');
    expect(call.params.endTime).toBe('1700086400000');
  });

  it('passes optional calendarId filter', async () => {
    const fetch = mockFetchSuccess({ events: [] });
    await getTool('ghl_get_calendar_events').handler(
      { startTime: 1700000000000, endTime: 1700086400000, calendarId: 'cal-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.params.calendarId).toBe('cal-1');
  });
});

// ── ghl_create_appointment ───────────────────────────────────────────────────

describe('ghl_create_appointment', () => {
  it('calls POST /calendars/events/appointments with required fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_appointment').handler(
      {
        calendarId: 'cal-1',
        contactId: 'contact-abc',
        startTime: '2024-12-15T14:00:00-05:00',
        endTime: '2024-12-15T15:00:00-05:00',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/calendars/events/appointments');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.calendarId).toBe('cal-1');
    expect(call.body?.contactId).toBe('contact-abc');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
    expect(call.body?.startTime).toBe('2024-12-15T14:00:00-05:00');
  });

  it('handles booking errors', async () => {
    mockFetchError(422, { message: 'Slot unavailable' });
    expectError(
      await getTool('ghl_create_appointment').handler(
        {
          calendarId: 'cal-1',
          contactId: 'contact-abc',
          startTime: '2024-12-15T14:00:00Z',
          endTime: '2024-12-15T15:00:00Z',
        },
        TEST_CONFIG
      ),
      422
    );
  });

  it('sends description (not notes) and the real meetingLocationType/spec fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_appointment').handler(
      {
        calendarId: 'cal-1',
        contactId: 'contact-abc',
        startTime: '2024-12-15T14:00:00-05:00',
        endTime: '2024-12-15T15:00:00-05:00',
        description: 'First consultation',
        meetingLocationType: 'gmeet',
        assignedUserId: 'user-1',
        meetingLocationId: 'custom_0',
        overrideLocationConfig: true,
        ignoreFreeSlotValidation: true,
        rrule: 'RRULE:FREQ=DAILY;INTERVAL=1;COUNT=5',
        address: '123 Main St',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.description).toBe('First consultation');
    expect(call.body?.notes).toBeUndefined();
    expect(call.body?.meetingLocationType).toBe('gmeet');
    expect(call.body?.assignedUserId).toBe('user-1');
    expect(call.body?.meetingLocationId).toBe('custom_0');
    expect(call.body?.overrideLocationConfig).toBe(true);
    expect(call.body?.ignoreFreeSlotValidation).toBe(true);
    expect(call.body?.rrule).toBe('RRULE:FREQ=DAILY;INTERVAL=1;COUNT=5');
    expect(call.body?.address).toBe('123 Main St');
  });

  it('accepts all real meetingLocationType enum values', async () => {
    for (const type of ['custom', 'zoom', 'gmeet', 'phone', 'address', 'ms_teams', 'google']) {
      const result = getTool('ghl_create_appointment').inputSchema.safeParse({
        calendarId: 'cal-1',
        contactId: 'contact-abc',
        startTime: '2024-12-15T14:00:00Z',
        endTime: '2024-12-15T15:00:00Z',
        meetingLocationType: type,
      });
      expect(result.success, `expected ${type} to be valid`).toBe(true);
    }
    const invalid = getTool('ghl_create_appointment').inputSchema.safeParse({
      calendarId: 'cal-1',
      contactId: 'contact-abc',
      startTime: '2024-12-15T14:00:00Z',
      endTime: '2024-12-15T15:00:00Z',
      meetingLocationType: 'google_meet',
    });
    expect(invalid.success).toBe(false);
  });

  it('accepts completed and active appointmentStatus values', async () => {
    for (const status of ['completed', 'active']) {
      const result = getTool('ghl_create_appointment').inputSchema.safeParse({
        calendarId: 'cal-1',
        contactId: 'contact-abc',
        startTime: '2024-12-15T14:00:00Z',
        endTime: '2024-12-15T15:00:00Z',
        appointmentStatus: status,
      });
      expect(result.success, `expected ${status} to be valid`).toBe(true);
    }
  });
});

// ── ghl_get_appointment ───────────────────────────────────────────────────────

describe('ghl_get_appointment', () => {
  it('calls GET /calendars/events/appointments/:id', async () => {
    const fetch = mockFetchSuccess({ event: { id: 'evt-1' } });
    await getTool('ghl_get_appointment').handler({ eventId: 'evt-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/calendars/events/appointments/evt-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_update_appointment ────────────────────────────────────────────────────

describe('ghl_update_appointment', () => {
  it('calls PUT /calendars/events/appointments/:id with update fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_appointment').handler(
      {
        eventId: 'evt-1',
        appointmentStatus: 'confirmed',
        startTime: '2024-12-16T14:00:00Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('PUT');
    expect(call.pathname).toBe('/calendars/events/appointments/evt-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.appointmentStatus).toBe('confirmed');
    expect(call.body?.startTime).toBe('2024-12-16T14:00:00Z');
    expect(call.body?.eventId).toBeUndefined();
  });

  it('sends description (not notes) and missing spec fields', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_update_appointment').handler(
      {
        eventId: 'evt-1',
        description: 'Rescheduled',
        meetingLocationType: 'phone',
        assignedUserId: 'user-2',
        meetingLocationId: 'custom_1',
        overrideLocationConfig: false,
        ignoreFreeSlotValidation: true,
        rrule: 'RRULE:FREQ=DAILY;INTERVAL=1;COUNT=3',
        address: '456 Oak Ave',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.body?.description).toBe('Rescheduled');
    expect(call.body?.notes).toBeUndefined();
    expect(call.body?.meetingLocationType).toBe('phone');
    expect(call.body?.assignedUserId).toBe('user-2');
    expect(call.body?.meetingLocationId).toBe('custom_1');
    expect(call.body?.overrideLocationConfig).toBe(false);
    expect(call.body?.ignoreFreeSlotValidation).toBe(true);
    expect(call.body?.rrule).toBe('RRULE:FREQ=DAILY;INTERVAL=1;COUNT=3');
    expect(call.body?.address).toBe('456 Oak Ave');
  });

  it('accepts completed and active appointmentStatus values', async () => {
    for (const status of ['completed', 'active']) {
      const result = getTool('ghl_update_appointment').inputSchema.safeParse({
        eventId: 'evt-1',
        appointmentStatus: status,
      });
      expect(result.success, `expected ${status} to be valid`).toBe(true);
    }
  });
});

// ── ghl_delete_calendar_event ─────────────────────────────────────────────────

describe('ghl_delete_calendar_event', () => {
  it('calls DELETE /calendars/events/:id', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_delete_calendar_event').handler(
      { eventId: 'evt-1' },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('DELETE');
    expect(call.pathname).toBe('/calendars/events/evt-1');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
  });
});

// ── ghl_create_block_slot ─────────────────────────────────────────────────────

describe('ghl_create_block_slot', () => {
  it('calls POST /calendars/events/block-slots with locationId', async () => {
    const fetch = mockFetchSuccess(MOCK_DATA);
    await getTool('ghl_create_block_slot').handler(
      {
        calendarId: 'cal-1',
        startTime: '2024-12-15T12:00:00Z',
        endTime: '2024-12-15T13:00:00Z',
      },
      TEST_CONFIG
    );
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('POST');
    expect(call.pathname).toBe('/calendars/events/block-slots');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.body?.calendarId).toBe('cal-1');
    expect(call.body?.locationId).toBe(TEST_CONFIG.locationId);
  });
});

// ── ghl_get_calendar_groups ───────────────────────────────────────────────────

describe('ghl_get_calendar_groups', () => {
  it('calls GET /calendars/groups with locationId', async () => {
    const fetch = mockFetchSuccess({ groups: [] });
    await getTool('ghl_get_calendar_groups').handler({}, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/calendars/groups');
    expect(call.headers.Version).toBe(GHL_VERSION_V3);
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });
});
