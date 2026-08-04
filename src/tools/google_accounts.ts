import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: despite the spec file being named ad-publishing-v3.json, all 7 operations
// below declare their `Version` header as a fixed single-value enum of the legacy date
// "2021-07-28" — verified directly against ad-publishing-v3.json for each operation.
// None are the ["v3"] exception, so GHL_VERSION_LEGACY is used throughout.

export const googleAccountsTools = [
  {
    name: "ghl_get_google_ad_accounts",
    description: "List Google ad accounts connected to a location. Optional filter: type.",
    inputSchema: z.object({
      type: z.enum(["INTEGRATION", "AD_MANAGER"]).optional().describe("Filter by ad account type"),
    }),
    handler: async (args: { type?: "INTEGRATION" | "AD_MANAGER" }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/ad-accounts", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
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
    name: "ghl_get_google_ad_account",
    description: "Get a single Google ad account by ID. Required fields: adAccountId. Optional: isDraft.",
    inputSchema: z.object({
      adAccountId: z.string().describe("The Google ad account ID"),
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { adAccountId: string; isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/google/ad-accounts/${args.adAccountId}`,
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
    name: "ghl_delete_google_ad_account",
    description: "Delete a Google ad account. Required fields: adAccountId.",
    inputSchema: z.object({
      adAccountId: z.string().describe("The Google ad account ID to delete"),
    }),
    handler: async (args: { adAccountId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/ad-publishing/google/ad-accounts/${args.adAccountId}`,
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
    name: "ghl_create_google_integration",
    description:
      "Create a Google ad-publishing integration for a location. Required fields: adAccountId, mccId.",
    inputSchema: z.object({
      adAccountId: z.string().describe("The Google ad account ID to link"),
      mccId: z.string().describe("The Google MCC (My Client Center) ID"),
    }),
    handler: async (args: { adAccountId: string; mccId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("POST", "/ad-publishing/google/integration", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          body: {
            locationId: config.locationId,
            adAccountId: args.adAccountId,
            mccId: args.mccId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_get_google_integration",
    description: "Get the Google ad-publishing integration for a location. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/integration", {
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
    name: "ghl_get_google_me",
    description:
      "Get the Google identity associated with the location's ad-publishing integration. Optional: isDraft.",
    inputSchema: z.object({
      isDraft: z.boolean().optional().describe("Whether to fetch the draft version"),
    }),
    handler: async (args: { isDraft?: boolean }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/me", {
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
    name: "ghl_get_google_entity",
    description:
      "List Google ad entities (campaigns, ad groups, or ads). Required fields: type (AD_MANAGER, INTEGRATION), entityType (CAMPAIGN, ADGROUP, AD). Optional: campaignId, adGroupId, searchId, startDate, endDate, selectedAdAccountId.",
    inputSchema: z.object({
      type: z.enum(["AD_MANAGER", "INTEGRATION"]).describe("The Google connection type"),
      entityType: z.enum(["CAMPAIGN", "ADGROUP", "AD"]).describe("The entity level to list"),
      campaignId: z.string().optional().describe("Filter ad groups/ads by campaign ID"),
      adGroupId: z.string().optional().describe("Filter ads by ad group ID"),
      searchId: z.string().optional().describe("Filter by search ID"),
      startDate: z.string().optional().describe("Start date filter (YYYY-MM-DD format)"),
      endDate: z.string().optional().describe("End date filter (YYYY-MM-DD format)"),
      selectedAdAccountId: z.string().optional().describe("The selected ad account ID"),
    }),
    handler: async (
      args: {
        type: "AD_MANAGER" | "INTEGRATION";
        entityType: "CAMPAIGN" | "ADGROUP" | "AD";
        campaignId?: string;
        adGroupId?: string;
        searchId?: string;
        startDate?: string;
        endDate?: string;
        selectedAdAccountId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/entity", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            type: args.type,
            entityType: args.entityType,
            campaignId: args.campaignId,
            adGroupId: args.adGroupId,
            searchId: args.searchId,
            startDate: args.startDate,
            endDate: args.endDate,
            selectedAdAccountId: args.selectedAdAccountId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
