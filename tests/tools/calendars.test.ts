import { describe, it, expect } from 'vitest';
import { calendarTools } from '../../src/tools/calendars.js';
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
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });

  it('passes groupId filter when provided', async () => {
    const fetch = mockFetchSuccess({ calendars: [] });
    await getTool('ghl_get_calendars').handler({ groupId: 'grp-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params.groupId).toBe('grp-1');
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
});

// ── ghl_get_appointment ───────────────────────────────────────────────────────

describe('ghl_get_appointment', () => {
  it('calls GET /calendars/events/appointments/:id', async () => {
    const fetch = mockFetchSuccess({ event: { id: 'evt-1' } });
    await getTool('ghl_get_appointment').handler({ eventId: 'evt-1' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.method).toBe('GET');
    expect(call.pathname).toBe('/calendars/events/appointments/evt-1');
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
    expect(call.body?.appointmentStatus).toBe('confirmed');
    expect(call.body?.startTime).toBe('2024-12-16T14:00:00Z');
    expect(call.body?.eventId).toBeUndefined();
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
    expect(call.params.locationId).toBe(TEST_CONFIG.locationId);
  });
});
