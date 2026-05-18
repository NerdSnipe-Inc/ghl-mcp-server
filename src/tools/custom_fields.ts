import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const customFieldTools = [
  {
    name: "ghl_get_custom_fields",
    description:
      "List custom fields for a given object type in the location. Use objectKey='contact' for contact fields, 'company' for business fields.",
    inputSchema: z.object({
      objectKey: z
        .string()
        .optional()
        .default("contact")
        .describe("Object type key: 'contact', 'company', etc."),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const objectKey = (args.objectKey as string) ?? "contact";
      try {
        const result = await ghlRequest(
          "GET",
          `/custom-fields/object-key/${objectKey}`,
          { token: config.token, params: { locationId: config.locationId } }
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
      objectKey: z
        .string()
        .optional()
        .default("contact")
        .describe("Object type: 'contact', 'company', etc."),
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
        const result = await ghlRequest("POST", "/custom-fields/", {
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
        const result = await ghlRequest("PUT", `/custom-fields/${fieldId}`, {
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
        const result = await ghlRequest("DELETE", `/custom-fields/${args.fieldId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
