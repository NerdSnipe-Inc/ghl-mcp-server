import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// Brand boards and brand voices are two sub-resources under the same
// `/brand-boards` API surface but with different path shapes:
//   - Brand boards : /brand-boards/{locationId}/... (and POST /brand-boards/ with
//     locationId in the body)
//   - Brand voices : /brand-boards/locations/{locationId}/brand-voices/...
// Both are exported together as `brandBoardTools` per the task brief.

export const brandBoardTools = [
  // ── Brand boards ────────────────────────────────────────────────────────────
  {
    name: "ghl_create_brand_board",
    description:
      "Create a brand board for a location. A brand board holds logos, colors, and fonts, and can be created blank, from a template, from a snapshot, or extracted from a website URL.",
    inputSchema: z.object({
      name: z.string().describe("Name of the brand board"),
      logos: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Array of logos: { url, label, path, id? }"),
      colors: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Array of colors: { hexa, rgba, hex, rgb, label, id? }"),
      fonts: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Array of fonts: { font, fallback, label, id? }"),
      default: z.boolean().optional().describe("Set as the default brand board for this location"),
      brandBoardId: z
        .string()
        .optional()
        .describe("Source brand board ID to copy from (creates a new brand board based on this template)"),
      parentId: z.string().optional().describe("Parent folder ID in media library for organizing brand boards"),
      type: z
        .enum(["template", "blank", "snapshot", "url"])
        .optional()
        .describe("Source type indicating how the brand board was created"),
      url: z.string().optional().describe("Website URL to extract design kit from (colors, fonts, logos)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/brand-boards/", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_brand_boards",
    description: "List brand boards for the location. Supports search, pagination, and including deleted boards.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Maximum number of brand boards to return"),
      offset: z.number().optional().describe("Number of brand boards to skip for pagination"),
      search: z.string().optional().describe("Search term to filter brand boards by name"),
      deleted: z.boolean().optional().describe("Include deleted brand boards in results"),
    }),
    handler: async (
      args: { limit?: number; offset?: number; search?: string; deleted?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/brand-boards/${config.locationId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: {
            limit: args.limit,
            offset: args.offset,
            search: args.search,
            deleted: args.deleted,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_brand_board",
    description: "Get a single brand board by ID.",
    inputSchema: z.object({
      id: z.string().describe("Brand board ID"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/brand-boards/${config.locationId}/${args.id}`, {
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
    name: "ghl_update_brand_board",
    description: "Update a brand board by ID. Only provided fields are changed.",
    inputSchema: z.object({
      id: z.string().describe("Brand board ID to update"),
      name: z.string().optional().describe("Name of the brand board"),
      logos: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Array of logos: { url, label, path, id? }"),
      colors: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Array of colors: { hexa, rgba, hex, rgb, label, id? }"),
      fonts: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Array of fonts: { font, fallback, label, id? }"),
      default: z.boolean().optional().describe("Set as the default brand board for this location"),
      parentId: z.string().optional().describe("Parent folder ID in media library (reserved for future use)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { id, ...fields } = args as { id: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("PATCH", `/brand-boards/${config.locationId}/${id}`, {
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
    name: "ghl_delete_brand_board",
    description: "Delete a brand board by ID.",
    inputSchema: z.object({
      id: z.string().describe("Brand board ID to delete"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/brand-boards/${config.locationId}/${args.id}`, {
          token: config.token,
          version: GHL_VERSION_V3,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  // ── Brand voices ────────────────────────────────────────────────────────────
  {
    name: "ghl_get_brand_voices",
    description: "List brand voices for the location. Supports search, pagination, and including deleted voices.",
    inputSchema: z.object({
      limit: z.number().optional().describe("Number of brand voices to return. Defaults to 10, minimum 1, maximum 20"),
      offset: z.number().optional().describe("Number of brand voices to skip for pagination. Defaults to 0"),
      search: z.string().optional().describe("Search text for brand voice name"),
      deleted: z.boolean().optional().describe("Whether to return deleted brand voices. Defaults to false"),
    }),
    handler: async (
      args: { limit?: number; offset?: number; search?: string; deleted?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/brand-boards/locations/${config.locationId}/brand-voices`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              limit: args.limit,
              offset: args.offset,
              search: args.search,
              deleted: args.deleted,
            },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_brand_voice",
    description:
      "Create a brand voice for a location. type=manual creates it with provided custom answers, type=url generates answers from a website, type=description generates answers from a text description.",
    inputSchema: z.object({
      type: z
        .enum(["manual", "url", "description"])
        .describe(
          "Creation type. \"manual\" creates with provided custom answers, \"url\" generates answers from a website, \"description\" generates answers from a text description"
        ),
      name: z.string().optional().describe("Name"),
      url: z.string().optional().describe("Website URL to generate brand voice from. Required when type is \"url\""),
      description: z
        .string()
        .optional()
        .describe(
          "Company description to generate brand voice from. Required when type is \"description\", optional when type is \"url\""
        ),
      answers: z
        .record(z.unknown())
        .optional()
        .describe(
          "Brand voice answers (brandName, toneOfVoice, targetAudience, customerPainPoints, businessType, companyWebsite, companyEmail, companyAddress, phone, businessHours, brandPromise, ...). Required when type is \"manual\""
        ),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/brand-boards/locations/${config.locationId}/brand-voices`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: args,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_brand_voice",
    description: "Get a brand voice by ID.",
    inputSchema: z.object({
      brandVoiceId: z.string().describe("Brand voice ID"),
    }),
    handler: async (args: { brandVoiceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/brand-boards/locations/${config.locationId}/brand-voices/${args.brandVoiceId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_brand_voice",
    description: "Update a brand voice by ID. Only provided fields are changed.",
    inputSchema: z.object({
      brandVoiceId: z.string().describe("Brand voice ID to update"),
      name: z.string().optional().describe("Name"),
      answers: z.record(z.unknown()).optional().describe("Updated brand voice answers"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { brandVoiceId, ...fields } = args as { brandVoiceId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PATCH",
          `/brand-boards/locations/${config.locationId}/brand-voices/${brandVoiceId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: fields,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_brand_voice",
    description: "Delete a brand voice by ID.",
    inputSchema: z.object({
      brandVoiceId: z.string().describe("Brand voice ID to delete"),
    }),
    handler: async (args: { brandVoiceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/brand-boards/locations/${config.locationId}/brand-voices/${args.brandVoiceId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_set_default_brand_voice",
    description: "Set a brand voice as the default for the location.",
    inputSchema: z.object({
      brandVoiceId: z.string().describe("Brand voice ID to set as default"),
    }),
    handler: async (args: { brandVoiceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/brand-boards/locations/${config.locationId}/brand-voices/${args.brandVoiceId}/default`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
