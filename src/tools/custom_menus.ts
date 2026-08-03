import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

const iconSchema = z.object({
  name: z.string().describe("Name of the icon"),
  fontFamily: z.enum(["fab", "fas", "far"]).describe("Font family of the icon"),
});

const iconSchemaOptional = z.object({
  name: z.string().optional().describe("Name of the icon"),
  fontFamily: z.enum(["fab", "fas", "far"]).optional().describe("Font family of the icon"),
});

export const customMenuTools = [
  {
    name: "ghl_get_custom_menus",
    description:
      "List custom menu links configured for the location. Supports search, pagination, and filtering to agency-level links only.",
    inputSchema: z.object({
      skip: z.number().optional().describe("Number of items to skip for pagination. Defaults to 0"),
      limit: z.number().optional().describe("Maximum number of items to return. Defaults to 20"),
      query: z.string().optional().describe("Search query to filter custom menus by name (partial or full match)"),
      showOnCompany: z
        .boolean()
        .optional()
        .describe("Filter to show only agency-level menu links. When omitted, fetches both agency and sub-account menu links"),
    }),
    handler: async (
      args: { skip?: number; limit?: number; query?: string; showOnCompany?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/custom-menus/", {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            locationId: config.locationId,
            skip: args.skip,
            limit: args.limit,
            query: args.query,
            showOnCompany: args.showOnCompany,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_custom_menu",
    description: "Get a single custom menu link by ID.",
    inputSchema: z.object({
      customMenuId: z.string().describe("Unique identifier of the custom menu"),
    }),
    handler: async (args: { customMenuId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/custom-menus/${args.customMenuId}`, {
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
    name: "ghl_create_custom_menu",
    description:
      "Create a custom menu link. For icon usage details see https://doc.clickup.com/8631005/d/h/87cpx-243696/d60fa70db6b92b2",
    inputSchema: z.object({
      title: z.string().describe("Title of the custom menu"),
      url: z.string().describe("URL of the custom menu"),
      icon: iconSchema.describe("Icon information for the custom menu (name and fontFamily are both required)"),
      showOnCompany: z.boolean().describe("Whether the menu must be displayed on the agency's level"),
      showOnLocation: z.boolean().describe("Whether the menu must be displayed for sub-accounts level"),
      showToAllLocations: z.boolean().describe("Whether the menu must be displayed to all sub-accounts"),
      openMode: z
        .enum(["iframe", "new_tab", "current_tab"])
        .describe("Mode for opening the menu link"),
      locations: z
        .array(z.string())
        .describe(
          "List of sub-account IDs where the menu should be shown. Applicable only when showOnLocation is true and showToAllLocations is false"
        ),
      userRole: z.enum(["all", "admin", "user"]).describe("Which user-roles should the menu be accessible to"),
      allowCamera: z.boolean().optional().describe("Whether to allow camera access (only for iframe mode)"),
      allowMicrophone: z.boolean().optional().describe("Whether to allow microphone access (only for iframe mode)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/custom-menus/", {
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
    name: "ghl_update_custom_menu",
    description: "Update a custom menu link by ID. Only provided fields are changed.",
    inputSchema: z.object({
      customMenuId: z.string().describe("ID of the custom menu to update"),
      title: z.string().optional().describe("Title of the custom menu"),
      url: z.string().optional().describe("URL of the custom menu"),
      icon: iconSchemaOptional.optional().describe("Icon information for the custom menu"),
      showOnCompany: z.boolean().optional().describe("Whether the menu must be displayed on the agency's level"),
      showOnLocation: z.boolean().optional().describe("Whether the menu must be displayed for sub-accounts level"),
      showToAllLocations: z.boolean().optional().describe("Whether the menu must be displayed to all sub-accounts"),
      openMode: z
        .enum(["iframe", "new_tab", "current_tab"])
        .optional()
        .describe("Mode for opening the menu link"),
      locations: z
        .array(z.string())
        .optional()
        .describe(
          "List of sub-account IDs where the menu should be shown. Applicable only when showOnLocation is true and showToAllLocations is false"
        ),
      userRole: z
        .enum(["all", "admin", "user"])
        .optional()
        .describe("Which user-roles should the menu be accessible to"),
      allowCamera: z.boolean().optional().describe("Whether to allow camera access (only for iframe mode)"),
      allowMicrophone: z.boolean().optional().describe("Whether to allow microphone access (only for iframe mode)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { customMenuId, ...fields } = args as { customMenuId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PUT", `/custom-menus/${customMenuId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: fields,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_custom_menu",
    description: "Delete a custom menu link by ID.",
    inputSchema: z.object({
      customMenuId: z.string().describe("ID of the custom menu to delete"),
    }),
    handler: async (args: { customMenuId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/custom-menus/${args.customMenuId}`, {
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
