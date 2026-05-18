import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const customValueTools = [
  {
    name: "ghl_get_custom_values",
    description: "List all custom values (location-level variables) in the location.",
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
      name: z.string().describe("Variable name"),
      value: z.string().describe("Variable value"),
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
      valueId: z.string().describe("Custom value ID to update"),
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
  {
    name: "ghl_delete_custom_value",
    description: "Delete a custom value (location-level variable) by ID.",
    inputSchema: z.object({
      valueId: z.string().describe("Custom value ID to delete"),
    }),
    handler: async (args: { valueId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/locations/${config.locationId}/customValues/${args.valueId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
