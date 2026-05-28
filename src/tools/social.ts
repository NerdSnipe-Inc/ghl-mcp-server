import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const socialTools = [
  {
    name: "ghl_get_social_accounts",
    description: "Get connected social media accounts for the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/${config.locationId}/accounts`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_posts",
    description: "Get scheduled or published social media posts.",
    inputSchema: z.object({
      skip: z.number().optional().default(0),
      limit: z.number().optional().default(20),
      status: z
        .enum(["scheduled", "published", "failed", "all"])
        .optional()
        .default("all"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/${config.locationId}/posts/list`,
          {
            token: config.token,
            body: {
              skip: args.skip,
              limit: args.limit,
              status: args.status,
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
    name: "ghl_create_social_post",
    description: "Schedule or publish a social media post.",
    inputSchema: z.object({
      content: z.string().describe("Post caption/body text"),
      accountIds: z
        .array(z.string())
        .describe("Social account IDs to post to"),
      scheduledAt: z
        .string()
        .optional()
        .describe("ISO 8601 scheduled publish time (omit to post immediately)"),
      mediaUrls: z
        .array(z.string())
        .optional()
        .describe("Image/video URLs to attach"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/${config.locationId}/posts`,
          { token: config.token, body: args }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_social_post",
    description: "Delete a scheduled social media post.",
    inputSchema: z.object({
      postId: z.string(),
    }),
    handler: async (args: { postId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/social-media-posting/${config.locationId}/posts/${args.postId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];

export const mediaTools = [
  {
    name: "ghl_get_media_files",
    description: "Get files and folders in the GHL media library.",
    inputSchema: z.object({
      sortBy: z
        .enum(["contentType", "uploadedBy", "createdAt", "updatedAt", "name", "size"])
        .optional()
        .default("updatedAt")
        .describe("Field to sort by"),
      sortOrder: z
        .enum(["asc", "desc"])
        .optional()
        .default("desc"),
      type: z
        .enum(["image", "video", "document", "audio", "all"])
        .optional()
        .default("all")
        .describe("Filter by file type"),
      limit: z.number().optional().default(25),
      offset: z.number().optional().default(0),
      query: z.string().optional().describe("Search query to filter files by name"),
      parentId: z.string().optional().describe("Folder ID to list contents of"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/medias/files", {
          token: config.token,
          params: {
            locationId: config.locationId,
            altType: "location",
            altId: config.locationId,
            sortBy: args.sortBy as string,
            sortOrder: args.sortOrder as string,
            type: args.type as string,
            limit: args.limit as number | undefined,
            offset: args.offset as number | undefined,
            query: args.query as string | undefined,
            parentId: args.parentId as string | undefined,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_media_file",
    description: "Delete a file or folder from the GHL media library.",
    inputSchema: z.object({
      fileId: z.string().describe("File or folder ID to delete"),
    }),
    handler: async (args: { fileId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/medias/${args.fileId}`, {
          token: config.token,
          params: {
            altType: "location",
            altId: config.locationId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];

export const triggerLinkTools = [
  {
    name: "ghl_get_trigger_links",
    description: "Get all trigger links in the location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/links/", {
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
    name: "ghl_create_trigger_link",
    description: "Create a trigger link that fires an action when clicked.",
    inputSchema: z.object({
      name: z.string().describe("Link name"),
      redirectTo: z.string().describe("URL to redirect to after trigger"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/links/", {
          token: config.token,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_trigger_link",
    description: "Delete a trigger link.",
    inputSchema: z.object({
      linkId: z.string(),
    }),
    handler: async (args: { linkId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/links/${args.linkId}`, {
          token: config.token,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
