import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// GHL Projects does not use locationId: it is derived from the auth token,
// so no tool in this file sends it.

// rruleOptions is an RFC 5545 recurrence object. The GHL docs do not fully
// specify its nested schema, so it is passed through as an open record.
const rruleOptionsSchema = z.record(z.unknown());

export const projectRecurringTaskTools = [
  {
    name: "ghl_create_recurring_task",
    description:
      "Create a recurring Project task. Tasks are generated on the schedule defined by rruleOptions.",
    inputSchema: z.object({
      title: z.string().describe("Title of the recurring task"),
      rruleOptions: rruleOptionsSchema.describe(
        "Recurrence rule options (RFC 5545 RRULE fields, e.g. freq, interval, byday)"
      ),
      description: z.string().optional().describe("Description of the recurring task"),
      contactIds: z.array(z.string()).optional().describe("Contact IDs associated with the task"),
      owners: z.array(z.string()).optional().describe("User IDs of the task owners"),
      ignoreTaskCreation: z
        .boolean()
        .optional()
        .describe("When true, the recurrence is saved without generating tasks"),
    }),
    handler: async (
      args: {
        title: string;
        rruleOptions: Record<string, unknown>;
        description?: string;
        contactIds?: string[];
        owners?: string[];
        ignoreTaskCreation?: boolean;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/projects/recurring-tasks", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            title: args.title,
            rruleOptions: args.rruleOptions,
            description: args.description,
            contactIds: args.contactIds,
            owners: args.owners,
            ignoreTaskCreation: args.ignoreTaskCreation,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_recurring_task",
    description: "Get a recurring Project task by ID.",
    inputSchema: z.object({
      id: z.string().describe("Recurring task ID"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/recurring-tasks/${args.id}`, {
          token: config.token,
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_recurring_task",
    description:
      "Update a recurring Project task. Only the fields you provide are changed.",
    inputSchema: z.object({
      id: z.string().describe("Recurring task ID"),
      title: z.string().optional().describe("Title of the recurring task"),
      rruleOptions: rruleOptionsSchema
        .optional()
        .describe("Recurrence rule options (RFC 5545 RRULE fields, e.g. freq, interval, byday)"),
      description: z.string().optional().describe("Description of the recurring task"),
      contactIds: z.array(z.string()).optional().describe("Contact IDs associated with the task"),
      owners: z.array(z.string()).optional().describe("User IDs of the task owners"),
      ignoreTaskCreation: z
        .boolean()
        .optional()
        .describe("When true, the recurrence is saved without generating tasks"),
    }),
    handler: async (
      args: {
        id: string;
        title?: string;
        rruleOptions?: Record<string, unknown>;
        description?: string;
        contactIds?: string[];
        owners?: string[];
        ignoreTaskCreation?: boolean;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", `/projects/recurring-tasks/${args.id}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            title: args.title,
            rruleOptions: args.rruleOptions,
            description: args.description,
            contactIds: args.contactIds,
            owners: args.owners,
            ignoreTaskCreation: args.ignoreTaskCreation,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_recurring_task",
    description: "Delete a recurring Project task by ID.",
    inputSchema: z.object({
      id: z.string().describe("Recurring task ID"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/recurring-tasks/${args.id}`, {
          token: config.token,
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
