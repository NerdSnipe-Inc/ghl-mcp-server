import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const phoneNumberTools = [
  {
    name: "ghl_get_phone_numbers",
    description: "List all purchased/active phone numbers in the location.",
    inputSchema: z.object({
      pageSize: z.number().optional().default(100).describe("Max 1000"),
      page: z.number().optional().default(1),
      searchFilter: z.string().optional().describe("Filter by phone number pattern"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/phone-system/numbers/location/${config.locationId}`,
          {
            token: config.token,
            params: {
              pageSize: args.pageSize as number | undefined,
              page: args.page as number | undefined,
              searchFilter: args.searchFilter as string | undefined,
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
    name: "ghl_search_available_phone_numbers",
    description:
      "Search for available phone numbers to purchase. Filter by country, area code, or capabilities.",
    inputSchema: z.object({
      countryCode: z.string().describe("ISO 2-letter country code (e.g. CA, US)"),
      numberTypes: z
        .enum(["local", "tollFree", "mobile", "national"])
        .optional()
        .describe("Phone number type filter"),
      firstPart: z.string().optional().describe("Leading digits / area code pattern"),
      lastPart: z.string().optional().describe("Trailing digit pattern"),
      anywhere: z.string().optional().describe("Any-position digit match"),
      smsEnabled: z.boolean().optional(),
      mmsEnabled: z.boolean().optional(),
      voiceEnabled: z.boolean().optional(),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "GET",
          `/phone-system/numbers/location/${config.locationId}/available`,
          {
            token: config.token,
            params: {
              countryCode: args.countryCode as string,
              numberTypes: args.numberTypes as string | undefined,
              firstPart: args.firstPart as string | undefined,
              lastPart: args.lastPart as string | undefined,
              anywhere: args.anywhere as string | undefined,
              smsEnabled: args.smsEnabled as boolean | undefined,
              mmsEnabled: args.mmsEnabled as boolean | undefined,
              voiceEnabled: args.voiceEnabled as boolean | undefined,
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
    name: "ghl_purchase_phone_number",
    description:
      "Purchase a phone number for the location. Use ghl_search_available_phone_numbers first to find a number — pass its fingerprintId when available.",
    inputSchema: z.object({
      phoneNumber: z
        .string()
        .describe("Phone number to purchase in E.164 format (e.g. +16135550100)"),
      countryCode: z.string().optional().describe("ISO 2-letter country code"),
      numberType: z.enum(["local", "tollFree", "mobile"]).optional(),
      fingerprintId: z
        .string()
        .optional()
        .describe("fingerprintId from search results — include when available"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/phone-system/numbers/location/${config.locationId}/purchase`,
          {
            token: config.token,
            body: args,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
