import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const contactTools = [
  {
    name: "ghl_get_contacts",
    description:
      "List/search contacts in the GHL location. Supports filtering by query and cursor-based pagination.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query (name, email, phone)"),
      limit: z.number().optional().default(20).describe("Max results (1-100)"),
      skip: z.number().optional().describe("Number of results to skip"),
      startAfterId: z.string().optional().describe("Contact ID to start after (cursor pagination)"),
      startAfter: z.number().optional().describe("Timestamp cursor for pagination"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/contacts/", {
          token: config.token,
          params: {
            locationId: config.locationId,
            query: args.query as string | undefined,
            limit: args.limit as number | undefined,
            skip: args.skip as number | undefined,
            startAfterId: args.startAfterId as string | undefined,
            startAfter: args.startAfter as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_contact",
    description: "Get a single contact by ID with all fields, tags, and custom data.",
    inputSchema: z.object({
      contactId: z.string().describe("The contact ID"),
    }),
    handler: async (args: { contactId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/contacts/${args.contactId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_contact",
    description: "Create a new contact in the GHL location. Returns the created contact object.",
    inputSchema: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional().describe("E.164 format preferred, e.g. +15551234567"),
      address1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional().default("US"),
      companyName: z.string().optional(),
      website: z.string().optional(),
      source: z.string().optional().describe("Lead source"),
      tags: z.array(z.string()).optional(),
      customFields: z
        .array(z.object({ id: z.string(), value: z.string() }))
        .optional()
        .describe("Custom field values [{id, value}]"),
      dnd: z.boolean().optional().describe("Do Not Disturb flag"),
      timezone: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/contacts/", {
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
    name: "ghl_update_contact",
    description: "Update an existing contact. Only provide fields you want to change.",
    inputSchema: z.object({
      contactId: z.string().describe("The contact ID to update"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      companyName: z.string().optional(),
      website: z.string().optional(),
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customFields: z
        .array(z.object({ id: z.string(), value: z.string() }))
        .optional(),
      dnd: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { contactId, ...fields } = args as { contactId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/contacts/${contactId}`, {
          token: config.token,
          body: fields,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_contact",
    description:
      "Create or update a contact by email or phone. Useful for ensuring no duplicates.",
    inputSchema: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      companyName: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
      customFields: z
        .array(z.object({ id: z.string(), value: z.string() }))
        .optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/contacts/upsert", {
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
    name: "ghl_delete_contact",
    description: "Permanently delete a contact by ID.",
    inputSchema: z.object({
      contactId: z.string().describe("The contact ID to delete"),
    }),
    handler: async (args: { contactId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/contacts/${args.contactId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_contacts",
    description: "Advanced contact search with filters for tags, pipeline stage, source, etc.",
    inputSchema: z.object({
      query: z.string().optional().describe("Full-text search query"),
      filters: z
        .array(
          z.object({
            field: z.string(),
            operator: z.string(),
            value: z.union([z.string(), z.number(), z.array(z.string())]),
          })
        )
        .optional()
        .describe("Advanced filter conditions"),
      page: z.number().optional().default(1),
      pageLimit: z.number().optional().default(20),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/contacts/search", {
          token: config.token,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Tags ---
  {
    name: "ghl_add_contact_tags",
    description: "Add one or more tags to a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      tags: z.array(z.string()).describe("Tags to add"),
    }),
    handler: async (args: { contactId: string; tags: string[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/contacts/${args.contactId}/tags`, {
          token: config.token,
          body: { tags: args.tags },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_remove_contact_tags",
    description: "Remove one or more tags from a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      tags: z.array(z.string()).describe("Tags to remove"),
    }),
    handler: async (args: { contactId: string; tags: string[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/contacts/${args.contactId}/tags`, {
          token: config.token,
          body: { tags: args.tags },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Notes ---
  {
    name: "ghl_get_contact_notes",
    description: "Get all notes for a contact.",
    inputSchema: z.object({
      contactId: z.string(),
    }),
    handler: async (args: { contactId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/contacts/${args.contactId}/notes`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_contact_note",
    description: "Add a note to a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      body: z.string().describe("Note content"),
      userId: z.string().optional().describe("User ID to attribute note to"),
    }),
    handler: async (args: { contactId: string; body: string; userId?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/contacts/${args.contactId}/notes`, {
          token: config.token,
          body: { body: args.body, userId: args.userId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_contact_note",
    description: "Update an existing contact note.",
    inputSchema: z.object({
      contactId: z.string(),
      noteId: z.string(),
      body: z.string().describe("Updated note content"),
    }),
    handler: async (args: { contactId: string; noteId: string; body: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("PUT", `/contacts/${args.contactId}/notes/${args.noteId}`, {
          token: config.token,
          body: { body: args.body },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_contact_note",
    description: "Delete a note from a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      noteId: z.string(),
    }),
    handler: async (args: { contactId: string; noteId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/contacts/${args.contactId}/notes/${args.noteId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Tasks ---
  {
    name: "ghl_get_contact_tasks",
    description: "Get all tasks for a contact.",
    inputSchema: z.object({
      contactId: z.string(),
    }),
    handler: async (args: { contactId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/contacts/${args.contactId}/tasks`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_contact_task",
    description: "Create a task for a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      title: z.string().describe("Task title"),
      body: z.string().optional().describe("Task description"),
      dueDate: z.string().describe("Due date ISO 8601 (e.g. 2024-12-31T17:00:00Z)"),
      completed: z.boolean().optional().default(false).describe("Mark task as completed"),
      assignedTo: z.string().optional().describe("User ID to assign task to"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { contactId, ...taskData } = args as { contactId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("POST", `/contacts/${contactId}/tasks`, {
          token: config.token,
          body: taskData,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_contact_task",
    description: "Update a task for a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      taskId: z.string(),
      title: z.string().optional(),
      body: z.string().optional(),
      dueDate: z.string().optional(),
      completed: z.boolean().optional().describe("Mark task completed or not"),
      assignedTo: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { contactId, taskId, ...taskData } = args as { contactId: string; taskId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/contacts/${contactId}/tasks/${taskId}`, {
          token: config.token,
          body: taskData,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_contact_task",
    description: "Delete a task from a contact.",
    inputSchema: z.object({
      contactId: z.string(),
      taskId: z.string(),
    }),
    handler: async (args: { contactId: string; taskId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/contacts/${args.contactId}/tasks/${args.taskId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Workflow enrollment ---
  {
    name: "ghl_add_contact_to_workflow",
    description:
      "Enroll a contact into a GHL workflow/automation. Use the configured workflow IDs or supply a custom one.",
    inputSchema: z.object({
      contactId: z.string(),
      workflowId: z
        .string()
        .describe(
          "The workflow ID to enroll the contact in. Use ghl_get_workflows to discover available workflow IDs."
        ),
      eventStartTime: z
        .string()
        .optional()
        .describe("Optional ISO 8601 event start time for time-based triggers"),
    }),
    handler: async (
      args: { contactId: string; workflowId: string; eventStartTime?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/contacts/${args.contactId}/workflow/${args.workflowId}`,
          {
            token: config.token,
            body: args.eventStartTime ? { eventStartTime: args.eventStartTime } : {},
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_remove_contact_from_workflow",
    description: "Remove a contact from a GHL workflow/automation.",
    inputSchema: z.object({
      contactId: z.string(),
      workflowId: z.string().describe("Workflow ID to remove contact from"),
    }),
    handler: async (args: { contactId: string; workflowId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/contacts/${args.contactId}/workflow/${args.workflowId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Appointments ---
  {
    name: "ghl_get_contact_appointments",
    description: "Get all appointments booked for a contact.",
    inputSchema: z.object({
      contactId: z.string(),
    }),
    handler: async (args: { contactId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/contacts/${args.contactId}/appointments`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
