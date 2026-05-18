import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const funnelTools = [
  {
    name: "ghl_get_funnels",
    description: "List all funnels in the location.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      offset: z.number().optional().default(0),
      search: z.string().optional().describe("Filter funnels by name"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/funnels/funnel/list", {
          token: config.token,
          params: {
            locationId: config.locationId,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            search: args.search as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_funnel_pages",
    description: "List all pages in a specific funnel.",
    inputSchema: z.object({
      funnelId: z.string().describe("Funnel ID (from ghl_get_funnels)"),
      limit: z.number().optional().default(25),
      offset: z.number().optional().default(0),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { funnelId, ...params } = args as { funnelId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest("GET", `/funnels/funnel/${funnelId}/pages`, {
          token: config.token,
          params: {
            locationId: config.locationId,
            limit: params.limit as number | undefined,
            offset: params.offset as number | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_funnel_page_count",
    description: "Get submission/visit count for a funnel page.",
    inputSchema: z.object({
      locationId: z.string().optional().describe("Defaults to the configured location"),
      funnelId: z.string().describe("Funnel ID"),
      pageId: z.string().describe("Page ID"),
      startDate: z.string().optional().describe("ISO 8601 start date"),
      endDate: z.string().optional().describe("ISO 8601 end date"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { funnelId, pageId, ...rest } = args as { funnelId: string; pageId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "GET",
          `/funnels/funnel/${funnelId}/pages/${pageId}/count`,
          {
            token: config.token,
            params: { locationId: config.locationId, ...rest },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
