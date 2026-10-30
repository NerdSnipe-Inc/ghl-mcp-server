import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// GHL Projects does not use locationId: it is derived from the auth token,
// so no tool in this file sends it.

const LIST_COLORS = [
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

export const projectListTools = [
  {
    name: "ghl_get_lists_in_space",
    description: "List the lists sitting directly in a Project space (paginated).",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
      limit: z.number().min(1).max(100).optional().describe("Maximum lists to return (1-100, default 20)"),
      cursor: z.string().optional().describe("Pagination cursor"),
      anchorId: z.string().optional().describe("List ID to anchor pagination on"),
    }),
    handler: async (
      args: { spaceId: string; limit?: number; cursor?: string; anchorId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/projects/spaces/${args.spaceId}/lists`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { limit: args.limit, cursor: args.cursor, anchorId: args.anchorId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_list_in_space",
    description: "Create a new list directly inside a Project space.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID to create the list in"),
      name: z.string().describe("List name"),
      color: z.enum(LIST_COLORS).optional().describe("List color swatch"),
      isPrivate: z.boolean().optional().describe("Whether the list is private"),
      userIds: z.array(z.string()).optional().describe("User IDs to give access to the list"),
    }),
    handler: async (
      args: {
        spaceId: string;
        name: string;
        color?: (typeof LIST_COLORS)[number];
        isPrivate?: boolean;
        userIds?: string[];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/projects/spaces/${args.spaceId}/lists`, {
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
    name: "ghl_get_lists_in_folder",
    description: "List the lists inside a Project folder (paginated).",
    inputSchema: z.object({
      folderId: z.string().describe("Folder ID"),
      limit: z.number().min(1).max(100).optional().describe("Maximum lists to return (1-100, default 20)"),
      cursor: z.string().optional().describe("Pagination cursor"),
      anchorId: z.string().optional().describe("List ID to anchor pagination on"),
    }),
    handler: async (
      args: { folderId: string; limit?: number; cursor?: string; anchorId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/projects/folders/${args.folderId}/lists`, {
          token: config.token,
          version: GHL_VERSION_V3,
          params: { limit: args.limit, cursor: args.cursor, anchorId: args.anchorId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_list_in_folder",
    description: "Create a new list inside a Project folder.",
    inputSchema: z.object({
      folderId: z.string().describe("Folder ID to create the list in"),
      name: z.string().describe("List name"),
      color: z.enum(LIST_COLORS).optional().describe("List color swatch"),
      isPrivate: z.boolean().optional().describe("Whether the list is private"),
      userIds: z.array(z.string()).optional().describe("User IDs to give access to the list"),
    }),
    handler: async (
      args: {
        folderId: string;
        name: string;
        color?: (typeof LIST_COLORS)[number];
        isPrivate?: boolean;
        userIds?: string[];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/projects/folders/${args.folderId}/lists`, {
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
    name: "ghl_get_list",
    description: "Get a single Project list by ID.",
    inputSchema: z.object({
      listId: z.string().describe("List ID"),
    }),
    handler: async (args: { listId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/lists/${args.listId}`, {
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
    name: "ghl_update_list",
    description: "Update a Project list's name, color, privacy or member list. Only the fields provided are changed.",
    inputSchema: z.object({
      listId: z.string().describe("List ID"),
      name: z.string().optional().describe("New list name"),
      color: z.enum(LIST_COLORS).optional().describe("New list color swatch"),
      isPrivate: z.boolean().optional().describe("Whether the list is private"),
      userIds: z.array(z.string()).optional().describe("User IDs to give access to the list"),
    }),
    handler: async (
      args: {
        listId: string;
        name?: string;
        color?: (typeof LIST_COLORS)[number];
        isPrivate?: boolean;
        userIds?: string[];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PATCH", `/projects/lists/${args.listId}`, {
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
    name: "ghl_delete_list",
    description: "Permanently delete a Project list.",
    inputSchema: z.object({
      listId: z.string().describe("List ID"),
    }),
    handler: async (args: { listId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/lists/${args.listId}`, {
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
    name: "ghl_get_list_users",
    description: "List the users who have access to a Project list (paginated, max 50 per page).",
    inputSchema: z.object({
      listId: z.string().describe("List ID"),
      skip: z.number().min(0).optional().describe("Number of members to skip (pagination, default 0)"),
      limit: z.number().min(1).max(50).optional().describe("Maximum members to return (1-50, default 50)"),
    }),
    handler: async (args: { listId: string; skip?: number; limit?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/lists/${args.listId}/users`, {
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
    name: "ghl_revoke_list_member",
    description: "Remove a user's access to a Project list.",
    inputSchema: z.object({
      listId: z.string().describe("List ID"),
      userId: z.string().describe("User ID to remove from the list"),
    }),
    handler: async (args: { listId: string; userId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/lists/${args.listId}/users/${args.userId}`, {
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
