import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const customFieldTools = [
  {
    name: "ghl_get_custom_fields",
    description:
      "List custom fields for the location.",
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
          "DATE",
          "TEXTBOX_LIST",
          "FILE_UPLOAD",
          "RADIO",
          "EMAIL",
        ])
        .describe("Field data type"),
      fieldKey: z
        .string()
        .optional()
        .describe("Machine key for the field (snake_case). Auto-generated from name if omitted."),
      showInForms: z
        .boolean()
        .optional()
        .default(false)
        .describe("Show field in forms"),
      parentId: z
        .string()
        .optional()
        .describe("Folder ID to place the field in (omit for root)"),
      placeholder: z.string().optional(),
      options: z
        .array(z.string())
        .optional()
        .describe("Options for SINGLE_OPTIONS/MULTIPLE_OPTIONS/CHECKBOX/RADIO fields"),
      position: z.number().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/locations/${config.locationId}/customFields`, {
          token: config.token,
          body: args,
        });
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
      fieldId: z.string().describe("Custom field ID to update"),
      name: z.string().optional(),
      placeholder: z.string().optional(),
      options: z.array(z.string()).optional(),
      position: z.number().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { fieldId, ...updateData } = args as { fieldId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/locations/${config.locationId}/customFields/${fieldId}`, {
          token: config.token,
          body: updateData,
        });
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
      fieldId: z.string().describe("Custom field ID to delete"),
    }),
    handler: async (args: { fieldId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/locations/${config.locationId}/customFields/${args.fieldId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
