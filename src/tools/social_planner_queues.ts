import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

const timeSlotSchema = z.object({
  dayOfWeek: z.number().describe("Day of the week (0-6)"),
  time: z.string().describe("Time in HH:mm format"),
});

// modifiedPostPayload (QueueModifiedPostDTO) and each item of `variations`
// (VariationInputDTO, which itself nests an OgTagsInputDTO ref) are deeply
// nested / loosely specified in the upstream spec — modeled as free-form
// records per established precedent rather than fully typed out.
const modifiedPostPayloadSchema = z
  .record(z.string(), z.unknown())
  .describe("New/modified post details (QueueModifiedPostDTO — deeply nested, passed through as-is)");

const variationsSchema = z
  .array(z.record(z.string(), z.unknown()))
  .describe("Post content variations (VariationInputDTO[] — passed through as-is)");

// `order` / `newOrder` accept either a numeric position or the string keywords
// "top" / "bottom" per the spec's oneOf[number, string].
const orderSchema = z
  .union([z.number(), z.string()])
  .describe('Order value: a number, or "top" / "bottom"');

export const socialPlannerQueuesTools = [
  {
    name: "ghl_create_social_queue",
    description:
      "Create a content queue for a social media category. Required fields: categoryId, timeSlots, userId. Optional: enableFuturePosts, prioritizeNewContent.",
    inputSchema: z.object({
      categoryId: z.string().describe("The category ID this queue belongs to"),
      timeSlots: z.array(timeSlotSchema).describe("Recurring posting time slots for the queue"),
      userId: z.string().describe("The user ID that owns/creates the queue"),
      enableFuturePosts: z
        .boolean()
        .optional()
        .describe("Automatically queue any new posts created in this category"),
      prioritizeNewContent: z
        .boolean()
        .optional()
        .describe("Place new items added via directToQueue at the top of the queue"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/social-media-posting/category/queues", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_queue_categories",
    description:
      "List social media categories available for creating queues. Optional: skip, limit, q (search query).",
    inputSchema: z.object({
      skip: z.number().optional().describe("Number of results to skip"),
      limit: z.number().optional().describe("Max results to return"),
      q: z.string().optional().describe("Search query to filter categories"),
    }),
    handler: async (
      args: { skip?: number; limit?: number; q?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          "/social-media-posting/category/queues/available-categories",
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              locationId: config.locationId,
              skip: args.skip,
              limit: args.limit,
              q: args.q,
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
    name: "ghl_list_social_queues",
    description: "List content queues for the location. Optional: skip, limit.",
    inputSchema: z.object({
      skip: z.number().optional().describe("Number of results to skip"),
      limit: z.number().optional().describe("Max results to return"),
    }),
    handler: async (args: { skip?: number; limit?: number }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/social-media-posting/category/queues/list", {
          token: config.token,
          version: GHL_VERSION_V3,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_queue_calendar",
    description:
      "Fetch a calendar view of queued posts. Required fields: startDate, endDate. Optional: categoryIds, accountIds.",
    inputSchema: z.object({
      startDate: z.string().describe("Calendar range start date"),
      endDate: z.string().describe("Calendar range end date"),
      categoryIds: z.array(z.string()).optional().describe("Filter by category IDs"),
      accountIds: z.array(z.string()).optional().describe("Filter by social account IDs"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          "/social-media-posting/category/queues/list/calendar",
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...args, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_social_queue_active_post",
    description: "Delete the currently active queue post and schedule the next one. Required fields: postId.",
    inputSchema: z.object({
      postId: z.string().describe("The active post ID to delete"),
    }),
    handler: async (args: { postId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/social-media-posting/category/queues/${args.postId}/active-post`,
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
    name: "ghl_get_social_queue",
    description: "Get a content queue by ID. Required fields: queueId.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
    }),
    handler: async (args: { queueId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/social-media-posting/category/queues/${args.queueId}`,
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
    name: "ghl_update_social_queue",
    description:
      "Update a content queue. Required fields: queueId. Optional: skipLegacyWatermark, status, skipDateTime, timeSlots, enableFuturePosts, prioritizeNewContent.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID to update"),
      skipLegacyWatermark: z
        .boolean()
        .optional()
        .describe("Skip legacy watermark cleanup when rescheduling posts"),
      // Spec quirk: the OpenAPI spec types `status` as `object` but its example
      // value is the plain string "paused" — modeled as a string to match the
      // actual API example rather than the declared (likely incorrect) type.
      status: z.string().optional().describe('Queue status, e.g. "paused"'),
      skipDateTime: z.string().optional().describe("Skip date/time in ISO format"),
      timeSlots: z.array(timeSlotSchema).optional().describe("Recurring posting time slots"),
      enableFuturePosts: z
        .boolean()
        .optional()
        .describe("Automatically queue any new posts created in this category"),
      prioritizeNewContent: z
        .boolean()
        .optional()
        .describe("Place new items added via directToQueue at the top of the queue"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, ...fields } = args as { queueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/social-media-posting/category/queues/${queueId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_social_queue_item",
    description:
      "Create a new item in a content queue. Required fields: queueId. Optional: sessionId, modifiedPostPayload, order, variations, primaryImage, directToQueue.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID to add the item to"),
      sessionId: z.string().optional().describe("Edit session ID"),
      modifiedPostPayload: modifiedPostPayloadSchema.optional(),
      order: orderSchema.optional(),
      variations: variationsSchema.optional(),
      primaryImage: z
        .string()
        .optional()
        .describe(
          "Primary media URL (image). Falls back to modifiedPostPayload.primaryImage if not set."
        ),
      directToQueue: z
        .boolean()
        .optional()
        .describe(
          "When true, creates the item directly without requiring an edit session; order is ignored"
        ),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, ...fields } = args as { queueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${queueId}/create/item`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_queue_edit_calendar",
    description:
      "Fetch a calendar view of an active edit session. Required fields: queueId, sessionId, startDate, endDate. Optional: accountIds.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      sessionId: z.string().describe("Edit session ID"),
      startDate: z.string().describe("Calendar range start date"),
      endDate: z.string().describe("Calendar range end date"),
      accountIds: z.array(z.string()).optional().describe("Filter by social account IDs"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, ...fields } = args as { queueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${queueId}/edit/calendar`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_discard_social_queue_edit",
    description:
      "Discard an active queue edit session. Required fields: queueId, sessionId. Optional: keepInDraft.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      sessionId: z.string().describe("Edit session ID to discard"),
      keepInDraft: z.boolean().optional().describe("Keep discarded changes as a draft"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, ...fields } = args as { queueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${queueId}/edit/discard`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_save_social_queue_edit",
    description:
      "Save an active queue edit session. Required fields: queueId, sessionId. Optional: keepInDraft.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      sessionId: z.string().describe("Edit session ID to save"),
      keepInDraft: z.boolean().optional().describe("Keep the saved changes as a draft"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, ...fields } = args as { queueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${queueId}/edit/save`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_start_social_queue_edit",
    description: "Start a new edit session for a content queue. Required fields: queueId.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID to start editing"),
    }),
    handler: async (args: { queueId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${args.queueId}/edit/start`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_queue_items",
    description:
      "List items in a content queue. Required fields: queueId. Optional: sessionId, skip, limit, errorFilter, itemId.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      sessionId: z.string().optional().describe("Edit session ID to scope results to"),
      skip: z.number().optional().describe("Number of results to skip"),
      limit: z.number().optional().describe("Max results to return"),
      errorFilter: z.boolean().optional().describe("Filter to items with posting errors"),
      itemId: z.string().optional().describe("Filter to a specific item ID"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, ...fields } = args as { queueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${queueId}/items`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_social_queue_item",
    description:
      "Delete an item from a content queue. Required fields: queueId, itemId. Optional: sessionId.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      itemId: z.string().describe("The queue item ID to delete"),
      sessionId: z.string().optional().describe("Edit session ID"),
    }),
    handler: async (
      args: { queueId: string; itemId: string; sessionId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/social-media-posting/category/queues/${args.queueId}/items/${args.itemId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: { locationId: config.locationId, sessionId: args.sessionId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_social_queue_item",
    description:
      "Update an item in a content queue. Required fields: queueId, itemId. Optional: sessionId, modifiedPostPayload, newOrder, variations, primaryImage.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      itemId: z.string().describe("The queue item ID to update"),
      sessionId: z.string().optional().describe("Edit session ID"),
      modifiedPostPayload: modifiedPostPayloadSchema.optional(),
      newOrder: orderSchema.optional(),
      variations: variationsSchema.optional(),
      primaryImage: z.string().optional().describe("Primary media URL (image)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, itemId, ...fields } = args as {
        queueId: string;
        itemId: string;
      } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/social-media-posting/category/queues/${queueId}/items/${itemId}`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_clone_social_queue_item",
    description:
      "Clone an item in a content queue. Required fields: queueId, itemId, sessionId, order.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      itemId: z.string().describe("The queue item ID to clone"),
      sessionId: z.string().describe("Edit session ID"),
      order: z.number().describe("Order value for the cloned item"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, itemId, ...fields } = args as {
        queueId: string;
        itemId: string;
      } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${queueId}/items/${itemId}/clone`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_reset_social_queue_item",
    description:
      "Reset an item in a content queue back to its original state. Required fields: queueId, itemId. Optional: sessionId.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      itemId: z.string().describe("The queue item ID to reset"),
      sessionId: z.string().optional().describe("Edit session ID"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, itemId, ...fields } = args as {
        queueId: string;
        itemId: string;
      } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "PUT",
          `/social-media-posting/category/queues/${queueId}/items/${itemId}/reset`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_social_queue_slots",
    description:
      "List available posting slots for a content queue. Required fields: queueId. Optional: sessionId, skip, limit.",
    inputSchema: z.object({
      queueId: z.string().describe("The queue ID"),
      sessionId: z.string().optional().describe("Edit session ID to scope results to"),
      skip: z.number().optional().describe("Number of results to skip"),
      limit: z.number().optional().describe("Max results to return"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      const { queueId, ...fields } = args as { queueId: string } & Record<string, unknown>;
      try {
        const result = await ghlRequest(
          "POST",
          `/social-media-posting/category/queues/${queueId}/slots`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            body: { ...fields, locationId: config.locationId },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
