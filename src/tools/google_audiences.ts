import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: like google_accounts.ts and google_campaigns.ts, every operation in this
// file declares its `Version` header as a fixed single-value enum of the legacy date
// "2021-07-28" — verified directly against ad-publishing-v3.json for each of the 14
// operations below.

// Spec quirk: `PUT /ad-publishing/google/audiences`, `PUT /ad-publishing/google/segments`,
// and `PUT /ad-publishing/google/conversions` are all genuine upserts (no ID in the
// path) — verified directly. `UpsertAudienceDTO` and `UpsertConversionDTO` accept an
// optional `resourceName`/`conversionId` field respectively to key an update vs create,
// while `UpsertSegmentDTO` accepts an optional `id`. Named `ghl_upsert_google_*`
// accordingly.

// Spec quirk: `ruleBasedUserList` on `UpsertSegmentDTO` (via `RuleBasedUserListDTO` ->
// `FlexibleRuleUserListDTO` -> `RuleOperandDTO` -> `RuleDTO` -> ruleItemGroups ->
// ruleItems -> per-type rule-item variants) is a genuinely deep/wide $ref chain —
// modeled permissively as z.record per established precedent (see google_campaigns.ts
// `audience`/`assets`/`adGroups`), rather than flattened into a shallow z.object.

// Spec quirk: `dimensions`/`exclusionDimension` on `UpsertAudienceDTO` both reference
// the same shared schema, `AudienceDimensionDTO` (4 fields, one of which nests a small
// 3-field `AudienceSegmentsDTO` — no deeper chain) — modeled as a proper nested
// z.object() rather than z.record, since the full shape is shallow and knowable.

