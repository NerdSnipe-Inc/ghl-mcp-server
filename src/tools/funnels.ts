import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const funnelTools = [
  {
    name: "ghl_get_funnels",
    description: "List all funnels in the location.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      offset: z.number().optional().default(0),
      name: z.string().optional().describe("Filter funnels by name"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/funnels/funnel/list", {
          token: config.token,
          params: {
            locationId: config.locationId,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            name: args.name as string | undefined,
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
      name: z.string().optional().describe("Filter pages by name"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/funnels/page", {
          token: config.token,
          params: {
            locationId: config.locationId,
            funnelId: args.funnelId as string,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            name: args.name as string | undefined,
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
    description: "Get the total count of pages in a funnel.",
    inputSchema: z.object({
      funnelId: z.string().describe("Funnel ID"),
      name: z.string().optional().describe("Filter by page name"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/funnels/page/count", {
          token: config.token,
          params: {
            locationId: config.locationId,
            funnelId: args.funnelId as string,
            name: args.name as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
