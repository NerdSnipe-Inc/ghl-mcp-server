import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY, GHL_VERSION_V3 } from "../client.js";

// Spec quirk: like facebook_accounts.ts, every operation in this file declares its
// `Version` header as a fixed single-value enum of the legacy date "2021-07-28" —
// EXCEPT `GET .../publishing-progress`, whose `Version` header enum is exactly `["v3"]`.
// That single operation is the sole GHL_VERSION_V3 usage across the entire 95-operation
// ad-publishing-v3.json resource; every other tool here uses GHL_VERSION_LEGACY.

// Spec quirk: the 12 duplicate/pause/resume/publish action endpoints are NOT uniform.
// Campaign duplicate/pause/resume/publish and ad-set/ad pause/resume all declare a
// requestBody with `locationId` required. Ad-set duplicate and ad duplicate declare NO
// requestBody at all (path param only) — verified directly against the spec, not assumed.

export const facebookCampaignsTools = [
  {
    name: "ghl_get_facebook_campaign",
    description:
      "Get a single Facebook campaign by ID. Required fields: campaignId. Optional: fields, source.",
    inputSchema: z.object({
      campaignId: z.string().describe("The Facebook campaign ID"),
      fields: z.string().optional().describe("Comma-separated list of fields to return"),
      source: z.string().optional().describe("Campaign data source"),
    }),
    handler: async (
      args: { campaignId: string; fields?: string; source?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/campaign/${args.campaignId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            params: { locationId: config.locationId, fields: args.fields, source: args.source },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_upsert_facebook_campaign",
    description:
      "Create or update a Facebook campaign. Pass id to update an existing campaign, or omit it to create a new one. Optional: name, objective (OUTCOME_LEADS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_SALES), specialAdCategories, source.",
    inputSchema: z.object({
      id: z.string().optional().describe("Campaign ID — provide to update, omit to create"),
      name: z.string().optional().describe("Campaign name"),
      objective: z
        .enum(["OUTCOME_LEADS", "OUTCOME_TRAFFIC", "OUTCOME_ENGAGEMENT", "OUTCOME_SALES"])
        .optional()
        .describe("Campaign objective"),
      specialAdCategories: z
        .array(
          z.enum([
            "EMPLOYMENT",
            "CREDIT",
            "FINANCIAL_PRODUCTS_SERVICES",
            "HOUSING",
            "ISSUES_ELECTIONS_POLITICS",
            "ONLINE_GAMBLING_AND_GAMING",
            "NONE",
          ])
        )
        .optional()
        .describe("Special ad categories"),
      source: z.string().optional().describe("Campaign data source"),
    }),
    handler: async (
      args: {
        id?: string;
        name?: string;
        objective?: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC" | "OUTCOME_ENGAGEMENT" | "OUTCOME_SALES";
        specialAdCategories?: string[];
        source?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/facebook/campaigns", {
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
    name: "ghl_delete_facebook_campaign",
    description: "Delete a Facebook campaign. Required fields: campaignId.",
    inputSchema: z.object({
      campaignId: z.string().describe("The Facebook campaign ID to delete"),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/ad-publishing/facebook/campaigns/${args.campaignId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_duplicate_facebook_campaign",
    description: "Duplicate a Facebook campaign. Required fields: campaignId.",
    inputSchema: z.object({
      campaignId: z.string().describe("The Facebook campaign ID to duplicate"),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/campaigns/${args.campaignId}/duplicate`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_pause_facebook_campaign",
    description: "Pause a Facebook campaign. Required fields: campaignId.",
    inputSchema: z.object({
      campaignId: z.string().describe("The Facebook campaign ID to pause"),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/campaigns/${args.campaignId}/pause`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_publish_facebook_campaign",
    description: "Publish a Facebook campaign. Required fields: campaignId.",
    inputSchema: z.object({
      campaignId: z.string().describe("The Facebook campaign ID to publish"),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/campaigns/${args.campaignId}/publish`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_get_facebook_campaign_publishing_progress",
    description:
      "Get the publishing progress of a Facebook campaign. Required fields: campaignId. Optional: isDraft.",
    inputSchema: z.object({
      campaignId: z.string().describe("The Facebook campaign ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { campaignId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/campaigns/${args.campaignId}/publishing-progress`,
          {
            token: config.token,
            // Sole exception in this 95-operation spec resource: this operation's Version
            // header enum is ["v3"], not the legacy date used everywhere else.
            version: GHL_VERSION_V3,
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
    name: "ghl_resume_facebook_campaign",
    description: "Resume a paused Facebook campaign. Required fields: campaignId.",
    inputSchema: z.object({
      campaignId: z.string().describe("The Facebook campaign ID to resume"),
    }),
    handler: async (args: { campaignId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/campaigns/${args.campaignId}/resume`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_upsert_facebook_adset",
    description:
      "Create or update a Facebook ad set. Pass id to update an existing ad set, or omit it to create a new one. Required fields: campaignId. Optional: name, pageId, instagramActorId, messagingPlatforms (WHATSAPP, MESSENGER, INSTAGRAM_DIRECT), whatsappNumber, audience, budget, conversionLocation, customEventType, pixelId.",
    inputSchema: z.object({
      id: z.string().optional().describe("Ad set ID — provide to update, omit to create"),
      campaignId: z.string().describe("The parent campaign ID"),
      name: z.string().optional().describe("Ad set name"),
      pageId: z.string().optional().describe("Facebook page ID"),
      instagramActorId: z.string().optional().describe("Instagram actor ID"),
      messagingPlatforms: z
        .array(z.enum(["WHATSAPP", "MESSENGER", "INSTAGRAM_DIRECT"]))
        .optional()
        .describe("Messaging platforms"),
      whatsappNumber: z.string().optional().describe("WhatsApp phone number"),
      audience: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Targeting audience configuration (geo-locations, locales, placements, custom audiences)"),
      budget: z.record(z.string(), z.unknown()).optional().describe("Ad set budget configuration"),
      conversionLocation: z.string().optional().describe("Conversion location"),
      customEventType: z.string().optional().describe("Custom event type"),
      pixelId: z.string().optional().describe("Conversion pixel ID"),
    }),
    handler: async (
      args: {
        id?: string;
        campaignId: string;
        name?: string;
        pageId?: string;
        instagramActorId?: string;
        messagingPlatforms?: string[];
        whatsappNumber?: string;
        audience?: Record<string, unknown>;
        budget?: Record<string, unknown>;
        conversionLocation?: string;
        customEventType?: string;
        pixelId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/facebook/adsets", {
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
    name: "ghl_delete_facebook_adset",
    description: "Delete a Facebook ad set. Required fields: adSetId.",
    inputSchema: z.object({
      adSetId: z.string().describe("The Facebook ad set ID to delete"),
    }),
    handler: async (args: { adSetId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/ad-publishing/facebook/adsets/${args.adSetId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_duplicate_facebook_adset",
    description: "Duplicate a Facebook ad set. Required fields: adSetId.",
    inputSchema: z.object({
      adSetId: z.string().describe("The Facebook ad set ID to duplicate"),
    }),
    handler: async (args: { adSetId: string }, config: GHLConfig) => {
      try {
        // Spec quirk: unlike the campaign duplicate/pause/resume endpoints, this
        // operation declares no requestBody at all — no locationId is sent.
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/adsets/${args.adSetId}/duplicate`,
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
    name: "ghl_pause_facebook_adset",
    description: "Pause a Facebook ad set. Required fields: adSetId.",
    inputSchema: z.object({
      adSetId: z.string().describe("The Facebook ad set ID to pause"),
    }),
    handler: async (args: { adSetId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/adsets/${args.adSetId}/pause`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_resume_facebook_adset",
    description: "Resume a paused Facebook ad set. Required fields: adSetId.",
    inputSchema: z.object({
      adSetId: z.string().describe("The Facebook ad set ID to resume"),
    }),
    handler: async (args: { adSetId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/adsets/${args.adSetId}/resume`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_upsert_facebook_ad",
    description:
      "Create or update a Facebook ad. Pass id to update an existing ad, or omit it to create a new one. Required fields: campaignId, adsetId. Optional: name, primaryText, headline, description, imageUrl, mediaType (SINGLE, CAROUSEL), media, multiAdvertiserAds, cta, conversationFormId, destinationLink, destinationFormId.",
    inputSchema: z.object({
      id: z.string().optional().describe("Ad ID — provide to update, omit to create"),
      campaignId: z.string().describe("The parent campaign ID"),
      adsetId: z.string().describe("The parent ad set ID"),
      name: z.string().optional().describe("Ad name"),
      primaryText: z.string().optional().describe("Ad primary text"),
      headline: z.string().optional().describe("Ad headline text"),
      description: z.string().optional().describe("Ad description text"),
      imageUrl: z.string().optional().describe("Ad image URL"),
      mediaType: z.enum(["SINGLE", "CAROUSEL"]).optional().describe("Ad media type"),
      media: z
        .array(z.record(z.string(), z.unknown()))
        .optional()
        .describe("Media items (images or videos) attached to the ad creative"),
      multiAdvertiserAds: z.boolean().optional().describe("Enable multi-advertiser ads"),
      cta: z.string().optional().describe("Call to action type"),
      conversationFormId: z.string().optional().describe("Conversation form ID"),
      destinationLink: z.string().optional().describe("Destination link URL"),
      destinationFormId: z.string().optional().describe("Destination form ID"),
    }),
    handler: async (
      args: {
        id?: string;
        campaignId: string;
        adsetId: string;
        name?: string;
        primaryText?: string;
        headline?: string;
        description?: string;
        imageUrl?: string;
        mediaType?: "SINGLE" | "CAROUSEL";
        media?: Record<string, unknown>[];
        multiAdvertiserAds?: boolean;
        cta?: string;
        conversationFormId?: string;
        destinationLink?: string;
        destinationFormId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/facebook/ads", {
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
    name: "ghl_delete_facebook_ad",
    description: "Delete a Facebook ad. Required fields: adId.",
    inputSchema: z.object({
      adId: z.string().describe("The Facebook ad ID to delete"),
    }),
    handler: async (args: { adId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", `/ad-publishing/facebook/ads/${args.adId}`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_duplicate_facebook_ad",
    description: "Duplicate a Facebook ad. Required fields: adId.",
    inputSchema: z.object({
      adId: z.string().describe("The Facebook ad ID to duplicate"),
    }),
    handler: async (args: { adId: string }, config: GHLConfig) => {
      try {
        // Spec quirk: like ad-set duplicate, this operation declares no requestBody.
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/ads/${args.adId}/duplicate`,
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
    name: "ghl_pause_facebook_ad",
    description: "Pause a Facebook ad. Required fields: adId.",
    inputSchema: z.object({
      adId: z.string().describe("The Facebook ad ID to pause"),
    }),
    handler: async (args: { adId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/ad-publishing/facebook/ads/${args.adId}/pause`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_resume_facebook_ad",
    description: "Resume a paused Facebook ad. Required fields: adId.",
    inputSchema: z.object({
      adId: z.string().describe("The Facebook ad ID to resume"),
    }),
    handler: async (args: { adId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", `/ad-publishing/facebook/ads/${args.adId}/resume`, {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: { locationId: config.locationId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
