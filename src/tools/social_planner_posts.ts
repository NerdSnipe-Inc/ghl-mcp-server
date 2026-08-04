import { z } from "zod";
import {
  ghlRequest,
  ghlRequestMultipart,
  formatError,
  GHLConfig,
  GHL_VERSION_V3,
} from "../client.js";

const POST_TYPE_ENUM = ["post", "story", "reel"] as const;

const POST_STATUS_ENUM = [
  "draft",
  "scheduled",
  "in_review",
  "published",
  "in_progress",
  "pending",
  "failed",
  "notification_sent",
  "deleted",
] as const;

const PLATFORM_ENUM = [
  "facebook",
  "instagram",
  "linkedin",
  "google",
  "pinterest",
  "youtube",
  "tiktok",
] as const;

export const socialPlannerPostsTools = [
  {
    name: "ghl_upload_social_csv",
    description:
      "Step 1 of the CSV bulk-import flow: upload a CSV file of social media posts for this " +
      "location. Takes raw CSV text content (not a file path — this server has no filesystem " +
      "access to a client's local files) and a filename; sends it upstream as a " +
      "multipart/form-data request with a binary `file` field. After upload, use " +
      "ghl_get_social_csv_upload_status / ghl_get_social_csv_post to inspect the parsed rows, " +
      "then ghl_finalize_social_csv to commit the import. Required: csvContent, filename.",
    inputSchema: z.object({
      csvContent: z.string().describe("Raw CSV file content (not a file path)"),
      filename: z.string().describe("Filename to report for the uploaded CSV, e.g. 'posts.csv'"),
    }),
    handler: async (
      args: { csvContent: string; filename: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequestMultipart(
          "POST",
          `/social-media-posting/${config.locationId}/csv`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            fields: { file: { content: args.csvContent, filename: args.filename } },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_csv_upload_status",
    description:
      "List CSV bulk-import jobs (uploads) for this location, with pagination and filters. " +
      "Required: userId. Optional: skip, limit, includeUsers, isFromTemplate.",
    inputSchema: z.object({
      userId: z.string().describe("User ID to filter CSV uploads by"),
      skip: z.number().optional().describe("Number of results to skip (pagination)"),
      limit: z.number().optional().describe("Max results to return"),
      includeUsers: z.boolean().optional().describe("Include uploader user details in the response"),
      isFromTemplate: z.boolean().optional().describe("Filter to uploads created from a template"),
    }),
    handler: async (
      args: {
        userId: string;
        skip?: number;
        limit?: number;
        includeUsers?: boolean;
        isFromTemplate?: boolean;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/${config.locationId}/csv`,
          { token: config.token, version: GHL_VERSION_V3, params: { ...args } }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_csv_post",
    description:
      "Get the parsed rows/posts of a single CSV bulk-import job by ID, with pagination. " +
      "Required: id. Optional: skip, limit.",
    inputSchema: z.object({
      id: z.string().describe("The CSV upload job ID"),
      skip: z.number().optional().describe("Number of results to skip (pagination)"),
      limit: z.number().optional().describe("Max results to return"),
    }),
    handler: async (
      args: { id: string; skip?: number; limit?: number },
      config: GHLConfig
    ) => {
      const { id, ...query } = args;
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/${config.locationId}/csv/${id}`,
          { token: config.token, version: GHL_VERSION_V3, params: { ...query } }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_finalize_social_csv",
    description:
      "Finalize (commit) a CSV bulk-import job, scheduling/publishing its parsed posts. " +
      "Required: id, userId.",
    inputSchema: z.object({
      id: z.string().describe("The CSV upload job ID to finalize"),
      userId: z.string().describe("User ID finalizing the import"),
    }),
    handler: async (args: { id: string; userId: string }, config: GHLConfig) => {
      const { id, ...body } = args;
      try {
        const result = await ghlRequest(
          "PATCH",
          `/social-media-posting/${config.locationId}/csv/${id}`,
          { token: config.token, version: GHL_VERSION_V3, body }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_social_csv",
    description: "Delete a CSV bulk-import job entirely (all its parsed posts). Required: id.",
    inputSchema: z.object({
      id: z.string().describe("The CSV upload job ID to delete"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/social-media-posting/${config.locationId}/csv/${args.id}`,
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_social_csv_post",
    description:
      "Delete a single post row from a CSV bulk-import job (without deleting the whole job). " +
      "Required: csvId, postId.",
    inputSchema: z.object({
      csvId: z.string().describe("The CSV upload job ID"),
      postId: z.string().describe("The post row ID within the CSV job to delete"),
    }),
    handler: async (args: { csvId: string; postId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/social-media-posting/${config.locationId}/csv/${args.csvId}/post/${args.postId}`,
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_bulk_delete_social_posts",
    description:
      "Delete multiple social media posts by ID in a single request. Optional: postIds. " +
      // NOTE: the upstream DeletePostsDto schema does not mark `postIds` as required
      // (`required` is absent from the schema), so this tool accepts an empty/omitted
      // call. Omitting postIds (or passing an empty array) is presumed to be a no-op
      // delete upstream — this was not verified against a live account, since deleting
      // nothing has no observable side effect to confirm either way.
      "Passing an empty array or omitting postIds entirely is presumed a no-op upstream.",
    inputSchema: z.object({
      postIds: z.array(z.string()).optional().describe("Post IDs to delete"),
    }),
    handler: async (args: { postIds?: string[] }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/${config.locationId}/posts/bulk-delete`,
          { token: config.token, version: GHL_VERSION_V3, body: args }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_post",
    description: "Get a single social media post by ID. Required: id.",
    inputSchema: z.object({
      id: z.string().describe("The post ID"),
    }),
    handler: async (args: { id: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/${config.locationId}/posts/${args.id}`,
          { token: config.token, version: GHL_VERSION_V3 }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_social_post",
    description:
      "Update an existing social media post (content, schedule, status, media, platform-specific " +
      "details, etc). This PUT endpoint is a full-document replace (CreatePostDTO), so omitted " +
      "optional fields may clear existing values upstream — pass through previously-set fields " +
      "you want to preserve. Required: id, type, accountIds, userId. Optional: summary, media, " +
      "status, scheduleDate, selectedBestTime, createdBy, followUpComment, ogTagsDetails, " +
      "postApprovalDetails, scheduleTimeUpdated, tags, categoryId, applyWatermark, " +
      "tiktokPostDetails, gmbPostDetails, linkedinPostDetails, pinterestPostDetails, " +
      "facebookPostDetails, instagramPostDetails, youtubePostDetails. The platform-specific " +
      "detail objects (facebookPostDetails, instagramPostDetails, linkedinPostDetails, " +
      "gmbPostDetails, pinterestPostDetails, tiktokPostDetails, youtubePostDetails, " +
      "ogTagsDetails, postApprovalDetails) are modeled permissively (pass-through objects), not " +
      "individually validated — supply whatever shape the platform's DTO expects.",
    inputSchema: z.object({
      id: z.string().describe("The post ID to update"),
      type: z.enum(POST_TYPE_ENUM).describe("Post type: post, story, or reel"),
      accountIds: z.array(z.string()).describe("Connected social account IDs to publish to"),
      userId: z.string().describe("User ID performing the update"),
      summary: z.string().optional().describe("Post content/caption text"),
      media: z
        .array(
          z.object({
            url: z.string().describe("Media URL"),
            type: z.string().optional().describe("Media MIME type, e.g. image/jpeg"),
            caption: z.string().optional(),
            altText: z.string().optional(),
          })
        )
        .optional()
        .describe("Media attachments for the post"),
      status: z.enum(POST_STATUS_ENUM).optional().describe("Post status"),
      scheduleDate: z.string().optional().describe("ISO 8601 scheduled publish time (required if status is scheduled or in_review)"),
      selectedBestTime: z.string().optional().describe("Selected best-time slot for scheduling (ISO 8601)"),
      createdBy: z.string().optional().describe("User ID of the post's original creator (MongoDB ObjectId)"),
      followUpComment: z.string().optional().describe("Follow-up comment to post immediately after the main post (Facebook, Instagram, LinkedIn, YouTube only)"),
      ogTagsDetails: z.record(z.string(), z.unknown()).optional().describe("Open Graph tags metadata (OgTagsSchema) — e.g. metaImage, metaLink, ogTitle, ogDescription"),
      postApprovalDetails: z.record(z.string(), z.unknown()).optional().describe("Post approval workflow details (PostApprovalSchema) — e.g. approver, approvalStatus"),
      scheduleTimeUpdated: z.boolean().optional().describe("Flag indicating the schedule datetime was manually updated (for tracking rescheduled posts)"),
      tags: z.array(z.string()).optional().describe("Tag IDs to attach to the post"),
      categoryId: z.string().optional().describe("Category ID to attach to the post"),
      applyWatermark: z.boolean().optional().describe("Apply watermark to media in this post (images only)"),
      tiktokPostDetails: z.record(z.string(), z.unknown()).optional().describe("TikTok-specific post configuration (TiktokPostSchema)"),
      gmbPostDetails: z.record(z.string(), z.unknown()).optional().describe("Google Business Profile-specific post configuration (GMBPostSchema)"),
      linkedinPostDetails: z.record(z.string(), z.unknown()).optional().describe("LinkedIn-specific post configuration (LinkedinPostSchema)"),
      pinterestPostDetails: z.record(z.string(), z.unknown()).optional().describe("Pinterest-specific post configuration (PinterestPostSchema)"),
      facebookPostDetails: z.record(z.string(), z.unknown()).optional().describe("Facebook-specific post configuration (FacebookPostSchema)"),
      instagramPostDetails: z.record(z.string(), z.unknown()).optional().describe("Instagram-specific post configuration (InstagramPostSchema)"),
      youtubePostDetails: z.record(z.string(), z.unknown()).optional().describe("YouTube-specific post configuration (YoutubePostSchema)"),
    }),
    handler: async (
      args: { id: string } & Record<string, unknown>,
      config: GHLConfig
    ) => {
      const { id, ...body } = args;
      try {
        const result = await ghlRequest(
          "PUT",
          `/social-media-posting/${config.locationId}/posts/${id}`,
          { token: config.token, version: GHL_VERSION_V3, body }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_statistics",
    description:
      "Get engagement/analytics statistics for connected social accounts, optionally filtered by " +
      "platform and date range (defaults to the last 7 days vs. the prior 7 days if no " +
      "currentRange is given). Required: profileIds (1-100 account IDs, from the profileId field " +
      "of ghl_get_social_accounts). Optional: platforms, currentRange, prevRange (prevRange only " +
      "applies when currentRange is also given).",
    inputSchema: z.object({
      profileIds: z
        .array(z.string())
        .describe("1-100 connected social account IDs (profileId from the accounts API) to fetch analytics for"),
      platforms: z.array(z.enum(PLATFORM_ENUM)).optional().describe("Filter by platform(s); defaults to all platforms if omitted"),
      currentRange: z
        .object({
          startDate: z.string().describe("ISO 8601 start date"),
          endDate: z.string().describe("ISO 8601 end date"),
        })
        .optional()
        .describe("Custom date range for the current period (defaults to last 7 days if omitted)"),
      prevRange: z
        .object({
          startDate: z.string().describe("ISO 8601 start date"),
          endDate: z.string().describe("ISO 8601 end date"),
        })
        .optional()
        .describe("Comparison date range; only used when currentRange is also given"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          "/social-media-posting/statistics",
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId },
            body: args,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
