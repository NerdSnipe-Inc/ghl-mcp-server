import { z } from "zod";
import { ghlRequest, formatError, GHLConfig } from "../client.js";

export const phoneNumberTools = [
  {
    name: "ghl_get_phone_numbers",
    description: "List all purchased/active phone numbers in the location.",
    inputSchema: z.object({
      pageSize: z.number().optional().describe("Number of results per page"),
      page: z.number().optional().describe("Page number"),
      searchFilter: z.string().optional().describe("Filter by phone number or label"),
      skipNumberPool: z.boolean().optional().describe("Skip number pool results"),
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
              skipNumberPool: args.skipNumberPool as boolean | undefined,
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
      "Search for available phone numbers to purchase. Filter by country, number type, or capabilities.",
    inputSchema: z.object({
      countryCode: z.string().describe("ISO 2-letter country code (e.g. CA, US)"),
      numberTypes: z.string().optional().describe("Phone number type (e.g. local, tollFree)"),
      firstPart: z.string().optional().describe("First part of the number to match"),
      lastPart: z.string().optional().describe("Last part of the number to match"),
      anywhere: z.boolean().optional().describe("Match digits anywhere in number"),
      smsEnabled: z.boolean().optional().describe("Filter for SMS-capable numbers"),
      mmsEnabled: z.boolean().optional().describe("Filter for MMS-capable numbers"),
      voiceEnabled: z.boolean().optional().describe("Filter for voice-capable numbers"),
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
              anywhere: args.anywhere as boolean | undefined,
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
      "Purchase a phone number for the location.",
    inputSchema: z.object({
      phoneNumber: z
        .string()
        .describe("Phone number to purchase in E.164 format (e.g. +16135550100)"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "POST",
          `/phone-system/numbers/location/${config.locationId}/purchase`,
          {
            token: config.token,
            body: { phoneNumber: args.phoneNumber },
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_release_phone_number",
    description:
      "Release (delete) a purchased phone number from the location.",
    inputSchema: z.object({
      numberId: z.string().describe("The phone number ID to release"),
    }),
    handler: async (args: { numberId: string }, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "DELETE",
          `/phone-system/numbers/location/${config.locationId}/${args.numberId}`,
          { token: config.token }
        );
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
  {
    name: "ghl_update_phone_number",
    description:
      "Update settings for a phone number (friendly name, call forwarding, etc.).",
    inputSchema: z.object({
      numberId: z.string().describe("The phone number ID to update"),
      friendlyName: z.string().optional().describe("Display label for the number"),
      callForwardingNumber: z
        .string()
        .optional()
        .describe("Number to forward calls to in E.164 format"),
    }),
    handler: async (args: Record<string, unknown>, config: GHLConfig) => {
      try {
        const result = await ghlRequest(
          "PUT",
          `/phone-system/numbers/location/${config.locationId}/${args.numberId as string}`,
          {
            token: config.token,
            body: {
              ...(args.friendlyName !== undefined ? { friendlyName: args.friendlyName } : {}),
              ...(args.callForwardingNumber !== undefined ? { callForwardingNumber: args.callForwardingNumber } : {}),
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
