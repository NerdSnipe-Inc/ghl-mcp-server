import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: like google_accounts.ts and facebook_campaigns.ts, every operation in
// this file declares its `Version` header as a fixed single-value enum of the legacy
// date "2021-07-28" — verified directly against ad-publishing-v3.json for each of the
// 6 operations below. None is the sole GHL_VERSION_V3 exception (that's Facebook's
// campaign publishing-progress endpoint, out of scope here).

// Spec quirk: `PUT /ad-publishing/google/ads` (ghl_upsert_google_campaign) is a genuine
// upsert — no ID in the path, an optional `id` in the body decides create vs update —
// verified directly (requestBody schema `CampaignDTO`, required: name, locationId,
// advertisingChannelType).

// Spec quirk: `advertisingChannelSubType` is declared as a string enum with exactly one
// value, `["DEMAND_GEN"]`, in the spec — modeled as-is even though a single-value enum
// is unusual for this field.

// Spec quirk: `POST /ad-publishing/google/assets` is labeled "Upsert assets" in the
// spec's summary and its requestBody schema (`UpsertAssetsDTO`) has no top-level `id`,
// but each of the three oneOf payload variants (Call/Sitelink/LeadForm) carries an
// optional `resourceName` field described as "Google Ads resource name for an existing
// asset" — presence of `resourceName` inside `payload` is what keys create vs update.
// Confirmed genuinely upsert-shaped; kept the name ghl_upsert_google_assets. The
// `payload` oneOf is modeled permissively as z.record per established precedent since
// its shape depends on `type`.

// Spec quirk: `GET /ad-publishing/google/assets` allows `type` enum
// [CALL, SITELINK, LEAD_FORM, IMAGE, TEXT], but `POST /ad-publishing/google/assets`
// only allows [CALL, SITELINK, LEAD_FORM] for the same field — the GET-only values
// IMAGE and TEXT appear to be read-only asset types with no documented upsert payload
// shape. Each tool's `type` enum reflects its own operation's schema exactly.

// Spec quirk: `POST /ad-publishing/google/ads/{adId}/publish` declares no requestBody
// and no locationId parameter at all (path param adId only) — verified directly, not
// assumed. No body is sent.

// Spec quirk: `advertiserOnly` on `GET /ad-publishing/google/assets` is declared as
// `type: string` (no enum), not boolean — modeled as z.string() to match the spec
// literally, even though query params serialize to strings regardless at the wire level.

