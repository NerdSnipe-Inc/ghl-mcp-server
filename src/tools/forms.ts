import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const formTools = [
  {
    name: "ghl_get_forms",
    description: "List all forms created in the location.",
    inputSchema: z.object({
      limit: z.number().optional().default(25),
      skip: z.number().optional().default(0),
      type: z.string().optional().describe("Filter by form type"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/forms/", {
          token: config.token,
          params: {
            locationId: config.locationId,
            limit: args.limit as number | undefined,
            skip: args.skip as number | undefined,
            type: args.type as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_form_submissions",
    description: "Get submissions for a specific form or all forms in the location.",
    inputSchema: z.object({
      formId: z.string().optional().describe("Filter by form ID — omit to get all submissions"),
      startAt: z.string().optional().describe("Start date ISO 8601"),
      endAt: z.string().optional().describe("End date ISO 8601"),
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
