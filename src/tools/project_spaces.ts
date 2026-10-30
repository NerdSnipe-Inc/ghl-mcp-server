import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// GHL Projects does not use locationId: it is derived from the auth token,
// so no tool in this file sends it.

const SPACE_COLORS = [
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#6B7280",
] as const;

export const projectSpaceTools = [
  {
    name: "ghl_create_space",
    description:
      "Create a new Project space. Spaces are the top level of the Projects hierarchy (Space > Folder > List > Task).",
    inputSchema: z.object({
      name: z.string().describe("Space name"),
      color: z.enum(SPACE_COLORS).optional().describe("Space color swatch"),
      isPrivate: z.boolean().optional().describe("Whether the space is private"),
      userIds: z.array(z.string()).optional().describe("User IDs to give access to the space"),
    }),
    handler: async (
      args: { name: string; color?: (typeof SPACE_COLORS)[number]; isPrivate?: boolean; userIds?: string[] },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/projects/spaces", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            name: args.name,
            color: args.color,
            isPrivate: args.isPrivate,
            userIds: args.userIds,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_spaces",
    description: "List all Project spaces in the account.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/projects/spaces", {
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
    name: "ghl_get_space",
    description: "Get a single Project space by ID.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
    }),
    handler: async (args: { spaceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/spaces/${args.spaceId}`, {
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
    name: "ghl_update_space",
    description: "Update a Project space's name, color, privacy or member list. Only the fields provided are changed.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
      name: z.string().optional().describe("New space name"),
      color: z.enum(SPACE_COLORS).optional().describe("New space color swatch"),
      isPrivate: z.boolean().optional().describe("Whether the space is private"),
      userIds: z.array(z.string()).optional().describe("User IDs to give access to the space"),
    }),
    handler: async (
      args: {
        spaceId: string;
        name?: string;
        color?: (typeof SPACE_COLORS)[number];
        isPrivate?: boolean;
        userIds?: string[];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PATCH", `/projects/spaces/${args.spaceId}`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            name: args.name,
            color: args.color,
            isPrivate: args.isPrivate,
            userIds: args.userIds,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_space",
    description: "Permanently delete a Project space.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
    }),
    handler: async (args: { spaceId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/spaces/${args.spaceId}`, {
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
    name: "ghl_get_space_users",
    description: "List the users who have access to a Project space.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
      skip: z.number().optional().describe("Number of members to skip (pagination)"),
      limit: z.number().max(50).optional().describe("Maximum members to return (max 50)"),
    }),
    handler: async (args: { spaceId: string; skip?: number; limit?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/spaces/${args.spaceId}/users`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { skip: args.skip, limit: args.limit },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_revoke_space_member",
    description: "Remove a user's access to a Project space.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
      userId: z.string().describe("User ID to remove from the space"),
    }),
    handler: async (args: { spaceId: string; userId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/spaces/${args.spaceId}/users/${args.userId}`, {
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
