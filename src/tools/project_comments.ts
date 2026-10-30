import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

// GHL Projects does not use locationId: it is derived from the auth token,
// so no tool in this file sends it.

const COMMENT_BODY_MAX = 32000;

export const projectCommentTools = [
  {
    name: "ghl_get_task_comments",
    description:
      "List the comments on a Project task (paginated). `skip` must be a multiple of `limit`.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
      skip: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Number of comments to skip (default 0). Must be a multiple of limit."),
      limit: z.number().int().min(1).max(100).optional().describe("Maximum comments to return (1-100, default 50)"),
    }),
    handler: async (args: { taskId: string; skip?: number; limit?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/projects/tasks/${args.taskId}/comments`, {
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
    name: "ghl_create_task_comment",
    description: "Add a comment to a Project task. Optionally reply to a comment or mention users.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
      body: z.string().max(COMMENT_BODY_MAX).describe(`Comment text (max ${COMMENT_BODY_MAX} characters)`),
      parentCommentId: z
        .string()
        .nullable()
        .optional()
        .describe("ID of the comment this one replies to, if it is a reply"),
      mentionedUserIds: z.array(z.string()).optional().describe("User IDs to mention in the comment"),
    }),
    handler: async (
      args: { taskId: string; body: string; parentCommentId?: string | null; mentionedUserIds?: string[] },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", `/projects/tasks/${args.taskId}/comments`, {
          token: config.token,
          version: GHL_VERSION_V3,
          body: {
            body: args.body,
            parentCommentId: args.parentCommentId,
            mentionedUserIds: args.mentionedUserIds,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_task_comment",
    description: "Update the text (and mentions) of a comment on a Project task.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
      commentId: z.string().describe("Comment ID"),
      body: z.string().max(COMMENT_BODY_MAX).describe(`Comment text (max ${COMMENT_BODY_MAX} characters)`),
      mentionedUserIds: z.array(z.string()).optional().describe("User IDs to mention in the comment"),
    }),
    handler: async (
      args: { taskId: string; commentId: string; body: string; mentionedUserIds?: string[] },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PATCH",
          `/projects/tasks/${args.taskId}/comments/${args.commentId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: {
              body: args.body,
              mentionedUserIds: args.mentionedUserIds,
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
    name: "ghl_delete_task_comment",
    description: "Delete a comment from a Project task.",
    inputSchema: z.object({
      taskId: z.string().describe("Task ID"),
      commentId: z.string().describe("Comment ID"),
    }),
    handler: async (args: { taskId: string; commentId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/projects/tasks/${args.taskId}/comments/${args.commentId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
