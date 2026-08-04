import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: despite living in the "ad-publishing-v3.json" spec file (and this repo's
// Phase 2f naming), every operation below declares its `Version` header parameter as a
// fixed enum of exactly one legacy value, "2021-07-28" — there is no v3 header variant
// documented for any of the 14 ad-publishing/facebook operations. GHL_VERSION_LEGACY is
// used throughout this file for that reason, not GHL_VERSION_V3.

export const facebookAccountsTools = [
  {
    name: "ghl_get_facebook_ad_accounts",
    description:
      "List Facebook ad accounts connected to a location. Optional filters: type, next (pagination cursor), fetchAll, limit.",
    inputSchema: z.object({
      type: z.string().optional().describe("Filter by ad account type"),
      next: z.string().optional().describe("Pagination cursor for the next page"),
      fetchAll: z.string().optional().describe("Whether to fetch all ad accounts"),
      limit: z.string().optional().describe("Max number of results to return"),
    }),
    handler: async (
      args: { type?: string; next?: string; fetchAll?: string; limit?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/ad-accounts", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            type: args.type,
            next: args.next,
            fetchAll: args.fetchAll,
            limit: args.limit,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_facebook_ad_account",
    description: "Get a single Facebook ad account by ID. Required fields: adAccountId. Optional: isDraft.",
    inputSchema: z.object({
      adAccountId: z.string().describe("The Facebook ad account ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { adAccountId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/ad-accounts/${args.adAccountId}`,
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
    name: "ghl_delete_facebook_ad_account",
    description: "Delete a Facebook ad account. Required fields: adAccountId.",
    inputSchema: z.object({
      adAccountId: z.string().describe("The Facebook ad account ID to delete"),
    }),
    handler: async (args: { adAccountId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/ad-publishing/facebook/ad-accounts/${args.adAccountId}`,
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
    name: "ghl_create_facebook_integration",
    description:
      "Create a Facebook ad-publishing integration for a location. Required fields: pageId. Optional: adAccountId.",
    inputSchema: z.object({
      pageId: z.string().describe("The Facebook page ID to integrate"),
      adAccountId: z.string().optional().describe("The Facebook ad account ID to link"),
    }),
    handler: async (args: { pageId: string; adAccountId?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/ad-publishing/facebook/integration", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: {
            locationId: config.locationId,
            pageId: args.pageId,
            adAccountId: args.adAccountId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_facebook_integration",
    description: "Get the Facebook ad-publishing integration for a location. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/integration", {
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
    name: "ghl_delete_facebook_integration",
    description: "Delete the Facebook ad-publishing integration for a location.",
    inputSchema: z.object({}),
    handler: async (_args: Record<string, never>, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", "/ad-publishing/facebook/integration", {
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
    name: "ghl_get_facebook_me",
    description:
      "Get the Facebook identity (user/page) associated with the location's ad-publishing integration. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/me", {
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
    name: "ghl_get_facebook_entity",
    description:
      "List Facebook ad entities (campaigns, ad sets, or ads). Required fields: type (AD_MANAGER, INTEGRATION), entityType (CAMPAIGN, ADSET, AD). Optional: next, fetchAll, campaignId, adSetId, searchId, selectedAdAccountId.",
    inputSchema: z.object({
      type: z.enum(["AD_MANAGER", "INTEGRATION"]).describe("The Facebook connection type"),
      entityType: z.enum(["CAMPAIGN", "ADSET", "AD"]).describe("The entity level to list"),
      next: z.string().optional().describe("Pagination cursor for the next page"),
      fetchAll: z.string().optional().describe("Whether to fetch all entities"),
      campaignId: z.string().optional().describe("Filter ad sets/ads by campaign ID"),
      adSetId: z.string().optional().describe("Filter ads by ad set ID"),
      searchId: z.string().optional().describe("Filter by search ID"),
      selectedAdAccountId: z.string().optional().describe("The selected ad account ID"),
    }),
    handler: async (
      args: {
        type: "AD_MANAGER" | "INTEGRATION";
        entityType: "CAMPAIGN" | "ADSET" | "AD";
        next?: string;
        fetchAll?: string;
        campaignId?: string;
        adSetId?: string;
        searchId?: string;
        selectedAdAccountId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/entity", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            type: args.type,
            entityType: args.entityType,
            next: args.next,
            fetchAll: args.fetchAll,
            campaignId: args.campaignId,
            adSetId: args.adSetId,
            searchId: args.searchId,
            selectedAdAccountId: args.selectedAdAccountId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_facebook_pages",
    description: "List Facebook pages available to a location. Optional: fetchExisting.",
    inputSchema: z.object({
      fetchExisting: z.string().optional().describe("Whether to include already-connected pages"),
    }),
    handler: async (args: { fetchExisting?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/pages", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, fetchExisting: args.fetchExisting },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_delete_facebook_page",
    description: "Disconnect a Facebook page from a location. Required fields: pageId.",
    inputSchema: z.object({
      pageId: z.string().describe("The Facebook page ID to disconnect"),
    }),
    handler: async (args: { pageId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("DELETE", "/ad-publishing/facebook/page", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, pageId: args.pageId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_set_default_facebook_page",
    description: "Set the default Facebook page for a location. Required fields: pageId. Optional: isDraft.",
    inputSchema: z.object({
      pageId: z.string().describe("The Facebook page ID to set as default"),
      isDraft: z.boolean().optional().describe("Whether to apply this to the draft version"),
    }),
    handler: async (args: { pageId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("PUT", "/ad-publishing/facebook/page/default", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: { locationId: config.locationId, isDraft: args.isDraft },
          body: { pageId: args.pageId },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_facebook_page_forms",
    description: "List lead forms for a Facebook page. Required fields: pageId. Optional: isDraft.",
    inputSchema: z.object({
      pageId: z.string().describe("The Facebook page ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { pageId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/page/${args.pageId}/forms`,
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
    name: "ghl_create_facebook_page_form",
    description:
      // Spec quirk: the schema's top-level `required` array always lists privacyPolicyLink
      // and thankYouPage as required, even though their field descriptions say they're
      // "required when isDraft is false or omitted; optional for drafts." The strict
      // `required` array is honored here (both are required inputs) since the conditional
      // relaxation for drafts is only documented in prose, not encoded in the schema.
      "Create a Facebook lead form on a page. Required fields: pageId, type (MORE_VOLUME, HIGHER_INTENT), name, questions, privacyPolicyLink, thankYouPage. Optional: questionPageHeadline, privacyPolicyText, greetingCard, customDisclaimer, isDraft, draftFormId, locale.",
    inputSchema: z.object({
      pageId: z.string().describe("The Facebook page ID to create the form on"),
      type: z.enum(["MORE_VOLUME", "HIGHER_INTENT"]).describe("The lead form type"),
      name: z.string().describe("The lead form name"),
      questions: z
        .array(z.record(z.string(), z.unknown()))
        .describe("List of questions displayed on the lead form"),
      privacyPolicyLink: z.string().describe("Privacy policy URL"),
      thankYouPage: z.record(z.string(), z.unknown()).describe("Thank you page configuration"),
      questionPageHeadline: z.string().optional().describe("Question page headline"),
      privacyPolicyText: z.string().optional().describe("Privacy policy text"),
      greetingCard: z.record(z.string(), z.unknown()).optional().describe("Greeting card configuration"),
      customDisclaimer: z.record(z.string(), z.unknown()).optional().describe("Custom disclaimer configuration"),
      isDraft: z.boolean().optional().describe("If the form is a draft, set to true"),
      draftFormId: z.string().optional().describe("Draft form ID"),
      locale: z.string().optional().describe("Locale, e.g. EN_US"),
    }),
    handler: async (
      args: {
        pageId: string;
        type: "MORE_VOLUME" | "HIGHER_INTENT";
        name: string;
        questions: Record<string, unknown>[];
        privacyPolicyLink: string;
        thankYouPage: Record<string, unknown>;
        questionPageHeadline?: string;
        privacyPolicyText?: string;
        greetingCard?: Record<string, unknown>;
        customDisclaimer?: Record<string, unknown>;
        isDraft?: boolean;
        draftFormId?: string;
        locale?: string;
      },
      config: GHLConfig
    ) => {
      const { pageId, ...fields } = args;
      try {
        const result = await ghlRequest(
          "POST",
          `/ad-publishing/facebook/page/${pageId}/forms`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
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
    name: "ghl_get_facebook_page_instagram_accounts",
    description:
      "List Instagram accounts linked to a Facebook page. Required fields: pageId. Optional: type (INTEGRATION, AD_MANAGER).",
    inputSchema: z.object({
      pageId: z.string().describe("The Facebook page ID"),
      type: z.enum(["INTEGRATION", "AD_MANAGER"]).optional().describe("Filter by connection type"),
    }),
    handler: async (
      args: { pageId: string; type?: "INTEGRATION" | "AD_MANAGER" },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/page/${args.pageId}/instagram`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            params: { locationId: config.locationId, type: args.type },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
