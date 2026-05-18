import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const locationTools = [
  {
    name: "ghl_get_location",
    description: "Get details about the current GHL location/sub-account.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/locations/${config.locationId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Tags ---
  {
    name: "ghl_get_location_tags",
    description: "Get all tags defined in the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/locations/${config.locationId}/tags`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_location_tag",
    description: "Create a new tag in the location.",
    inputSchema: z.object({
      name: z.string().describe("Tag name"),
    }),
    handler: async (args: { name: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/locations/${config.locationId}/tags`, {
          token: config.token,
          body: { name: args.name },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_location_tag",
    description: "Delete a tag from the location.",
    inputSchema: z.object({
      tagId: z.string(),
    }),
    handler: async (args: { tagId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/locations/${config.locationId}/tags/${args.tagId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Custom Fields ---
  {
    name: "ghl_get_custom_fields",
    description: "Get all custom fields defined for contacts in the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/locations/${config.locationId}/customFields`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_custom_field",
    description: "Create a new custom field in the location.",
    inputSchema: z.object({
      name: z.string(),
      dataType: z
        .enum([
          "TEXT",
          "LARGE_TEXT",
          "NUMERICAL",
          "PHONE",
          "MONETORY",
          "CHECKBOX",
          "SINGLE_OPTIONS",
          "MULTIPLE_OPTIONS",
          "FLOAT",
          "TIME",
          "DATE",
          "FILE_UPLOAD",
          "SIGNATURE",
        ])
        .describe("Field data type"),
      position: z.number().optional().describe("Display order position"),
      placeholder: z.string().optional(),
      options: z
        .array(z.string())
        .optional()
        .describe("Options for dropdown/checkbox fields"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/locations/${config.locationId}/customFields`,
          { token: config.token, body: args }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_custom_field",
    description: "Update an existing custom field.",
    inputSchema: z.object({
      fieldId: z.string(),
      name: z.string().optional(),
      placeholder: z.string().optional(),
      options: z.array(z.string()).optional(),
      position: z.number().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { fieldId, ...updateData } = args as { fieldId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/locations/${config.locationId}/customFields/${fieldId}`,
          { token: config.token, body: updateData }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_custom_field",
    description: "Delete a custom field from the location.",
    inputSchema: z.object({
      fieldId: z.string(),
    }),
    handler: async (args: { fieldId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/locations/${config.locationId}/customFields/${args.fieldId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Custom Values ---
  {
    name: "ghl_get_custom_values",
    description: "Get all custom values (location-level variables) in the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/locations/${config.locationId}/customValues`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_custom_value",
    description: "Create a new custom value (location-level variable).",
    inputSchema: z.object({
      name: z.string(),
      value: z.string(),
    }),
    handler: async (args: { name: string; value: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/locations/${config.locationId}/customValues`,
          { token: config.token, body: args }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_custom_value",
    description: "Update an existing custom value.",
    inputSchema: z.object({
      valueId: z.string(),
      name: z.string().optional(),
      value: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { valueId, ...updateData } = args as { valueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/locations/${config.locationId}/customValues/${valueId}`,
          { token: config.token, body: updateData }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Users ---
  {
    name: "ghl_get_users",
    description: "Get all users (team members) in the GHL location.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      skip: z.number().optional().default(0),
    }),
    handler: async (args: { limit?: number; skip?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/users/", {
          token: config.token,
          params: {
            locationId: config.locationId,
            limit: args.limit,
            skip: args.skip,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_users",
    description: "Search users in the location by name or email.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query"),
    }),
    handler: async (args: { query?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/users/search", {
          token: config.token,
          params: { locationId: config.locationId, query: args.query },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Templates ---
  {
    name: "ghl_get_templates",
    description: "Get SMS/email templates saved in the location.",
    inputSchema: z.object({
      type: z
        .enum(["sms", "email", "whatsapp"])
        .optional()
        .describe("Filter by template type"),
      limit: z.number().optional().default(25),
      skip: z.number().optional().default(0),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/locations/${config.locationId}/templates`, {
          token: config.token,
          params: { type: args.type as string | undefined, limit: args.limit as number | undefined, skip: args.skip as number | undefined },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  // --- Forms ---
  {
    name: "ghl_get_forms",
    description: "Get all forms created in the location.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      skip: z.number().optional().default(0),
      type: z.string().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/forms/", {
          token: config.token,
          params: { locationId: config.locationId, limit: args.limit as number | undefined, skip: args.skip as number | undefined, type: args.type as string | undefined },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_form_submissions",
    description: "Get form submissions for a specific form or all forms.",
    inputSchema: z.object({
      formId: z.string().optional().describe("Filter by form ID"),
      startAt: z.string().optional().describe("Start date filter ISO 8601"),
      endAt: z.string().optional().describe("End date filter ISO 8601"),
      limit: z.number().optional().default(25),
      page: z.number().optional().default(1),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/forms/submissions", {
          token: config.token,
          params: {
            locationId: config.locationId,
            formId: args.formId as string | undefined,
            startAt: args.startAt as string | undefined,
            endAt: args.endAt as string | undefined,
            limit: args.limit as number | undefined,
            page: args.page as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
