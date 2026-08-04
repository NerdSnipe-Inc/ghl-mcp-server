import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: like facebook_accounts.ts and facebook_campaigns.ts, every operation in
// this file declares its `Version` header as a fixed single-value enum of the legacy
// date "2021-07-28" — verified directly against ad-publishing-v3.json for all 12
// operations below. None of them are the ["v3"] exception (that's publishing-progress,
// out of scope here), so GHL_VERSION_LEGACY is used throughout.

// Spec quirk: PUT /facebook/custom-audience/{audienceId} takes the audience ID in the
// path and only updates `name`/`description` — it is a plain update, not an upsert,
// so it's named `ghl_update_facebook_custom_audience`. PUT /facebook/pixels takes no ID
// in the path (only an optional `conversionPixelId` in the body) — it's a genuine
// create-or-update, so it's named `ghl_upsert_facebook_pixel`.

// Spec quirk: UpdateCustomAudienceBatchDTO.dynamicAudience is typed `string` with
// example value `"true"` — a boolean-shaped flag modeled as a free string in the spec.
// Passed through as-is (string) rather than coerced to boolean.

// Spec quirk: UpsertConversionPixelDTO.type and UpdateCustomAudienceBatchDTO.operationType
// are documented only as free-form strings with a single example (e.g. "LEAD_EVENT",
// "ADD") — the spec declares no enum, so these are modeled as plain strings rather than
// a closed set of literals.

