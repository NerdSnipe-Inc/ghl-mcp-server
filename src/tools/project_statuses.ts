import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// GHL Projects does not use locationId: it is derived from the auth token,
// so no tool in this file sends it.

export const projectStatusTools = [
  {
    name: "ghl_get_space_statuses",
    description: "Get the status groups and statuses configured for a Project space.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
    }),
    handler: async (args: { spaceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/spaces/${args.spaceId}/statuses`, {
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
    name: "ghl_update_space_statuses",
    description:
      "Replaces the entire status set for this space — omitted groups or statuses are removed. Pass the complete groups array you want the space to have.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
      groups: z
        .array(z.unknown())
        .describe("Complete array of status groups (with their nested statuses) for the space. Sent verbatim as the full replacement."),
    }),
    handler: async (args: { spaceId: string; groups: unknown[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("PUT", `/projects/spaces/${args.spaceId}/statuses`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { groups: args.groups },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_list_statuses",
    description: "Get the status groups and statuses configured for a Project list.",
    inputSchema: z.object({
      listId: z.string().describe("List ID"),
    }),
    handler: async (args: { listId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/lists/${args.listId}/statuses`, {
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