export const googleAudiencesTools = [
  {
    name: "ghl_upsert_google_audience",
    description:
      "Create or update a Google Ads audience. Pass resourceName to update an existing audience, or omit it to create a new one. Required fields: name. Optional: dimensions, exclusionDimension.",
    inputSchema: z.object({
      resourceName: z
        .string()
        .optional()
        .describe("Google Ads resource name — provide to update, omit to create"),
      name: z.string().describe("Audience name"),
      dimensions: z
        .object({
          isAgeUnknown: z.boolean().optional().describe("Include unknown age"),
          ageRanges: z.array(z.string()).optional().describe("Age range filters"),
          genders: z.array(z.string()).optional().describe("Gender targets"),
          parentalStatuses: z.array(z.string()).optional().describe("Parental status targets"),
          audienceSegments: z
            .object({
              customAudiences: z
                .array(z.string())
                .optional()
                .describe("Resource names of custom audience segments"),
              userLists: z
                .array(z.string())
                .optional()
                .describe("Resource names of user lists (remarketing, customer match, etc.)"),
              userInterests: z
                .array(z.string())
                .optional()
                .describe("Resource names of user interest segments"),
            })
            .optional()
            .describe("Audience segment references used for targeting"),
        })
        .optional()
        .describe("Audience dimensions"),
      exclusionDimension: z
        .object({
          isAgeUnknown: z.boolean().optional().describe("Include unknown age"),
          ageRanges: z.array(z.string()).optional().describe("Age range filters"),
          genders: z.array(z.string()).optional().describe("Gender targets"),
          parentalStatuses: z.array(z.string()).optional().describe("Parental status targets"),
          audienceSegments: z
            .object({
              customAudiences: z.array(z.string()).optional().describe("Resource names of custom audience segments"),
              userLists: z.array(z.string()).optional().describe("Resource names of user lists"),
              userInterests: z.array(z.string()).optional().describe("Resource names of user interest segments"),
            })
            .optional()
            .describe("Audience segment references used for targeting"),
        })
        .optional()
        .describe("Exclusion dimensions"),
    }),
    handler: async (
      args: {
        resourceName?: string;
        name: string;
        dimensions?: {
          isAgeUnknown?: boolean;
          ageRanges?: string[];
          genders?: string[];
          parentalStatuses?: string[];
          audienceSegments?: { customAudiences?: string[]; userLists?: string[]; userInterests?: string[] };
        };
        exclusionDimension?: {
          isAgeUnknown?: boolean;
          ageRanges?: string[];
          genders?: string[];
          parentalStatuses?: string[];
          audienceSegments?: { customAudiences?: string[]; userLists?: string[]; userInterests?: string[] };
        };
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/google/audiences", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_google_audiences",
    description: "List Google Ads audiences for the location. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch draft versions"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/audiences", {
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
    name: "ghl_get_google_audience",
    description: "Get a single Google Ads audience by ID. Required fields: audienceId. Optional: isDraft.",
    inputSchema: z.object({
      audienceId: z.string().describe("The Google Ads audience ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { audienceId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/ad-publishing/google/audiences/${args.audienceId}`, {
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
    name: "ghl_get_google_segments",
    description: "List Google Ads segments for the location. Optional: type.",
    inputSchema: z.object({
      type: z.string().optional().describe("Filter by segment type"),
    }),
    handler: async (args: { type?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/segments", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, type: args.type },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_google_segment",
    description:
      "Create or update a Google Ads segment. Pass id in the body to update an existing segment, or omit it to create a new one. Required fields: type (CUSTOM_SEGMENTS, WEBSITE_VISITOR, CUSTOMER_MATCH, LOOKALIKE), name. Optional: description, members, status, id, membershipStatus, ruleBasedUserList, membershipLifeSpan, seedUserListIds, countryCodes, expansionLevel (BALANCED, BROAD, NARROW).",
    inputSchema: z.object({
      type: z
        .enum(["CUSTOM_SEGMENTS", "WEBSITE_VISITOR", "CUSTOMER_MATCH", "LOOKALIKE"])
        .describe("Segment type"),
      name: z.string().describe("Segment name"),
      description: z.string().optional().describe("Segment description"),
      members: z
        .array(
          z.object({
            memberType: z.enum(["KEYWORD", "URL", "APP"]).describe("Member type"),
            keyword: z.string().optional().describe("Keyword value"),
            url: z.string().optional().describe("URL value"),
            app: z.string().optional().describe("App identifier"),
          })
        )
        .optional()
        .describe("Segment members"),
      status: z.string().optional().describe("Segment status"),
      id: z.string().optional().describe("Segment ID — provide to update, omit to create"),
      membershipStatus: z.string().optional().describe("Membership status"),
      ruleBasedUserList: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Rule-based user list config"),
      membershipLifeSpan: z.number().optional().describe("Membership life span in days"),
      seedUserListIds: z.array(z.string()).optional().describe("Seed user list IDs"),
      countryCodes: z.array(z.string()).optional().describe("Country codes"),
      expansionLevel: z
        .enum(["BALANCED", "BROAD", "NARROW"])
        .optional()
        .describe("Lookalike expansion level"),
    }),
    handler: async (
      args: {
        type: string;
        name: string;
        description?: string;
        members?: { memberType: "KEYWORD" | "URL" | "APP"; keyword?: string; url?: string; app?: string }[];
        status?: string;
        id?: string;
        membershipStatus?: string;
        ruleBasedUserList?: Record<string, unknown>;
        membershipLifeSpan?: number;
        seedUserListIds?: string[];
        countryCodes?: string[];
        expansionLevel?: "BALANCED" | "BROAD" | "NARROW";
      },
      config: GHLConfig
    ) => {
      try {
        const { type, ...body } = args;
        const result = await ghlRequest("PUT", "/ad-publishing/google/segments", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, type },
          body,
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_create_google_offline_user_list_job",
    description:
      "Create a Google Ads offline user list upload job. Optional: smartListIds, csvPath, userListId, isDynamic.",
    inputSchema: z.object({
      smartListIds: z.array(z.string()).optional().describe("Smart list IDs to include"),
      csvPath: z.string().optional().describe("Path to a CSV file of offline users"),
      userListId: z.string().optional().describe("Target user list ID"),
      isDynamic: z.boolean().optional().describe("Whether the list updates dynamically"),
    }),
    handler: async (
      args: { smartListIds?: string[]; csvPath?: string; userListId?: string; isDynamic?: boolean },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "POST",
          "/ad-publishing/google/segments/offline-user-list-job",
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_delete_google_segment",
    description:
      "Delete a Google Ads segment. Required fields: segmentId, type (CUSTOM_SEGMENTS, DATA_SEGMENTS).",
    inputSchema: z.object({
      segmentId: z.string().describe("The Google Ads segment ID"),
      type: z.enum(["CUSTOM_SEGMENTS", "DATA_SEGMENTS"]).describe("Segment type"),
    }),
    handler: async (args: { segmentId: string; type: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/ad-publishing/google/segments/${args.segmentId}`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, type: args.type },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_google_segment",
    description:
      "Get a single Google Ads segment by ID. Required fields: segmentId, type (CUSTOM_SEGMENTS, DATA_SEGMENTS).",
    inputSchema: z.object({
      segmentId: z.string().describe("The Google Ads segment ID"),
      type: z.enum(["CUSTOM_SEGMENTS", "DATA_SEGMENTS"]).describe("Segment type"),
    }),
    handler: async (args: { segmentId: string; type: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/ad-publishing/google/segments/${args.segmentId}`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, type: args.type },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_google_conversions",
    description:
      "List Google Ads conversion actions for the location. Optional: type (AD_MANAGER, AD_WORDS), conversionType, category, startDate, endDate.",
    inputSchema: z.object({
      type: z.enum(["AD_MANAGER", "AD_WORDS"]).optional().describe("Conversion source type"),
      conversionType: z.string().optional().describe("Filter by conversion type"),
      category: z.string().optional().describe("Filter by conversion category"),
      startDate: z.string().optional().describe("Filter start date"),
      endDate: z.string().optional().describe("Filter end date"),
    }),
    handler: async (
      args: {
        type?: string;
        conversionType?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/conversions", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, ...args },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_google_conversion",
    description:
      "Create or update a Google Ads conversion action. Pass conversionId to update an existing conversion, or omit it to create a new one. Required fields: name, type (UPLOAD_CLICKS, UPLOAD_CALLS, WEBPAGE, LEAD_FORM_SUBMIT), category, valueSettings, countingType (ONE_PER_CLICK, MANY_PER_CLICK), attributionModel (GOOGLE_SEARCH_ATTRIBUTION_DATA_DRIVEN, GOOGLE_ADS_LAST_CLICK), clickThroughWindow.",
    inputSchema: z.object({
      conversionId: z
        .string()
        .optional()
        .describe("Conversion ID — provide to update, omit to create"),
      name: z.string().describe("Conversion action name"),
      type: z
        .enum(["UPLOAD_CLICKS", "UPLOAD_CALLS", "WEBPAGE", "LEAD_FORM_SUBMIT"])
        .describe("Conversion action type"),
      category: z.string().describe("Conversion category"),
      valueSettings: z
        .object({
          defaultValue: z.number().describe("Default monetary value assigned to each conversion"),
          defaultCurrencyCode: z.string().describe("ISO 4217 currency code for the default value"),
          alwaysUseDefaultValue: z
            .boolean()
            .describe("When true, always uses the default value even if a transaction-specific value is provided"),
        })
        .describe("Value settings that control how monetary value is attributed to conversions"),
      countingType: z.enum(["ONE_PER_CLICK", "MANY_PER_CLICK"]).describe("Conversion counting type"),
      attributionModel: z
        .enum(["GOOGLE_SEARCH_ATTRIBUTION_DATA_DRIVEN", "GOOGLE_ADS_LAST_CLICK"])
        .describe("Attribution model"),
      clickThroughWindow: z.number().describe("Click-through conversion window in days"),
    }),
    handler: async (
      args: {
        conversionId?: string;
        name: string;
        type: string;
        category: string;
        valueSettings: { defaultValue: number; defaultCurrencyCode: string; alwaysUseDefaultValue: boolean };
        countingType: string;
        attributionModel: string;
        clickThroughWindow: number;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/google/conversions", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { ...args, locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_google_conversion",
    description: "Get a single Google Ads conversion action by ID. Required fields: conversionId. Optional: isDraft.",
    inputSchema: z.object({
      conversionId: z.string().describe("The Google Ads conversion action ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { conversionId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/ad-publishing/google/conversions/${args.conversionId}`, {
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
    name: "ghl_delete_google_conversion",
    description: "Delete a Google Ads conversion action. Required fields: conversionId. Optional: isDraft.",
    inputSchema: z.object({
      conversionId: z.string().describe("The Google Ads conversion action ID"),
      isDraft: z.boolean().optional().describe("Whether to target the draft version"),
    }),
    handler: async (args: { conversionId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/ad-publishing/google/conversions/${args.conversionId}`, {
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
    name: "ghl_get_google_conversion_goals",
    description: "List Google Ads conversion goals for the location. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch draft versions"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/conversion-goals", {
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
    name: "ghl_get_google_target_interests",
    description:
      "Search Google Ads target interest categories. Required fields: type (AFFINITY, IN_MARKET), advertisingChannelType.",
    inputSchema: z.object({
      type: z.enum(["AFFINITY", "IN_MARKET"]).describe("Target interest type"),
      advertisingChannelType: z.string().describe("Advertising channel type to search interests for"),
    }),
    handler: async (args: { type: string; advertisingChannelType: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/target-interests", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            type: args.type,
            advertisingChannelType: args.advertisingChannelType,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
