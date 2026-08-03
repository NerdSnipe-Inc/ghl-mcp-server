import { z } from "zod";
import { ghlRequest, formatError, GHLConfig, GHL_VERSION_V3 } from "../client.js";

export const affiliateManagerTools = [
  {
    name: "ghl_get_affiliates",
    description: "List affiliates for the location. Supports search, filtering, and pagination.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search affiliates by name"),
      active: z.boolean().optional().describe("Filter by active status"),
      campaignId: z.string().optional().describe("Filter by campaign ID"),
      skip: z.number().optional().describe("Number of records to skip (default 0)"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of records to return, max 100 (default 10)"),
      fromDate: z.string().optional().describe("Start date filter, e.g. 2023-10-01"),
      toDate: z.string().optional().describe("End date filter, e.g. 2023-10-01"),
    }),
    handler: async (
      args: {
        query?: string;
        active?: boolean;
        campaignId?: string;
        skip?: number;
        limit?: number;
        fromDate?: string;
        toDate?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/affiliate-manager/${config.locationId}/affiliates`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              query: args.query,
              active: args.active,
              campaignId: args.campaignId,
              skip: args.skip,
              limit: args.limit,
              fromDate: args.fromDate,
              toDate: args.toDate,
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
    name: "ghl_get_affiliate",
    description: "Get details of a single affiliate by ID.",
    inputSchema: z.object({
      affiliateId: z.string().describe("The affiliate ID"),
    }),
    handler: async (args: { affiliateId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/affiliate-manager/${config.locationId}/affiliates/${args.affiliateId}`,
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
  {
    name: "ghl_get_affiliate_commissions",
    description: "List affiliate commissions for the location. Supports filtering and pagination.",
    inputSchema: z.object({
      campaignId: z.string().optional().describe("Filter by campaign ID"),
      affiliateId: z.string().optional().describe("Filter by affiliate ID"),
      status: z.string().optional().describe("Filter by commission status, e.g. pending"),
      query: z.string().optional().describe("Search query, e.g. affiliate email"),
      skip: z.number().optional().describe("Number of records to skip (default 0)"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of records to return, max 100 (default 10)"),
      fromDate: z.string().optional().describe("Start date filter, e.g. 2023-10-01"),
      toDate: z.string().optional().describe("End date filter, e.g. 2023-10-01"),
    }),
    handler: async (
      args: {
        campaignId?: string;
        affiliateId?: string;
        status?: string;
        query?: string;
        skip?: number;
        limit?: number;
        fromDate?: string;
        toDate?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/affiliate-manager/${config.locationId}/commissions`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              campaignId: args.campaignId,
              affiliateId: args.affiliateId,
              status: args.status,
              query: args.query,
              skip: args.skip,
              limit: args.limit,
              fromDate: args.fromDate,
              toDate: args.toDate,
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
    name: "ghl_get_affiliate_payouts",
    description: "List affiliate payouts for the location. Supports filtering and pagination.",
    inputSchema: z.object({
      status: z.string().optional().describe("Filter by payout status, e.g. pending"),
      query: z.string().optional().describe("Search query"),
      affiliateId: z.string().optional().describe("Filter by affiliate ID"),
      campaignId: z.string().optional().describe("Filter by campaign ID"),
      skip: z.number().optional().describe("Number of records to skip (default 0)"),
      limit: z.number().optional().describe("Maximum number of records to return (default 10)"),
      start: z.string().optional().describe("Start date-time filter, e.g. 2022-12-01T00:00:00.000Z"),
      end: z.string().optional().describe("End date-time filter, e.g. 2022-12-31T23:59:59.999Z"),
    }),
    handler: async (
      args: {
        status?: string;
        query?: string;
        affiliateId?: string;
        campaignId?: string;
        skip?: number;
        limit?: number;
        start?: string;
        end?: string;
      },
      config: GHLConfig
    ) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/affiliate-manager/${config.locationId}/payouts`,
          {
            token: config.token,
            version: GHL_VERSION_V3,
            params: {
              status: args.status,
              query: args.query,
              affiliateId: args.affiliateId,
              campaignId: args.campaignId,
              skip: args.skip,
              limit: args.limit,
              start: args.start,
              end: args.end,
            },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
