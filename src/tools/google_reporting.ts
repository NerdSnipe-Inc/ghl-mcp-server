import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_LEGACY } from "../client.js";

// Spec quirk: like google_accounts.ts, google_campaigns.ts, and google_audiences.ts,
// every operation in this file declares its `Version` header as a fixed single-value
// enum of the legacy date "2021-07-28" — verified directly against ad-publishing-v3.json
// for all 4 operations below.

// Spec quirk: `ghl_get_google_reporting`'s `fields` query param is an array with an
// enum of allowed values (impressions, clicks, cost_micros, average_cpc, conversions,
// average_cpm, cost_per_conversion, ctr); ghlRequest will serialize it as
// comma-separated values, matching the facebook_reporting.ts precedent.

// Spec quirk: `ghl_get_google_reporting_list`'s `listType` param has no enum in the
// spec (only an example value "campaigns"), so it is modeled as a plain z.string(),
// unlike the `type`/`groupBy` params on this file which do declare enums.

// Spec quirk: `ghl_search_google_targeting`'s `type` param has no enum in the spec
// (only an example value "geolocation"), so it is modeled as a plain z.string().
// Its `locationId` query param is marked required in the spec (unlike the equivalent
// Facebook targeting search param, which is optional) — modeled here as sourced
// directly from config.locationId, consistent with every other tool in this Google
// ad-publishing surface.

export const googleReportingTools = [
  {
    name: "ghl_get_google_reporting",
    description:
      "Get Google Ads reporting data with aggregation. Required fields: fields (array), startDate, endDate, type. Optional: groupBy.",
    inputSchema: z.object({
      fields: z
        .array(
          z.enum([
            "impressions",
            "clicks",
            "cost_micros",
            "average_cpc",
            "conversions",
            "average_cpm",
            "cost_per_conversion",
            "ctr",
          ])
        )
        .describe("Fields to include in the report"),
      groupBy: z.enum(["date", "week", "month"]).optional().describe("Group results by time period"),
      startDate: z.string().describe("Start date for the report (YYYY-MM-DD format)"),
      endDate: z.string().describe("End date for the report (YYYY-MM-DD format)"),
      type: z.enum(["AD_MANAGER", "INTEGRATION"]).describe("Report type"),
    }),
    handler: async (
      args: {
        fields: (
          | "impressions"
          | "clicks"
          | "cost_micros"
          | "average_cpc"
          | "conversions"
          | "average_cpm"
          | "cost_per_conversion"
          | "ctr"
        )[];
        groupBy?: "date" | "week" | "month";
        startDate: string;
        endDate: string;
        type: "AD_MANAGER" | "INTEGRATION";
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/reporting", {
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
    name: "ghl_get_google_campaign_reporting",
    description:
      "Get reporting data for a specific Google Ads campaign. Required fields: campaignId, startDate, endDate.",
    inputSchema: z.object({
      campaignId: z.string().describe("Google Ads campaign ID"),
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
          `/ad-publishing/google/reporting/campaign/${args.campaignId}`,
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
    name: "ghl_get_google_reporting_list",
    description:
      "Get a list of Google Ads reporting data (e.g. campaigns). Required fields: listType, startDate, endDate, type. Optional: campaignId.",
    inputSchema: z.object({
      listType: z.string().describe("List type (e.g. campaigns)"),
      startDate: z.string().describe("Start date for the report (YYYY-MM-DD format)"),
      endDate: z.string().describe("End date for the report (YYYY-MM-DD format)"),
      type: z.enum(["AD_MANAGER", "INTEGRATION"]).describe("Report type"),
      campaignId: z.string().optional().describe("Filter by campaign ID"),
    }),
    handler: async (
      args: {
        listType: string;
        startDate: string;
        endDate: string;
        type: "AD_MANAGER" | "INTEGRATION";
        campaignId?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/reporting/list", {
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
    name: "ghl_search_google_targeting",
    description:
      "Search Google Ads targeting options (e.g. geolocation). Required fields: type. Optional: query.",
    inputSchema: z.object({
      type: z.string().describe("Targeting type (e.g. geolocation)"),
      query: z.string().optional().describe("Search query string"),
    }),
    handler: async (args: { type: string; query?: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest("GET", "/ad-publishing/google/targeting/search", {
          token: config.token,
          version: GHL_VERSION_LEGACY,
          params: {
            locationId: config.locationId,
            type: args.type,
            query: args.query,
          },
        });
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