export const facebookAudiencesTools = [
  {
    name: "ghl_get_facebook_custom_audiences",
    description:
      "Get Facebook custom audiences for a location. Required fields: type, adAccountId. Optional: source.",
    inputSchema: z.object({
      type: z.enum(["lookalike", "custom", "all"]).describe("Custom audience type filter"),
      adAccountId: z.string().describe("Facebook ad account ID"),
      source: z.enum(["ad_manager", "integration"]).optional().describe("Audience data source"),
    }),
    handler: async (
      args: {
        type: "lookalike" | "custom" | "all";
        adAccountId: string;
        source?: "ad_manager" | "integration";
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/custom-audience", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            type: args.type,
            adAccountId: args.adAccountId,
            source: args.source,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_facebook_custom_audience",
    description: "Delete a Facebook custom audience. Required fields: audienceId. Optional: isDraft.",
    inputSchema: z.object({
      audienceId: z.string().describe("The Facebook custom audience ID to delete"),
      isDraft: z.boolean().optional().describe("Whether to delete the draft version"),
    }),
    handler: async (args: { audienceId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/ad-publishing/facebook/custom-audience/${args.audienceId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            params: { locationId: config.locationId, isDraft: args.isDraft },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_facebook_custom_audience",
    description:
      "Update a Facebook custom audience's name and description. Required fields: audienceId, name. Optional: description.",
    inputSchema: z.object({
      audienceId: z.string().describe("The Facebook custom audience ID to update"),
      name: z.string().describe("Audience name"),
      description: z.string().optional().describe("Audience description"),
    }),
    handler: async (
      args: { audienceId: string; name: string; description?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/ad-publishing/facebook/custom-audience/${args.audienceId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            body: {
              locationId: config.locationId,
              name: args.name,
              description: args.description,
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
    name: "ghl_get_facebook_custom_audience",
    description: "Get a single Facebook custom audience by ID. Required fields: audienceId. Optional: isDraft.",
    inputSchema: z.object({
      audienceId: z.string().describe("The Facebook custom audience ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { audienceId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/custom-audience/${args.audienceId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            params: { locationId: config.locationId, isDraft: args.isDraft },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_add_facebook_custom_audience_member",
    description:
      "Add a contact to a Facebook custom audience. Required fields: audienceId, contactId. Optional: fbAdAccountId.",
    inputSchema: z.object({
      audienceId: z.string().describe("The Facebook custom audience ID"),
      contactId: z.string().describe("The contact ID to add to the audience"),
      fbAdAccountId: z.string().optional().describe("Facebook ad account ID"),
    }),
    handler: async (
      args: { audienceId: string; contactId: string; fbAdAccountId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/ad-publishing/facebook/custom-audience/${args.audienceId}/member`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            body: {
              locationId: config.locationId,
              contactId: args.contactId,
              fbAdAccountId: args.fbAdAccountId,
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
    name: "ghl_remove_facebook_custom_audience_member",
    description:
      "Remove a contact from a Facebook custom audience. Required fields: audienceId, contactId. Optional: fbAdAccountId.",
    inputSchema: z.object({
      audienceId: z.string().describe("The Facebook custom audience ID"),
      contactId: z.string().describe("The contact ID to remove from the audience"),
      fbAdAccountId: z.string().optional().describe("Facebook ad account ID"),
    }),
    handler: async (
      args: { audienceId: string; contactId: string; fbAdAccountId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/ad-publishing/facebook/custom-audience/${args.audienceId}/member`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            body: {
              locationId: config.locationId,
              contactId: args.contactId,
              fbAdAccountId: args.fbAdAccountId,
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
    name: "ghl_batch_update_facebook_custom_audience_members",
    description:
      "Batch add or remove members of a Facebook custom audience via CSV, smartlists, or a dynamic audience. Required fields: audienceId, operationType. Optional: csvPath, smartlistIds, dynamicAudience.",
    inputSchema: z.object({
      audienceId: z.string().describe("The Facebook custom audience ID"),
      operationType: z.string().describe("Batch operation type (e.g. ADD, REMOVE)"),
      csvPath: z.string().optional().describe("CSV file path containing the members to update"),
      smartlistIds: z.array(z.string()).optional().describe("Smartlist IDs to source members from"),
      dynamicAudience: z
        .string()
        .optional()
        .describe("Dynamic audience flag (spec models this as a string, e.g. \"true\")"),
    }),
    handler: async (
      args: {
        audienceId: string;
        operationType: string;
        csvPath?: string;
        smartlistIds?: string[];
        dynamicAudience?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/ad-publishing/facebook/custom-audience/${args.audienceId}/member/batch`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            body: {
              locationId: config.locationId,
              operationType: args.operationType,
              csvPath: args.csvPath,
              smartlistIds: args.smartlistIds,
              dynamicAudience: args.dynamicAudience,
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
    name: "ghl_get_facebook_pixels",
    description:
      "Get Facebook conversion pixels for a location. Optional: channel, pageId, igUserId.",
    inputSchema: z.object({
      channel: z.string().optional().describe("Channel filter"),
      pageId: z.string().optional().describe("Facebook page ID filter"),
      igUserId: z.string().optional().describe("Instagram user ID filter"),
    }),
    handler: async (
      args: { channel?: string; pageId?: string; igUserId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/pixels", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            channel: args.channel,
            pageId: args.pageId,
            igUserId: args.igUserId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_facebook_pixel",
    description:
      "Create or update a Facebook conversion pixel. Pass conversionPixelId to update an existing pixel, or omit it to create a new one. Required fields: type. Optional: name, igUserId.",
    inputSchema: z.object({
      conversionPixelId: z
        .string()
        .optional()
        .describe("Conversion pixel ID — provide to update, omit to create"),
      name: z.string().optional().describe("Pixel name"),
      igUserId: z.string().optional().describe("Instagram user ID"),
      type: z.string().describe("Pixel event type (e.g. LEAD_EVENT)"),
    }),
    handler: async (
      args: { conversionPixelId?: string; name?: string; igUserId?: string; type: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/facebook/pixels", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: {
            locationId: config.locationId,
            conversionPixelId: args.conversionPixelId,
            name: args.name,
            igUserId: args.igUserId,
            type: args.type,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_facebook_conversation_forms",
    description: "Get Facebook conversation forms for a location. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch draft versions"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/conversation-forms", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_facebook_conversation_form",
    description:
      "Create a Facebook conversation form. Required fields: name, text, questions (array of {question, response?}).",
    inputSchema: z.object({
      name: z.string().describe("Conversation form name"),
      text: z.string().describe("Welcome message text"),
      questions: z
        .array(
          z.object({
            question: z.string().describe("Question title text"),
            response: z.string().optional().describe("Auto-response message"),
          })
        )
        .describe("Quick-reply questions shown in the welcome message"),
    }),
    handler: async (
      args: { name: string; text: string; questions: { question: string; response?: string }[] },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/ad-publishing/facebook/conversation-forms", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: {
            locationId: config.locationId,
            name: args.name,
            text: args.text,
            questions: args.questions,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_facebook_lead_form",
    description: "Get a single Facebook lead form by ID. Required fields: leadFormId. Optional: isDraft.",
    inputSchema: z.object({
      leadFormId: z.string().describe("The Facebook lead form ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { leadFormId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/lead-form/${args.leadFormId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            params: { locationId: config.locationId, isDraft: args.isDraft },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
