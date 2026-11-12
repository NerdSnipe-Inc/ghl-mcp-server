import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Confirmed live against the actual API (2026-11-12): a request sent with
// `picklistOptions` was rejected with "property picklistOptions should not
// exist" / "options must be an array" — the request DTO's real field name is
// `options`, not `picklistOptions` (which, per the original spec note here,
// only appears on the *response* schema). Renamed accordingly.
export const customFieldTools = [
  {
    name: "ghl_get_custom_fields",
    description:
      "List custom fields for the location.",
    inputSchema: z.object({
      model: z
        .enum(["contact", "opportunity", "all"])
        .optional()
        .describe("Filter custom fields by model"),
    }),
    handler: async (args: { model?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/locations/${config.locationId}/customFields`,
          { token: config.token, version: GHL_VERSION_V3, params: { model: args.model } }
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
      placeholder: z.string().optional(),
      options: z
        .array(z.string())
        .optional()
        .describe("Options for SINGLE_OPTIONS/MULTIPLE_OPTIONS/CHECKBOX/RADIO fields"),
      position: z.number().optional(),
      acceptedFormat: z
        .array(z.string())
        .optional()
        .describe("Accepted file extensions for FILE_UPLOAD fields, e.g. ['.pdf', '.docx']"),
      isMultipleFile: z
        .boolean()
        .optional()
        .describe("Allow multiple file uploads (FILE_UPLOAD fields)"),
      maxNumberOfFiles: z
        .number()
        .optional()
        .describe("Max number of files allowed (FILE_UPLOAD fields)"),
      textBoxListOptions: z
        .array(z.object({ label: z.string().optional(), prefillValue: z.string().optional() }))
        .optional()
        .describe("Options for TEXTBOX_LIST fields"),
      model: z.enum(["contact", "opportunity"]).optional().describe("Model the field belongs to"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/locations/${config.locationId}/customFields`, {
          token: config.token,
          version: GHL_VERSION_V3,
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
    description: "Update an existing custom field. Spec requires `name` even on update.",
    inputSchema: z.object({
      fieldId: z.string().describe("Custom field ID to update"),
      name: z.string().describe("Field name (required by spec, even on update)"),
      placeholder: z.string().optional(),
      options: z
        .array(z.string())
        .optional()
        .describe("Options for SINGLE_OPTIONS/MULTIPLE_OPTIONS/CHECKBOX/RADIO fields"),
      position: z.number().optional(),
      acceptedFormat: z
        .array(z.string())
        .optional()
        .describe("Accepted file extensions for FILE_UPLOAD fields, e.g. ['.pdf', '.docx']"),
      isMultipleFile: z
        .boolean()
        .optional()
        .describe("Allow multiple file uploads (FILE_UPLOAD fields)"),
      maxNumberOfFiles: z
        .number()
        .optional()
        .describe("Max number of files allowed (FILE_UPLOAD fields)"),
      textBoxListOptions: z
        .array(z.object({ label: z.string().optional(), prefillValue: z.string().optional() }))
        .optional()
        .describe("Options for TEXTBOX_LIST fields"),
      model: z.enum(["contact", "opportunity"]).optional().describe("Model the field belongs to"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { fieldId, ...updateData } = args as { fieldId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/locations/${config.locationId}/customFields/${fieldId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
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
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