export const googleCampaignsTools = [
  {
    name: "ghl_upsert_google_campaign",
    description:
      "Create or update a Google Ads campaign. Pass id to update an existing campaign, or omit it to create a new one. Required fields: name, advertisingChannelType (SEARCH, DISCOVERY, DISPLAY, HOTEL, LOCAL, MULTI_CHANNEL, PERFORMANCE_MAX, DEMAND_GEN). Optional: advertisingChannelSubType (DEMAND_GEN), goalType (WEBSITE_TRAFFIC, LEAD), budget, audience, networkSettings, biddingStrategy, assets, isEuPoliticalAds, adGroups, campaignGoal, adSchedule, publishingStatus (DRAFT, SCHEDULED, PUBLISHED, PUBLISHING, FAILED, IN_REVIEW, PAUSED, ARCHIVED, WITH_ISSUES, REJECTED), googleAdAccountId, unpublishedChanges, maximumCpc, googleCampaignId, source, advancedOptions.",
    inputSchema: z.object({
      id: z.string().optional().describe("Campaign ID — provide to update, omit to create"),
      name: z.string().describe("Campaign name"),
      advertisingChannelType: z
        .enum([
          "SEARCH",
          "DISCOVERY",
          "DISPLAY",
          "HOTEL",
          "LOCAL",
          "MULTI_CHANNEL",
          "PERFORMANCE_MAX",
          "DEMAND_GEN",
        ])
        .describe("Advertising channel type"),
      advertisingChannelSubType: z
        .enum(["DEMAND_GEN"])
        .optional()
        .describe("Advertising channel sub type"),
      goalType: z.enum(["WEBSITE_TRAFFIC", "LEAD"]).optional().describe("Campaign goal type"),
      budget: z
        .object({
          budgetType: z.enum(["DAILY", "LIFETIME"]).optional().describe("Budget type"),
          amount: z.number().optional().describe("Budget amount in micros"),
          scheduleStartDate: z.string().optional().describe("Schedule start date"),
          scheduleEndDate: z.string().optional().describe("Schedule end date"),
        })
        .optional()
        .describe("Campaign budget configuration"),
      audience: z.record(z.string(), z.unknown()).optional().describe("Targeting audience configuration"),
      networkSettings: z
        .object({
          targetSearchNetwork: z.boolean().describe("Target Google Search Network"),
          targetContentNetwork: z.boolean().describe("Target Google Display Network"),
        })
        .optional()
        .describe("Network settings configuration"),
      biddingStrategy: z
        .object({
          type: z.string().optional().describe("Bidding strategy type (e.g. MAXIMIZE_CONVERSIONS)"),
          value: z.number().optional().describe("Bid value in micros"),
        })
        .optional()
        .describe("Bidding strategy configuration"),
      assets: z.record(z.string(), z.unknown()).optional().describe("Campaign-level assets configuration"),
      isEuPoliticalAds: z.boolean().optional().describe("Whether this is an EU political ad"),
      adGroups: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .describe("Ad groups within the campaign"),
      campaignGoal: z
        .object({
          // Distinct from and easily confused with the top-level `goalType` enum above —
          // this is the nested campaign-goal object's own `type` enum, verified separately
          // against GoogleCampaignGoalDTO in the spec.
          type: z
            .enum(["CONVERSIONS", "CLICK", "YOUTUBE_ENGAGEMENT"])
            .describe("Campaign goal type"),
          value: z.string().optional().describe("Goal value (e.g. conversion action resource name)"),
          isCustomConversionGoal: z
            .boolean()
            .optional()
            .describe("Whether this is a custom conversion goal"),
        })
        .optional()
        .describe("Campaign goal configuration"),
      adSchedule: z
        .array(
          z.object({
            dayOfWeek: z
              .enum([
                "FRIDAY",
                "MONDAY",
                "SATURDAY",
                "SUNDAY",
                "THURSDAY",
                "TUESDAY",
                "UNKNOWN",
                "UNSPECIFIED",
                "WEDNESDAY",
                "ALL_DAYS",
                "MONDAY_TO_FRIDAY",
                "SATURDAY_AND_SUNDAY",
              ])
              .describe("Day of week"),
            from: z.string().describe("Start time (HH:MM)"),
            to: z.string().describe("End time (HH:MM)"),
          })
        )
        .optional()
        .describe("Ad schedule entries"),
      publishingStatus: z
        .enum([
          "DRAFT",
          "SCHEDULED",
          "PUBLISHED",
          "PUBLISHING",
          "FAILED",
          "IN_REVIEW",
          "PAUSED",
          "ARCHIVED",
          "WITH_ISSUES",
          "REJECTED",
        ])
        .optional()
        .describe("Publishing status"),
      googleAdAccountId: z.string().optional().describe("Google ad account ID"),
      unpublishedChanges: z.boolean().optional().describe("Whether there are unpublished changes"),
      maximumCpc: z.number().optional().describe("Maximum cost-per-click bid"),
      googleCampaignId: z.string().optional().describe("Google's own campaign ID"),
      source: z.string().optional().describe("Campaign data source"),
      advancedOptions: z.record(z.string(), z.unknown()).optional().describe("Advanced campaign options"),
    }),
    handler: async (
      args: {
        id?: string;
        name: string;
        advertisingChannelType: string;
        advertisingChannelSubType?: string;
        goalType?: string;
        budget?: {
          budgetType?: "DAILY" | "LIFETIME";
          amount?: number;
          scheduleStartDate?: string;
          scheduleEndDate?: string;
        };
        audience?: Record<string, unknown>;
        networkSettings?: { targetSearchNetwork: boolean; targetContentNetwork: boolean };
        biddingStrategy?: { type?: string; value?: number };
        assets?: Record<string, unknown>;
        isEuPoliticalAds?: boolean;
        adGroups?: Record<string, unknown>[];
        campaignGoal?: {
          type: "CONVERSIONS" | "CLICK" | "YOUTUBE_ENGAGEMENT";
          value?: string;
          isCustomConversionGoal?: boolean;
        };
        adSchedule?: {
          dayOfWeek:
            | "FRIDAY"
            | "MONDAY"
            | "SATURDAY"
            | "SUNDAY"
            | "THURSDAY"
            | "TUESDAY"
            | "UNKNOWN"
            | "UNSPECIFIED"
            | "WEDNESDAY"
            | "ALL_DAYS"
            | "MONDAY_TO_FRIDAY"
            | "SATURDAY_AND_SUNDAY";
          from: string;
          to: string;
        }[];
        publishingStatus?: string;
        googleAdAccountId?: string;
        unpublishedChanges?: boolean;
        maximumCpc?: number;
        googleCampaignId?: string;
        source?: string;
        advancedOptions?: Record<string, unknown>;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/google/ads", {
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
    name: "ghl_get_google_campaign",
    description: "Get a single Google Ads campaign by ID. Required fields: adId. Optional: isDraft.",
    inputSchema: z.object({
      adId: z.string().describe("The Google ad/campaign ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { adId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", `/ad-publishing/google/ads/${args.adId}`, {
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
    name: "ghl_publish_google_campaign",
    description: "Publish a Google Ads campaign and push it live. Required fields: adId.",
    inputSchema: z.object({
      adId: z.string().describe("The Google ad/campaign ID to publish"),
    }),
    handler: async (args: { adId: string }, config: GHLConfig) => {
      try {
        // Spec quirk: no requestBody and no locationId parameter declared for this
        // operation — no body is sent.
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/google/ads/${args.adId}/publish`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_google_assets",
    description:
      "List Google Ads creative assets. Required fields: type (CALL, SITELINK, LEAD_FORM, IMAGE, TEXT). Optional: id, advertiserOnly.",
    inputSchema: z.object({
      type: z
        .enum(["CALL", "SITELINK", "LEAD_FORM", "IMAGE", "TEXT"])
        .describe("Asset type to list"),
      id: z.string().optional().describe("Filter by a specific asset ID"),
      advertiserOnly: z
        .string()
        .optional()
        .describe("Whether to only return advertiser-owned assets (e.g. \"true\")"),
    }),
    handler: async (
      args: { type: string; id?: string; advertiserOnly?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/assets", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            type: args.type,
            id: args.id,
            advertiserOnly: args.advertiserOnly,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_google_assets",
    description:
      "Create or update a Google Ads creative asset. Required fields: type (CALL, SITELINK, LEAD_FORM), payload (shape depends on type — CallAssetPayload for CALL, SitelinkAssetPayload for SITELINK, LeadFormAssetPayload for LEAD_FORM). Include a resourceName inside payload to update an existing asset, or omit it to create a new one.",
    inputSchema: z.object({
      type: z.enum(["CALL", "SITELINK", "LEAD_FORM"]).describe("Asset type to create or update"),
      payload: z
        .record(z.string(), z.unknown())
        .describe(
          "Asset payload — shape depends on type. Include resourceName to update an existing asset."
        ),
    }),
    handler: async (
      args: { type: string; payload: Record<string, unknown> },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/ad-publishing/google/assets", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { locationId: config.locationId, type: args.type, payload: args.payload },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_google_keyword_ideas",
    description:
      "Get Google Ads keyword ideas for a target URL. Required fields: url. Optional: languageCode, locations, keywords, isDraft.",
    inputSchema: z.object({
      url: z.string().describe("Target URL to generate keyword ideas for"),
      languageCode: z.string().optional().describe("Language code (e.g. en)"),
      locations: z.array(z.string()).optional().describe("Target locations"),
      keywords: z.array(z.string()).optional().describe("Seed keywords"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (
      args: {
        url: string;
        languageCode?: string;
        locations?: string[];
        keywords?: string[];
        isDraft?: boolean;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("POST", "/ad-publishing/google/keyword-ideas", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
          body: {
            url: args.url,
            languageCode: args.languageCode,
            locations: args.locations,
            keywords: args.keywords,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
