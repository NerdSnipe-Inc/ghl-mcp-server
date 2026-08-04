import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: Like facebook_accounts.ts, facebook_campaigns.ts, and facebook_audiences.ts,
// every operation in this file declares its `Version` header as a fixed single-value enum
// of the legacy date "2021-07-28" — verified directly against ad-publishing-v3.json for
// all 4 operations below. None are the ["v3"] exception (publishing-progress), so
// GHL_VERSION_LEGACY is used throughout.

// Spec quirk: ghl_get_facebook_reporting takes a `fields` query param that is an array;
// ghlRequest will serialize it as comma-separated values.

export const facebookReportingTools = [
  {
    name: "ghl_get_facebook_reporting",
    description:
      "Get Facebook ad reporting data with aggregation. Required fields: fields (array), groupBy, startDate, endDate, type.",
    inputSchema: z.object({
      fields: z.array(z.string()).describe("Fields to include in the report (e.g. impressions, clicks)"),
      groupBy: z.string().describe("Group results by field (e.g. CAMPAIGN, ADSET)"),
      startDate: z.string().describe("Start date for the report (YYYY-MM-DD format)"),
      endDate: z.string().describe("End date for the report (YYYY-MM-DD format)"),
      type: z.string().describe("Report type (e.g. CAMPAIGN, ADSET)"),
    }),
    handler: async (
      args: { fields: string[]; groupBy: string; startDate: string; endDate: string; type: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/reporting", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            fields: args.fields.join(","),
            groupBy: args.groupBy,
            startDate: args.startDate,
            endDate: args.endDate,
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
    name: "ghl_get_facebook_campaign_reporting",
    description:
      "Get reporting data for a specific Facebook campaign. Required fields: campaignId, startDate, endDate.",
    inputSchema: z.object({
      campaignId: z.string().describe("Facebook campaign ID"),
      startDate: z.string().describe("Start date for the report (YYYY-MM-DD format)"),
      endDate: z.string().describe("End date for the report (YYYY-MM-DD format)"),
    }),
    handler: async (
      args: { campaignId: string; startDate: string; endDate: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/ad-publishing/facebook/reporting/campaign/${args.campaignId}`,
          {
            token: config.token,
            version: GHL_VERSION_LEGACY,
            params: {
              locationId: config.locationId,
              startDate: args.startDate,
              endDate: args.endDate,
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
    name: "ghl_get_facebook_reporting_list",
    description:
      "Get a list of Facebook reporting data (campaigns, ad sets, or ads). Required fields: listType, startDate, endDate, type. Optional: campaignId.",
    inputSchema: z.object({
      listType: z.string().describe("List type (e.g. CAMPAIGNS, ADSETS, ADS)"),
      startDate: z.string().describe("Start date for the report (YYYY-MM-DD format)"),
      endDate: z.string().describe("End date for the report (YYYY-MM-DD format)"),
      type: z.string().describe("Report type (e.g. CAMPAIGN, ADSET, AD)"),
      campaignId: z.string().optional().describe("Filter by campaign ID"),
    }),
    handler: async (
      args: { listType: string; startDate: string; endDate: string; type: string; campaignId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/reporting/list", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            listType: args.listType,
            startDate: args.startDate,
            endDate: args.endDate,
            type: args.type,
            campaignId: args.campaignId,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_search_facebook_targeting",
    description:
      "Search Facebook targeting options (interests, behaviors, demographics). Required fields: type, query. Optional: locationId, searchType.",
    inputSchema: z.object({
      type: z.string().describe("Targeting type (e.g. INTERESTS, BEHAVIORS, DEMOGRAPHICS)"),
      query: z.string().describe("Search query string"),
      searchType: z.string().optional().describe("Search type (e.g. KEYWORD)"),
      locationId: z.string().optional().describe("Location ID (defaults to config location if not provided)"),
    }),
    handler: async (
      args: { type: string; query: string; searchType?: string; locationId?: string },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/facebook/targeting/search", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: args.locationId,
            type: args.type,
            query: args.query,
            searchType: args.searchType,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
