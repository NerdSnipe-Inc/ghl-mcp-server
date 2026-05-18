import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const tagTools = [
  {
    name: "ghl_get_location_tags",
    description: "List all tags defined in the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/locations/${config.locationId}/tags`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_location_tag",
    description: "Create a new tag in the location.",
    inputSchema: z.object({
      name: z.string().describe("Tag name"),
    }),
    handler: async (args: { name: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/locations/${config.locationId}/tags`, {
          token: config.token,
          body: { name: args.name },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_location_tag",
    description: "Delete a tag from the location.",
    inputSchema: z.object({
      tagId: z.string().describe("Tag ID to delete"),
    }),
    handler: async (args: { tagId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/locations/${config.locationId}/tags/${args.tagId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
