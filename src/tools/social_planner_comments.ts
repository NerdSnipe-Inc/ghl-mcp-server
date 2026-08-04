import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const socialPlannerCommentsTools = [
  {
    name: "ghl_create_social_comment",
    description:
      "Create a new comment on a social media post. Required fields: platform, parentId, isParentThread, content. Optional: attachments, mentions, notifyAllGroupMembers.",
    inputSchema: z.object({
      platform: z.string().describe("Social media platform (e.g., 'facebook', 'instagram')"),
      parentId: z.string().describe("ID of the parent post or comment"),
      isParentThread: z.boolean().describe("Whether the parent is a thread (true) or a single post (false)"),
      content: z.string().describe("Comment text content"),
      attachments: z
        .array(z.string())
        .optional()
        .describe("URLs of media attachments (images, videos)"),
      mentions: z
        .array(z.string())
        .optional()
        .describe("List of user IDs or handles to mention"),
      notifyAllGroupMembers: z
        .boolean()
        .optional()
        .describe("Whether to notify all group members of this comment"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { platform, ...fields } = args as { platform: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/comments/${platform}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId },
            body: { ...fields },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_list_social_comments",
    description:
      "List comments for one or more social media posts. Required fields: platform, originIds. Optional: fromDate, toDate, sortBy, search, skip, limit, parentId.",
    inputSchema: z.object({
      platform: z.string().describe("Social media platform (e.g., 'facebook', 'instagram')"),
      originIds: z
        .array(z.string())
        .describe("Array of post/origin IDs to fetch comments for"),
      fromDate: z
        .string()
        .optional()
        .describe("Filter comments from this date (ISO format)"),
      toDate: z
        .string()
        .optional()
        .describe("Filter comments until this date (ISO format)"),
      sortBy: z
        .string()
        .optional()
        .describe("Sort order for comments (e.g., 'date', 'likes')"),
      search: z
        .string()
        .optional()
        .describe("Search query to filter comments by text"),
      skip: z
        .number()
        .optional()
        .describe("Number of results to skip (pagination)"),
      limit: z
        .number()
        .optional()
        .describe("Max results to return"),
      parentId: z
        .string()
        .optional()
        .describe("Filter to comments on a specific parent post/comment"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { platform, ...fields } = args as { platform: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/comments/${platform}/list`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId },
            body: { ...fields },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_like_social_comment",
    description:
      "Like a social media comment. Required fields: platform, id. Supported platforms for " +
      "like/unlike: facebook, linkedin, community, tiktok, bluesky (instagram is NOT supported " +
      "for liking/unliking, though it is supported for creating/listing comments).",
    inputSchema: z.object({
      platform: z.string().describe("Social media platform that supports liking comments (e.g., 'facebook', 'linkedin', 'community', 'tiktok', 'bluesky' — instagram is not supported)"),
      id: z.string().describe("The comment ID to like"),
    }),
    handler: async (
      args: { platform: string; id: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/comments/${args.platform}/${args.id}/like`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_unlike_social_comment",
    description:
      "Unlike a social media comment. Required fields: platform, id. Supported platforms for " +
      "like/unlike: facebook, linkedin, community, tiktok, bluesky (instagram is NOT supported " +
      "for liking/unliking, though it is supported for creating/listing comments).",
    inputSchema: z.object({
      platform: z.string().describe("Social media platform that supports unliking comments (e.g., 'facebook', 'linkedin', 'community', 'tiktok', 'bluesky' — instagram is not supported)"),
      id: z.string().describe("The comment ID to unlike"),
    }),
    handler: async (
      args: { platform: string; id: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/social-media-posting/comments/${args.platform}/${args.id}/like`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
