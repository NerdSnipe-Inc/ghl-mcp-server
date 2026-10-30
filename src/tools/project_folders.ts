import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// GHL Projects does not use locationId: it is derived from the auth token,
// so no tool in this file sends it.

const FOLDER_COLORS = [
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

export const projectFolderTools = [
  {
    name: "ghl_get_folders",
    description: "List the folders in a Project space (paginated).",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID"),
      limit: z.number().min(1).max(100).optional().describe("Maximum folders to return (1-100, default 20)"),
      cursor: z.string().optional().describe("Pagination cursor"),
      anchorId: z.string().optional().describe("Folder ID to anchor pagination on"),
    }),
    handler: async (
      args: { spaceId: string; limit?: number; cursor?: string; anchorId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", `/projects/spaces/${args.spaceId}/folders`, {
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
    name: "ghl_create_folder",
    description: "Create a new folder inside a Project space. Folders sit between a space and its lists.",
    inputSchema: z.object({
      spaceId: z.string().describe("Space ID to create the folder in"),
      name: z.string().describe("Folder name"),
      color: z.enum(FOLDER_COLORS).optional().describe("Folder color swatch"),
      isPrivate: z.boolean().optional().describe("Whether the folder is private"),
      userIds: z.array(z.string()).optional().describe("User IDs to give access to the folder"),
    }),
    handler: async (
      args: {
        spaceId: string;
        name: string;
        color?: (typeof FOLDER_COLORS)[number];
        isPrivate?: boolean;
        userIds?: string[];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/projects/spaces/${args.spaceId}/folders`, {
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
    name: "ghl_get_folder",
    description: "Get a single Project folder by ID.",
    inputSchema: z.object({
      folderId: z.string().describe("Folder ID"),
    }),
    handler: async (args: { folderId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/folders/${args.folderId}`, {
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
    name: "ghl_update_folder",
    description: "Update a Project folder's name, color, privacy or member list. Only the fields provided are changed.",
    inputSchema: z.object({
      folderId: z.string().describe("Folder ID"),
      name: z.string().optional().describe("New folder name"),
      color: z.enum(FOLDER_COLORS).optional().describe("New folder color swatch"),
      isPrivate: z.boolean().optional().describe("Whether the folder is private"),
      userIds: z.array(z.string()).optional().describe("User IDs to give access to the folder"),
    }),
    handler: async (
      args: {
        folderId: string;
        name?: string;
        color?: (typeof FOLDER_COLORS)[number];
        isPrivate?: boolean;
        userIds?: string[];
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PATCH", `/projects/folders/${args.folderId}`, {
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
    name: "ghl_delete_folder",
    description: "Permanently delete a Project folder.",
    inputSchema: z.object({
      folderId: z.string().describe("Folder ID"),
    }),
    handler: async (args: { folderId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/folders/${args.folderId}`, {
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
    name: "ghl_get_folder_users",
    description: "List the users who have access to a Project folder.",
    inputSchema: z.object({
      folderId: z.string().describe("Folder ID"),
      skip: z.number().optional().describe("Number of members to skip (pagination)"),
      limit: z.number().min(1).max(50).optional().describe("Maximum members to return (1-50, default 50)"),
    }),
    handler: async (args: { folderId: string; skip?: number; limit?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/folders/${args.folderId}/users`, {
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
    name: "ghl_revoke_folder_member",
    description: "Remove a user's access to a Project folder.",
    inputSchema: z.object({
      folderId: z.string().describe("Folder ID"),
      userId: z.string().describe("User ID to remove from the folder"),
    }),
    handler: async (args: { folderId: string; userId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/projects/folders/${args.folderId}/users/${args.userId}`, {
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
