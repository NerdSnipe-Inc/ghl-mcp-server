import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const workflowTools = [
  {
    name: "ghl_get_workflows",
    description:
      "List all workflows/automations in the GHL location. Use this to discover workflow IDs before enrolling contacts.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/workflows/", {
          token: config.token,
          params: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_campaigns",
    description: "List all campaigns in the GHL location.",
    inputSchema: z.object({
      status: z.string().optional().describe("Filter by status (active, paused, etc.)"),
    }),
    handler: async (args: { status?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/campaigns/", {
          token: config.token,
          params: { locationId: config.locationId, status: args.status },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
