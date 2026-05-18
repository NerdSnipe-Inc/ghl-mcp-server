import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const calendarTools = [
  {
    name: "ghl_get_calendars",
    description: "List all calendars in the GHL location.",
    inputSchema: z.object({
      groupId: z.string().optional().describe("Filter by calendar group ID"),
    }),
    handler: async (args: { groupId?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/calendars/", {
          token: config.token,
          params: { locationId: config.locationId, groupId: args.groupId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_calendar",
    description: "Get a specific calendar by ID.",
    inputSchema: z.object({
      calendarId: z.string(),
    }),
    handler: async (args: { calendarId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/calendars/${args.calendarId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_free_slots",
    description:
      "Get available appointment slots for a calendar within a date range. Use this before booking to find open times.",
    inputSchema: z.object({
      calendarId: z.string(),
      startDate: z
        .number()
        .describe("Start timestamp in milliseconds (Unix epoch * 1000)"),
      endDate: z
        .number()
        .describe("End timestamp in milliseconds (Unix epoch * 1000)"),
      timezone: z
        .string()
        .optional()
        .describe("Timezone for slots, e.g. 'America/New_York'"),
    }),
    handler: async (
      args: { calendarId: string; startDate: number; endDate: number; timezone?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/calendars/${args.calendarId}/free-slots`, {
          token: config.token,
          params: {
            startDate: args.startDate,
            endDate: args.endDate,
            timezone: args.timezone,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_calendar_events",
    description: "Get calendar events (appointments and blocked slots) for a date range.",
    inputSchema: z.object({
      startTime: z
        .number()
        .describe("Start timestamp in milliseconds"),
      endTime: z
        .number()
        .describe("End timestamp in milliseconds"),
      calendarId: z.string().optional().describe("Filter by specific calendar"),
      userId: z.string().optional().describe("Filter by assigned user"),
      groupId: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/calendars/events", {
          token: config.token,
          params: {
            locationId: config.locationId,
            startTime: args.startTime as number,
            endTime: args.endTime as number,
            calendarId: args.calendarId as string | undefined,
            userId: args.userId as string | undefined,
            groupId: args.groupId as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_appointment",
    description:
      "Book an appointment on a GHL calendar for a contact. Always check free slots first.",
    inputSchema: z.object({
      calendarId: z.string(),
      contactId: z.string().describe("Contact to book the appointment for"),
      startTime: z
        .string()
        .describe("ISO 8601 start time, e.g. '2024-12-15T14:00:00-05:00'"),
      endTime: z
        .string()
        .describe("ISO 8601 end time"),
      title: z.string().optional().describe("Appointment title/name"),
      appointmentStatus: z
        .enum(["new", "confirmed", "cancelled", "showed", "noshow", "invalid"])
        .optional()
        .default("new"),
      meetingLocationType: z
        .enum(["default", "zoom", "google_meet", "phone", "custom"])
        .optional(),
      address: z.string().optional().describe("Location address if in-person"),
      notes: z.string().optional(),
      ignoreDateRange: z.boolean().optional(),
      toNotify: z.boolean().optional().default(true),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/calendars/events/appointments", {
          token: config.token,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_appointment",
    description: "Get a specific appointment by event ID.",
    inputSchema: z.object({
      eventId: z.string(),
    }),
    handler: async (args: { eventId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/calendars/events/appointments/${args.eventId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_appointment",
    description: "Update an existing appointment (reschedule, change status, update notes).",
    inputSchema: z.object({
      eventId: z.string(),
      calendarId: z.string().optional(),
      startTime: z.string().optional().describe("New ISO 8601 start time"),
      endTime: z.string().optional().describe("New ISO 8601 end time"),
      title: z.string().optional(),
      appointmentStatus: z
        .enum(["new", "confirmed", "cancelled", "showed", "noshow", "invalid"])
        .optional(),
      notes: z.string().optional(),
      toNotify: z.boolean().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { eventId, ...updateData } = args as { eventId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/calendars/events/appointments/${eventId}`,
          { token: config.token, body: updateData }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_calendar_event",
    description: "Delete a calendar event or appointment.",
    inputSchema: z.object({
      eventId: z.string(),
    }),
    handler: async (args: { eventId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/calendars/events/${args.eventId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_block_slot",
    description: "Block a time slot on a calendar (prevents bookings during that period).",
    inputSchema: z.object({
      calendarId: z.string(),
      startTime: z.string().describe("ISO 8601 start time"),
      endTime: z.string().describe("ISO 8601 end time"),
      title: z.string().optional().default("Blocked"),
      assignedUserId: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/calendars/events/block-slots", {
          token: config.token,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_calendar_groups",
    description: "Get all calendar groups in the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/calendars/groups", {
          token: config.token,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
